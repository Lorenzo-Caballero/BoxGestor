import React, { useMemo, useState } from "react";

const RegistroRetiros = ({
  visible,
  onClose,
  cajaId,
  // billeteras del turno (internas / operativas)
  billeteras = [],
  // billeteras externas (del jefe) opcionales
  billeterasExternas = [],
  // NUEVO: callback genérico (recibe { tipo: 'interna'|'retiro', desde, hasta, monto })
  onGuardarMovimiento,
  // COMPAT: si el padre sólo maneja retiros, usa este
  onGuardar,
  // OPCIONAL: si el padre quiere manejar transferencias por separado
  onGuardarTransferencia,
}) => {
  // Si el padre no pasó callback para internas, oculto el selector y fijo "retiro"
  const modoSoloRetiro = !onGuardarMovimiento && !onGuardarTransferencia;
  const [tipo, setTipo] = useState(modoSoloRetiro ? "retiro" : "interna"); // 'interna' | 'retiro'
  const [desdeId, setDesdeId] = useState("");
  const [hastaId, setHastaId] = useState("");
  const [montoRaw, setMontoRaw] = useState(""); // solo dígitos
  const [montoFocused, setMontoFocused] = useState(false);

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

  const handleGuardar = () => {
    if (!visible) return;
    if (!cajaId) {
      alert("No hay caja abierta.");
      return;
    }
    // campos
    if (!desdeId || !montoRaw) {
      alert("Completá todos los campos.");
      return;
    }
    if (!modoSoloRetiro) {
      if (tipo === "interna" && !hastaId) return alert("Elegí la billetera destino (interna).");
      if (tipo === "retiro" && billeterasExternas.length > 0 && !hastaId)
        return alert("Elegí la billetera externa destino.");
    } else {
      // solo retiro
      if (billeterasExternas.length > 0 && !hastaId)
        return alert("Elegí la billetera externa destino.");
    }

    const montoNum = Number(montoRaw);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert("El monto debe ser un número válido mayor a 0.");
      return;
    }

    const desdeObj = (billeteras || []).find((b) => Number(b.id) === Number(desdeId));
    if (!desdeObj) return alert("Billetera de origen no encontrada.");

    let hastaObj;

    const tipoEfectivo = modoSoloRetiro ? "retiro" : tipo;

    if (tipoEfectivo === "interna") {
      hastaObj = (billeteras || []).find((b) => Number(b.id) === Number(hastaId));
      if (!hastaObj) return alert("Billetera de destino no encontrada.");
      if (Number(hastaObj.id) === Number(desdeObj.id))
        return alert("En transferencias internas, 'Desde' y 'Hasta' deben ser distintos.");
    } else {
      // RETIRO EXTERNO: si tenés lista de externas, usamos la elegida; sino, generamos un placeholder
      if ((billeterasExternas || []).length > 0) {
        hastaObj = (billeterasExternas || []).find((b) => String(b.id) === String(hastaId));
        if (!hastaObj) return alert("Billetera externa no encontrada.");
        hastaObj = { ...hastaObj, externa: true };
      } else {
        // placeholder si no pasaste billeterasExternas
        hastaObj = {
          id: 0,
          servicio: "Retiro (Jefe)",
          titular: "Jefe",
          cbu: "",
          externa: true,
        };
      }
    }

    // DEVOLVER AL PADRE (todas las variantes)
    const payload = {
      tipo: tipoEfectivo,
      desde: {
        id: Number(desdeObj.id) || 0,
        servicio: desdeObj.servicio || "",
        titular: desdeObj.titular || "",
        cbu: desdeObj.cbu || "",
      },
      hasta: {
        id: Number(hastaObj.id) || 0,
        servicio: hastaObj.servicio || "",
        titular: hastaObj.titular || "",
        cbu: hastaObj.cbu || "",
        externa: !!hastaObj.externa,
      },
      monto: montoNum,
    };

    if (typeof onGuardarMovimiento === "function") {
      onGuardarMovimiento(payload);
    } else if (payload.tipo === "retiro" && typeof onGuardar === "function") {
      onGuardar({ desde: payload.desde, hasta: payload.hasta, monto: payload.monto });
    } else if (payload.tipo === "interna" && typeof onGuardarTransferencia === "function") {
      onGuardarTransferencia({ desde: payload.desde, hasta: payload.hasta, monto: payload.monto });
    } else if (payload.tipo === "interna" && !onGuardarTransferencia) {
      alert(
        "Transferencia interna registrada localmente no soportada por el padre. " +
          "Activá onGuardarMovimiento u onGuardarTransferencia en el componente padre."
      );
      return;
    }

    // reset y cerrar
    setDesdeId("");
    setHastaId("");
    setMontoRaw("");
    if (!modoSoloRetiro) setTipo("interna");
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[460px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Registrar Movimiento</h2>

        {!modoSoloRetiro && (
          <div className="mb-3">
            <label className="block font-medium mb-1">Tipo</label>
            <select
              className="w-full border p-2 rounded"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setHastaId("");
              }}
            >
              <option value="interna">Transferencia interna</option>
              <option value="retiro">Retiro (fuera del sistema)</option>
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block font-medium mb-1">Desde</label>
          <select
            className="w-full border p-2 rounded"
            value={desdeId}
            onChange={(e) => setDesdeId(e.target.value)}
          >
            <option value="">Seleccionar billetera</option>
            {(billeteras || []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.servicio} — {b.titular} {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
              </option>
            ))}
          </select>
        </div>

        {(modoSoloRetiro || tipo === "retiro") ? (
          <div className="mb-3">
            <label className="block font-medium mb-1">Hasta (externa)</label>
            {billeterasExternas.length > 0 ? (
              <select
                className="w-full border p-2 rounded"
                value={hastaId}
                onChange={(e) => setHastaId(e.target.value)}
              >
                <option value="">Seleccionar billetera externa</option>
                {billeterasExternas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.servicio} — {b.titular} {b.cbu ? `(${recortarCBU(b.cbu)})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-600">
                No configuraste billeteras externas; se usará “Retiro (Jefe)” como destino.
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <label className="block font-medium mb-1">Hasta (interna)</label>
            <select
              className="w-full border p-2 rounded"
              value={hastaId}
              onChange={(e) => setHastaId(e.target.value)}
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

        {/* Input Monto */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Monto</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              className="w-full border rounded p-2"
              value={montoDisplay}
              onFocus={() => setMontoFocused(true)}
              onBlur={() => setMontoFocused(false)}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (/^\d*$/.test(digits)) {
                  setMontoRaw(digits);
                }
              }}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
