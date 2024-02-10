import React, { useState } from 'react';
import RouletteWheel from './CustomRoulette';

const Games = () => {
  const [spinning, setSpinning] = useState(false);

  const segments = ['Segmento 1', 'Segmento 2', 'Segmento 3', 'Segmento 4', 'Segmento 5'];

  const handleSpin = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 5000); // Simula un giro de 5 segundos
  };

  return (
    <div>
    
      <RouletteWheel segments={segments} spin={spinning} rotating={spinning} />
    </div>
  );
};

export default Games;
