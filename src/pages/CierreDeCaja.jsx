import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistroRetiros from "./RegistrarRetiro";

export default function CierreCaja({ onCerrarCaja }) {
  const [datosApertura, setDatosApertura] = useState(null);
  const [empleadoId, setEmpleadoId] = useState(null);

  // Billeteras del turno (internas) y billeteras externas (del jefe)
  const [billeterasDisponibles, setBilleterasDisponibles] = useState([]);
  const [billeterasExternas, setBilleterasExternas] = useState([]);

  // Monto de cierre por billetera (key = servicio|cbu|titular)
  const [montosCierre, setMontosCierre] = useState({});

  // Movimientos cargados desde el modal
  const [transferencias, setTransferencias] = useState([]);   // {desde, hasta, monto}
  const [retirosExternos, setRetirosExternos] = useState([]); // {desde, hasta(externa), monto}

  // Premios / Bonos / Fichas (solo dígitos, formateo amigable)
  const [premiosRaw, setPremiosRaw] = useState("");     
  const [premiosFocused, setPremiosFocused] = useState(false);

  const [bonosRaw, setBonosRaw] = useState("");
  const [bonosFocused, setBonosFocused] = useState(false);

  const [fichasRaw, setFichasRaw] = useState("");
  const [fichasFocused, setFichasFocused] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [aperturaId, setAperturaId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  // -------- Helpers --------
  const walletKey = (w = {}) =>
    `${w.servicio || ""}|${w.cbu || ""}|${w.titular || ""}`;

  const formatARS = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  // Formatea miles con puntos sobre una cadena de dígitos (sin decimales)
  const formatMilesAR = (digitsStr) => {
    if (!digitsStr) return "";
    const cleaned = digitsStr.replace(/^0+(?=\d)/, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aperturaRes, empleadosRes, billeterasRes] = await Promise.all([
          fetch("https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja"),
          fetch("https://gestoradmin.store/gestorcaja.php?recurso=empleados"),
          fetch("https://gestoradmin.store/gestorcaja.php?recurso=billeteras"),
        ]);

        if (!aperturaRes.ok) throw new Error("No se pudo obtener la apertura");
        if (!empleadosRes.ok) throw new Error("No se pudo obtener los empleados");
        if (!billeterasRes.ok) throw new Error("No se pudo obtener billeteras");

        const aperturaJson = await aperturaRes.json();
        const empleados = await empleadosRes.json();
        const todasBilleteras = await billeterasRes.json();

        const aperturas = aperturaJson.data || [];
        if (!Array.isArray(aperturas) || aperturas.length === 0) {
          setMensaje("No se encontró ninguna caja.");
          setLoading(false);
          return;
        }

        const abiertas = aperturas.filter((a) => !a.fecha_cierre);
        const apertura = abiertas.length
          ? abiertas[0]
          : aperturas.sort((a, b) => Number(b.id) - Number(a.id))[0];

        const billeterasIni = Array.isArray(apertura.billeteras_iniciales)
          ? apertura.billeteras_iniciales
          : Object.values(apertura.billeteras_iniciales || {});

        const montosIniciales = billeterasIni.reduce((acc, b) => {
          acc[walletKey(b)] = Number(b.monto || 0);
          return acc;
        }, {});

        const empInfo = (empleados || []).find(
          (emp) => Number(emp.id) === Number(apertura.empleado_id)
        );

        setDatosApertura({
          empleado: empInfo ? empInfo.nombre : `ID ${apertura.empleado_id}`,
          turno: apertura.turno,
          montosIniciales,
        });
        setEmpleadoId(Number(apertura.empleado_id) || null);
        setAperturaId(apertura.id);
        setBilleterasDisponibles(billeterasIni);

        const externas = Array.isArray(todasBilleteras)
          ? todasBilleteras.filter(
              (b) => String(b.tipo || "").toLowerCase() === "retiro"
            )
          : [];
        setBilleterasExternas(externas);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setMensaje("Error al cargar datos de apertura o empleados.");
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleMontoCierre = (key, val) => {
    setMontosCierre((prev) => ({ ...prev, [key]: val }));
  };

  const agregarMovimiento = (mov) => { /* ... igual que antes ... */ };
  const eliminarTransferencia = (i) =>
    setTransferencias((prev) => prev.filter((_, idx) => idx !== i));
  const eliminarRetiro = (i) =>
    setRetirosExternos((prev) => prev.filter((_, idx) => idx !== i));

  const cerrarCaja = async () => {
    const faltantes = billeterasDisponibles.some((b) => {
      const key = walletKey(b);
      return montosCierre[key] === undefined || montosCierre[key] === "";
    });

    if (
      faltantes ||
      premiosRaw === "" ||
      bonosRaw === "" ||
      fichasRaw === ""
    ) {
      setMensaje("Completá todos los campos antes de cerrar la caja.");
      return;
    }

    const fechaCierre = new Date().toISOString();

    const billeteras_finales = billeterasDisponibles.map((b) => ({
      id: Number(b.id || 0),
      servicio: b.servicio,
      titular: b.titular,
      cbu: b.cbu,
      monto: Number(montosCierre[walletKey(b)]) || 0,
    }));

    const cierrePayload = {
      id: aperturaId,
      premios: Number(premiosRaw) || 0,
      bonos: Number(bonosRaw) || 0,
      fichas_finales: Number(fichasRaw) || 0,
      fecha_cierre: fechaCierre,
      billeteras_finales,
    };

    try {
      const resClose = await fetch(
        "https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cierrePayload),
        }
      );

      if (!resClose.ok) {
        setMensaje("Error al cerrar la caja. Intentá nuevamente.");
        return;
      }

      // registrar transferencias y retiros (igual que antes)...

      alert("✅ Caja cerrada correctamente");
      navigate("/");
      onCerrarCaja && onCerrarCaja(cierrePayload);
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      setMensaje("Ocurrió un error al cerrar la caja.");
    }
  };

  if (loading) return <p className="text-center mt-6">Cargando datos de apertura...</p>;
  if (!datosApertura) return <p className="text-center mt-6 text-red-500">No se pudo cargar la apertura.</p>;

  // Displays amigables
  const premiosDisplay =
    premiosFocused ? formatMilesAR(premiosRaw) : premiosRaw !== "" ? formatARS(Number(premiosRaw)) : "";

  const bonosDisplay =
    bonosFocused ? formatMilesAR(bonosRaw) : bonosRaw !== "" ? formatARS(Number(bonosRaw)) : "";

  const fichasDisplay =
    fichasFocused ? formatMilesAR(fichasRaw) : fichasRaw !== "" ? formatARS(Number(fichasRaw)) : "";

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-[520px] mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cierre de Caja</h2>

      {/* datos apertura */}
      <div className="mb-4">
        <p className="font-medium">
          Agente: <span className="font-bold">{datosApertura.empleado}</span>
        </p>
        <p className="font-medium">
          Turno: <span className="font-bold">{datosApertura.turno}</span>
        </p>
      </div>

      {/* filas billeteras */}
      {billeterasDisponibles.map((b) => {
        const key = walletKey(b);
        return (
          <div key={key} className="flex items-center gap-2 mb-2">
            <div className="w-44">
              <div className="font-medium">{b.servicio}</div>
              <div className="text-xs text-gray-500">{b.titular}</div>
              <div className="text-[10px] text-gray-400">
                {b.cbu ? `${String(b.cbu).slice(0, 6)}...${String(b.cbu).slice(-4)}` : ""}
              </div>
            </div>
            <span className="flex-1 text-right">
              {formatARS(datosApertura.montosIniciales[key] || 0)}
            </span>
            <span className="px-2">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Cierre"
              className="flex-1 p-1 border rounded"
              value={
                montosCierre[key] !== undefined && montosCierre[key] !== ""
                  ? Number(montosCierre[key]).toLocaleString("es-AR")
                  : ""
              }
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                if (/^\d*$/.test(rawValue)) {
                  handleMontoCierre(key, rawValue);
                }
              }}
            />
          </div>
        );
      })}

      {/* Premios */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Premios Pagados</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            className="w-full p-1 border rounded"
            value={premiosDisplay}
            onFocus={() => setPremiosFocused(true)}
            onBlur={() => setPremiosFocused(false)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (/^\d*$/.test(digits)) setPremiosRaw(digits);
            }}
            placeholder="0"
          />
        </div>
      </div>

      {/* Bonos */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Bonos</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            className="w-full p-1 border rounded"
            value={bonosDisplay}
            onFocus={() => setBonosFocused(true)}
            onBlur={() => setBonosFocused(false)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (/^\d*$/.test(digits)) setBonosRaw(digits);
            }}
            placeholder="0"
          />
        </div>
      </div>

      {/* Fichas Finales */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Fichas Finales</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            className="w-full p-1 border rounded"
            value={fichasDisplay}
            onFocus={() => setFichasFocused(true)}
            onBlur={() => setFichasFocused(false)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              if (/^\d*$/.test(digits)) setFichasRaw(digits);
            }}
            placeholder="0"
          />
        </div>
      </div>

      <button
        onClick={() => setMostrarModal(true)}
        className="w-full bg-blue-500 text-white py-2 rounded mb-4 hover:bg-blue-600 font-bold"
      >
        Movimientos (Transferencias / Retiros)
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
        billeteras={billeterasDisponibles}
        billeterasExternas={billeterasExternas}
        onGuardarMovimiento={agregarMovimiento}
      />
      {/* Listados de lo cargado en el modal */}
      {transferencias.length > 0 && (
        <div className="mt-6 text-sm">
          <h3 className="font-bold mb-2">Transferencias internas</h3>
          <ul className="list-disc pl-5 space-y-1">
            {transferencias.map((t, i) => (
              <li key={`t-${i}`}>
                {t.desde.servicio} → {t.hasta.servicio} — ${Number(t.monto).toLocaleString("es-AR")}{" "}
                <button className="ml-2 text-red-600 hover:underline" onClick={() => eliminarTransferencia(i)}>
                  eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {retirosExternos.length > 0 && (
        <div className="mt-4 text-sm">
          <h3 className="font-bold mb-2">Retiros (fuera del sistema)</h3>
          <ul className="list-disc pl-5 space-y-1">
            {retirosExternos.map((r, i) => (
              <li key={`r-${i}`}>
                {r.desde.servicio} → {r.hasta?.servicio || "Retiro (Jefe)"} — ${Number(r.monto).toLocaleString("es-AR")}{" "}
                <button className="ml-2 text-red-600 hover:underline" onClick={() => eliminarRetiro(i)}>
                  eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
