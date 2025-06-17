import React from 'react';

export default function EmpleadoList({ empleados, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-xl overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-6 py-3 text-left">Nombre</th>
            <th className="px-6 py-3 text-left">Turno</th>
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((emp) => (
            <tr key={emp.id} className="border-t hover:bg-gray-50">
              <td className="px-6 py-3">{emp.nombre}</td>
              <td className="px-6 py-3">{emp.turno}</td>
              <td className="px-6 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(emp)}
                  className="text-blue-600 hover:underline"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => onDelete(emp.id)}
                  className="text-red-600 hover:underline"
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
