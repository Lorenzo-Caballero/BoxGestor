import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AperturaDeCaja = () => {
  const [empleado, setEmpleado] = useState("");
  const [turno, setTurno] = useState("");
  const [billeterasSeleccionadas, setBilleterasSeleccionadas] = useState([]); // ids
  const [billeterasDisponibles, setBilleterasDisponibles] = useState([]);
  const [montos, setMontos] = useState({}); // { [id]: "12345" }
  const [usoTurno, setUsoTurno] = useState({}); // { [id]: "operativa" | "retiro" }
  const [fichas, setFichas] = useState("");
  const [saldoJugadoresInicio, setSaldoJugadoresInicio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [empleados, setEmpleados] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const obtenerEmpleados = async () => {
      try {
        const res = await fetch("https://gestoradmin.store/gestorcaja.php?recurso=empleados");
        const data = await res.json();
        setEmpleados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar empleados:", err);
      }
    };

    const obtenerBilleteras = async () => {
      try {
        const res = await fetch("https://gestoradmin.store/gestorcaja.php?recurso=billeteras");
        const data = await res.json();
        const todas = Array.isArray(data) ? data : [];
        // ✅ Ya NO filtramos por tipo. El agente elige el uso en esta pantalla.
        setBilleterasDisponibles(todas);
      } catch (err) {
        console.error("Error al cargar billeteras:", err);
      }
    };

    obtenerEmpleados();
    obtenerBilleteras();
  }, []);

  const toggleBilletera = (billeteraId) => {
    const id = Number(billeteraId);
    setBilleterasSeleccionadas((prev) => {
      const ya = prev.includes(id);
      const next = ya ? prev.filter((x) => x !== id) : [...prev, id];
      // por defecto, si la seleccionan por primera vez, queda como "operativa"
      if (!ya && !usoTurno[id]) {
        setUsoTurno((u) => ({ ...u, [id]: "operativa" }));
      }
      return next;
    });
  };

  const handleMontoChange = (billeteraId, value) => {
    setMontos((prev) => ({ ...prev, [billeteraId]: value }));
  };

  const parseEntero = (s) => {
    const raw = String(s || "").replace(/\./g, "");
    return raw === "" ? 0 : Number(raw);
  };

  const enviarAperturaCaja = async () => {
    try {
      if (!empleado) return setMensaje("Seleccioná un agente.");
      if (!turno) return setMensaje("Seleccioná un turno.");
      if (billeterasSeleccionadas.length === 0)
        return setMensaje("Seleccioná al menos una billetera.");

      if (!window.confirm("¿Confirmás abrir la caja con estos datos?")) return;

      // billeteras seleccionadas con sus montos iniciales + USO del turno
      const billeterasConDatos = billeterasSeleccionadas.map((id) => {
        const b = billeterasDisponibles.find((x) => Number(x.id) === Number(id));
        return {
          id: Number(b?.id) || 0,
          servicio: b?.servicio || "",
          titular: b?.titular || "",
          cbu: b?.cbu || "",
          monto: parseEntero(montos[id] || "0"),
          uso: usoTurno[id] === "retiro" ? "retiro" : "operativa", // 👈 se envía al backend
        };
      });

      const datos = {
        empleado: Number(empleado),
        turno,
        billeteras: billeterasConDatos,
        fichas_iniciales: parseEntero(fichas),
        saldo_jugadores_inicial: parseEntero(saldoJugadoresInicio),
      };

      const res = await fetch(
        "https://gestoradmin.store/gestorcaja.php?recurso=apertura-caja",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        }
      );

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Respuesta no válida del servidor: " + text);
      }

      if (res.ok && !data?.error) {
        alert("✅ Caja abierta correctamente");
        navigate("/cerrar-caja");
      } else {
        setMensaje(data?.error || "Error desconocido al abrir la caja.");
      }
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error de red o del servidor.");
    } finally {
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  const recortarCBU = (cbu) => {
    if (!cbu) return "";
    const s = String(cbu);
    return `${s.slice(0, 6)}...${s.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-[#6C63FF] via-[#40E0D0] to-[#6C63FF] animate-gradient-x flex items-center justify-center px-4"
    >
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#334155] to-[#0f172a] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-5xl bg-white/10 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl p-10">
          <h2 className="text-3xl font-extrabold mb-8 text-center">💫 Apertura de Caja</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm mb-2 font-medium">Agente:</label>
              <select
                value={empleado}
                onChange={(e) => setEmpleado(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2 font-medium">Turno:</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
          </div>

          {/* Selección de billeteras */}
          <div className="mb-8">
            <label className="block text-sm mb-2 font-semibold">Seleccionar Billeteras:</label>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
              {billeterasDisponibles.map((b) => {
                const id = Number(b.id);
                const selected = billeterasSeleccionadas.includes(id);
                return (
                  <motion.div
                    key={id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => toggleBilletera(id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border text-white ${
                      selected
                        ? "bg-gradient-to-tr from-purple-700 to-cyan-600 border-white"
                        : "bg-slate-700 border-slate-600 hover:border-white"
                    }`}
                  >
                    <div className="font-semibold">{b.servicio}</div>
                    <div className="text-sm">{b.titular}</div>
                    <div className="text-xs mt-1 text-slate-300">{recortarCBU(b.cbu)}</div>

                    {/* Selector de uso SOLO cuando está seleccionada */}
                    {selected && (
                      <div
                        className="mt-3"
                        onClick={(e) => e.stopPropagation()} // evita des-seleccionar al abrir el select
                      >
                        <label className="block text-xs mb-1">Uso en este turno</label>
                        <select
                          value={usoTurno[id] || "operativa"}
                          onChange={(e) =>
                            setUsoTurno((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className="w-full p-2 rounded-lg bg-black/30 border border-white/30 text-white text-sm"
                        >
                          <option value="operativa">Billetera para cobrar</option>
                          <option value="retiro">Billetera para pagar</option>
                        </select>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Montos iniciales */}
          {billeterasSeleccionadas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4">Montos Iniciales</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {billeterasSeleccionadas.map((id) => {
                  const billeteraInfo = billeterasDisponibles.find((b) => Number(b.id) === id);
                  return (
                    <div key={id} className="bg-slate-800 border border-slate-600 rounded-xl p-4">
                      <div className="font-semibold">{billeteraInfo?.servicio}</div>
                      <div className="text-sm">{billeteraInfo?.titular}</div>
                      <div className="text-xs mb-2 text-slate-400">{recortarCBU(billeteraInfo?.cbu)}</div>

                      <label className="text-xs opacity-80">Uso en este turno</label>
                      <select
                        value={usoTurno[id] || "operativa"}
                        onChange={(e) => setUsoTurno((prev) => ({ ...prev, [id]: e.target.value }))}
                        className="w-full p-2 mt-1 mb-3 rounded-lg bg-slate-700 border border-slate-500 text-white"
                      >
                        <option value="operativa">Billetera para cobrar</option>
                        <option value="retiro">Billetera para pagar</option>
                      </select>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          montos[id] !== undefined && montos[id] !== ""
                            ? Number(montos[id]).toLocaleString("es-AR")
                            : ""
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\./g, "");
                          if (/^\d*$/.test(rawValue)) {
                            handleMontoChange(id, rawValue);
                          }
                        }}
                        className="w-full p-2 rounded-lg bg-slate-700 text-white border border-slate-500 focus:outline-none"
                        placeholder="Monto inicial $"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fichas iniciales */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Fichas iniciales 🎰</label>
            <input
              type="text"
              inputMode="numeric"
              value={fichas !== "" ? Number(fichas).toLocaleString("es-AR") : ""}
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                if (/^\d*$/.test(rawValue)) setFichas(rawValue);
              }}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
              placeholder="Ingresar Fichas Iniciales"
            />
          </div>

          {/* Saldo de jugadores (inicio) */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Saldo de jugadores (inicio) 💼
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={
                saldoJugadoresInicio !== ""
                  ? Number(saldoJugadoresInicio).toLocaleString("es-AR")
                  : ""
              }
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\./g, "");
                if (/^\d*$/.test(rawValue)) setSaldoJugadoresInicio(rawValue);
              }}
              className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 focus:outline-none"
              placeholder="Ej: 227.095"
            />
            <p className="text-xs text-slate-300 mt-1">
              Es el total de fichas en posesión de los jugadores (pasivo de la plataforma) al abrir.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={enviarAperturaCaja}
            className="w-full py-3 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-700 hover:opacity-90 transition-shadow shadow-xl"
          >
            🚀 Abrir Caja
          </motion.button>

          {mensaje && <p className="mt-4 text-center text-red-300">{mensaje}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default AperturaDeCaja;