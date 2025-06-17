import React, { useState } from 'react';

export default function EmpleadoForm({ onCrear }) {
  const [nombre, setNombre] = useState('');
  const [turno, setTurno] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre && turno) {
      onCrear({ nombre, turno });
      setNombre('');
      setTurno('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-2xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Empleado</h2>
      <input
        type="text"
        placeholder="Nombre del empleado"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4"
      />
      <input
        type="text"
        placeholder="Turno del empleado"
        value={turno}
        onChange={(e) => setTurno(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4"
      />
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700">
        Guardar Empleado
      </button>
    </form>
  );
}
