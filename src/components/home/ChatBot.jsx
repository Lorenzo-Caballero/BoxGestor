import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FiMessageSquare } from 'react-icons/fi'; 
import { motion } from "framer-motion";
import {config} from "dotenv"

config()

const apiUrl = 'https://api.openai.com/v1/chat/completions';

const ChatButton = () => {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false); // Estado para controlar la animación de escribiendo
  const chatRef = useRef(null);

  const obtenerRespuestaFauno = async (userMessage) => {
    const apikey =  process.env.API_KEY; // Agrega tu API Key de OpenAI
    try {
      setEscribiendo(true); // Activar la animación de escribiendo
      const respuesta = await axios.post(
        apiUrl,
        {
          messages: [
            {"role": "system", "content": "Eres un asistente de Fauno, das respuestas breves las respuestas no deben superar los cuatro renglones, eres argentino , fauno es un tatuador profesional de Santa Clara del Mar. Como asistente virtual de Fauno, debes conocer que Fauno es un tatuador con más de cinco años de experiencia y se destaca en la realización de diseños exclusivos. Se inspira en la naturaleza, animales, insectos, flora y fauna. Debes responder con amabilidad preguntas referenciadas al mundo del tatuaje. Si están fuera del contexto del tatuaje o del arte, responde con un 'No conozco esos temas'. Además, ten en cuenta que tienes un límite de respuesta de 70 tokens, evita superarlo."},
            {"role": "user", "content": userMessage} 
          ],
          model: "gpt-3.5-turbo",
          max_tokens: 140,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apikey}`,
          },
        }
      );

      setEscribiendo(false); // Desactivar la animación de escribiendo
      return respuesta.data.choices[0].message.content;
    } catch (error) {
      console.error('Error al llamar a la API de OpenAI:', error);
      setEscribiendo(false); // Desactivar la animación de escribiendo en caso de error
      return 'Lo siento, hubo un problema al procesar tu solicitud.';
    }
  };

  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return; // Evitar enviar mensajes vacíos
    setMensajes((prevMensajes) => [...prevMensajes, { texto: nuevoMensaje, origen: 'usuario' }]);
    setNuevoMensaje(''); // Limpiar el input
    const respuestaFauno = await obtenerRespuestaFauno(nuevoMensaje);
    setMensajes((prevMensajes) => [...prevMensajes, { texto: respuestaFauno, origen: 'fauno' }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEnviarMensaje();
    }
  };

  const handleChatToggle = () => {
    setChatAbierto(!chatAbierto);
  };

  return (
    <div className="fixed bottom-0 right-4">
      <button onClick={handleChatToggle} className={`flex items-center justify-center bg-purple-300 rounded-full w-12 h-12 ${chatAbierto ? 'hidden' : ''}`}>
        <FiMessageSquare className="text-white text-2xl" />
      </button>
      {chatAbierto && (
        <div className="bg-purple-100 p-4 rounded-t-lg shadow-lg w-80">
          <div className="h-60 overflow-y-auto mb-2">
            {mensajes.map((mensaje, index) => (
              <div key={index} className={`mb-2 ${mensaje.origen === 'usuario' ? 'text-right' : 'text-left'} px-4 py-2 rounded-lg bg-purple-200 text-gray-800`}>
                <strong>{mensaje.origen === 'usuario' ? 'Tú' : 'Asistente Fauno'}</strong>: {mensaje.texto}
              </div>
            ))}
        {escribiendo && (
  <motion.div
    initial={{ opacity: 0 }} // Opacidad inicial
    animate={{ opacity: 1 }} // Opacidad al animar
    transition={{ duration: 0.5 }} // Duración de la animación
    className="mb-2 text-left px-4 py-2 rounded-lg bg-purple-200"
  >
    <strong>Asistente Fauno</strong>: ...
  </motion.div>
)}
          </div>
          <div className="flex justify-between">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje aquí"
              className="flex-1 border rounded-full px-4 py-2 outline-none"
            />
            <button onClick={handleEnviarMensaje} className="ml-2 bg-purple-300 rounded-full px-4 py-2 text-white font-semibold">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatButton;
