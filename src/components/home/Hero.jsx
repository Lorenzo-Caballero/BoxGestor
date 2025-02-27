import React, { useState } from "react";

const Hero = () => {
  const slides = [
    {
      image:
        "https://i.pinimg.com/474x/29/13/f1/2913f17e798801c7043b5717c8bbcd5a.jpg",
      label: "Primera Diapositiva",
      description: "Contenido representativo de la primera diapositiva.",
    },
    {
      image:
        "https://i.pinimg.com/474x/94/dd/b4/94ddb411fdb829d7455393a7dcc81084.jpg",
      label: "Segunda Diapositiva",
      description: "Contenido representativo de la segunda diapositiva.",
    },
    {
      image:
        "https://i.pinimg.com/474x/ae/a8/e9/aea8e99f5853185fca210af7aa16a40f.jpg",
      label: "Tercera Diapositiva",
      description: "Contenido representativo de la tercera diapositiva.",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full h-[88vh] mx-auto overflow-hidden">
      {/* Diapositivas */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-center ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Contenedor del recuadro blanco */}
            <div className="bg-white p-4 rounded-lg shadow-lg lg:w-4/5 lg:h-4/5 flex items-center justify-center">
              <img
                src={slide.image}
                alt={slide.label}
                className="max-w-full max-h-full object-contain rounded-md"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Efecto de desvanecimiento transparente */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>

      {/* Controles */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full text-white hover:bg-opacity-75"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-3 w-3 rounded-full ${
              currentIndex === index ? "bg-white" : "bg-gray-400"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Hero;
