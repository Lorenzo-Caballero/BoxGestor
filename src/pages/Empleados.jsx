import React, { useState, useEffect } from 'react';
import EmpleadoForm from './sinoca/EmpleadoForm';
import EmpleadoList from './sinoca/EmpleadoList';

const API_BASE = 'https://gestoradmin.store/index.php';

export default function GestionarDatos() {
  const [empleadoNombre, setEmpleadoNombre] = useState('');
  const [empleadoTurno, setEmpleadoTurno] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const obtenerEmpleados = async () => {
    try {
      const res = await fetch(`${API_BASE}?recurso=empleados`);
      const data = await res.json();
      setEmpleados(data || []);
    } catch (err) {
      console.error(err);
      setMensaje('Error al obtener empleados');
    }
  };

  const crearEmpleado = async (empleado) => {
    try {
      const res = await fetch(`${API_BASE}?recurso=empleados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(empleado),
      });

      const data = await res.json();
      setMensaje(data.message || 'Empleado creado');
      obtenerEmpleados(); // Refrescar lista
      setIsCreating(false); // Cerrar formulario
    } catch (err) {
      console.error(err);
      setMensaje('Error al crear empleado');
    }
  };

  const eliminarEmpleado = async (id) => {
    try {
      const res = await fetch(`${API_BASE}?recurso=empleados&id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      setMensaje(data.message || 'Empleado eliminado');
      obtenerEmpleados(); // Refrescar lista
    } catch (err) {
      console.error(err);
      setMensaje('Error al eliminar empleado');
    }
  };

  const handleCrearEmpleado = () => {
    setIsCreating(true);
  };

  const handleCerrarForm = () => {
    setIsCreating(false);
  };

  useEffect(() => {
    obtenerEmpleados();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        {/* Botón Crear Empleado */}
        {!isCreating && (
          <button
            onClick={handleCrearEmpleado}
            className="w-full bg-blue-600 text-white py-2 rounded-xl mb-6 hover:bg-blue-700 transition"
          >
            + Crear Empleado
          </button>
        )}

        {/* Formulario Crear Empleado */}
        {isCreating && <EmpleadoForm onCrear={crearEmpleado} onCerrar={handleCerrarForm} />}

        {/* Mensaje */}
        {mensaje && (
          <div className="text-center text-sm text-green-700 bg-green-100 border border-green-300 rounded-xl p-3">
            {mensaje}
          </div>
        )}

        {/* Listado de Empleados */}
        <EmpleadoList empleados={empleados} onEdit={() => {}} onDelete={eliminarEmpleado} />
      </div>
    </div>
  );
}
