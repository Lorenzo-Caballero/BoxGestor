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

const buildWalletMapFromCaja = (entry) => {
  const iniciales = Array.isArray(entry?.billeteras_iniciales)
    ? entry.billeteras_iniciales
    : Object.values(entry?.billeteras_iniciales || {});
  const map = new Map();
  iniciales.forEach((b) => {
    const k = walletKey(b);
    const monto = safeNum(b?.monto);
    map.set(k, {
      ...b,
      saldo_inicial: monto,
      saldo_actual: monto,
      transf_in: 0,
      transf_out: 0,
      retiros: 0,
    });
  });
  return map;
};

const buildFinalMapFromCaja = (entry) => {
  const finales = Array.isArray(entry?.billeteras_finales)
    ? entry.billeteras_finales
    : Object.values(entry?.billeteras_finales || {});
  const map = new Map();
  finales.forEach((b) => map.set(walletKey(b), safeNum(b?.monto)));
  return map;
};

const applyMovimientosCaja = (map, cajaId, transferencias, retiros) => {
  (transferencias || [])
    .filter((t) => Number(t.caja_id) === Number(cajaId))
    .forEach((t) => {
      const m = safeNum(t.monto);
      const d = t.desde_billetera || {};
      const h = t.hasta_billetera || {};
      const kd = walletKey(d);
      const kh = walletKey(h);

      if (!map.has(kd))
        map.set(kd, {
          ...d,
          saldo_inicial: 0,
          saldo_actual: 0,
          transf_in: 0,
          transf_out: 0,
          retiros: 0,
        });
      if (!map.has(kh))
        map.set(kh, {
          ...h,
          saldo_inicial: 0,
          saldo_actual: 0,
          transf_in: 0,
          transf_out: 0,
          retiros: 0,
        });

      map.get(kd).saldo_actual -= m;
      map.get(kd).transf_out += m;
      map.get(kh).saldo_actual += m;
      map.get(kh).transf_in += m;
    });

  (retiros || [])
    .filter((r) => Number(r.caja_id) === Number(cajaId))
    .forEach((r) => {
      const m = safeNum(r.monto);
      const d = r.desde_billetera || {};
      const kd = walletKey(d);
      if (!map.has(kd))
        map.set(kd, {
          ...d,
          saldo_inicial: 0,
          saldo_actual: 0,
          transf_in: 0,
          transf_out: 0,
          retiros: 0,
        });
      map.get(kd).saldo_actual -= m;
      map.get(kd).retiros += m;
    });

  return Array.from(map.values());
};

/* =========================
   Faltantes por caja
   ========================= */
const calcFaltantesCajaFromSnapshot = (entry) => {
  try {
    const detalle = Array.isArray(entry?.descuadre_detalle)
      ? entry.descuadre_detalle
      : JSON.parse(entry?.descuadre_detalle || "[]");

    let totalFaltante = 0;
    let totalSobrante = 0;

    const porBilletera = (detalle || []).map((d) => {
      const esp = safeNum(d.esperado);
      const fin = safeNum(d.final);
      const dif = safeNum(d.diferencia);
      if (dif < 0) totalFaltante += -dif;
      if (dif > 0) totalSobrante += dif;
      return {
        servicio: d.servicio || "",
        titular: d.titular || "",
        cbu: d.cbu || "",
        esperado: esp,
        final: fin,
        diferencia: dif,
      };
    });

    return {
      totalFaltante,
      totalSobrante,
      porBilletera,
      usedSnapshot: true,
    };
  } catch {
    return null;
  }
};

const calcFaltantesCajaRecompute = (entry, transferencias, retiros) => {
  const base = buildWalletMapFromCaja(entry);
  const esperadoArr = applyMovimientosCaja(base, entry.id, transferencias, retiros);
  const esperadoMap = new Map();
  esperadoArr.forEach((b) => esperadoMap.set(walletKey(b), safeNum(b.saldo_actual)));

  const finalesMap = buildFinalMapFromCaja(entry);

  const keys = new Set([...esperadoMap.keys(), ...finalesMap.keys()]);
  let totalFaltante = 0;
  let totalSobrante = 0;
  const porBilletera = [];

  keys.forEach((k) => {
    const esp = safeNum(esperadoMap.get(k));
    const fin = safeNum(finalesMap.get(k));
    const diff = fin - esp; // <0 faltante, >0 sobrante
    if (diff < 0) totalFaltante += -diff;
    if (diff > 0) totalSobrante += diff;
    const [servicio, cbu, titular] = (k || "").split("|");
    porBilletera.push({
      key: k,
      servicio,
      titular,
      cbu,
      esperado: esp,
      final: fin,
      diferencia: diff,
    });
  });

  return { totalFaltante, totalSobrante, porBilletera, usedSnapshot: false };
};

