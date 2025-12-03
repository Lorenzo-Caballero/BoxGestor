import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistroRetiros from "./RegistrarRetiro";
import RegistrarPremio from "./RegistrarPremio";

const API = "https://gestoradmin.store/gestorcaja.php";

export default function CierreDeCaja({ onCerrarCaja }) {
  const [datosApertura, setDatosApertura] = useState(null);
  const [empleadoId, setEmpleadoId] = useState(null);

  const [billeterasDisponibles, setBilleterasDisponibles] = useState([]);
  const [billeterasExternas, setBilleterasExternas] = useState([]);

  const [montosCierre, setMontosCierre] = useState({});
  const [depositosPorBilletera, setDepositosPorBilletera] = useState({});

  const [transferencias, setTransferencias] = useState([]);
  const [retirosExternos, setRetirosExternos] = useState([]);

  const [premios, setPremios] = useState([]);

  const [bonosRaw, setBonosRaw] = useState("");
  const [bonosFocused, setBonosFocused] = useState(false);

  const [fichasRaw, setFichasRaw] = useState("");
  const [fichasFocused, setFichasFocused] = useState(false);

  const [saldoJugadoresFinRaw, setSaldoJugadoresFinRaw] = useState("");
  const [saldoJugadoresFinFocused, setSaldoJugadoresFinFocused] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [aperturaId, setAperturaId] = useState(null);

  const [mostrarModalMovimientos, setMostrarModalMovimientos] =
    useState(false);
  const [mostrarModalPremios, setMostrarModalPremios] = useState(false);

  const navigate = useNavigate();

  const walletKey = (w = {}) =>
    `${w?.servicio || ""}|${w?.cbu || ""}|${w?.titular || ""}`;

  const formatARS = (n) =>
    Number(n || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  const formatMilesAR = (digitsStr) => {
    if (!digitsStr) return "";
    const cleaned = String(digitsStr).replace(/^0+(?=\d)/, "");
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
  const toNumber = (digits) => (digits === "" ? 0 : Number(digits));

  const premiosTotal = premios.reduce(
    (acc, p) => acc + Number(p?.monto || 0),
    0
  );

  // cargar datos de apertura
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aperturaRes, empleadosRes, billeterasRes] = await Promise.all([
          fetch(`${API}?recurso=apertura-caja`).catch(() => null),
          fetch(`${API}?recurso=empleados`).catch(() => null),
          fetch(`${API}?recurso=billeteras`).catch(() => null),
        ]);

        const aperturaJson = aperturaRes
          ? await aperturaRes.json().catch(() => ({}))
          : {};
        const empleadosJson = empleadosRes
          ? await empleadosRes.json().catch(() => [])
          : [];
        const todasBilleteras = billeterasRes
          ? await billeterasRes.json().catch(() => [])
          : [];

        const aperturas = Array.isArray(aperturaJson?.data)
          ? aperturaJson.data
          : [];
        if (aperturas.length === 0) {
          setMensaje("No se encontró ninguna caja abierta.");
          setLoading(false);
          return;
        }

        const abiertas = aperturas.filter((a) => !a?.fecha_cierre);
        const apertura = abiertas.length
          ? abiertas[0]
          : [...aperturas].sort(
              (a, b) => Number(b?.id || 0) - Number(a?.id || 0)
            )[0];

        const bilIniRaw = Array.isArray(apertura?.billeteras_iniciales)
          ? apertura.billeteras_iniciales
          : apertura?.billeteras_iniciales &&
            typeof apertura.billeteras_iniciales === "object"
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

        const aperturaIdLocal = apertura?.id ?? null;

        setDatosApertura({
          empleado: empInfo
            ? empInfo.nombre
            : `ID ${apertura?.empleado_id ?? "-"}`,
          turno: apertura?.turno || "-",
          montosIniciales,
        });

        setEmpleadoId(Number(apertura?.empleado_id) || null);
        setAperturaId(aperturaIdLocal);
        setBilleterasDisponibles(billeterasIni);

        const externas = (Array.isArray(todasBilleteras) ? todasBilleteras : []).filter(
          (b) => String(b?.tipo || "").toLowerCase() === "retiro"
        );
        setBilleterasExternas(externas);

        if (aperturaIdLocal) {
          const premiosRes = await fetch(
            `${API}?recurso=premios&caja_id=${aperturaIdLocal}`
          ).catch(() => null);

          const premiosJson = premiosRes
            ? await premiosRes.json().catch(() => [])
            : [];

          setPremios(Array.isArray(premiosJson) ? premiosJson : []);
        }

        setLoading(false);
      } catch (error) {
        setMensaje("Error al cargar datos.");
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const handleMontoCierre = (key, val) =>
    setMontosCierre((prev) => ({ ...prev, [key]: val }));

  const handleDeposito = (key, val) =>
    setDepositosPorBilletera((prev) => ({ ...prev, [key]: val }));

  // movimientos
  const agregarMovimiento = (mov) => {
    if (!mov || !mov.desde || !mov.hasta || !mov.monto) return;
    const monto = Number(mov.monto) || 0;
    const esRetiro =
      String(mov.hasta?.tipo || "").toLowerCase() === "retiro" ||
      mov.tipo === "retiro";
    if (esRetiro) setRetirosExternos((prev) => [...prev, { ...mov, monto }]);
    else setTransferencias((prev) => [...prev, { ...mov, monto }]);
  };

  const eliminarTransferencia = (i) =>
    setTransferencias((prev) => prev.filter((_, idx) => idx !== i));

  const eliminarRetiro = (i) =>
    setRetirosExternos((prev) => prev.filter((_, idx) => idx !== i));

  const eliminarPremio = (i) =>
    setPremios((prev) => prev.filter((_, idx) => idx !== i));

  const handlePremioAgregado = (nuevo) => {
    if (!nuevo) return;
    setPremios((prev) => [...prev, nuevo]);
  };

  // cierre de caja
  const cerrarCaja = async () => {
    const faltantes = billeterasDisponibles.some((b) => {
      const key = walletKey(b);
      return (
        montosCierre[key] === undefined ||
        montosCierre[key] === "" ||
        depositosPorBilletera[key] === undefined ||
        depositosPorBilletera[key] === ""
      );
    });

    if (
      faltantes ||
      bonosRaw === "" ||
      fichasRaw === "" ||
      saldoJugadoresFinRaw === ""
    ) {
      setMensaje("Completá todos los campos antes de cerrar la caja.");
      return;
    }

    if (!window.confirm("¿Seguro que querés cerrar la caja?")) return;

    try {
      // transferencias internas
      for (const t of transferencias) {
        await fetch(`${API}?recurso=transferencias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caja_id: aperturaId,
            monto: Number(t.monto) || 0,
            desde_billetera: t.desde,
            hasta_billetera: t.hasta,
          }),
        });
      }

      // retiros externos
      for (const r of retirosExternos) {
        await fetch(`${API}?recurso=retiros`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caja_id: aperturaId,
            monto: Number(r.monto) || 0,
            desde_billetera: r.desde,
            hasta_billetera: r.hasta || { servicio: "Retiro (Jefe)" },
          }),
        });
      }
    } catch (e) {
      console.error("Error registrando movimientos:", e);
      setMensaje("Error registrando movimientos.");
      return;
    }

    const depositosArray = billeterasDisponibles.map((b) => ({
      id: Number(b?.id || 0),
      servicio: b?.servicio,
      titular: b?.titular,
      cbu: b?.cbu,
      monto: toNumber(depositosPorBilletera[walletKey(b)] || 0),
    }));

    const billeteras_finales = billeterasDisponibles.map((b) => ({
      id: Number(b?.id || 0),
      servicio: b?.servicio,
      titular: b?.titular,
      cbu: b?.cbu,
      monto: toNumber(montosCierre[walletKey(b)] || 0),
    }));

    const totalDepositosCalculado = billeterasDisponibles.reduce((acc, b) => {
      return acc + toNumber(depositosPorBilletera[walletKey(b)] || 0);
    }, 0);

    const body = {
      caja_id: aperturaId,
      billeteras_finales,
      premios: premiosTotal,
      bonos: toNumber(bonosRaw),
      fichas_finales: toNumber(fichasRaw),
      saldo_jugadores_final: toNumber(saldoJugadoresFinRaw),
      depositos: depositosArray,
      depositos_totales: totalDepositosCalculado,
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
        setMensaje(data?.error || "Error al cerrar la caja.");
        return;
      }

      alert("Caja cerrada correctamente");
      onCerrarCaja && onCerrarCaja({ ...body, id: aperturaId });
      navigate("/");
    } catch (error) {
      setMensaje("Ocurrió un error.");
    }
  };

  // UI carga/error
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-center justify-center px-4">
        <p className="text-sm text-[#c7c9cc]">Cargando datos...</p>
      </div>
    );
  }

  if (!datosApertura) {
    return (
      <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-center justify-center px-4">
        <p className="text-sm text-red-400">{mensaje}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-[#1e1f23] border border-[#2f3336] rounded-2xl shadow-2xl p-8 md:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[#e8e9ea]">
            Cierre de caja
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[#2f3336]" />
        </div>

        {/* Info de apertura */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
            <p className="text-sm text-[#c7c9cc]">Agente</p>
            <p className="font-semibold text-[#e6e6e6]">
              {datosApertura.empleado}
            </p>
          </div>
          <div className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
            <p className="text-sm text-[#c7c9cc]">Turno</p>
            <p className="font-semibold text-[#e6e6e6]">
              {datosApertura.turno}
            </p>
          </div>
        </div>

        {/* Billeteras */}
        <div className="space-y-6 mb-10">
          {billeterasDisponibles.map((b) => {
            const key = walletKey(b);
            return (
              <div
                key={key}
                className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4 space-y-3"
              >
                {/* Cabecera billetera */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#e6e6e6]">
                      {b?.servicio}
                    </div>
                    <div className="text-xs text-[#c7c9cc]">{b?.titular}</div>
                    <div className="text-[10px] text-[#9da3ab]">
                      {b?.cbu
                        ? `${String(b.cbu).slice(0, 6)}...${String(
                            b.cbu
                          ).slice(-4)}`
                        : ""}
                    </div>
                  </div>

                  <div className="text-right text-sm text-[#c7c9cc]">
                    Inicial:{" "}
                    {formatARS(datosApertura.montosIniciales[key] || 0)}
                  </div>
                </div>

                {/* SALDO FINAL */}
                <div>
                  <label className="block text-xs text-[#9da3ab] mb-1">
                    Saldo de cierre
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-2 rounded-lg bg-[#202329] border border-[#3a3f45] focus:outline-none"
                    value={
                      montosCierre[key] !== undefined &&
                      montosCierre[key] !== ""
                        ? Number(montosCierre[key]).toLocaleString("es-AR")
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, "");
                      if (/^\d*$/.test(raw)) handleMontoCierre(key, raw);
                    }}
                  />
                </div>

                {/* DEPOSITOS POR BILLETERA */}
                <div>
                  <label className="block text-xs text-[#9da3ab] mb-1">
                    Depósitos totales de esta billetera (provenientes de
                    jugadores)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full p-2 rounded-lg bg-[#202329] border border-[#3a3f45] focus:outline-none"
                    value={
                      depositosPorBilletera[key] !== undefined &&
                      depositosPorBilletera[key] !== ""
                        ? Number(
                            depositosPorBilletera[key]
                          ).toLocaleString("es-AR")
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, "");
                      if (/^\d*$/.test(raw)) handleDeposito(key, raw);
                    }}
                    placeholder="Ej: 19000"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Valores restantes */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
              Premios pagados
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={formatARS(premiosTotal)}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
              Bonos
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={
                bonosFocused
                  ? formatMilesAR(bonosRaw)
                  : bonosRaw !== ""
                  ? formatARS(Number(bonosRaw))
                  : ""
              }
              onFocus={() => setBonosFocused(true)}
              onBlur={() => setBonosFocused(false)}
              onChange={(e) => setBonosRaw(onlyDigits(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
              Fichas finales
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={
                fichasFocused
                  ? formatMilesAR(fichasRaw)
                  : fichasRaw !== ""
                  ? formatARS(Number(fichasRaw))
                  : ""
              }
              onFocus={() => setFichasFocused(true)}
              onBlur={() => setFichasFocused(false)}
              onChange={(e) => setFichasRaw(onlyDigits(e.target.value))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
              Saldo de jugadores (fin)
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
              value={
                saldoJugadoresFinFocused
                  ? formatMilesAR(saldoJugadoresFinRaw)
                  : saldoJugadoresFinRaw !== ""
                  ? formatARS(Number(saldoJugadoresFinRaw))
                  : ""
              }
              onFocus={() => setSaldoJugadoresFinFocused(true)}
              onBlur={() => setSaldoJugadoresFinFocused(false)}
              onChange={(e) =>
                setSaldoJugadoresFinRaw(onlyDigits(e.target.value))
              }
              placeholder="Ej: 227000"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <button
            onClick={() => setMostrarModalPremios(true)}
            className="w-full py-3 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33]"
          >
            Registrar premios
          </button>

          <button
            onClick={() => setMostrarModalMovimientos(true)}
            className="w-full py-3 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33]"
          >
            Movimientos (transferencias / retiros)
          </button>

          <button
            onClick={cerrarCaja}
            className="w-full py-3 rounded-2xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44]"
          >
            Confirmar y cerrar caja
          </button>
        </div>

        {mensaje && (
          <p className="mt-4 text-center text-red-400">{mensaje}</p>
        )}

        {/* Listado de premios EDITABLE */}
        {premios.length > 0 && (
          <div className="mt-8 text-sm">
            <h3 className="font-semibold mb-2 text-[#d7d9dc]">
              Premios registrados
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[#c7c9cc]">
              {premios.map((p, i) => (
                <li key={`p-${i}`}>
                  {formatARS(p.monto)} —{" "}
                  {p.servicio ||
                    p.billetera_servicio ||
                    `Billetera #${p.billetera_id}`}
                  <button
                    className="ml-2 text-red-400 hover:underline"
                    onClick={() => eliminarPremio(i)}
                  >
                    eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Listados de transferencias y retiros */}
        {transferencias.length > 0 && (
          <div className="mt-8 text-sm">
            <h3 className="font-semibold mb-2 text-[#d7d9dc]">
              Transferencias internas
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[#c7c9cc]">
              {transferencias.map((t, i) => (
                <li key={`t-${i}`}>
                  {t.desde.servicio} → {t.hasta.servicio} — $
                  {Number(t.monto).toLocaleString("es-AR")}{" "}
                  <button
                    className="ml-2 text-red-400 hover:underline"
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
          <div className="mt-6 text-sm">
            <h3 className="font-semibold mb-2 text-[#d7d9dc]">
              Retiros (fuera del sistema)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-[#c7c9cc]">
              {retirosExternos.map((r, i) => (
                <li key={`r-${i}`}>
                  {r.desde.servicio} →{" "}
                  {r.hasta?.servicio || "Retiro (Jefe)"} — $
                  {Number(r.monto).toLocaleString("es-AR")}{" "}
                  <button
                    className="ml-2 text-red-400 hover:underline"
                    onClick={() => eliminarRetiro(i)}
                  >
                    eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modales */}
        <RegistroRetiros
          visible={mostrarModalMovimientos}
          onClose={() => setMostrarModalMovimientos(false)}
          cajaId={aperturaId}
          billeteras={billeterasDisponibles}
          billeterasExternas={billeterasExternas}
          onGuardarMovimiento={agregarMovimiento}
        />

        <RegistrarPremio
          visible={mostrarModalPremios}
          onClose={() => setMostrarModalPremios(false)}
          cajaId={aperturaId}
          billeteras={billeterasDisponibles}
          onPremioAgregado={handlePremioAgregado}
        />
      </div>
    </div>
  );
}
