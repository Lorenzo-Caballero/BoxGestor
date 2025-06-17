import React, { useState } from 'react';

export default function BilleteraForm({ onCrear }) {
  const [form, setForm] = useState({ cbu: '', servicio: '', titular: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCrear(form);
    setForm({ cbu: '', servicio: '', titular: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-2xl p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Crear Billetera</h2>
      {['cbu', 'servicio', 'titular'].map((field) => (
        <input
          key={field}
          type="text"
          placeholder={field.toUpperCase()}
          value={form[field]}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl mb-4"
        />
      ))}
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-xl">
        Crear Billetera
      </button>
    </form>
  );
}
