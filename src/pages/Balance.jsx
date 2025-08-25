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

const formatDate = (dateStr = "") => {
  const [year, month, day] = (dateStr || "").split("-");
  return `${day}/${month}`;
};

const formatDateTime = (dateTimeStr = "") => {
  const [date, time] = (dateTimeStr || "").split(" ");
  return `${formatDate(date)} ${String(time || "").slice(0, 5)}`;
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* =========================
   Helpers para billeteras
   ========================= */
const walletKey = (w = {}) => `${w.servicio || ""}|${w.cbu || ""}|${w.titular || ""}`;

const buildWalletMapFromCaja = (entry) => {
  const iniciales = Array.isArray(entry?.billeteras_iniciales)
    ? entry.billeteras_iniciales
    : Object.values(entry?.billeteras_iniciales || {});

  const map = new Map();
  iniciales.forEach((b) => {
    const k = walletKey(b);
    const monto = Number(b?.monto || 0);
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
  finales.forEach((b) => {
    const k = walletKey(b);
    map.set(k, Number(b?.monto || 0));
  });
  return map;
};

const applyMovimientosCaja = (map, cajaId, transferencias, retiros) => {
  (transferencias || [])
    .filter((t) => Number(t.caja_id) === Number(cajaId))
    .forEach((t) => {
      const m = Number(t.monto || 0);
      const d = t.desde_billetera || {};
      const h = t.hasta_billetera || {};
      const kd = walletKey(d);
      const kh = walletKey(h);

      if (!map.has(kd))
        map.set(kd, { ...d, saldo_inicial: 0, saldo_actual: 0, transf_in: 0, transf_out: 0, retiros: 0 });
      if (!map.has(kh))
        map.set(kh, { ...h, saldo_inicial: 0, saldo_actual: 0, transf_in: 0, transf_out: 0, retiros: 0 });

      map.get(kd).saldo_actual -= m;
      map.get(kd).transf_out += m;
      map.get(kh).saldo_actual += m;
      map.get(kh).transf_in += m;
    });

  (retiros || [])
    .filter((r) => Number(r.caja_id) === Number(cajaId))
    .forEach((r) => {
      const m = Number(r.monto || 0);
      const d = r.desde_billetera || {};
      const kd = walletKey(d);
      if (!map.has(kd))
        map.set(kd, { ...d, saldo_inicial: 0, saldo_actual: 0, transf_in: 0, transf_out: 0, retiros: 0 });
      map.get(kd).saldo_actual -= m;
      map.get(kd).retiros += m;
    });

  return Array.from(map.values());
};

const calcFaltantesCaja = (entry, transferencias, retiros) => {
  const base = buildWalletMapFromCaja(entry);
  const esperadoArr = applyMovimientosCaja(base, entry.id, transferencias, retiros);
  const esperadoMap = new Map();
  esperadoArr.forEach((b) => esperadoMap.set(walletKey(b), Number(b.saldo_actual || 0)));

  const finalesMap = buildFinalMapFromCaja(entry);

  const keys = new Set([...esperadoMap.keys(), ...finalesMap.keys()]);
  let totalFaltante = 0;
  let totalSobrante = 0;
  const porBilletera = [];

  keys.forEach((k) => {
    const esp = Number(esperadoMap.get(k) || 0);
    const fin = Number(finalesMap.get(k) || 0);
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

  return { totalFaltante, totalSobrante, porBilletera };
};

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
  const [showFichasLine, setShowFichasLine] = useState(true); // toggle línea de fichas
  const navigate = useNavigate();

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
      (empleadosData || []).forEach((emp) => {
        empleadosMap[emp.id] = emp.nombre;
      });

      setEmpleados(empleadosMap);
      setRetiros(Array.isArray(retirosData) ? retirosData : []);
      setTransferencias(Array.isArray(transfData) ? transfData : []);

      const cajaArray = Array.isArray(cajasJson.data) ? cajasJson.data : [];
      const parsed = cajaArray.filter((entry) => entry.fecha_apertura && entry.fecha_cierre);
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
      .reduce((acc, it) => acc + Number(it.monto || 0), 0);

  const resumen = {};
  const detallesPorFecha = {};

  filtered.forEach((entry) => {
    const date = entry.fecha_apertura.split(" ")[0];
    const retirosCaja = sumRetirosCaja(entry.id);
    const premiosCaja = Number(entry.premios || 0);
    const bonosCaja = Number(entry.bonos || 0);
    const gananciaCaja = retirosCaja - (premiosCaja + bonosCaja);
    const ingresoCaja = retirosCaja;
    const egresoCaja = premiosCaja + bonosCaja;

    if (!resumen[date]) resumen[date] = { ganancia: 0, ingreso: 0, egreso: 0 };
    resumen[date].ganancia += gananciaCaja;
    resumen[date].ingreso += ingresoCaja;
    resumen[date].egreso += egresoCaja;

    if (!detallesPorFecha[date]) detallesPorFecha[date] = [];
    detallesPorFecha[date].push({
      ...entry,
      _retirosCaja: retirosCaja,
      _premiosCaja: premiosCaja,
      _bonosCaja: bonosCaja,
    });
  });

  const sortedDates = Object.entries(resumen).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );

  const allSorted = [...filtered]
    .map((entry) => {
      const retirosCaja = sumRetirosCaja(entry.id);
      const premiosCaja = Number(entry.premios || 0);
      const bonosCaja = Number(entry.bonos || 0);
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
      // regla ganancia (retiros - premios - bonos)
      const retirosDia = detalles.reduce((acc, e) => acc + Number(e._retirosCaja || 0), 0);
      const premiosDia = detalles.reduce((acc, e) => acc + Number(e._premiosCaja || 0), 0);
      const bonosDia = detalles.reduce((acc, e) => acc + Number(e._bonosCaja || 0), 0);
      const ganancia = retirosDia - (premiosDia + bonosDia);

      // fichas gastadas = max(0, fichas_iniciales - fichas_finales)
      const fichasGastadas = detalles.reduce((acc, e) => {
        const ini = Number(e.fichas_iniciales || 0);
        const fin = Number(e.fichas_finales || 0);
        const diff = ini - fin;
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      return {
        dateISO: date,
        date: formatDate(date),
        ganancia,
        fichas: fichasGastadas,
      };
    });
  }, [sortedDates, detallesPorFecha]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const g = payload.find((p) => p.dataKey === "ganancia");
    const f = payload.find((p) => p.dataKey === "fichas");
    return (
      <div className="rounded-lg bg-slate-900/90 border border-slate-700 p-3 text-sm">
        <div className="font-semibold mb-1">{label}</div>
        {g && <div>Ganancia: <span className="font-bold">{formatCurrency(g.value)}</span></div>}
        {f && <div>Fichas gastadas: <span className="font-bold">{Number(f.value).toLocaleString("es-AR")}</span></div>}
      </div>
    );
  };

  return (
    <div className="relative p-6 space-y-10 bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Caja Analytics</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllMovements(!showAllMovements)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow transition"
          >
            {showAllMovements ? "Resumen Diario" : "Todos los Movimientos"}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded shadow-lg transition"
          >
            Ver Retiros
          </button>
          <button
            onClick={() => navigate("/billeteras")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition"
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
          className="bg-gray-700 text-white border p-2 rounded shadow-sm"
        />
        <select
          value={turno}
          onChange={(e) => setTurno(e.target.value)}
          className="bg-gray-700 text-white border p-2 rounded shadow-sm"
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
          className="bg-gray-700 text-white border p-2 rounded shadow-sm"
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
          className="bg-gray-700 text-white border p-2 rounded shadow-sm md:col-span-2"
        />
        <button
          onClick={() => {
            setFecha("");
            setTurno("");
            setEmpleado("");
            setSearchTerm("");
          }}
          className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2 transition"
        >
          Limpiar filtros
        </button>
      </div>

      {/* ======= GRÁFICO DE EVOLUCIÓN ======= */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Evolución diaria</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-cyan-400"
              checked={showFichasLine}
              onChange={(e) => setShowFichasLine(e.target.checked)}
            />
            Mostrar fichas gastadas
          </label>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 8, right: 16, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis
                yAxisId="left"
                stroke="#9ca3af"
                tickFormatter={(v) => `\$${Number(v).toLocaleString("es-AR")}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                hide={!showFichasLine}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={0} yAxisId="left" stroke="#6b7280" />

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
        <div className="text-xs text-gray-400 mt-2">
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

          {sortedDates.map(([date]) => {
            const detalles = detallesPorFecha[date] || [];

            const retirosDia = detalles.reduce((acc, e) => acc + Number(e._retirosCaja || 0), 0);
            const premiosDia = detalles.reduce((acc, e) => acc + Number(e._premiosCaja || 0), 0);
            const bonosDia = detalles.reduce((acc, e) => acc + Number(e._bonosCaja || 0), 0);

            const ingreso = retirosDia;
            const egreso = premiosDia + bonosDia;
            const ganancia = ingreso - egreso;
            const claseColor = ganancia >= 0 ? "text-green-400" : "text-red-400";

            const detalleBilleterasDelDia = (() => {
              const agreg = new Map();
              detalles.forEach((entry) => {
                const base = buildWalletMapFromCaja(entry);
                const arr = applyMovimientosCaja(base, entry.id, transferencias, retiros);
                arr.forEach((b) => {
                  const k = walletKey(b);
                  if (!agreg.has(k)) agreg.set(k, { ...b });
                  else {
                    const acc = agreg.get(k);
                    acc.saldo_inicial += b.saldo_inicial;
                    acc.transf_in += b.transf_in;
                    acc.transf_out += b.transf_out;
                    acc.retiros += b.retiros;
                    acc.saldo_actual += b.saldo_actual;
                  }
                });
              });
              return Array.from(agreg.values());
            })();

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

            const totalFaltanteDia = faltantesDelDia.reduce((acc, it) => acc + it.totalFaltante, 0);

            return (
              <div key={date} className="bg-gray-800 p-4 rounded-xl shadow-md">
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
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="text-gray-300 mt-2 text-sm">
                    Ingreso: {formatCurrency(ingreso)} — Egreso: {formatCurrency(egreso)}
                  </div>

                  {totalFaltanteDia > 0 && (
                    <div className="mt-3 p-3 rounded-lg border border-red-500 bg-red-900/30">
                      <div className="font-semibold text-red-300">
                        ⚠️ Faltantes detectados en el día: {formatCurrency(totalFaltanteDia)}
                      </div>
                      <div className="mt-2 grid gap-2">
                        {faltantesDelDia.map((f) => (
                          <div
                            key={`falt-${f.cajaId}`}
                            className="bg-red-950/40 border border-red-600 rounded p-3"
                          >
                            <div className="flex justify-between">
                              <div className="text-sm">
                                <div>
                                  <span className="text-red-200 font-semibold">Caja:</span> #{f.cajaId}
                                </div>
                                <div>
                                  <span className="text-red-200 font-semibold">Empleado:</span> {f.empleado}
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
                                    .filter((b) => Number(b.diferencia || 0) !== 0)
                                    .map((b, idx) => (
                                      <tr key={idx} className="text-red-100">
                                        <td className="px-2 py-1">{b.servicio}</td>
                                        <td className="px-2 py-1">{b.titular}</td>
                                        <td className="px-2 py-1">{b.cbu}</td>
                                        <td className="px-2 py-1 text-right">{formatCurrency(b.esperado)}</td>
                                        <td className="px-2 py-1 text-right">{formatCurrency(b.final)}</td>
                                        <td
                                          className={`px-2 py-1 text-right ${
                                            b.diferencia < 0 ? "text-red-400" : "text-green-400"
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

                  <MovimientosTable entries={detalles} empleados={empleados} />

                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      Saldos por billetera (con transferencias internas y retiros)
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-800 text-gray-300">
                          <tr>
                            <th className="text-left px-3 py-2">Servicio</th>
                            <th className="text-left px-3 py-2">Titular</th>
                            <th className="text-left px-3 py-2">CBU</th>
                            <th className="text-right px-3 py-2">Inicial</th>
                            <th className="text-right px-3 py-2">Transf. (+)</th>
                            <th className="text-right px-3 py-2">Transf. (−)</th>
                            <th className="text-right px-3 py-2">Retiros (−)</th>
                            <th className="text-right px-3 py-2">Actual</th>
                            <th className="text-right px-3 py-2">Δ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {detalleBilleterasDelDia.map((b, i) => {
                            const delta = (b.saldo_actual || 0) - (b.saldo_inicial || 0);
                            return (
                              <tr key={i} className="bg-gray-900 hover:bg-gray-800">
                                <td className="px-3 py-2">{b.servicio}</td>
                                <td className="px-3 py-2">{b.titular}</td>
                                <td className="px-3 py-2">{b.cbu}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(b.saldo_inicial)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(b.transf_in)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(b.transf_out)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(b.retiros)}</td>
                                <td className="px-3 py-2 text-right font-semibold">
                                  {formatCurrency(b.saldo_actual)}
                                </td>
                                <td
                                  className={`px-3 py-2 text-right ${
                                    delta >= 0 ? "text-green-400" : "text-red-400"
                                  }`}
                                >
                                  {delta >= 0 ? "+" : ""}
                                  {formatCurrency(delta)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex justify-center items-center px-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-5xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Historial de Retiros</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-red-400 hover:text-red-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-6">
                {retiros.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-800 rounded-xl shadow-md p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg text-gray-400 font-semibold">
                          Caja ID: <span className="text-white font-bold">{r.caja_id}</span>
                        </h3>
                        <p className="text-sm text-gray-400">Fecha: {formatDateTime(r.fecha)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-300 text-xl font-bold">
                          {formatCurrency(r.monto)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm text-gray-300 mb-2 font-medium uppercase tracking-wide">
                          Desde Billetera
                        </h4>
                        <p className="text-white">
                          <span className="font-semibold">Servicio:</span> {r.desde_billetera?.servicio}
                        </p>
                        <p className="text-white">
                          <span className="font-semibold">CBU:</span> {r.desde_billetera?.cbu}
                        </p>
                        <p className="text-white">
                          <span className="font-semibold">Titular:</span> {r.desde_billetera?.titular}
                        </p>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm text-gray-300 mb-2 font-medium uppercase tracking-wide">
                          Hasta Billetera
                        </h4>
                        <p className="text-white">
                          <span className="font-semibold">Servicio:</span> {r.hasta_billetera?.servicio}
                        </p>
                        <p className="text-white">
                          <span className="font-semibold">CBU:</span> {r.hasta_billetera?.cbu}
                        </p>
                        <p className="text-white">
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
