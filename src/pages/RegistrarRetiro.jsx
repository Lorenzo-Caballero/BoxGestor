import React, { useEffect, useState } from "react";

const RegistroRetiros = ({ visible, onClose, cajaId, onSuccess }) => {
  const [billeteras, setBilleteras] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (visible) {
      fetch("https://gestoradmin.store/gestorcaja.php?recurso=billeteras")
        .then((res) => res.json())
        .then(setBilleteras)
        .catch((err) => console.error("Error cargando billeteras:", err));
    }
  }, [visible]);

  const billeterasHasta = billeteras.filter((b) => b.id !== desde);

  const handleGuardar = async () => {
    if (!desde || !hasta || !monto || !cajaId) {
      alert("Completa todos los campos.");
      return;
    }

    const billeteraDesde = billeteras.find((b) => b.id === desde);
    const billeteraHasta = billeteras.find((b) => b.id === hasta);

    if (!billeteraDesde || !billeteraHasta) {
      alert("Error: billetera no encontrada.");
      return;
    }

    const retiroData = {
      caja_id: cajaId,
      desde_billetera: billeteraDesde,
      hasta_billetera: billeteraHasta,
      monto: parseFloat(monto),
    };

    console.log("Enviando retiro:", retiroData);

    try {
      const res = await fetch("https://gestoradmin.store/gestorcaja.php?recurso=retiros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(retiroData),
      });

      const data = await res.json();

      if (res.ok && data?.id_retiro) {
        alert("Retiro guardado exitosamente.");
        onSuccess?.(data);
        setDesde("");
        setHasta("");
        setMonto("");
        onClose();
      } else {
        alert(data?.error || "Error al guardar retiro.");
      }
    } catch (err) {
      console.error("Error al guardar retiro:", err);
      alert("Error de red al guardar retiro.");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Registrar Retiro</h2>

        <div className="mb-3">
          <label className="block font-medium mb-1">Desde</label>
          <select
            className="w-full border p-2 rounded"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          >
            <option value="">Seleccionar billetera</option>
            {billeteras.map((b) => (
              <option key={b.id} value={b.id}>
                {b.servicio} — {b.titular}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block font-medium mb-1">Hasta</label>
          <select
            className="w-full border p-2 rounded"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          >
            <option value="">Seleccionar billetera</option>
            {billeterasHasta.map((b) => (
              <option key={b.id} value={b.id}>
                {b.servicio} — {b.titular}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Monto</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
        </div>

        <div className="flex justify-between">
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleGuardar}
          >
            Guardar Retiro
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistroRetiros;
