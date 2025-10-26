import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistroRetiros from "./RegistrarRetiro";

const API = "https://gestoradmin.store/gestorcaja.php";

export default function CierreDeCaja({ onCerrarCaja }) {
  const [datosApertura, setDatosApertura] = useState(null);
  const [empleadoId, setEmpleadoId] = useState(null);

  const [billeterasDisponibles, setBilleterasDisponibles] = useState([]);
  const [billeterasExternas, setBilleterasExternas] = useState([]);
  const [montosCierre, setMontosCierre] = useState({});

  const [transferencias, setTransferencias] = useState([]);
  const [retirosExternos, setRetirosExternos] = useState([]);

  const [premiosRaw, setPremiosRaw] = useState("");
  const [premiosFocused, setPremiosFocused] = useState(false);

  const [bonosRaw, setBonosRaw] = useState("");
  const [bonosFocused, setBonosFocused] = useState(false);

  const [fichasRaw, setFichasRaw] = useState("");
  const [fichasFocused, setFichasFocused] = useState(false);

  const [saldoJugadoresFinRaw, setSaldoJugadoresFinRaw] = useState("");
  const [saldoJugadoresFinFocused, setSaldoJugadoresFinFocused] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [aperturaId, setAperturaId] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const navigate = useNavigate();

  // utilidades
  const walletKey = (w = {}) => `${w?.servicio || ""}|${w?.cbu || ""}|${w?.titular || ""}`;

  const formatARS = (n) =>
    Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });

  const formatMilesAR = (digitsStr) => {
    if (!digitsStr) return "";
    const cleaned = String(digitsStr).replace(/^0+(?=\d)/, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
  const toNumber = (digits) => (digits === "" ? 0 : Number(digits));

  // carga datos
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aperturaRes, empleadosRes, billeterasRes] = await Promise.all([
          fetch(`${API}?recurso=apertura-caja`).catch(() => null),
          fetch(`${API}?recurso=empleados`).catch(() => null),
          fetch(`${API}?recurso=billeteras`).catch(() => null),
        ]);

        const aperturaJson = aperturaRes ? await aperturaRes.json().catch(() => ({})) : {};
        const empleadosJson = empleadosRes ? await empleadosRes.json().catch(() => []) : [];
        const todasBilleteras = billeterasRes ? await billeterasRes.json().catch(() => []) : [];

        const aperturas = Array.isArray(aperturaJson?.data) ? aperturaJson.data : [];
        if (aperturas.length === 0) {
          setMensaje("No se encontró ninguna caja abierta.");
          setLoading(false);
          return;
        }

        const abiertas = aperturas.filter((a) => !a?.fecha_cierre);
        const apertura = abiertas.length
          ? abiertas[0]
          : [...aperturas].sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0))[0];

        const bilIniRaw =
          Array.isArray(apertura?.billeteras_iniciales)
            ? apertura.billeteras_iniciales
            : apertura?.billeteras_iniciales && typeof apertura.billeteras_iniciales === "object"
            ? Object.values(apertura.billeteras_iniciales)
            : [];

        const billeterasIni = Array.isArray(bilIniRaw) ? bilIniRaw : [];

        const montosIniciales = billeterasIni.reduce((acc, b) => {
          acc[walletKey(b)] = Number(b?.monto || 0);
          return acc;
        }, {});

        const empInfo = (Array.isArray(empleadosJson) ? empleadosJson : []).find(
          (emp) => Number(emp?.id) === Number(apertura?.empleado_id)
        );

        setDatosApertura({
          empleado: empInfo ? empInfo.nombre : `ID ${apertura?.empleado_id ?? "-"}`,
          turno: apertura?.turno || "-",
          montosIniciales,
        });
        setEmpleadoId(Number(apertura?.empleado_id) || null);
        setAperturaId(apertura?.id ?? null);
        setBilleterasDisponibles(billeterasIni);

        // externas tipo 'retiro'
        const externas = (Array.isArray(todasBilleteras) ? todasBilleteras : []).filter(
          (b) => String(b?.tipo || "").toLowerCase() === "retiro"
        );
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

  const handleMontoCierre = (key, val) => setMontosCierre((prev) => ({ ...prev, [key]: val }));

  // movimientos desde modal
  const agregarMovimiento = (mov) => {
    if (!mov || !mov.desde || !mov.hasta || !mov.monto) return;
    const monto = Number(mov.monto) || 0;
    const esRetiro = String(mov.hasta?.tipo || "").toLowerCase() === "retiro" || mov.tipo === "retiro";
    if (esRetiro) setRetirosExternos((prev) => [...prev, { ...mov, monto }]);
    else setTransferencias((prev) => [...prev, { ...mov, monto }]);
  };

  const eliminarTransferencia = (i) => setTransferencias((prev) => prev.filter((_, idx) => idx !== i));
  const eliminarRetiro = (i) => setRetirosExternos((prev) => prev.filter((_, idx) => idx !== i));

  // cierre
  const cerrarCaja = async () => {
    const faltantes = billeterasDisponibles.some((b) => montosCierre[walletKey(b)] === undefined);
    if (faltantes || premiosRaw === "" || bonosRaw === "" || fichasRaw === "" || saldoJugadoresFinRaw === "") {
      setMensaje("Completá todos los campos antes de cerrar la caja.");
      return;
    }

    if (!window.confirm("¿Seguro que querés cerrar la caja? Esta acción no se puede deshacer.")) return;

    // 1) transferencias internas
    try {
      if (transferencias.length > 0) {
        const results = await Promise.all(
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
            }).then(async (r) => ({ ok: r?.ok, json: await r.json().catch(() => ({})) }))
          )
        );
        const err = results.find((r) => !r.ok || r.json?.error);
        if (err) {
          setMensaje(err.json?.error || "Error al registrar transferencias.");
          return;
        }
      }

      // 2) retiros externos
      if (retirosExternos.length > 0) {
        const results = await Promise.all(
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
            }).then(async (r) => ({ ok: r?.ok, json: await r.json().catch(() => ({})) }))
          )
        );
        const err = results.find((r) => !r.ok || r.json?.error);
        if (err) {
          setMensaje(err.json?.error || "Error al registrar retiros.");
          return;
        }
      }
    } catch (e) {
      console.error(e);
      setMensaje("Error de red registrando movimientos. Intentá nuevamente.");
      return;
    }

    // 3) PUT cierre
    const billeteras_finales = billeterasDisponibles.map((b) => ({
      id: Number(b?.id || 0),
      servicio: b?.servicio,
      titular: b?.titular,
      cbu: b?.cbu,
      monto: toNumber(montosCierre[walletKey(b)] || 0),
    }));

    const body = {
      billeteras_finales,
      premios: toNumber(premiosRaw),
      bonos: toNumber(bonosRaw),
      fichas_finales: toNumber(fichasRaw),
      saldo_jugadores_final: toNumber(saldoJugadoresFinRaw),
      empleado_id: empleadoId || null,
    };

    try {
      const resClose = await fetch(`${API}?recurso=apertura-caja`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await resClose.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!resClose.ok || data?.error) {
        setMensaje(data?.error || "Error al cerrar la caja. Intentá nuevamente.");
        return;
      }

      alert("Caja cerrada correctamente");
      onCerrarCaja && onCerrarCaja({ ...body, id: aperturaId });
      navigate("/");
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      setMensaje("Ocurrió un error al cerrar la caja.");
    }
  };

  // estados de carga / error visibles (nunca pantalla vacía)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-center justify-center px-4">
        <p className="text-sm text-[#c7c9cc]">Cargando datos de apertura...</p>
      </div>
    );
  }

  if (!datosApertura) {
    return (
      <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-center justify-center px-4">
        <p className="text-sm text-red-400">{mensaje || "No se pudo cargar la apertura."}</p>
      </div>
    );
  }

  // displays con formato
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

  // UI
  return (
    <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-[#1e1f23] border border-[#2f3336] rounded-2xl shadow-2xl p-8 md:p-10">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#e8e9ea]">
            Cierre de caja
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[#2f3336]" />
        </div>

        {/* Info apertura */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
            <p className="text-sm text-[#c7c9cc]">Agente</p>
            <p className="font-semibold text-[#e6e6e6]">{datosApertura.empleado}</p>
          </div>
          <div className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
            <p className="text-sm text-[#c7c9cc]">Turno</p>
            <p className="font-semibold text-[#e6e6e6]">{datosApertura.turno}</p>
          </div>
        </div>

        {/* Billeteras */}
        <div className="space-y-3 mb-8">
          {billeterasDisponibles.map((b) => {
            const key = walletKey(b);
            return (
              <div key={key} className="flex items-center gap-3 bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
                <div className="min-w-[220px]">
                  <div className="font-semibold text-[#e6e6e6]">{b?.servicio}</div>
                  <div className="text-xs text-[#c7c9cc]">{b?.titular}</div>
                  <div className="text-[10px] text-[#9da3ab]">
                    {b?.cbu ? `${String(b.cbu).slice(0, 6)}...${String(b.cbu).slice(-4)}` : ""}
                  </div>
                </div>

                <span className="ml-auto text-sm text-[#c7c9cc]">
                  {formatARS(datosApertura.montosIniciales[key] || 0)}
                </span>

                <span className="text-[#9da3ab] px-2">→</span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Cierre"
                  className="w-40 p-2 rounded-lg bg-[#202329] border border-[#3a3f45] focus:outline-none"
                  value={
                    montosCierre[key] !== undefined && montosCierre[key] !== ""
                      ? Number(montosCierre[key]).toLocaleString("es-AR")
                      : ""
                  }
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\./g, "");
                    if (/^\d*$/.test(rawValue)) handleMontoCierre(key, rawValue);
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Valores de cierre */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Premios pagados</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={premiosDisplay}
              onFocus={() => setPremiosFocused(true)}
              onBlur={() => setPremiosFocused(false)}
              onChange={(e) => setPremiosRaw(onlyDigits(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Bonos</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={bonosDisplay}
              onFocus={() => setBonosFocused(true)}
              onBlur={() => setBonosFocused(false)}
              onChange={(e) => setBonosRaw(onlyDigits(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Fichas finales</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={fichasDisplay}
              onFocus={() => setFichasFocused(true)}
              onBlur={() => setFichasFocused(false)}
              onChange={(e) => setFichasRaw(onlyDigits(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">Saldo de jugadores (fin)</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={saldoJugadoresFinDisplay}
              onFocus={() => setSaldoJugadoresFinFocused(true)}
              onBlur={() => setSaldoJugadoresFinFocused(false)}
              onChange={(e) => setSaldoJugadoresFinRaw(onlyDigits(e.target.value))}
              placeholder="Ej: 227.095"
            />
            <p className="text-xs text-[#9da3ab] mt-1">
              Total de fichas en posesión de jugadores al cierre (pasivo de la plataforma).
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setMostrarModal(true)}
            className="w-full py-3 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
          >
            Movimientos (transferencias / retiros)
          </button>

          <button
            onClick={cerrarCaja}
            className="w-full py-3 rounded-2xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44] transition-colors"
          >
            Confirmar y cerrar caja
          </button>
        </div>

        {mensaje && <p className="mt-4 text-center text-red-400">{mensaje}</p>}

        <RegistroRetiros
          visible={mostrarModal}
          onClose={() => setMostrarModal(false)}
          cajaId={aperturaId}
          billeteras={billeterasDisponibles}
          billeterasExternas={billeterasExternas}
          onGuardarMovimiento={agregarMovimiento}
        />

        {/* Listados */}
        {transferencias.length > 0 && (
          <div className="mt-8 text-sm">
            <h3 className="font-semibold mb-2 text-[#d7d9dc]">Transferencias internas</h3>
            <ul className="list-disc pl-5 space-y-1 text-[#c7c9cc]">
              {transferencias.map((t, i) => (
                <li key={`t-${i}`}>
                  {t.desde.servicio} → {t.hasta.servicio} — ${Number(t.monto).toLocaleString("es-AR")}{" "}
                  <button className="ml-2 text-red-400 hover:underline" onClick={() => eliminarTransferencia(i)}>
                    eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {retirosExternos.length > 0 && (
          <div className="mt-6 text-sm">
            <h3 className="font-semibold mb-2 text-[#d7d9dc]">Retiros (fuera del sistema)</h3>
            <ul className="list-disc pl-5 space-y-1 text-[#c7c9cc]">
              {retirosExternos.map((r, i) => (
                <li key={`r-${i}`}>
                  {r.desde.servicio} → {r.hasta?.servicio || "Retiro (Jefe)"} — ${Number(r.monto).toLocaleString("es-AR")}{" "}
                  <button className="ml-2 text-red-400 hover:underline" onClick={() => eliminarRetiro(i)}>
                    eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