const calcFaltantesCaja = (entry, transferencias, retiros) => {
  const fromSnap = calcFaltantesCajaFromSnapshot(entry);
  if (fromSnap) return fromSnap;
  return calcFaltantesCajaRecompute(entry, transferencias, retiros);
};

/* ===============================================================
   Pack del backend para una caja (tarjetas + tabla) — estilizado
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

  if (loading) return <div className="text-sm text-[#9da3ab] mt-2">Cargando resumen de caja #{cajaId}…</div>;
  if (err) return <div className="text-sm text-red-400 mt-2">Error: {err}</div>;
  if (!pack) return null;

  const resumen = pack.resumen?.totales || pack.resumen || {};
  const filas = pack.billeteras || [];
  const fc = (n) =>
    `$${Number(n || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="mt-4 space-y-4">
      {/* Totales del turno */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
        {[
          ["Retiros reales (T)", resumen.T],
          ["Depósitos (D)", resumen.depositos],
          ["Premios", resumen.premios],
          ["Bonos", resumen.bonos],
          ["Δ Pasivo (ΔL)", resumen.deltaL],
          ["Ganancia (T − (P+Bo))", resumen.ganancia, true],
        ].map(([label, val, isGain], idx) => (
          <div key={idx} className="rounded-lg p-3 border border-[#3a3f45] bg-[#2a2d33]">
            <div className="text-[#c7c9cc]">{label}</div>
            <div className={`font-bold ${isGain ? (Number(val) >= 0 ? "text-emerald-400" : "text-red-400") : ""}`}>
              {fc(val)}
            </div>
          </div>
        ))}
      </div>

      {/* House Win & Cash Flow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {[
          ["House Win", resumen.houseWin],
          ["Cash Flow (R − P)", resumen.cashFlow],
          ["Δ Billeteras (ΔB)", resumen.deltaB],
          ["Consumo fichas (C)", resumen.C],
        ].map(([label, val], idx) => (
          <div key={idx} className="rounded-lg p-3 border border-[#3a3f45] bg-[#2a2d33]">
            <div className="text-[#c7c9cc]">{label}</div>
            <div className="font-bold">{fc(val)}</div>
          </div>
        ))}
      </div>

      {/* Saldos por billetera (del servidor) */}
      <div className="overflow-x-auto rounded-lg border border-[#3a3f45]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#2a2d33] text-[#d7d9dc]">
            <tr>
              {[
                "Servicio","Titular","CBU","Inicial","Transf. (+)","Transf. (−)",
                "Retiros (→ jefe)","Ext. Ingreso","Esperado","Final","Δ",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3f45]">
            {filas.map((b, i) => {
              const delta = Number(b.diferencia || 0);
              return (
                <tr key={i} className="bg-[#1e1f23] hover:bg-[#22252b]">
                  <td className="px-3 py-2">{b.servicio}</td>
                  <td className="px-3 py-2">{b.titular}</td>
                  <td className="px-3 py-2">{b.cbu}</td>
                  <td className="px-3 py-2 text-right">{fc(b.inicial)}</td>
                  <td className="px-3 py-2 text-right">{fc(b.transf_in)}</td>
                  <td className="px-3 py-2 text-right">{fc(b.transf_out)}</td>
                  <td className="px-3 py-2 text-right">{fc(b.retiros_al_jefe)}</td>
                  <td className="px-3 py-2 text-right">{fc(b.extin)}</td>
                  <td className="px-3 py-2 text-right">{fc(b.esperado)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fc(b.final)}</td>
                  <td className={`px-3 py-2 text-right ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {delta >= 0 ? "+" : ""}{fc(delta)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
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
      (empleadosData || []).forEach((emp) => (empleadosMap[emp.id] = emp.nombre));

      setEmpleados(empleadosMap);
      setRetiros(Array.isArray(retirosData) ? retirosData : []);
      setTransferencias(Array.isArray(transfData) ? transfData : []);

      const cajaArray = Array.isArray(cajasJson.data) ? cajasJson.data : [];
      const parsed = cajaArray.filter((e) => e.fecha_apertura && e.fecha_cierre);
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
      const empleadoMatch = empleado ? Number(item.empleado_id) === Number(empleado) : true;
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

    const retirosCaja = sumRetirosCaja(entry.id);
    const premiosCaja = safeNum(entry.premios);
    const bonosCaja = safeNum(entry.bonos);
    const ingresoCaja = retirosCaja;
    const egresoCaja = premiosCaja + bonosCaja;
    const gananciaCaja = ingresoCaja - egresoCaja;

    // Δ pasivo (si existen columnas)
    const liIni = safeNum(entry.liability_inicio);
    const liFin = safeNum(entry.liability_fin);
    const deltaPasivo = Number.isFinite(liIni) && Number.isFinite(liFin) ? liFin - liIni : null;

    if (!resumen[date])
      resumen[date] = { ganancia: 0, ingreso: 0, egreso: 0, deltaPasivo: 0, tienePasivo: false };
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
      const retirosCaja = sumRetirosCaja(entry.id);
      const premiosCaja = safeNum(entry.premios);
      const bonosCaja = safeNum(entry.bonos);
      const ganancia = retirosCaja - (premiosCaja + bonosCaja);
      return { ...entry, ganancia };
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

      const retirosDia = detalles.reduce((acc, e) => acc + safeNum(e._retirosCaja), 0);
      const premiosDia = detalles.reduce((acc, e) => acc + safeNum(e._premiosCaja), 0);
      const bonosDia = detalles.reduce((acc, e) => acc + safeNum(e._bonosCaja), 0);
      const ganancia = retirosDia - (premiosDia + bonosDia);

      // fichas gastadas = max(0, fichas_iniciales - fichas_finales)
      const fichasGastadas = detalles.reduce((acc, e) => {
        const ini = safeNum(e.fichas_iniciales);
        const fin = safeNum(e.fichas_finales);
        const diff = ini - fin;
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      return { dateISO: date, date: formatDate(date), ganancia, fichas: fichasGastadas };
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
            Ganancia: <span className="font-bold text-[#e6e6e6]">{formatCurrency(g.value)}</span>
          </div>
        )}
        {f && (
          <div className="text-[#c7c9cc]">
            Fichas gastadas:{" "}
            <span className="font-bold text-[#e6e6e6]">{Number(f.value).toLocaleString("es-AR")}</span>
          </div>
        )}
      </div>
    );
  };

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
            <LineChart data={chartData} margin={{ left: 8, right: 16, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d33" />
              <XAxis dataKey="date" stroke="#9da3ab" />
              <YAxis
                yAxisId="left"
                stroke="#9da3ab"
                tickFormatter={(v) => `\$${Number(v).toLocaleString("es-AR")}`}
              />
              <YAxis yAxisId="right" orientation="right" stroke="#9da3ab" hide={!showFichasLine} />
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
          * Ganancia = Retiros − (Premios + Bonos). Las fichas se muestran como unidades (eje derecho).
        </div>
      </div>

      {/* ======= LISTADO (resumen/expandible) ======= */}
      {showAllMovements ? (
        <div className="overflow-x-auto">
          <MovimientosTable entries={allSorted} empleados={empleados} />
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Ganancia diaria</h2>

          {sortedDates.map(([date, resume]) => {
            const detalles = detallesPorFecha[date] || [];

            const retirosDia = detalles.reduce((acc, e) => acc + safeNum(e._retirosCaja), 0);
            const premiosDia = detalles.reduce((acc, e) => acc + safeNum(e._premiosCaja), 0);
            const bonosDia = detalles.reduce((acc, e) => acc + safeNum(e._bonosCaja), 0);

            const ingreso = retirosDia;
            const egreso = premiosDia + bonosDia;
            const ganancia = ingreso - egreso;

            const claseColor = ganancia >= 0 ? "text-emerald-400" : "text-red-400";

            // Faltantes por caja del día
            const faltantesDelDia = detalles
              .map((entry) => {
                const r = calcFaltantesCaja(entry, transferencias, retiros);
                return {
                  cajaId: entry.id,
                  empleado: empleados[entry.empleado_id] || `ID ${entry.empleado_id}`,
                  fechaCierre: entry.fecha_cierre,
                  ...r,
                };
              })
              .filter((x) => x.totalFaltante > 0);

            const totalFaltanteDia = faltantesDelDia.reduce(
              (acc, it) => acc + it.totalFaltante,
              0
            );

            const tienePasivo = resume?.tienePasivo;
            const deltaPasivoDia = resume?.deltaPasivo || 0;

            return (
              <div key={date} className="bg-[#1e1f23] border border-[#2f3336] p-4 rounded-2xl">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                >
                  <span className="text-lg font-semibold">{formatDate(date)}</span>
                  <span className={`text-sm font-bold ${claseColor}`}>
                    {ganancia >= 0
                      ? `+ ${formatCurrency(ganancia)}`
                      : `- ${formatCurrency(Math.abs(ganancia))}`}
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
                  <div className="text-[#c7c9cc] mt-2 text-sm">
                    Ingreso: {formatCurrency(ingreso)} — Egreso: {formatCurrency(egreso)}
                    {tienePasivo && (
                      <span className="ml-3">
                        | Δ Pasivo jugadores:{" "}
                        <span className="text-yellow-300">
                          {deltaPasivoDia >= 0 ? "+ " : "- "}
                          {formatCurrency(Math.abs(deltaPasivoDia))}
                        </span>
                      </span>
                    )}
                  </div>

                  {totalFaltanteDia > 0 && (
                    <div className="mt-3 p-3 rounded-xl border border-red-500 bg-red-900/25">
                      <div className="font-semibold text-red-300">
                        Faltantes detectados en el día: {formatCurrency(totalFaltanteDia)}
                      </div>
                      <div className="mt-2 grid gap-2">
                        {faltantesDelDia.map((f) => (
                          <div
                            key={`falt-${f.cajaId}`}
                            className="bg-red-950/30 border border-red-600 rounded-xl p-3"
                          >
                            <div className="flex justify-between">
                              <div className="text-sm">
                                <div>
                                  <span className="text-red-200 font-semibold">Caja:</span> #{f.cajaId}
                                </div>
                                <div>
                                  <span className="text-red-200 font-semibold">Empleado:</span>{" "}
                                  {f.empleado}
                                </div>
                                <div>
                                  <span className="text-red-200 font-semibold">Cierre:</span>{" "}
                                  {formatDateTime(f.fechaCierre)}
                                </div>
                              </div>
                              <div className="text-right text-red-300 font-bold">
                                Faltante: {formatCurrency(f.totalFaltante)}
                              </div>
                            </div>

                            <div className="mt-2 overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="text-red-200">
                                    <th className="text-left px-2 py-1">Servicio</th>
                                    <th className="text-left px-2 py-1">Titular</th>
                                    <th className="text-left px-2 py-1">CBU</th>
                                    <th className="text-right px-2 py-1">Esperado</th>
                                    <th className="text-right px-2 py-1">Final</th>
                                    <th className="text-right px-2 py-1">Dif.</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {f.porBilletera
                                    .filter((b) => safeNum(b.diferencia) !== 0)
                                    .map((b, idx) => (
                                      <tr key={idx} className="text-red-100">
                                        <td className="px-2 py-1">{b.servicio}</td>
                                        <td className="px-2 py-1">{b.titular}</td>
                                        <td className="px-2 py-1">{b.cbu}</td>
                                        <td className="px-2 py-1 text-right">
                                          {formatCurrency(b.esperado)}
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          {formatCurrency(b.final)}
                                        </td>
                                        <td
                                          className={`px-2 py-1 text-right ${
                                            b.diferencia < 0 ? "text-red-400" : "text-emerald-400"
                                          }`}
                                        >
                                          {b.diferencia >= 0 ? "+" : ""}
                                          {formatCurrency(b.diferencia)}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movimientos del día */}
                  <MovimientosTable entries={detalles} empleados={empleados} />

                  {/* Detalle por caja desde el servidor */}
                  <div className="mt-4 space-y-6">
                    {detalles.map((entry) => (
                      <div key={`det-${entry.id}`} className="pt-2 border-t border-[#2f3336]">
                        <h3 className="text-sm font-semibold text-[#d7d9dc] mb-2">
                          Caja #{entry.id} — {empleados[entry.empleado_id] || `ID ${entry.empleado_id}`}
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
                        <p className="text-sm">Fecha: {formatDateTime(r.fecha)}</p>
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
                          <span className="font-semibold">Servicio:</span> {r.desde_billetera?.servicio}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">CBU:</span> {r.desde_billetera?.cbu}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Titular:</span> {r.desde_billetera?.titular}
                        </p>
                      </div>

                      <div className="rounded-lg p-4 bg-[#1e1f23] border border-[#2f3336]">
                        <h4 className="text-sm text-[#c7c9cc] mb-2 font-medium uppercase tracking-wide">
                          Hasta billetera
                        </h4>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Servicio:</span> {r.hasta_billetera?.servicio}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">CBU:</span> {r.hasta_billetera?.cbu}
                        </p>
                        <p className="text-[#e6e6e6]">
                          <span className="font-semibold">Titular:</span> {r.hasta_billetera?.titular}
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
