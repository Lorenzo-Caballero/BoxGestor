import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import CierreDeCaja from './CierreDeCaja';
import AperturaDeCaja from './AperturaDeCaja';
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: { duration: .3 }
  },
  exit: {
    x: '-100vw',
    transition: { ease: 'easeInOut' }
  }
}


const Home = () => {
  const [aperturaData, setAperturaData] = useState(null);

  return (
    <motion.main
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
   {!aperturaData ? (
        <AperturaDeCaja
          onConfirmar={(data) => setAperturaData(data)}
        />
      ) : (
        <CierreDeCaja
          apertura={aperturaData}
          onCerrarCaja={(cierreData) => {
            console.log('Cierre completo enviado:', cierreData);
            // Aquí puedes reiniciar o guardar el cierre
            setAperturaData(null);
          }}
        />
      )}
    </motion.main>
  );
};

export default Home;
