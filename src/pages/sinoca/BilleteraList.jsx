import React from 'react';
import EditableItem from './EditableItem';

export default function BilleteraList({ billeteras, onUpdate, onDelete }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Billeteras Registradas</h2>
      {billeteras.length ? (
        <div className="space-y-2">
          {billeteras.map((b) => (
            <EditableItem
              key={b.id}
              item={b}
              fields={['cbu', 'servicio', 'titular']}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay billeteras.</p>
      )}
    </div>
  );
}
