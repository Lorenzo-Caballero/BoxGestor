import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistroRetiros from "./RegistrarRetiro";

export default function CierreCaja({ onCerrarCaja }) {
  const [datosApertura, setDatosApertura] = useState(null);
  const [billeterasDisponibles, setBilleterasDisponibles] = useState([]);
  const [montosCierre, setMontosCierre] = useState({});
  const [retiro, setRetiro] = useState({ desde: "", hacia: "", monto: "" });
  const [retiros, setRetiros] = useState([]);
  const [premios, setPremios] = useState("");
  const [bonos, setBonos] = useState("");
  const [fichasFinales, setFichasFinales] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [aperturaId, setAperturaId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aperturaRes, empleadosRes] = await Promise.all([
          fetch("https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja"),
          fetch("https://gestoradmin.store/gestorcaja.php?recurso=empleados"),
        ]);

        if (!aperturaRes.ok) throw new Error("No se pudo obtener la apertura");
        if (!empleadosRes.ok) throw new Error("No se pudo obtener la lista de empleados");

        const aperturaJson = await aperturaRes.json();
        const empleados = await empleadosRes.json();

        const aperturas = aperturaJson.data || [];
        if (!Array.isArray(aperturas) || aperturas.length === 0) {
          setMensaje("No se encontró ninguna apertura de caja.");
          setLoading(false);
          return;
        }

        const apertura = aperturas[0];
        const billeteras = apertura.billeteras_iniciales || [];
        const nombresBilleteras = billeteras.map((b) => b.servicio);
        const montosIniciales = billeteras.reduce((acc, b) => {
          acc[b.servicio] = b.monto;
          return acc;
        }, {});

        const empleadoInfo = empleados.find(emp => emp.id === apertura.empleado_id);

        setDatosApertura({
          empleado: empleadoInfo ? empleadoInfo.nombre : `ID ${apertura.empleado_id}`,
          turno: apertura.turno,
          montos: montosIniciales,
        });
        setAperturaId(apertura.id);
        setBilleterasDisponibles(nombresBilleteras);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setMensaje("Error al cargar datos de apertura o empleados.");
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleMontoCierre = (b, val) => {
    setMontosCierre(prev => ({ ...prev, [b]: val }));
  };

  const agregarRetiro = () => {
    const { desde, hacia, monto } = retiro;
    const montoNum = parseFloat(monto);
    if (!desde || !hacia || !monto)
      return setMensaje("Completá todos los campos del retiro.");
    if (desde === hacia)
      return setMensaje("No se puede retirar de y hacia la misma billetera.");
    if (isNaN(montoNum) || montoNum <= 0)
      return setMensaje("El monto debe ser un número válido mayor a 0.");
    if (retiros.some(r => r.desde === desde && r.hacia === hacia && r.monto === montoNum))
      return setMensaje("Este retiro ya fue agregado.");

    setRetiros(prev => [...prev, { desde, hacia, monto: montoNum }]);
    setRetiro({ desde: "", hacia: "", monto: "" });
    setMensaje("");
  };

  const eliminarRetiro = (index) => {
    setRetiros(prev => prev.filter((_, i) => i !== index));
  };

  const cerrarCaja = async () => {
    const camposCompletos = billeterasDisponibles.every(
      b => montosCierre[b] !== undefined && montosCierre[b] !== ""
    ) && premios !== "" && bonos !== "" && fichasFinales !== "";

    if (!camposCompletos) {
      setMensaje("Por favor, completá todos los campos antes de cerrar la caja.");
      return;
    }

    if (retiros.some(r => r.desde === r.hacia || isNaN(parseFloat(r.monto)) || parseFloat(r.monto) <= 0)) {
      setMensaje("Hay retiros inválidos en la lista.");
      return;
    }

    const fechaCierre = new Date().toISOString();

    const billeterasFinales = billeterasDisponibles.map(b => ({
      servicio: b,
      monto: parseFloat(montosCierre[b])
    }));

    const cierre = {
      id: aperturaId,
      premios: parseFloat(premios),
      bonos: parseFloat(bonos),
      fichas_finales: parseFloat(fichasFinales),
      fecha_cierre: fechaCierre,
      billeteras_finales: billeterasFinales,
      retiros
    };

    try {
      const response = await fetch("https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cierre),
      });

      if (response.ok) {
        for (const r of retiros) {
          const retiroConCajaId = {
            caja_id: aperturaId,
            desde: r.desde,
            hasta: r.hacia,
            monto: r.monto,
            fecha: fechaCierre
          };
          await fetch("https://gestoradmin.store/gestorcaja.php?recurso=retiros", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(retiroConCajaId),
          });
        }

        alert("✅ Caja cerrada correctamente");
        navigate("/");
        onCerrarCaja && onCerrarCaja(cierre);
      } else {
        setMensaje("Error al cerrar la caja. Intentalo de nuevo.");
      }
    } catch (error) {
      console.error("Error al hacer PUT o POST:", error);
      setMensaje("Ocurrió un error al cerrar la caja.");
    }
  };

  if (loading) return <p className="text-center mt-6">Cargando datos de apertura...</p>;
  if (!datosApertura) return <p className="text-center mt-6 text-red-500">No se pudo cargar la apertura.</p>;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cierre de Caja</h2>

      <div className="mb-4">
        <p className="font-medium">Agente: <span className="font-bold">{datosApertura.empleado}</span></p>
        <p className="font-medium">Turno: <span className="font-bold">{datosApertura.turno}</span></p>
      </div>

      {billeterasDisponibles.map((b) => (
        <div key={b} className="flex items-center gap-2 mb-2">
          <span className="w-24 font-medium">{b}</span>
          <span>
            {datosApertura.montos[b].toLocaleString("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 2,
            })}
          </span>
          <span>$</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Cierre"
            className="flex-1 p-1 border rounded"
            value={
              montosCierre[b] !== undefined && montosCierre[b] !== ""
                ? Number(montosCierre[b]).toLocaleString("es-AR")
                : ""
            }
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\./g, ""); // eliminar puntos
              if (/^\d*$/.test(rawValue)) {
                handleMontoCierre(b, rawValue);
              }
            }}
          />

        </div>
      ))}

      <div className="mb-4">
        <label className="block font-medium mb-1">Premios Pagados</label>
        <input type="number" className="w-full p-1 border rounded" value={premios} onChange={(e) => setPremios(e.target.value)} />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Bonos</label>
        <input type="number" className="w-full p-1 border rounded" value={bonos} onChange={(e) => setBonos(e.target.value)} />
      </div>

      <div className="mb-6">
        <label className="block font-medium mb-1">Fichas Finales</label>
        <input type="number" className="w-full p-1 border rounded" value={fichasFinales} onChange={(e) => setFichasFinales(e.target.value)} />
      </div>

      <button
        onClick={() => setMostrarModal(true)}
        className="w-full bg-blue-500 text-white py-2 rounded mb-4 hover:bg-blue-600 font-bold"
      >
        Retiros
      </button>

      <button
        onClick={cerrarCaja}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold"
      >
        CONFIRMAR Y CERRAR CAJA
      </button>

      {mensaje && <p className="mt-4 text-center text-sm text-red-600">{mensaje}</p>}

      <RegistroRetiros
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        cajaId={aperturaId}
        onGuardar={agregarRetiro}
      />

      {retiros.length > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="font-bold mb-2">Retiros Registrados:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {retiros.map((r, i) => (
              <li key={i}>
                {r.desde.servicio} → {r.hasta.servicio} — ${r.monto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
