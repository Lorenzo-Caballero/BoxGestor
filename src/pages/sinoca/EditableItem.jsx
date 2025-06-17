import React, { useState } from 'react';

export default function EditableItem({ item, fields, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(item);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://gestoradmin.store/index.php?recurso=empleados&id=${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate(form); // actualiza en el frontend
        setEditMode(false);
      } else {
        alert(data.error || 'Error al actualizar el empleado');
      }
    } catch (error) {
      console.error('Error en PUT:', error);
      alert('Error en la conexión con la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 border rounded-xl bg-gray-50">
      <div className="flex-1 space-y-1">
        {fields.map((f) =>
          editMode ? (
            <input
              key={f}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          ) : (
            <div key={f} className="text-sm text-gray-700">
              <strong>{f}:</strong> {item[f]}
            </div>
          )
        )}
      </div>
      <div className="flex space-x-2 ml-4">
        {editMode ? (
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-green-600 hover:text-green-800 text-sm font-semibold px-2 py-1 rounded hover:bg-green-100 disabled:opacity-50"
          >
            💾 {loading ? 'Guardando...' : 'Guardar'}
          </button>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold px-2 py-1 rounded hover:bg-blue-100"
          >
            ✏️ Editar
          </button>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-800 text-sm font-semibold px-2 py-1 rounded hover:bg-red-100"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}
