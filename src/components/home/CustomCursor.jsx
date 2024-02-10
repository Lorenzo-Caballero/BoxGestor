import React, { useState, useEffect } from 'react';
import { FaHandPointer, FaTimesCircle } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const CustomCursor = () => {
  const [cursorType, setCursorType] = useState('default');
  const location = useLocation();

  useEffect(() => {
    // Cambiar el tipo de cursor según la ubicación o la interacción
    const handleCursorChange = () => {
      setCursorType('pointer'); // Cambia el tipo de cursor aquí según tus necesidades
    };

    window.addEventListener('mousemove', handleCursorChange);

    return () => {
      window.removeEventListener('mousemove', handleCursorChange);
    };
  }, [location]);

  return (
    <div>
   
      {cursorType === 'pointer' ? (
        <FaHandPointer
          size={24}
          data-tip=""
          data-for="custom-cursor"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <FaTimesCircle
          size={24}
          data-tip=""
          data-for="custom-cursor"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default CustomCursor;
