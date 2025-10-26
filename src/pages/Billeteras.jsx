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
        await axios.put(`${API_URL}&id=${editId}`, form);
      } else {
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

  const handleEdit = (b) => {
    setForm({ cbu: b.cbu, servicio: b.servicio, titular: b.titular });
    setEditId(b.id);
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
    <div className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl bg-[#1e1f23] border border-[#2f3336] rounded-2xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-full text-center">
            <motion.h1
              className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#e8e9ea]"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Gestión de Billeteras
            </motion.h1>
            <div className="mx-auto mt-3 h-px w-24 bg-[#2f3336]" />
          </div>

          <button
            onClick={() => navigate("/")}
            className="ml-4 shrink-0 px-4 py-2 rounded-xl font-medium bg-transparent border border-[#3a3f45] hover:bg-[#2a2d33] transition-colors"
          >
            Volver al panel
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#2a2d33] border border-[#3a3f45] rounded-2xl p-4 md:p-5 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            type="text"
            name="cbu"
            placeholder="CBU"
            value={form.cbu}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-[#202329] border border-[#3a3f45] focus:outline-none"
            required
          />
          <input
            type="text"
            name="servicio"
            placeholder="Servicio"
            value={form.servicio}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-[#202329] border border-[#3a3f45] focus:outline-none"
            required
          />
          <input
            type="text"
            name="titular"
            placeholder="Titular"
            value={form.titular}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-[#202329] border border-[#3a3f45] focus:outline-none"
            required
          />
          <div className="flex gap-2 items-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-[#2f3336] hover:bg-[#3a3f44] transition-colors disabled:opacity-60"
            >
              {editId !== null ? "Guardar" : "Crear"}
            </button>
            {editId !== null && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 rounded-xl text-sm bg-transparent border border-[#3a3f45] hover:bg-[#202329] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista de billeteras */}
        <div className="grid gap-4">
          {billeteras.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <p className="text-sm text-[#9da3ab]">CBU</p>
                <p className="font-semibold text-[#e6e6e6] break-all">{b.cbu}</p>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-[#9da3ab]">Servicio</p>
                    <p className="text-[#e6e6e6]">{b.servicio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#9da3ab]">Titular</p>
                    <p className="text-[#e6e6e6]">{b.titular}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  onClick={() => handleEdit(b)}
                  className="px-4 py-2 rounded-lg bg-transparent border border-[#3a3f45] hover:bg-[#202329] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="px-4 py-2 rounded-lg bg-transparent border border-[#3a3f45] hover:bg-[#3a2224] text-red-300 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
