import React from "react";

const MovimientosTable = ({ entries, empleados }) => {
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
    return (
        <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-gray-900 rounded-lg text-sm">
                <thead className="bg-gray-700 text-gray-300">
                    <tr>
                        <th className="p-2">Empleado</th>
                        <th className="p-2">Turno</th>
                        <th className="p-2">Fecha Apertura</th>
                        <th className="p-2">Fecha Cierre</th>
                        <th className="p-2">Iniciales</th>
                        <th className="p-2">Finales</th>
                        <th className="p-2">Fichas Iniciales</th>
                        <th className="p-2">Fichas Finales</th>
                        <th className="p-2">Premios</th>
                        <th className="p-2">Bonos</th>
                        <th className="p-2">Ganancia</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => {
                        const iniciales = Array.isArray(entry.billeteras_iniciales)
                            ? entry.billeteras_iniciales.reduce((acc, b) => acc + (b.monto || 0), 0)
                            : Object.values(entry.billeteras_iniciales || {}).reduce((acc, m) => acc + (m || 0), 0);

                        const finales = Array.isArray(entry.billeteras_finales)
                            ? entry.billeteras_finales.reduce((acc, b) => acc + (b.monto || 0), 0)
                            : Object.values(entry.billeteras_finales || {}).reduce((acc, m) => acc + (m || 0), 0);

                        const ganancia = finales - iniciales;
                        const color = ganancia >= 0 ? "text-green-400" : "text-red-400";

                        return (
                            <tr key={entry.id} className="hover:bg-gray-800 border-b border-gray-700">
                                <td className="p-2">{empleados[entry.empleado_id]}</td>
                                <td className="p-2">{entry.turno}</td>
                                <td className="p-2">{formatDateTime(entry.fecha_apertura)}</td>
                                <td className="p-2">{formatDateTime(entry.fecha_cierre)}</td>
                                <td className="p-2">
                                    {Array.isArray(entry.billeteras_iniciales)
                                        ? entry.billeteras_iniciales.map((b, idx) => (
                                            <div key={idx}>
                                                {b.servicio}: {formatCurrency(b.monto)}
                                            </div>
                                        ))
                                        : Object.entries(entry.billeteras_iniciales || {}).map(([servicio, monto], idx) => (
                                            <div key={idx}>
                                                {servicio}: {formatCurrency(monto)}
                                            </div>
                                        ))}
                                </td>
                                <td className="p-2">
                                    {Array.isArray(entry.billeteras_finales)
                                        ? entry.billeteras_finales.map((b, idx) => (
                                            <div key={idx}>
                                                {b.servicio}: {formatCurrency(b.monto)}
                                            </div>
                                        ))
                                        : Object.entries(entry.billeteras_finales || {}).map(([servicio, monto], idx) => (
                                            <div key={idx}>
                                                {servicio}: {formatCurrency(monto)}
                                            </div>
                                        ))}
                                </td>
                                <td className="p-2">{entry.fichas_iniciales}</td>
                                <td className="p-2">{entry.fichas_finales}</td>
                                <td className="p-2 text-yellow-300">{entry.premios || 0}</td>
                                <td className="p-2 text-blue-300">{entry.bonos || 0}</td>
                                <td className={`p-2 font-bold ${color}`}>
                                    {ganancia >= 0 ? `+ ${formatCurrency(ganancia)}` : `- ${formatCurrency(Math.abs(ganancia))}`}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default MovimientosTable;
