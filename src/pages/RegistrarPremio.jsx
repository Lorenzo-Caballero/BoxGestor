import React, { useEffect, useState } from "react";

export default function RegistrarPremio({
  visible,
  onClose,
  billeteras = [],
  onPremioAgregado,
}) {
  const [billeteraId, setBilleteraId] = useState("");
  const [montoRaw, setMontoRaw] = useState("");
  const [montoFocused, setMontoFocused] = useState(false);
  const [msg, setMsg] = useState("");

  if (!visible) return null;

  // Helpers de formato (idénticos a RegistroRetiros)
  const formatARS = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  const formatMilesAR = (digitsStr = "") => {
    if (!digitsStr) return "";
    const cleaned = digitsStr.replace(/^0+(?=\d)/, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const montoDisplay = montoFocused
    ? formatMilesAR(montoRaw)
    : montoRaw !== ""
    ? formatARS(Number(montoRaw))
    : "";

  const resetCampos = () => {
    setBilleteraId("");
    setMontoRaw("");
    setMontoFocused(false);
  };

  const recortarCBU = (cbu = "") => {
    const s = String(cbu);
    return s ? `${s.slice(0, 6)}...${s.slice(-4)}` : "";
  };

  const guardar = () => {
    setMsg("");

    if (!billeteraId || !montoRaw) {
      setMsg("Completá todos los campos.");
      return;
    }

    const montoNum = Number(montoRaw);
    if (isNaN(montoNum) || montoNum <= 0) {
      setMsg("El monto debe ser un número válido mayor a 0.");
      return;
    }

    const billeteraObj = billeteras.find(
      (b) => String(b.id) === String(billeteraId)
    );

    if (!billeteraObj) {
      setMsg("Billetera no encontrada.");
      return;
    }

    // Objeto estandarizado igual que el usado en movimientos
    const premio = {
      billetera_id: Number(billeteraObj.id),
      servicio: billeteraObj.servicio,
      titular: billeteraObj.titular,
      cbu: billeteraObj.cbu,
      monto: montoNum,
    };

    if (typeof onPremioAgregado === "function") {
      onPremioAgregado(premio);
    }

    // Mantener modal abierto y limpiar campos
    resetCampos();
    setMsg("✅ Premio agregado. Podés cargar otro o cerrar.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-[#2f3336] bg-[#1e1f23] p-6 text-[#e6e6e6] shadow-2xl">
        <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight text-[#e8e9ea] mb-4">
          Registrar premio pagado
        </h2>

        {/* Billetera */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
            Billetera usada para pagar
          </label>

          <select
            className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
            value={billeteraId}
            onChange={(e) => {
              setBilleteraId(e.target.value);
              setMsg("");
            }}
          >
            <option value="">Seleccionar billetera</option>
            {billeteras.map((b) => (
              <option key={b.id} value={b.id}>
                {b.servicio} — {b.titular}{" "}
                {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
            Monto del premio
          </label>

          <div className="relative">
            {!montoFocused && montoRaw !== "" && (
              <span className="absolute left-3 top-2.5 text-[#9da3ab]">$</span>
            )}

            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={montoDisplay}
              onFocus={() => setMontoFocused(true)}
              onBlur={() => setMontoFocused(false)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (/^\d*$/.test(digits)) setMontoRaw(digits);
              }}
              placeholder="0"
            />
          </div>
        </div>

        {!!msg && (
          <p
            className={`mt-2 mb-3 text-sm ${
              msg.startsWith("✅") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {msg}
          </p>
        )}

        {/* Botones */}
        <div className="flex justify-between mt-3 gap-3">
          <button
            className="w-32 py-2 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33]"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            className="w-32 py-2 rounded-2xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44]"
            onClick={guardar}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
