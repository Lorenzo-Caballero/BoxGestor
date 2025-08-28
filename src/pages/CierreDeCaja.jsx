import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistroRetiros from "./RegistrarRetiro";

const API = "https://gestoradmin.store/gestorcaja.php";

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

  // Premios / Bonos / Fichas (solo dígitos, con display formateado)
  const [premiosRaw, setPremiosRaw] = useState("");
  const [premiosFocused, setPremiosFocused] = useState(false);

  const [bonosRaw, setBonosRaw] = useState("");
  const [bonosFocused, setBonosFocused] = useState(false);

  const [fichasRaw, setFichasRaw] = useState("");
  const [fichasFocused, setFichasFocused] = useState(false);

  // NUEVO: Saldo de jugadores (liability) final
  const [saldoJugadoresFinRaw, setSaldoJugadoresFinRaw] = useState("");
  const [saldoJugadoresFinFocused, setSaldoJugadoresFinFocused] = useState(false);

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

  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
  const toNumber = (digits) => (digits === "" ? 0 : Number(digits));

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aperturaRes, empleadosRes, billeterasRes] = await Promise.all([
          fetch(`${API}?recurso=apertura-caja`),
          fetch(`${API}?recurso=empleados`),
          fetch(`${API}?recurso=billeteras`),
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

        // externas = tipo 'retiro' (no operativas)
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

  // Recibe objetos del modal. Si 'hasta' es tipo 'retiro' => va a retirosExternos, si no => transferencia interna
  const agregarMovimiento = (mov) => {
    if (!mov || !mov.desde || !mov.hasta || !mov.monto) return;
    const monto = Number(mov.monto) || 0;
    const esRetiro =
      String(mov.hasta?.tipo || "").toLowerCase() === "retiro" ||
      mov.tipo === "retiro";

    if (esRetiro) {
      setRetirosExternos((prev) => [...prev, { ...mov, monto }]);
    } else {
      setTransferencias((prev) => [...prev, { ...mov, monto }]);
    }
  };

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
      fichasRaw === "" ||
      saldoJugadoresFinRaw === ""
    ) {
      setMensaje("Completá todos los campos antes de cerrar la caja.");
      return;
    }

    const billeteras_finales = billeterasDisponibles.map((b) => ({
      id: Number(b.id || 0),
      servicio: b.servicio,
      titular: b.titular,
      cbu: b.cbu,
      monto: toNumber(montosCierre[walletKey(b)]),
    }));

    const body = {
      billeteras_finales,
      premios: toNumber(premiosRaw),
      bonos: toNumber(bonosRaw),
      fichas_finales: toNumber(fichasRaw),
      // NUEVO: enviar liability final
      saldo_jugadores_final: toNumber(saldoJugadoresFinRaw),
    };

    try {
      // 1) Cerrar caja
      const resClose = await fetch(`${API}?recurso=apertura-caja`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await resClose.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { error: text }; }

      if (!resClose.ok || data?.error) {
        setMensaje(data?.error || "Error al cerrar la caja. Intentá nuevamente.");
        return;
      }

      // 2) Registrar transferencias internas
      if (transferencias.length > 0) {
        await Promise.all(
          transferencias.map((t) =>
            fetch(`${API}?recurso=transferencias`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                caja_id: aperturaId,
                desde_billetera: t.desde,
                hasta_billetera: t.hasta,
                monto: Number(t.monto) || 0,
                empleado_id: empleadoId || null,
              }),
            })
          )
        );
      }

      // 3) Registrar retiros externos (fondos que salen del sistema)
      if (retirosExternos.length > 0) {
        await Promise.all(
          retirosExternos.map((r) =>
            fetch(`${API}?recurso=retiros`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                caja_id: aperturaId,
                desde_billetera: r.desde,
                hasta_billetera: r.hasta, // externa tipo 'retiro'
                monto: Number(r.monto) || 0,
              }),
            })
          )
        );
      }

      alert("✅ Caja cerrada correctamente");
      onCerrarCaja && onCerrarCaja({ ...body, id: aperturaId });
      navigate("/");
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

  const saldoJugadoresFinDisplay =
    saldoJugadoresFinFocused
      ? formatMilesAR(saldoJugadoresFinRaw)
      : saldoJugadoresFinRaw !== ""
      ? formatARS(Number(saldoJugadoresFinRaw))
      : "";

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
            onChange={(e) => setPremiosRaw(onlyDigits(e.target.value))}
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
            onChange={(e) => setBonosRaw(onlyDigits(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      {/* Fichas Finales */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Fichas Finales</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            className="w-full p-1 border rounded"
            value={fichasDisplay}
            onFocus={() => setFichasFocused(true)}
            onBlur={() => setFichasFocused(false)}
            onChange={(e) => setFichasRaw(onlyDigits(e.target.value))}
            placeholder="0"
          />
        </div>
      </div>

      {/* NUEVO: Saldo de jugadores final (liability) */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Saldo de jugadores (fin) 💼</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            className="w-full p-1 border rounded"
            value={saldoJugadoresFinDisplay}
            onFocus={() => setSaldoJugadoresFinFocused(true)}
            onBlur={() => setSaldoJugadoresFinFocused(false)}
            onChange={(e) => setSaldoJugadoresFinRaw(onlyDigits(e.target.value))}
            placeholder="Ej: 227.095"
          />
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Total de fichas en posesión de jugadores al cierre (pasivo de la plataforma).
        </p>
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
                {t.desde.servicio} → {t.hasta.servicio} — $
                {Number(t.monto).toLocaleString("es-AR")}{" "}
                <button
                  className="ml-2 text-red-600 hover:underline"
                  onClick={() => eliminarTransferencia(i)}
                >
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
                {r.desde.servicio} → {r.hasta?.servicio || "Retiro (Jefe)"} — $
                {Number(r.monto).toLocaleString("es-AR")}{" "}
                <button
                  className="ml-2 text-red-600 hover:underline"
                  onClick={() => eliminarRetiro(i)}
                >
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
