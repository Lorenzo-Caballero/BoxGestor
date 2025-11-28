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

      const billeterasConDatos = billeterasSeleccionadas.map((id) => {
        const b = billeterasDisponibles.find((x) => Number(x.id) === Number(id));
        return {
          id: Number(b?.id) || 0,
          servicio: b?.servicio || "",
          titular: b?.titular || "",
          cbu: b?.cbu || "",
          monto: parseEntero(montos[id] || "0"),
          uso: usoTurno[id] === "retiro" ? "retiro" : "operativa",
        };
      });

      const datos = {
        empleado: Number(empleado),
        turno,
        billeteras: billeterasConDatos,
        fichas_iniciales: parseEntero(fichas),
        // Este valor el backend lo guarda como liability_inicio / saldo de jugadores al inicio
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
        alert("Caja abierta correctamente");
        navigate("/cerrar-caja");
      } else {
        setMensaje(data?.error || "Error desconocido al abrir la caja.");
      }
    } catch (err) {
      console.error(err);
      setMensaje("Error de red o del servidor.");
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
      className="min-h-screen bg-[#0e0f13] text-[#e6e6e6] flex items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-5xl bg-[#1e1f23] border border-[#2f3336] rounded-2xl shadow-2xl p-8 md:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-[#e8e9ea]">
            Apertura de caja
          </h2>
          <div className="mx-auto mt-3 h-px w-24 bg-[#2f3336]" />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm mb-2 font-medium text-[#c7c9cc]">Agente</label>
            <select
              value={empleado}
              onChange={(e) => setEmpleado(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
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
            <label className="block text-sm mb-2 font-medium text-[#c7c9cc]">Turno</label>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
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
          <label className="block text-sm mb-2 font-semibold text-[#c7c9cc]">
            Seleccionar billeteras
          </label>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {billeterasDisponibles.map((b) => {
              const id = Number(b.id);
              const selected = billeterasSeleccionadas.includes(id);
              return (
                <motion.div
                  key={id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => toggleBilletera(id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selected
                      ? "bg-[#24272e] border-[#8b949e]"
                      : "bg-[#2a2d33] border-[#3a3f45] hover:border-[#4a5056]"
                  }`}
                >
                  <div className="font-semibold text-[#e6e6e6]">{b.servicio}</div>
                  <div className="text-sm text-[#c7c9cc]">{b.titular}</div>
                  <div className="text-xs mt-1 text-[#9da3ab]">{recortarCBU(b.cbu)}</div>

                  {selected && (
                    <div
                      className="mt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="block text-xs mb-1 text-[#c7c9cc]">
                        Uso en este turno
                      </label>
                      <select
                        value={usoTurno[id] || "operativa"}
                        onChange={(e) =>
                          setUsoTurno((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        className="w-full p-2 rounded-lg bg-[#202329] border border-[#3a3f45] text-sm"
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
            <h3 className="text-base font-semibold mb-4 text-[#d7d9dc]">
              Montos iniciales
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {billeterasSeleccionadas.map((id) => {
                const billeteraInfo = billeterasDisponibles.find((b) => Number(b.id) === id);
                return (
                  <div key={id} className="bg-[#2a2d33] border border-[#3a3f45] rounded-xl p-4">
                    <div className="font-semibold text-[#e6e6e6]">
                      {billeteraInfo?.servicio}
                    </div>
                    <div className="text-sm text-[#c7c9cc]">{billeteraInfo?.titular}</div>
                    <div className="text-xs mb-2 text-[#9da3ab]">
                      {recortarCBU(billeteraInfo?.cbu)}
                    </div>

                    <label className="text-xs opacity-80 text-[#c7c9cc]">
                      Uso en este turno
                    </label>
                    <select
                      value={usoTurno[id] || "operativa"}
                      onChange={(e) =>
                        setUsoTurno((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      className="w-full p-2 mt-1 mb-3 rounded-lg bg-[#202329] border border-[#3a3f45]"
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
                      className="w-full p-2 rounded-lg bg-[#202329] border border-[#3a3f45] focus:outline-none"
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
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
            Fichas iniciales
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={fichas !== "" ? Number(fichas).toLocaleString("es-AR") : ""}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\./g, "");
              if (/^\d*$/.test(rawValue)) setFichas(rawValue);
            }}
            className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
            placeholder="Ingresar fichas iniciales"
          />
        </div>

        {/* Saldo de jugadores (inicio) */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-[#c7c9cc]">
            Saldo de jugadores (inicio)
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
            className="w-full p-3 rounded-xl bg-[#2a2d33] border border-[#3a3f45] focus:outline-none"
            placeholder="Ej: 227.095"
          />
          <p className="text-xs text-[#9da3ab] mt-1">
            Es el total de fichas en posesión de los jugadores (pasivo de la plataforma) al abrir.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={enviarAperturaCaja}
          className="w-full py-3 rounded-2xl font-semibold text-[15px] bg-[#2f3336] hover:bg-[#3a3f44] transition-colors"
        >
          Abrir caja
        </motion.button>

        {mensaje && <p className="mt-4 text-center text-red-400">{mensaje}</p>}
      </div>
    </motion.div>
  );
};

export default AperturaDeCaja;
