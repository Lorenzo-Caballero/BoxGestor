import React, { useState } from 'react';
import { Wheel } from 'react-custom-roulette';

const data = [
  { option: '10% OFF', probability: 50 },
  { option: '15% OFF', probability: 40 },
  { option: '30% OFF', probability: 10 },
];

export default () => {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);

  const handleSpinClick = () => {
    if (!mustSpin) {
      const randomNumber = Math.random() * 100; // Genera un número aleatorio entre 0 y 100
      let cumulativeProbability = 0;
      let newPrizeNumber = 0;

      // Itera sobre las opciones y determina cuál es la opción seleccionada
      for (let i = 0; i < data.length; i++) {
        cumulativeProbability += data[i].probability;
        if (randomNumber <= cumulativeProbability) {
          newPrizeNumber = i;
          break;
        }
      }

      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="relative">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={data.map((item) => ({ ...item, option: `${item.option} ` }))}
          onStopSpinning={() => {
            setMustSpin(false);
          }}
          outerBorderColor="#E5E7EB"
          outerBorderWidth={5}
          innerBorderColor="#F3F4F6"
          innerBorderWidth={5}
          radiusLineColor="#F3F4F6"
          fontSize={18}
          fontFamily="Arial"
          fontWeight="bold"
          textDistance={60}
          perpendicularText={true}
          backgroundColors={['#FDE68A', '#A7F3D0', '#FECACA']}
        />
        <button
          onClick={handleSpinClick}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-blue-500 px-6 py-3 text-white rounded-md shadow-lg hover:bg-blue-600 focus:outline-none"
        >
          SPIN
        </button>
      </div>
    </div>
  );
};
