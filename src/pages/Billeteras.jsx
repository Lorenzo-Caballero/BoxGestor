import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_URL = "https://gestoradmin.store/gestorcaja.php?recurso=billeteras";

export default function BilleterasPanel() {
  const [billeteras, setBilleteras] = useState([]);
  const [form, setForm] = useState({ cbu: "", servicio: "", titular: "" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchBilleteras = async () => {
    try {
      const res = await axios.get(API_URL);
      setBilleteras(res.data);
    } catch (err) {
      console.error("Error al cargar billeteras", err);
    }
  };

  useEffect(() => {
    fetchBilleteras();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editId !== null) {
        // PUT
        await axios.put(`${API_URL}&id=${editId}`, form);
      } else {
        // POST
        await axios.post(API_URL, form);
      }

      setForm({ cbu: "", servicio: "", titular: "" });
      setEditId(null);
      fetchBilleteras();
    } catch (err) {
      console.error("Error al guardar", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (billetera) => {
    setForm({
      cbu: billetera.cbu,
      servicio: billetera.servicio,
      titular: billetera.titular,
    });
    setEditId(billetera.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar billetera?")) return;
    try {
      await axios.delete(`${API_URL}&id=${id}`);
      fetchBilleteras();
    } catch (err) {
      console.error("Error al eliminar", err);
    }
  };

  const handleCancel = () => {
    setForm({ cbu: "", servicio: "", titular: "" });
    setEditId(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <motion.h1
        className="text-2xl font-bold text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Gestión de Billeteras
      </motion.h1>
      <button
        onClick={() => navigate("/")}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition"
      >
        Volver al Panel
      </button>
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <input
          type="text"
          name="cbu"
          placeholder="CBU"
          value={form.cbu}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          name="servicio"
          placeholder="Servicio"
          value={form.servicio}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="text"
          name="titular"
          placeholder="Titular"
          value={form.titular}
          onChange={handleChange}
          className="border rounded px-3 py-2"
          required
        />
        <div className="flex gap-2 items-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            {editId !== null ? "Guardar" : "Crear"}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4">
        {billeteras.map((b) => (
          <motion.div
            key={b.id}
            className="bg-gray-100 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1">
              <p className="font-semibold">CBU: <span className="font-normal">{b.cbu}</span></p>
              <p className="font-semibold">Servicio: <span className="font-normal">{b.servicio}</span></p>
              <p className="font-semibold">Titular: <span className="font-normal">{b.titular}</span></p>
            </div>
            <div className="mt-2 md:mt-0 flex gap-2">
              <button
                onClick={() => handleEdit(b)}
                className="bg-yellow-400 hover:bg-yellow-500 px-4 py-1 rounded text-sm text-white"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm text-white"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
