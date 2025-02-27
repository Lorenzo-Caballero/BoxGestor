import React, { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX } from 'react-icons/fi'; // Importa el icono de cierre
import { motion } from "framer-motion";
import { CohereClient } from "cohere-ai";
import axios from 'axios'; // Importa axios para hacer solicitudes HTTP
import assistent from "../../assets/assistent.png";
const ChatButton = () => {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [cohereToken, setCohereToken] = useState(null); // Estado para almacenar el token
  const [enviandoMensaje, setEnviandoMensaje] = useState(false); // Estado para controlar si se está enviando un mensaje
  const mensajesRef = useRef(null); // Referencia al contenedor de mensajes
  const [mostrarTooltip, setMostrarTooltip] = useState(false);

  useEffect(() => {
    obtenerTokenCohere(); // Obtener el token de Cohere al montar el componente
  }, []);

  // Función para obtener el token de Cohere
  const obtenerTokenCohere = async () => {
    try {
      const response = await axios.get('https://restapi-lennitabb-production.up.railway.app/api/ai');
      const token = response.ia;
      console.log(token);
      setCohereToken(token); // Almacena el token en el estado
    } catch (error) {
      console.error('Error al obtener el token de la API:', error);
    }
  };

  //tootip handle
  const handleMouseEnter = () => {
    setMostrarTooltip(true);
  };

  const handleMouseLeave = () => {
    setMostrarTooltip(false);
  };

  // Función para hacer scroll hacia abajo en el contenedor de mensajes
  const scrollToBottom = () => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(); // Hace scroll hacia abajo al cargar o actualizar mensajes
  }, [mensajes]); // Se ejecuta cada vez que se actualiza la lista de mensajes

  // Función para enviar un mensaje y obtener la respuesta de Cohere
  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || enviandoMensaje) return;
    setEnviandoMensaje(true); // Deshabilita el botón de enviar mensaje
    setMensajes(prevMensajes => [
      ...prevMensajes,
      { texto: nuevoMensaje, origen: 'usuario' }
    ]);
    setNuevoMensaje('');
    try {
      const respuestaCohere = await obtenerRespuestaCohere(nuevoMensaje);
      setMensajes(prevMensajes => [
        ...prevMensajes,
        { texto: respuestaCohere, origen: 'asistente' }
      ]);
    } finally {
      setEnviandoMensaje(false); // Habilita el botón de enviar mensaje
    }
  };

// Función para obtener la respuesta de Cohere utilizando .chat
const obtenerRespuestaCohere = async (userMessage) => {
  try {
    if (!cohereToken) {
      throw new Error('Token de Cohere no disponible');
    }

    const cohere = new CohereClient({
      token: cohereToken,
      language: "es", // Configura el idioma español
      model: "command-r-plus",
    });

    setEscribiendo(true);
    // Construir el historial de chat
    const chatHistory = [
      { role: "SYSTEM", message: "Eres un asistente de Fauno, das respuestas breves las respuestas no deben superar los cuatro renglones, eres argentino , fauno es un tatuador profesional de Santa Clara del Mar. Como asistente virtual de Fauno, debes conocer que Fauno es un tatuador con más de cinco años de experiencia y se destaca en la realización de diseños exclusivos. Se inspira en la naturaleza, animales, insectos, flora y fauna, además tatua en el estudio de @Nahuelherreratattoo un reconocido artista de Mar del Plata , Nahuel es experto en hiperrealismo , ademas de Nahuel , Fauno es compañero de David Garcia, otro reconocido artista de Mar del Plata ,David es experto en retrato de Animales . Debes responder con amabilidad preguntas referenciadas al mundo del tatuaje. Si están fuera del contexto del tatuaje o del arte, responde con un 'No conozco esos temas', si te piden el numero de telefono de fauno ,fauno tiene 26 años dales el siguiente link para que accedan :`https://wa.me/2233407440`, si te preguntan por paloma , es la novia y musa inspiradora de fauno , si te preguntan por el valor minimo de un tattoo , es de 10 mil pesos argentinos el valor minimo . Además, ten en cuenta que tienes un límite de respuesta de 70 tokens, evita superarlo." },
      { role: "USER", message: userMessage }
    ];

    const response = await cohere.chat({
      message: userMessage,
      model: "command-r-plus",
      chat_history: chatHistory,
      language: "es",
    });

    setEscribiendo(false);
    console.log(response);
    return response.text;
  } catch (error) {
    console.error('Error al llamar a Cohere AI:', error);
    setEscribiendo(false);
    return 'Lo siento, hubo un problema al procesar tu solicitud.';
  }
};

  // Función para manejar el evento de presionar la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEnviarMensaje();
    }
  };

  // Función para manejar el evento de alternar la visibilidad del chat
  const handleChatToggle = () => {
    setChatAbierto(!chatAbierto);
  };

  // Función para manejar el evento de cerrar el chat
  const handleCloseChat = () => {
    setChatAbierto(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-10">
    <button
      onClick={handleChatToggle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex items-center justify-center w-16 h-16 focus:outline-none ${chatAbierto ? 'hidden' : ''}`}
    >
      <img src={assistent} alt="Asistente" className="w-16 h-16" />
    </button>
    {mostrarTooltip && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-16 right-4 px-2 py-1 bg-purple-500 text-white text-sm rounded-md shadow-lg"
      >
        Soy tu asistente virtual
      </motion.div>
    )}
      {chatAbierto && (
        <div className="bg-purple-100 p-4 rounded-t-lg shadow-lg w-80">
          <div className="flex justify-between mb-2">
            <button onClick={handleCloseChat}><FiX className="text-gray-600" /></button> {/* Botón de cierre */}
          </div>
          <div ref={mensajesRef} className="h-60 overflow-y-auto mb-2">
            {mensajes.map((mensaje, index) => (
              <div key={index} className={`mb-2 ${mensaje.origen === 'usuario' ? 'text-right' : 'text-left'} px-4 py-2 rounded-lg bg-purple-200 text-gray-800`}>
                <strong>{mensaje.origen === 'usuario' ? 'Tú' : 'Asistente LennitaBB'}</strong>: {mensaje.texto}
              </div>
            ))}
            {escribiendo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-2 text-left px-4 py-2 rounded-lg bg-purple-200"
              >
                <strong>Asistente LennitaBB</strong>: ...
              </motion.div>
            )}
          </div>
          <div className="flex justify-between">
   <input
  type="text"
  value={nuevoMensaje}
  onChange={(e) => setNuevoMensaje(e.target.value)}
  onKeyPress={handleKeyPress}
  placeholder="Escribí algo acá"
  className="flex-1 border rounded-full px-4 py-2 outline-none"
  disabled={enviandoMensaje} // Deshabilita el input mientras se está enviando un mensaje
/>
            
            <button onClick={handleEnviarMensaje} disabled={enviandoMensaje} className="ml-2 bg-purple-300 rounded-full px-4 py-2 text-white font-semibold">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatButton;