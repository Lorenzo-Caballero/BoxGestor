import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MovimientosTable from "./MovimientosTable";
import { useNavigate } from "react-router-dom";

const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const formatDateTime = (dateTimeStr) => {
  const [date, time] = dateTimeStr.split(" ");
  return `${formatDate(date)} ${time.slice(0, 5)}`;
};

const formatCurrency = (value) =>
  `$${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const CajaAnalytics = () => {
  const [data, setData] = useState([]);
  const [empleados, setEmpleados] = useState({});
  const [retiros, setRetiros] = useState([]);
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [resCajas, resEmpleados, resRetiros] = await Promise.all([
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja"),
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=empleados"),
        fetch("https://gestoradmin.store/gestorcaja.php?recurso=retiros"),
      ]);

      const cajasJson = await resCajas.json();
      console.log("cajas:", cajasJson);

      const empleadosData = await resEmpleados.json();
      const retirosData = await resRetiros.json();

      const empleadosMap = {};
      empleadosData.forEach((emp) => {
        empleadosMap[emp.id] = emp.nombre;
      });

      setEmpleados(empleadosMap);
      setRetiros(retirosData);

      const cajaArray = Array.isArray(cajasJson.data) ? cajasJson.data : [];
      const parsed = cajaArray.filter(
        (entry) => entry.fecha_apertura && entry.fecha_cierre
      );
      setData(parsed);
      setFiltered(parsed);

      const fechas = parsed.map((e) => e.fecha_apertura.split(" ")[0]);
      const min = fechas.reduce((a, b) => (a < b ? a : b));
      const max = fechas.reduce((a, b) => (a > b ? a : b));
      setFechaMin(min);
      setFechaMax(max);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const result = data.filter((item) => {
      const dateMatch = fecha ? item.fecha_apertura.startsWith(fecha) : true;
      const turnoMatch = turno ? item.turno === turno : true;
      const empleadoMatch = empleado ? item.empleado_id === empleado : true;
      return dateMatch && turnoMatch && empleadoMatch;
    });
    setFiltered(result);
  }, [fecha, turno, empleado, data]);

  const resumen = {};
  const detallesPorFecha = {};
  filtered.forEach((entry) => {
    const date = entry.fecha_apertura.split(" ")[0];

    const ingreso = Array.isArray(entry.billeteras_finales)
      ? entry.billeteras_finales.reduce((sum, b) => sum + parseFloat(b.monto || 0), 0)
      : Object.values(entry.billeteras_finales || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);

    const egreso = Array.isArray(entry.billeteras_iniciales)
      ? entry.billeteras_iniciales.reduce((sum, b) => sum + parseFloat(b.monto || 0), 0)
      : Object.values(entry.billeteras_iniciales || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);

    const ganancia = ingreso - egreso;

    if (!resumen[date]) resumen[date] = { ganancia: 0, ingreso: 0, egreso: 0 };
    resumen[date].ganancia += ganancia;
    resumen[date].ingreso += ingreso;
    resumen[date].egreso += egreso;

    if (!detallesPorFecha[date]) detallesPorFecha[date] = [];
    detallesPorFecha[date].push({ ...entry, ganancia });
  });

  const sortedDates = Object.entries(resumen).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );

  const allSorted = [...filtered]
    .map((entry) => {
      const ingreso = Array.isArray(entry.billeteras_finales)
        ? entry.billeteras_finales.reduce((sum, b) => sum + parseFloat(b.monto || 0), 0)
        : Object.values(entry.billeteras_finales || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      const egreso = Array.isArray(entry.billeteras_iniciales)
        ? entry.billeteras_iniciales.reduce((sum, b) => sum + parseFloat(b.monto || 0), 0)
        : Object.values(entry.billeteras_iniciales || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);

      const ganancia = ingreso - egreso;

      return { ...entry, ganancia };
    })
    .filter((entry) =>
      empleados[entry.empleado_id]
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(a.fecha_apertura) - new Date(b.fecha_apertura));

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          className="bg-gray-700 text-white border p-2 rounded shadow-sm"
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

      {showAllMovements ? (
        <div className="overflow-x-auto">
          <MovimientosTable entries={allSorted} empleados={empleados} />
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Ganancia diaria</h2>
          {sortedDates.map(([date]) => {
            const detalles = detallesPorFecha[date] || [];

            const totalIniciales = detalles.reduce((acc, entry) => {
              const subtotal = Array.isArray(entry.billeteras_iniciales)
                ? entry.billeteras_iniciales.reduce((sum, b) => sum + (b.monto || 0), 0)
                : Object.values(entry.billeteras_iniciales || {}).reduce((sum, m) => sum + (m || 0), 0);
              return acc + subtotal;
            }, 0);

            const totalFinales = detalles.reduce((acc, entry) => {
              const subtotal = Array.isArray(entry.billeteras_finales)
                ? entry.billeteras_finales.reduce((sum, b) => sum + (b.monto || 0), 0)
                : Object.values(entry.billeteras_finales || {}).reduce((sum, m) => sum + (m || 0), 0);
              return acc + subtotal;
            }, 0);

            const ganancia = totalFinales - totalIniciales;
            const ingreso = totalIniciales;
            const egreso = ganancia < 0 ? Math.abs(ganancia) : 0;
            const claseColor = ganancia >= 0 ? "text-green-400" : "text-red-400";

            return (
              <div key={date} className="bg-gray-800 p-4 rounded-xl shadow-md">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                >
                  <span className="text-lg font-semibold">{formatDate(date)}</span>
                  <span className={`text-sm font-bold ${claseColor}`}>
                    {ganancia >= 0 ? `+ ${formatCurrency(ganancia)}` : `- ${formatCurrency(Math.abs(ganancia))}`}
                  </span>
                </div>

                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: expandedDate === date ? "auto" : 0, opacity: expandedDate === date ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <div className="text-gray-300 mt-2 text-sm">
                    Ingreso: {formatCurrency(ingreso)} — Egreso: {formatCurrency(egreso)}
                  </div>
                  <MovimientosTable entries={detalles} empleados={empleados} />
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
                        <p className="text-sm text-gray-400">
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
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm text-gray-300 mb-2 font-medium uppercase tracking-wide">
                          Desde Billetera
                        </h4>
                        <p className="text-white"><span className="font-semibold">Servicio:</span> {r.desde_billetera.servicio}</p>
                        <p className="text-white"><span className="font-semibold">CBU:</span> {r.desde_billetera.cbu}</p>
                        <p className="text-white"><span className="font-semibold">Titular:</span> {r.desde_billetera.titular}</p>
                      </div>

                      <div className="bg-gray-700 rounded-lg p-4">
                        <h4 className="text-sm text-gray-300 mb-2 font-medium uppercase tracking-wide">
                          Hasta Billetera
                        </h4>
                        <p className="text-white"><span className="font-semibold">Servicio:</span> {r.hasta_billetera.servicio}</p>
                        <p className="text-white"><span className="font-semibold">CBU:</span> {r.hasta_billetera.cbu}</p>
                        <p className="text-white"><span className="font-semibold">Titular:</span> {r.hasta_billetera.titular}</p>
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
