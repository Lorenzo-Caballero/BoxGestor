import React, { useState } from "react";

export default function RegistrarPremio({
  visible,
  onClose,
  billeteras,
  onPremioAgregado, // <- nombre nuevo del callback
}) {
  const [billeteraSeleccionada, setBilleteraSeleccionada] = useState(null);
  const [monto, setMonto] = useState("");

  if (!visible) return null;

  const cerrarModal = () => {
    setBilleteraSeleccionada(null);
    setMonto("");
    onClose();
  };

  const guardar = () => {
    if (!billeteraSeleccionada || monto === "" || Number(monto) <= 0) {
      alert("Seleccioná una billetera y un monto válido.");
      return;
    }

    if (typeof onPremioAgregado === "function") {
      onPremioAgregado({
        billetera: billeteraSeleccionada,
        monto: Number(monto),
      });
    }

    cerrarModal();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-[#1e1f23] w-full max-w-md rounded-2xl border border-[#32363b] p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-[#e8e9ea] mb-4 text-center">
          Registrar premio pagado
        </h2>

        {/* Selección de billetera */}
        <label className="text-sm text-[#c7c9cc] mb-1 block">
          Billetera usada para pagar
        </label>
        <select
          className="w-full bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-3 text-[#e6e6e6] mb-4"
          value={billeteraSeleccionada ? billeteraSeleccionada.id : ""}
          onChange={(e) => {
            const sel = billeteras.find(
              (b) => String(b.id) === String(e.target.value)
            );
            setBilleteraSeleccionada(sel || null);
          }}
        >
          <option value="">Seleccionar billetera...</option>
          {billeteras.map((b) => (
            <option key={b.id} value={b.id}>
              {b.servicio} - {b.titular}
            </option>
          ))}
        </select>

        {/* Monto */}
        <label className="text-sm text-[#c7c9cc] mb-1 block">
          Monto del premio
        </label>
        <input
          type="text"
          inputMode="numeric"
          className="w-full bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-3 text-[#e6e6e6] mb-4"
          placeholder="0"
          value={monto}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, "");
            setMonto(clean);
          }}
        />

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            className="w-1/2 py-3 rounded-xl border border-[#3a3f45] text-[#e8e9ea] hover:bg-[#2a2d33]"
            onClick={cerrarModal}
          >
            Cancelar
          </button>

          <button
            className="w-1/2 py-3 rounded-xl bg-[#2f3336] text-[#e8e9ea] hover:bg-[#3b3f46]"
            onClick={guardar}
          >
            Guardar premio
          </button>
        </div>
      </div>
    </div>
  );
}
