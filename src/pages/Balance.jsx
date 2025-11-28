import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MovimientosTable from "./MovimientosTable";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

/* =========================
   Helpers de formato
   ========================= */
const formatDate = (dateStr = "") => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
};

const formatDateTime = (dateTimeStr = "") => {
  if (!dateTimeStr) return "";
  const [date, time = ""] = dateTimeStr.split(" ");
  return `${formatDate(date)} ${time.slice(0, 5)}`;
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/* =========================
   Helpers para billeteras
   ========================= */
const walletKey = (w = {}) =>
  `${w?.servicio || ""}|${w?.cbu || ""}|${w?.titular || ""}`;


/* =========================
   Faltantes por caja
   ========================= */

/* ===============================================================
   Detalle de una caja (cards del backend, SIN tabla gigante)
   =============================================================== */
function CajaDetalleServidor({ cajaId }) {
  const [loading, setLoading] = useState(true);
  const [pack, setPack] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(
          `https://gestoradmin.store/gestorcaja.php?recurso=balance&caja_id=${cajaId}`
        );
        const txt = await res.text();
        const data = JSON.parse(txt);

        if (!res.ok || data?.error) {
          throw new Error(data?.error || "Error al obtener balance");
        }
        if (alive) setPack(data);
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [cajaId]);

  if (loading)
    return (
      <div className="text-sm text-[#9da3ab] mt-2">
        Cargando resumen de caja #{cajaId}…
      </div>
    );
  if (err) return <div className="text-sm text-red-400 mt-2">Error: {err}</div>;
  if (!pack) return null;

  // 🚀 AHORA TOMAMOS EXACTAMENTE LOS CAMPOS QUE DEVUELVE EL BACKEND
  const resumen = pack.resumen || {};

  const fc = (n) =>
    `$${Number(n || 0).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // 👇 Cards ajustadas a tu backend ACTUAL
  const cards = [
    { label: "Depósitos", value: resumen.depositos },
    { label: "Premios", value: resumen.premios },
    { label: "Bonos", value: resumen.bonos },
    { label: "Costo Bonos", value: resumen.costoBonos },
    { label: "Costo Fichas", value: resumen.costoFichas },
    { label: "Consumo Fichas", value: resumen.consumoFichas},
    { label: "Retiros / Bajadas", value: resumen.T_total },
     {
  label: "Ganancia Neta",
  value: resumen.gananciaReal,
  isGain: true,
},

  ];

  return (
    <div className="mt-4 space-y-4">
      {/* GRID DE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className="rounded-lg p-3 border border-[#3a3f45] bg-[#2a2d33]"
          >
            <div className="text-[#c7c9cc]">{c.label}</div>
            <div
              className={`font-bold ${
                c.isGain
                  ? Number(c.value) >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                  : ""
              }`}
            >
              {fc(c.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===============================================================
   Resumen real del día (usando backend por cada caja del día)
   =============================================================== */
function DayResumenServidor({ detalles }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [resumenDia, setResumenDia] = useState(null);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        let totalD = 0;
        let totalT = 0;
        let totalP = 0;
        let totalB = 0;
        let totalDeltaL = 0;
        let tieneL = false;

        for (const entry of detalles) {
          const res = await fetch(
            `https://gestoradmin.store/gestorcaja.php?recurso=balance&caja_id=${entry.id}`
          );
          const txt = await res.text();
          const data = JSON.parse(txt);

          if (!res.ok || data?.error) {
            throw new Error(data?.error || "Error al obtener balance diario");
          }

          const r = data.resumen?.totales || data.resumen || {};
          totalD += safeNum(r.depositos);
          totalT += safeNum(r.T);
          totalP += safeNum(r.premios);
          totalB += safeNum(r.bonos);
          if (typeof r.deltaL === "number") {
            totalDeltaL += safeNum(r.deltaL);
            tieneL = true;
          } else {
            const liIni = safeNum(entry.liability_inicio);
            const liFin = safeNum(entry.liability_fin);
            if (
              Number.isFinite(liIni) &&
              Number.isFinite(liFin) &&
              (liIni !== 0 || liFin !== 0)
            ) {
              totalDeltaL += liFin - liIni;
              tieneL = true;
            }
          }
        }

        if (!alive) return;
        setResumenDia({
          D: totalD,
          T: totalT,
          P: totalP,
          B: totalB,
          deltaL: totalDeltaL,
          tieneL,
        });
      } catch (e) {
        if (!alive) return;
        setErr(String(e.message || e));
        setResumenDia(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (detalles && detalles.length) {
      run();
    } else {
      setLoading(false);
      setResumenDia(null);
    }

    return () => {
      alive = false;
    };
  }, [JSON.stringify(detalles?.map((d) => d.id) || [])]);

  if (loading)
    return (
      <div className="text-xs text-[#9da3ab] mt-2">
        Calculando Ganancia Real del día…
      </div>
    );

  if (err)
    return (
      <div className="text-xs text-red-400 mt-2">
        Error al calcular Ganancia Real del día: {err}
      </div>
    );

  if (!resumenDia)
    return (
      <div className="text-xs text-[#9da3ab] mt-2">
        No hay datos para el día.
      </div>
    );

  const { T, P, B, HW, deltaL, tieneL } = resumenDia;

}

