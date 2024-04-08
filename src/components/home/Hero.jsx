import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import conejita1 from "../../assets/conejimarron.png";
import conejita2 from "../../assets/coneji-removebg-preview.png";
import conejita3 from "../../assets/osito-removebg-preview (2).png";

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(conejita1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Cambiar a la siguiente imagen de manera circular
      setCurrentImage((prevImage) => {
        switch (prevImage) {
          case conejita1:
            return conejita2;
          case conejita2:
            return conejita3;
          case conejita3:
            return conejita1;
          default:
            return conejita1;
        }
      });
    }, 8000); // Cambiar cada 8 segundos

    return () => clearInterval(interval);
  }, []);

  const fadeInOut = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        style={{ backgroundImage: "url('/your-background-image.jpg')" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Decoraciones adicionales, como dibujos o formas */}
      </motion.div>
      <motion.img
        key={currentImage} // Key para forzar la remontaje de la imagen en cada cambio
        src={currentImage}
        alt="conejita"
        className="w-60 md:w-72 lg:w-80 mx-auto rounded-lg"
        initial="hidden"
        animate="visible"
        variants={fadeInOut}
        transition={{
          duration: 2, // Duración de la transición
          ease: "easeInOut", // Tipo de transición
          scale: { duration: 1.5, yoyo: Infinity, ease: "easeInOut" }, // Efecto de zoom
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-12">
        <Link to="/products">
          <motion.button
            className="px-4 py-2 font-bold bg-white border-4 border-purple-600 rounded-full shadow-md m-2"
            whileHover={{ scale: 1.1 }}
          >
            Ver diseños
          </motion.button>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
