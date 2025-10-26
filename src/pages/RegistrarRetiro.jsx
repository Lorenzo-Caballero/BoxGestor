import React, { useEffect, useMemo, useState } from "react";

const RegistroRetiros = ({
  visible,
  onClose,
  cajaId,
  // billeteras del turno (internas / operativas)
  billeteras = [],
  // billeteras externas (del jefe) opcionales
  billeterasExternas = [],
  // Callback unificado: recibe { tipo: 'transferencia'|'retiro', desde, hasta, monto }
  onGuardarMovimiento,
  // COMPAT: si el padre sólo maneja retiros
  onGuardar,
  // COMPAT: si el padre quiere manejar transferencias por separado
  onGuardarTransferencia,
}) => {
  // Si el padre no pasó callback para internas, oculto selector y fijo "retiro"
  const modoSoloRetiro = !onGuardarMovimiento && !onGuardarTransferencia;
  const [modo, setModo] = useState(modoSoloRetiro ? "retiro" : "transferencia"); // 'transferencia' | 'retiro'
  const [desdeId, setDesdeId] = useState("");
  const [hastaId, setHastaId] = useState("");
  const [montoRaw, setMontoRaw] = useState(""); // solo dígitos
  const [montoFocused, setMontoFocused] = useState(false);
  const [msg, setMsg] = useState("");

  // Cerrar con ESC
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  const recortarCBU = (cbu = "") => {
    const s = String(cbu || "");
    return s ? `${s.slice(0, 6)}...${s.slice(-4)}` : "";
  };

  // Helpers de formato
  const formatARS = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  const formatMilesAR = (digitsStr) => {
    if (!digitsStr) return "";
    const cleaned = digitsStr.replace(/^0+(?=\d)/, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const montoDisplay = montoFocused
    ? formatMilesAR(montoRaw)
    : montoRaw !== ""
    ? formatARS(Number(montoRaw))
    : "";

  // para internas, evitamos que el “hasta” sea igual al “desde”
  const billeterasHastaInternas = useMemo(() => {
    const dId = Number(desdeId || 0);
    return (billeteras || []).filter((b) => Number(b.id) !== dId);
  }, [billeteras, desdeId]);

  const pickFrom = (list, id) =>
    list.find((b) => String(b.id) === String(id)) || null;

  const resetCampos = () => {
    setHastaId("");
    setMontoRaw("");
    setMontoFocused(false);
  };

  const handleGuardar = () => {
    if (!visible) return;
    if (!cajaId) {
      setMsg("No hay caja abierta.");
      return;
    }
    setMsg("");

    // validaciones
    if (!desdeId || !montoRaw) {
      setMsg("Completá todos los campos.");
      return;
    }

    if (!modoSoloRetiro) {
      if (modo === "transferencia" && !hastaId) {
        setMsg("Elegí la billetera destino (interna).");
        return;
      }
      if (modo === "retiro" && billeterasExternas.length > 0 && !hastaId) {
        setMsg("Elegí la billetera externa destino.");
        return;
      }
    } else if (billeterasExternas.length > 0 && !hastaId) {
      setMsg("Elegí la billetera externa destino.");
      return;
    }

    const montoNum = Number(montoRaw);
    if (isNaN(montoNum) || montoNum <= 0) {
      setMsg("El monto debe ser un número válido mayor a 0.");
      return;
    }

    const desdeObjFull = pickFrom(billeteras, desdeId);
    if (!desdeObjFull) {
      setMsg("Billetera de origen no encontrada.");
      return;
    }

    let hastaObjFull;
    const modoFinal = modoSoloRetiro ? "retiro" : modo;

    if (modoFinal === "transferencia") {
      hastaObjFull = pickFrom(billeteras, hastaId);
      if (!hastaObjFull) {
        setMsg("Billetera de destino no encontrada.");
        return;
      }
      if (String(hastaObjFull.id) === String(desdeObjFull.id)) {
        setMsg("En transferencias internas, 'Desde' y 'Hasta' deben ser distintos.");
        return;
      }
    } else {
      // RETIRO EXTERNO
      if ((billeterasExternas || []).length > 0) {
        hastaObjFull = pickFrom(billeterasExternas, hastaId);
        if (!hastaObjFull) {
          setMsg("Billetera externa no encontrada.");
          return;
        }
      } else {
        // placeholder si no pasaste billeterasExternas
        hastaObjFull = {
          id: 0,
          servicio: "Retiro (Jefe)",
          titular: "Jefe",
          cbu: "",
          tipo: "retiro",
        };
      }
    }

    // Shape normalizado para el backend/padre
    const desde = {
      id: Number(desdeObjFull.id) || 0,
      servicio: desdeObjFull.servicio || "",
      titular: desdeObjFull.titular || "",
      cbu: desdeObjFull.cbu || "",
    };

    const hasta = {
      id: Number(hastaObjFull.id) || 0,
      servicio: hastaObjFull.servicio || "",
      titular: hastaObjFull.titular || "",
      cbu: hastaObjFull.cbu || "",
      // marcamos explícitamente retiros
      tipo: modoFinal === "retiro" ? "retiro" : undefined,
    };

    const payload = {
      tipo: modoFinal, // 'transferencia' | 'retiro'
      desde,
      hasta,
      monto: montoNum,
    };

    // Callbacks compatibles
    if (typeof onGuardarMovimiento === "function") {
      onGuardarMovimiento(payload);
    } else if (payload.tipo === "retiro" && typeof onGuardar === "function") {
      onGuardar({ desde, hasta, monto: montoNum });
    } else if (
      payload.tipo === "transferencia" &&
      typeof onGuardarTransferencia === "function"
    ) {
      onGuardarTransferencia({ desde, hasta, monto: montoNum });
    } else if (payload.tipo === "transferencia" && !onGuardarTransferencia) {
      setMsg(
        "Transferencia interna registrada localmente no soportada por el padre. Activá onGuardarMovimiento u onGuardarTransferencia en el componente padre."
      );
      return;
    }

    // Mantener modal abierto para cargar varios: limpiar campos y avisar
    resetCampos();
    setMsg("✅ Movimiento agregado. Podés cargar otro o cerrar.");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // cerrar si clic fuera del panel
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-[520px] max-w-[92vw] rounded-2xl border border-[#2f3336] bg-[#1e1f23] p-6 text-[#e6e6e6] shadow-2xl">
        <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight text-[#e8e9ea] mb-4">
          Registrar Movimiento
        </h2>

        {/* Tipo */}
        {!modoSoloRetiro && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Tipo</label>
            <select
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={modo}
              onChange={(e) => {
                setModo(e.target.value);
                setHastaId("");
                setMsg("");
              }}
            >
              <option value="transferencia">Transferencia interna</option>
              <option value="retiro">Retiro (fuera del sistema)</option>
            </select>
          </div>
        )}

        {/* Desde */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Desde</label>
          <select
            className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
            value={desdeId}
            onChange={(e) => {
              setDesdeId(e.target.value);
              setMsg("");
            }}
          >
            <option value="">Seleccionar billetera</option>
            {(billeteras || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.servicio} — {b.titular} {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Hasta */}
        {modoSoloRetiro || modo === "retiro" ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Hasta (externa)</label>
            {billeterasExternas.length > 0 ? (
              <select
                className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
                value={hastaId}
                onChange={(e) => {
                  setHastaId(e.target.value);
                  setMsg("");
                }}
              >
                <option value="">Seleccionar billetera externa</option>
                {billeterasExternas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.servicio} — {b.titular} {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-[#9da3ab]">
                No configuraste billeteras externas; se usará “Retiro (Jefe)” como destino.
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Hasta (interna)</label>
            <select
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={hastaId}
              onChange={(e) => {
                setHastaId(e.target.value);
                setMsg("");
              }}
            >
              <option value="">Seleccionar billetera</option>
              {billeterasHastaInternas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.servicio} — {b.titular} {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Monto */}
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Monto</label>
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

        {/* Mensajes */}
        {!!msg && (
          <p
            className={`mt-2 mb-3 text-sm ${
              msg.startsWith("✅") ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {msg}
          </p>
        )}

        {/* Acciones */}
        <div className="flex justify-between mt-3 gap-3">
          <button
            className="w-32 py-2 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="w-32 py-2 rounded-2xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44] transition-colors"
            onClick={handleGuardar}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroRetiros;
