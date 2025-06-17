import React, { useEffect, useState } from 'react';


const FormularioNumero = ({ nuevoNumero, setNuevoNumero, onGuardar, onCancelar }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl max-w-md mx-auto mb-8 text-white">
    <label className="block mb-2">Nuevo número:</label>
    <input
      type="text"
      value={nuevoNumero}
      onChange={(e) => setNuevoNumero(e.target.value)}
      placeholder="Ej: +5491123456789"
      className="w-full p-2 rounded bg-white bg-opacity-20 text-white placeholder-cyan-200 mb-4"
    />
    <div className="flex justify-between">
      <button
        onClick={onGuardar}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded shadow-md"
      >
        Guardar
      </button>
      <button
        onClick={onCancelar}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded shadow-md"
      >
        Cancelar
      </button>
    </div>
  </div>
);

const TablaPremios = () => {
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [numeroWhatsapp, setNumeroWhatsapp] = useState('');
  const [nuevoNumero, setNuevoNumero] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const idNumeroWhatsapp = 1;

  useEffect(() => {
    const obtenerPremios = async () => {
      try {
        const response = await fetch('https://gestoradmin.store/index.php?recurso=premios-casino');
        const data = await response.json();

        const premiosUnicos = [];
        const vistos = new Set();
        data.forEach(premio => {
          const clave = `${premio.uuid}-${premio.ip}`;
          if (!vistos.has(clave)) {
            vistos.add(clave);
            premiosUnicos.push(premio);
          }
        });

        setPremios(premiosUnicos);
      } catch (err) {
        console.error('Error al obtener premios:', err);
        setError('No se pudieron cargar los premios.');
      } finally {
        setLoading(false);
      }
    };

    const obtenerNumeroWhatsapp = async () => {
      try {
        const res = await fetch('https://gestoradmin.store/WhatsAppNumber.php?recurso=wp-number&id=1');
        const data = await res.json();
        if (data?.number) setNumeroWhatsapp(data.number);
      } catch (e) {
        console.error('Error al obtener número de WhatsApp:', e);
      }
    };

    obtenerPremios();
    obtenerNumeroWhatsapp();
  }, []);

  const cambiarNumeroWhatsapp = async () => {
    try {
      const res = await fetch('https://gestoradmin.store/WhatsAppNumber.php?recurso=wp-number', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idNumeroWhatsapp,
          number: nuevoNumero
        }),
      });

      const data = await res.json();
      if (data?.message) {
        alert('Número actualizado correctamente');
        setNumeroWhatsapp(nuevoNumero);
        setMostrarFormulario(false);
        setNuevoNumero('');
      } else {
        alert('No se pudo actualizar el número');
      }
    } catch (err) {
      console.error('Error al cambiar número:', err);
      alert('Ocurrió un error');
    }
  };

  const premiosFiltrados = premios.filter(p =>
    p.uuid.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c003e] via-[#450075] to-[#17798c] text-white p-6 relative overflow-hidden">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-bg {
          background-size: 400% 400%;
          animation: gradientMove 20s ease infinite;
        }
      `}</style>

      {/* Fondo animado */}
      <div className="absolute inset-0 animate-gradient-bg bg-gradient-to-br from-[#2c003e] via-[#450075] to-[#00d4ff] opacity-10 z-0 pointer-events-none" />

      <div className="relative z-10">
        {/* Header superior con título y acciones */}
        {/* Header mejorado con glassmorphism y diseño ordenado */}
{/* Header superior con título, WhatsApp y búsqueda */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 bg-white/5 border border-cyan-400/20 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl">
  {/* Título */}
  <h2 className="text-3xl md:text-4xl font-bold text-white text-center md:text-left w-full md:w-auto drop-shadow-md">
    🏆 Premios Reclamados
  </h2>

  {/* Número de WhatsApp y botón */}
  <div className="flex flex-col items-end text-right space-y-2">
    <div className="text-cyan-300 text-sm">
      <span className="font-semibold">WhatsApp actual:</span> {numeroWhatsapp || 'No disponible'}
    </div>
    <button
      onClick={() => setMostrarFormulario(true)}
      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-medium shadow-md hover:scale-105 hover:shadow-xl transition-all duration-200"
    >
      Cambiar número
    </button>
  </div>

  {/* Barra de búsqueda */}
  <div className="relative w-full md:w-72">
    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-300 z-20">
      🔍
    </span>
    <input
      type="text"
      placeholder="Buscar por código"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white bg-opacity-10 backdrop-blur-md text-white placeholder-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
    />
  </div>
</div>
        {mostrarFormulario && (
          <FormularioNumero
            nuevoNumero={nuevoNumero}
            setNuevoNumero={setNuevoNumero}
            onGuardar={cambiarNumeroWhatsapp}
            onCancelar={() => setMostrarFormulario(false)}
          />
        )}

        {/* Tabla */}
        {loading ? (
          <div className="text-center text-lg text-white">Cargando premios...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full shadow-2xl overflow-hidden bg-white bg-opacity-5 backdrop-blur-md text-white rounded-xl">
              <thead className="bg-gradient-to-r from-fuchsia-700 to-cyan-500">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Premio</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-bold uppercase">IP</th>
                </tr>
              </thead>
              <tbody>
                {premiosFiltrados.length > 0 ? (
                  premiosFiltrados.map((premio, idx) => (
                    <tr
                      key={premio.id}
                      className={`transition-all duration-300 ${idx % 2 === 0 ? 'bg-white bg-opacity-5' : 'bg-white bg-opacity-10'
                        } hover:bg-cyan-500 hover:bg-opacity-20`}
                    >
                      <td className="px-4 py-2 text-sm">{premio.id}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-lime-300">{premio.premio}</td>
                      <td className="px-4 py-2 text-xs break-all text-cyan-200">{premio.uuid}</td>
                      <td className="px-4 py-2 text-sm">{new Date(premio.date).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{premio.ip}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-white opacity-70">
                      No se encontraron premios con ese código.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TablaPremios;
