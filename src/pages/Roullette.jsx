import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ConfettiExplosion from './ConfettiExplosion';

const premios = [
  { nombre: '400 FICHAS', color: 'from-cyan-400 via-blue-500 to-indigo-600' },
  { nombre: '1.000 FICHAS', color: 'from-pink-500 via-purple-500 to-indigo-500' },
  { nombre: 'Nada 😢', color: 'from-gray-300 via-gray-400 to-gray-500' },
  { nombre: '500 FICHAS', color: 'from-lime-400 via-green-500 to-emerald-600' },
  { nombre: '2.000 FICHAS', color: 'from-yellow-400 via-orange-500 to-red-600' }
];

const calcularAngulo = (index, total) => (360 / total) * index;

export default function JuegoAzar() {
  const [mostrarConfetti, setMostrarConfetti] = useState(false);
  const [girando, setGirando] = useState(false);
  const [premio, setPremio] = useState(null);
  const [rotacionVisual, setRotacionVisual] = useState(0);
  const [keyAnimacion, setKeyAnimacion] = useState(0);
  const [uuid, setUuid] = useState('');
  const [ip, setIp] = useState('');
  const [puedeJugar, setPuedeJugar] = useState(true);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [botonBloqueado, setBotonBloqueado] = useState(false);

  useEffect(() => {
    const validarIP = async () => {
      try {
        const resIp = await fetch('https://api.ipify.org?format=json');
        const dataIp = await resIp.json();
        setIp(dataIp.ip);

        const res = await fetch('https://gestoradmin.store/index.php?recurso=premios-casino');
        const premiosData = await res.json();

        const jugadasDeIP = premiosData.filter(p => p.ip === dataIp.ip);
        if (jugadasDeIP.length > 0) {
          const ultima = jugadasDeIP[jugadasDeIP.length - 1];
          const ultimaJugada = new Date(ultima.date);
          const ahora = new Date();
          const diferencia = ahora - ultimaJugada;

          const horasRestantes = 24 - diferencia / (1000 * 60 * 60);
          if (horasRestantes > 0) {
            setPuedeJugar(false);
            setTiempoRestante(horasRestantes);

            // Mostrar premio si no fue reclamado
            if (!ultima.reclamado && ultima.premio !== 'Nada 😢') {
              setPremio({ nombre: ultima.premio });
              setUuid(ultima.uuid);
            }
          }
        }
      } catch (error) {
        console.error('Error al validar IP:', error);
      }
    };

    validarIP();
  }, []);

  const seleccionarPremioConPeso = () => {
    const random = Math.random();
    let acumulado = 0;
    for (let i = 0; i < premios.length; i++) {
      acumulado += [0.3, 0.3, 0.05, 0.25, 0.1][i];
      if (random <= acumulado) return i;
    }
    return premios.length - 1;
  };

  const girar = () => {
    if (!puedeJugar || girando) return;
    setGirando(true);
    const indice = seleccionarPremioConPeso();
    const gradosPorPremio = 360 / premios.length;
    const anguloCentroSector = gradosPorPremio * indice + gradosPorPremio / 2;
    const anguloFinal = 270 - anguloCentroSector;
    const vueltasExtra = 360 * 20;
    const rotacionTotal = vueltasExtra + anguloFinal;

    setRotacionVisual(rotacionTotal);
    setKeyAnimacion(prev => prev + 1);

    setTimeout(() => {
      const nuevoUuid = crypto.randomUUID();
      const premioGanado = premios[indice];
      setPremio(premioGanado);
      setUuid(nuevoUuid);
      setGirando(false);
      setPuedeJugar(false);

      if (premioGanado.nombre !== 'Nada 😢') {
        setMostrarConfetti(true);
        setTimeout(() => setMostrarConfetti(false), 1000);
      }

      (async () => {
        try {
          const fechaArgentina = new Date().toLocaleString('sv-SE', {
            timeZone: 'America/Argentina/Buenos_Aires'
          }).replace(' ', 'T');

          await fetch('https://gestoradmin.store/index.php?recurso=premios-casino', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              premio: premioGanado.nombre,
              uuid: nuevoUuid,
              date: fechaArgentina,
              ip: ip,
              reclamado: false
            }),
          });
        } catch (error) {
          console.error('Error al guardar el resultado:', error);
        }
      })();
    }, 4000);
  };

  const reclamarPremio = async () => {
    if (!premio || !uuid || premio.nombre === 'Nada 😢') return;
    setBotonBloqueado(true);
  
    try {
      // 1. Obtener número de WhatsApp desde la API
      const response = await fetch('https://gestoradmin.store/WhatsAppNumber.php?recurso=wp-number');
      const data = await response.json();
      const numeroWhatsApp = data[0]?.number;
  
      if (!numeroWhatsApp) throw new Error('No se pudo obtener el número de WhatsApp');
  
      // 2. Construir mensaje y URL con número dinámico
      const mensaje = `Hola me gané el premio: ${premio.nombre} en su página web. Quiero reclamarlo. Mi código es ${uuid}`;
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  
      // 3. Marcar el premio como reclamado
      await fetch('https://gestoradmin.store/index.php?recurso=premios-casino', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: uuid }),
      });
  
      // 4. Redirigir al WhatsApp con número dinámico
      window.location.href = urlWhatsApp;
  
    } catch (error) {
      alert('Hubo un error al procesar tu premio. Intenta de nuevo.');
      console.error(error);
      setBotonBloqueado(false);
    }
  };
  

  const formatTiempo = (horas) => {
    const horasInt = Math.floor(horas);
    const minutos = Math.floor((horas - horasInt) * 60);
    return `${horasInt}h ${minutos}m`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-6 bg-gradient-to-br from-[#1e0033] via-[#2d0066] to-[#1a0033] animate-gradient-xy">
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient-xy {
          background-size: 400% 400%;
          animation: gradientMove 15s ease infinite;
        }
      `}</style>

      {/* Ruleta SVG */}
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square mb-6">
        <motion.div
          key={keyAnimacion}
          className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          animate={{ rotate: rotacionVisual }}
          transition={{ duration: 4, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              {[
                ['#00ffff', '#ff00ff'],
                ['#00ff87', '#1e90ff'],
                ['#ff6ec4', '#7873f5'],
                ['#facc15', '#ff5f6d'],
                ['#38bdf8', '#9333ea'],
              ].map(([color1, color2], i) => (
                <linearGradient id={`grad${i}`} key={i} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={color1}>
                    <animate attributeName="stop-color" values={`${color1};${color2};${color1}`} dur="6s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor={color2}>
                    <animate attributeName="stop-color" values={`${color2};${color1};${color2}`} dur="6s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              ))}
            </defs>
            {premios.map((p, i) => {
              const startAngle = calcularAngulo(i, premios.length);
              const endAngle = calcularAngulo(i + 1, premios.length);
              const largeArc = endAngle - startAngle > 180 ? 1 : 0;

              const x1 = 100 + 100 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 100 + 100 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 100 + 100 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 100 + 100 * Math.sin((Math.PI * endAngle) / 180);

              return (
                <g key={i}>
                  <path d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`} fill={`url(#grad${i % 5})`} />
                  <text
                    x={100 + 60 * Math.cos((Math.PI * (startAngle + endAngle) / 2) / 180)}
                    y={100 + 60 * Math.sin((Math.PI * (startAngle + endAngle) / 2) / 180)}
                    fill="#fff"
                    fontSize="clamp(6px, 2vw, 10px)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {p.nombre}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-[14px] border-l-transparent border-r-transparent border-b-white z-20"></div>
      </div>

      {/* Botón girar */}
      <button
        onClick={girar}
        disabled={girando || !puedeJugar}
        className={`w-full max-w-xs sm:max-w-sm px-6 py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300 ${
          girando || !puedeJugar ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-600 hover:to-cyan-500'
        }`}
      >
        {girando ? 'Girando...' : 'Girar Ruleta'}
      </button>

      {/* Mensaje de espera */}
      {!puedeJugar && tiempoRestante && !premio && (
        <motion.div
          className="mt-6 w-full max-w-sm p-4 bg-gradient-to-br from-fuchsia-700 via-purple-800 to-indigo-900 text-white rounded-xl shadow-xl text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-lg sm:text-xl font-semibold">¡Ya jugaste hoy! 🎮</p>
          <p className="text-sm mt-2">Podrás volver a girar en:</p>
          <p className="text-md sm:text-lg mt-1 font-bold">{formatTiempo(tiempoRestante)}</p>
        </motion.div>
      )}

      {/* Premio ganado */}
      {premio && !girando && (
        <motion.div
          className="mt-6 w-full max-w-sm p-4 bg-white rounded-xl shadow-lg text-center text-base sm:text-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {mostrarConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <ConfettiExplosion />
            </div>
          )}
          <p>¡Felicidades! Ganaste: <strong>{premio.nombre}</strong></p>

          {premio.nombre !== 'Nada 😢' && (
            <button
              onClick={reclamarPremio}
              disabled={botonBloqueado}
              className={`mt-4 w-full py-2 rounded-lg text-white font-semibold shadow-md transition ${
                botonBloqueado
                  ? 'bg-gradient-to-r from-green-400 to-green-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 via-teal-500 to-lime-500 hover:from-green-600 hover:to-lime-600'
              }`}
            >
              {botonBloqueado ? 'Premio Reclamado' : 'Reclamar Premio'}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