/* =========================
   Componente principal
   ========================= */
const CajaAnalytics = () => {
  const [data, setData] = useState([]);
  const [empleados, setEmpleados] = useState({});
  const [retiros, setRetiros] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState("");
  const [empleado, setEmpleado] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fechaMin, setFechaMin] = useState("");
  const [fechaMax, setFechaMax] = useState("");
  const [expandedDate, setExpandedDate] = useState(null);
  const [showAllMovements, setShowAllMovements] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFichasLine, setShowFichasLine] = useState(true);
  const navigate = useNavigate();

  /* -------- Fetch -------- */
  useEffect(() => {
    const fetchData = async () => {
      const [resCajas, resEmpleados, resRetiros, resTransf] = await Promise.all([
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja"),
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=empleados"),
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=retiros"),
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=transferencias"),
      ]);

      const cajasJson = await resCajas.json();
      const empleadosData = await resEmpleados.json();
      const retirosData = await resRetiros.json();
      const transfData = await resTransf.json();

      const empleadosMap = {};
      (empleadosData || []).forEach(
        (emp) => (empleadosMap[emp.id] = emp.nombre)
      );

      setEmpleados(empleadosMap);
      setRetiros(Array.isArray(retirosData) ? retirosData : []);
      setTransferencias(Array.isArray(transfData) ? transfData : []);

      // Soporta varias formas posibles de respuesta
      const cajaArrayRaw = Array.isArray(cajasJson?.data)
        ? cajasJson.data
        : Array.isArray(cajasJson)
        ? cajasJson
        : Array.isArray(cajasJson?.cajas)
        ? cajasJson.cajas
        : [];

      console.log("APERTURA CAJA JSON", cajasJson, cajaArrayRaw);

      const parsed = cajaArrayRaw.filter(
        (e) => e.fecha_apertura && e.fecha_cierre
      );

      setData(parsed);
      setFiltered(parsed);

      if (parsed.length) {
        const fechas = parsed.map((e) => e.fecha_apertura.split(" ")[0]);
        const min = fechas.reduce((a, b) => (a < b ? a : b));
        const max = fechas.reduce((a, b) => (a > b ? a : b));
        setFechaMin(min);
        setFechaMax(max);
      }
    };

    fetchData();
  }, []);

  /* -------- Filtros -------- */
  useEffect(() => {
    const result = data.filter((item) => {
      const dateMatch = fecha ? item.fecha_apertura.startsWith(fecha) : true;
      const turnoMatch = turno ? item.turno === turno : true;
      const empleadoMatch = empleado
        ? Number(item.empleado_id) === Number(empleado)
        : true;
      return dateMatch && turnoMatch && empleadoMatch;
    });
    setFiltered(result);
  }, [fecha, turno, empleado, data]);

  /* ======================
     Resumen por fecha (día)
     ====================== */
  const sumRetirosCaja = (cajaId) =>
    (retiros || [])
      .filter((r) => Number(r.caja_id) === Number(cajaId))
      .reduce((acc, it) => acc + safeNum(it.monto), 0);

  const resumen = {};
  const detallesPorFecha = {};

  filtered.forEach((entry) => {
    const date = entry.fecha_apertura.split(" ")[0];

    // Datos reales desde backend
    const depositosCaja = safeNum(entry.depositos);
    const premiosCaja = safeNum(entry.premios);
    const bonosCaja = safeNum(entry.bonos);
    const retirosCaja = sumRetirosCaja(entry.id);

    // GANANCIA REAL PROVENIENTE DEL BACKEND
    const gananciaCaja = safeNum(entry.ganancia);

    // GANANCIA REAL = Depósitos – Premios – Bonos
    const ingresoCaja = depositosCaja;
    const egresoCaja = premiosCaja + bonosCaja;
   

    // Δ pasivo (si existen columnas)
    const liIni = safeNum(entry.liability_inicio);
    const liFin = safeNum(entry.liability_fin);
    const deltaPasivo =
      Number.isFinite(liIni) && Number.isFinite(liFin) ? liFin - liIni : null;
    
    if (!resumen[date])
      resumen[date] = {
        ganancia: 0,
        ingreso: 0,
        egreso: 0,
        deltaPasivo: 0,
        tienePasivo: false,
      };
    resumen[date].ganancia += gananciaCaja;
    resumen[date].ingreso += ingresoCaja;
    resumen[date].egreso += egresoCaja;
    if (deltaPasivo !== null) {
      resumen[date].deltaPasivo += deltaPasivo;
      resumen[date].tienePasivo = true;
    }

    if (!detallesPorFecha[date]) detallesPorFecha[date] = [];
    detallesPorFecha[date].push({
      ...entry,
      _retirosCaja: retirosCaja,
      _premiosCaja: premiosCaja,
      _bonosCaja: bonosCaja,
      _deltaPasivo: deltaPasivo,
    });
  });

  const sortedDates = Object.entries(resumen).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );

  const allSorted = [...filtered]
    .map((entry) => {
      const depositosCaja = safeNum(entry.depositos);
      const premiosCaja = safeNum(entry.premios);
      const bonosCaja = safeNum(entry.bonos);

      return {
  ...entry,
  houseWin: safeNum(entry.houseWin ?? entry.HW ?? entry.hw),
  gananciaReal: safeNum(entry.gananciaReal ?? entry.g_real ?? entry.ganancia_real),
};


    })
    .filter((entry) =>
      (empleados[entry.empleado_id] || "")
        .toLowerCase()
        .includes((searchTerm || "").toLowerCase())
    )
    .sort((a, b) => new Date(a.fecha_apertura) - new Date(b.fecha_apertura));

  /* ======================
     DATA: Gráfico de evolución
     ====================== */
  const chartData = useMemo(() => {
    return sortedDates.map(([date]) => {
      const detalles = detallesPorFecha[date] || [];

      // Depósitos del día (ingresos reales del casino)
      const depositosDia = detalles.reduce(
        (acc, e) => acc + safeNum(e.depositos),
        0
      );

      const premiosDia = detalles.reduce(
        (acc, e) => acc + safeNum(e._premiosCaja),
        0
      );

      const bonosDia = detalles.reduce(
        (acc, e) => acc + safeNum(e._bonosCaja),
        0
      );

const gananciaReal = detalles.reduce(
  (acc, e) => acc + safeNum(e.gananciaReal),
  0
);



  const fichasGastadas = detalles.reduce(
  (acc, e) => acc + safeNum(e.consumoFichas),
  0
);

      return {
        dateISO: date,
        date: formatDate(date),
        ganancia: gananciaReal,
        fichas: fichasGastadas,
      };
    });
  }, [sortedDates, detallesPorFecha]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const g = payload.find((p) => p.dataKey === "ganancia");
    const f = payload.find((p) => p.dataKey === "fichas");
    return (
      <div className="rounded-xl bg-[#1e1f23]/95 border border-[#3a3f45] p-3 text-sm">
        <div className="font-semibold mb-1 text-[#e6e6e6]">{label}</div>
        {g && (
          <div className="text-[#c7c9cc]">
            Ganancia:{" "}
            <span className="font-bold text-[#e6e6e6]">
              {formatCurrency(g.value)}
            </span>
          </div>
        )}
        {f && (
          <div className="text-[#c7c9cc]">
            Fichas gastadas:{" "}
            <span className="font-bold text-[#e6e6e6]">
              {Number(f.value).toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        )}
      </div>
    );
  };

  /* ======================
     Totales del período filtrado
     ====================== */
  const totalesFiltro = Object.values(resumen).reduce(
    (acc, dia) => {
      acc.depositos += dia.ingreso; // ingreso = depósitos reales
      acc.premiosYBonos += dia.egreso;
      acc.ganancia += dia.ganancia;

      if (dia.tienePasivo) {
        acc.deltaPasivo += dia.deltaPasivo;
        acc.tienePasivo = true;
      }
      return acc;
    },
    {
      depositos: 0,
      premiosYBonos: 0,
      ganancia: 0,
      deltaPasivo: 0,
      tienePasivo: false,
    }
  );

  const noHayDatos = !data.length;

  return (
    <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] p-6 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#e8e9ea]">
          Caja Analytics
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllMovements(!showAllMovements)}
            className="py-2 px-4 rounded-2xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44] transition-colors"
          >
            {showAllMovements ? "Resumen diario" : "Todos los movimientos"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="py-2 px-4 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
          >
            Ver Retiros
          </button>
          <button
            onClick={() => navigate("/billeteras")}
            className="py-2 px-4 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
          >
            Ver Billeteras
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <input
          type="date"
          value={fecha}
          min={fechaMin}
          max={fechaMax}
          onChange={(e) => setFecha(e.target.value)}
          className="p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
        />
        <select
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          className="p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
        >
          <option value="">Todos los turnos</option>
          {[...new Set(data.map((e) => e.turno))].map((t) => (
            <option key={t} value={t}>
              Turno {t}
            </option>
          ))}
        </select>
        <select
          value={empleado}
          onChange={(e) => setEmpleado(e.target.value)}
          className="p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
        >
          <option value="">Todos los empleados</option>
          {[...new Set(data.map((e) => e.empleado_id))].map((id) => (
            <option key={id} value={id}>
              {empleados[id]}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none md:col-span-2"
        />
        <button
          onClick={() => {
            setFecha("");
            setTurno("");
            setEmpleado("");
            setSearchTerm("");
          }}
          className="py-2 px-4 rounded-2xl font-semibold bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
        >
          Limpiar filtros
        </button>
      </div>

      {noHayDatos && (
        <div className="text-center text-red-400 mt-10">
          No hay datos disponibles.
        </div>
      )}

      {!noHayDatos && (
        <>
          {/* RESUMEN DEL PERÍODO FILTRADO */}
          <div className="bg-[#1e1f23] border border-[#2f3336] rounded-2xl p-4">
            <h2 className="text-lg font-semibold mb-3">
              Resumen del período filtrado
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl p-3 border border-[#3a3f45] bg-[#2a2d33]">
                <div className="text-[#c7c9cc]">Depósitos totales (D)</div>
                <div className="font-bold">
                  {formatCurrency(totalesFiltro.depositos)}
                </div>
              </div>
              <div className="rounded-xl p-3 border border-[#3a3f45] bg-[#2a2d33]">
                <div className="text-[#c7c9cc]">Premios + Bonos</div>
                <div className="font-bold">
                  {formatCurrency(totalesFiltro.premiosYBonos)}
                </div>
              </div>
              <div className="rounded-xl p-3 border border-[#3a3f45] bg-[#2a2d33]">
                <div className="text-[#c7c9cc]">
                  Ganancia Real 
                </div>
                <div
                  className={`font-bold ${
                    totalesFiltro.ganancia >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(totalesFiltro.ganancia)}
                </div>
              </div>
              {totalesFiltro.tienePasivo && (
                <div className="rounded-xl p-3 border border-[#3a3f45] bg-[#2a2d33]">
                  <div className="text-[#c7c9cc]">Δ Pasivo jugadores (∑ΔL)</div>
                  <div className="font-bold text-yellow-300">
                    {totalesFiltro.deltaPasivo >= 0 ? "+ " : "- "}
                    {formatCurrency(Math.abs(totalesFiltro.deltaPasivo))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ======= GRÁFICO DE EVOLUCIÓN ======= */}
          <div className="bg-[#1e1f23] border border-[#2f3336] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Evolución diaria</h2>
              <label className="flex items-center gap-2 text-sm text-[#c7c9cc]">
                <input
                  type="checkbox"
                  className="accent-emerald-400"
                  checked={showFichasLine}
                  onChange={(e) => setShowFichasLine(e.target.checked)}
                />
                Mostrar fichas gastadas
              </label>
            </div>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ left: 8, right: 16, top: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d33" />
                  <XAxis dataKey="date" stroke="#9da3ab" />
                  <YAxis
                    yAxisId="left"
                    stroke="#9da3ab"
                    tickFormatter={(v) =>
                      `\$${Number(v).toLocaleString("es-AR")}`
                    }
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9da3ab"
                    hide={!showFichasLine}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={0} yAxisId="left" stroke="#3a3f45" />

                  {/* Ganancia en verde */}
                  <Line
                    type="monotone"
                    dataKey="ganancia"
                    yAxisId="left"
                    name="Ganancia (ARS)"
                    stroke="#22c55e"
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />

                  {/* Fichas en violeta */}
                  {showFichasLine && (
                    <Line
                      type="monotone"
                      dataKey="fichas"
                      yAxisId="right"
                      name="Fichas gastadas"
                      stroke="#8b5cf6"
                      strokeWidth={1.8}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-[#9da3ab] mt-2">
              * Ganancia del día = Depósitos − (Premios + Bonos). Las fichas se
              muestran como unidades (eje derecho).
            </div>
          </div>

          {/* ======= LISTADO (resumen/expandible) ======= */}
          {showAllMovements ? (
            <div className="overflow-x-auto">
              <MovimientosTable entries={allSorted} empleados={empleados} />
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Ganancia Real diaria</h2>

              {sortedDates.map(([date, resume]) => {
                const detalles = detallesPorFecha[date] || [];

                const premiosDia = detalles.reduce(
                  (acc, e) => acc + safeNum(e._premiosCaja),
                  0
                );
                const bonosDia = detalles.reduce(
                  (acc, e) => acc + safeNum(e._bonosCaja),
                  0
                );
                const depositosDia = detalles.reduce(
                  (acc, e) => acc + safeNum(e.depositos),
                  0
                );

                const ingreso = depositosDia;
                const egreso = premiosDia + bonosDia;
  const gananciaRealDia = detalles.reduce(
  (acc, e) => acc + safeNum(e.gananciaReal),
  0
);



                const claseColor = gananciaRealDia >= 0 ? "text-emerald-400" : "text-red-400";


                
              
                const tienePasivo = resume?.tienePasivo;

                return (
                  <div
                    key={date}
                    className="bg-[#1e1f23] border border-[#2f3336] p-4 rounded-2xl"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() =>
                        setExpandedDate(
                          expandedDate === date ? null : date
                        )
                      }
                    >
                      <span className="text-lg font-semibold">
                        {formatDate(date)}
                      </span>
                      <span className={`text-sm font-bold ${claseColor}`}>
  {gananciaRealDia >= 0
  ? `+ ${formatCurrency(gananciaRealDia)}`
  : `- ${formatCurrency(Math.abs(gananciaRealDia))}`}
</span>
</div>  
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: expandedDate === date ? "auto" : 0,
                        opacity: expandedDate === date ? 1 : 0,
                      }}
                      transition={{ duration: 0.35 }}
                      className="overflow-hidden"
                    >
                      {/* Resumen real del día, usando backend (formato 1) */}
                      <DayResumenServidor detalles={detalles} />

                  
                      
                  

                      {/* Movimientos del día */}
                      <MovimientosTable
                        entries={detalles}
                        empleados={empleados}
                      />

                      {/* Detalle por caja desde el servidor (solo cards, sin tabla grande) */}
                      <div className="mt-4 space-y-6">
                        {detalles.map((entry) => (
                          <div
                            key={`det-${entry.id}`}
                            className="pt-2 border-t border-[#2f3336]"
                          >
                            <h3 className="text-sm font-semibold text-[#d7d9dc] mb-2">
                              Caja #{entry.id} —{" "}
                              {empleados[entry.empleado_id] ||
                                `ID ${entry.empleado_id}`}
                            </h3>
                            <CajaDetalleServidor cajaId={entry.id} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal de Retiros */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e1f23] rounded-2xl p-6 w-full max-w-5xl shadow-2xl border border-[#2f3336] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[22px] font-semibold tracking-tight text-[#e8e9ea]">
                  Historial de retiros
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-4">
                {retiros.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    className="rounded-xl border border-[#3a3f45] bg-[#2a2d33] p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-[#c7c9cc]">
                        <h3 className="text-lg font-semibold text-[#e6e6e6]">
                          Caja ID: <span className="font-bold">{r.caja_id}</span>
                        </h3>
                        <p className="text-sm">
                          Fecha: {formatDateTime(r.fecha)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-300 text-xl font-bold">
                          {formatCurrency(r.monto)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg p-4 bg-[#1e1f23] border border-[#2f3336]">
                        <h4 className="text-sm text-[#c7c9cc] mb-2 font-medium uppercase tracking-wide">
                          Desde billetera
                        </h4>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Servicio:</span>{" "}
                          {r.desde_billetera?.servicio}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">CBU:</span>{" "}
                          {r.desde_billetera?.cbu}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Titular:</span>{" "}
                          {r.desde_billetera?.titular}
                        </p>
                      </div>

                      <div className="rounded-lg p-4 bg-[#1e1f23] border border-[#2f3336]">
                        <h4 className="text-sm text-[#c7c9cc] mb-2 font-medium uppercase tracking-wide">
                          Hasta billetera
                        </h4>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Servicio:</span>{" "}
                          {r.hasta_billetera?.servicio}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">CBU:</span>{" "}
                          {r.hasta_billetera?.cbu}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Titular:</span>{" "}
                          {r.hasta_billetera?.titular}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CajaAnalytics;
