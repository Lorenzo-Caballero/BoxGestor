import React from "react";

const formatDate = (dateStr = "") => {
  const [year, month, day] = String(dateStr).split("-");
  if (!year || !month || !day) return dateStr || "";
  return `${day}/${month}`;
};

const formatDateTime = (dateTimeStr = "") => {
  const [date = "", time = ""] = String(dateTimeStr).split(" ");
  return `${formatDate(date)} ${String(time).slice(0, 5)}`.trim();
};

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function MovimientosTable({ entries = [], empleados = {} }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full bg-gray-900 rounded-lg text-sm">
        <thead className="bg-gray-700 text-gray-300">
          <tr>
            <th className="p-2 text-left">Empleado</th>
            <th className="p-2 text-left">Turno</th>
            <th className="p-2 text-left">Fecha Apertura</th>
            <th className="p-2 text-left">Fecha Cierre</th>
            <th className="p-2 text-left">Iniciales</th>
            <th className="p-2 text-left">Finales</th>
            <th className="p-2 text-right">Fichas Iniciales</th>
            <th className="p-2 text-right">Fichas Finales</th>
            <th className="p-2 text-right">Premios</th>
            <th className="p-2 text-right">Bonos</th>
            <th className="p-2 text-right">Ganancia</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => {
            // Sumatorias para el fallback "finales - iniciales"
            const iniciales = Array.isArray(entry?.billeteras_iniciales)
              ? entry.billeteras_iniciales.reduce((acc, b) => acc + Number(b?.monto || 0), 0)
              : Object.values(entry?.billeteras_iniciales || {}).reduce((acc, m) => acc + Number(m || 0), 0);

            const finales = Array.isArray(entry?.billeteras_finales)
              ? entry.billeteras_finales.reduce((acc, b) => acc + Number(b?.monto || 0), 0)
              : Object.values(entry?.billeteras_finales || {}).reduce((acc, m) => acc + Number(m || 0), 0);

            // HOUSEWIN REAL DEL TURNO
const houseWin = Number(
  entry.houseWin ?? entry.HW ?? entry.hw ?? 0
);

const color =
  houseWin >= 0 ? "text-green-400" : "text-red-400";


            return (
              <tr key={entry.id} className="hover:bg-gray-800 border-b border-gray-700">
                <td className="p-2">{empleados[entry.empleado_id] || `ID ${entry.empleado_id}`}</td>
                <td className="p-2">{entry.turno}</td>
                <td className="p-2">{formatDateTime(entry.fecha_apertura)}</td>
                <td className="p-2">{formatDateTime(entry.fecha_cierre)}</td>

                {/* Iniciales */}
                <td className="p-2">
                  {Array.isArray(entry?.billeteras_iniciales)
                    ? entry.billeteras_iniciales.map((b, idx) => (
                        <div key={idx}>
                          {b.servicio}: {formatCurrency(b.monto)}
                        </div>
                      ))
                    : Object.entries(entry?.billeteras_iniciales || {}).map(
                        ([servicio, monto], idx) => (
                          <div key={idx}>
                            {servicio}: {formatCurrency(monto)}
                          </div>
                        )
                      )}
                </td>

                {/* Finales */}
                <td className="p-2">
                  {Array.isArray(entry?.billeteras_finales)
                    ? entry.billeteras_finales.map((b, idx) => (
                        <div key={idx}>
                          {b.servicio}: {formatCurrency(b.monto)}
                        </div>
                      ))
                    : Object.entries(entry?.billeteras_finales || {}).map(
                        ([servicio, monto], idx) => (
                          <div key={idx}>
                            {servicio}: {formatCurrency(monto)}
                          </div>
                        )
                      )}
                </td>

                <td className="p-2 text-right">
                  {Number(entry?.fichas_iniciales || 0).toLocaleString("es-AR")}
                </td>
                <td className="p-2 text-right">
                  {Number(entry?.fichas_finales || 0).toLocaleString("es-AR")}
                </td>
                <td className="p-2 text-right text-yellow-300">
                  {formatCurrency(entry?.premios || 0)}
                </td>
                <td className="p-2 text-right text-blue-300">
                  {formatCurrency(entry?.bonos || 0)}
                </td>

                <td className={`p-2 text-right font-bold ${color}`}>
  {houseWin >= 0 ? "+ " : "- "}
  {formatCurrency(Math.abs(houseWin))}
</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
