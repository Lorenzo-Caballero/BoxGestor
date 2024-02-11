import React from "react";
import { Link } from "react-router-dom";
import video from "../../assets/MachinePen.mp4"
import { motion } from 'framer-motion';

const Hero = () => {
  const phoneNumber = '2233407440';
  const message = encodeURIComponent('Hola Fauno! Quiero reservar un turno.');
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${message}`;


  const underlineAnimate = {
    hidden: {
      opacity: 0,
      pathLength: 0,
    },
    visible: {
      opacity: 1,
      pathLength: 1,
      transition: {
        delay: 0.8,
        duration: .6,
      },
    },
  };

  const headerAnimate = {
    hidden: {
      opacity: 0,
      y: 25,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8
      }
    },
  };

  const textAnimate = {
    hidden: {
      opacity: 0,
      y: 25,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.3
      }
    },
  };

  const linksAnimate = {
    hidden: {
      opacity: 0,
      x: '-100vw',
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 1,
        delay: 0.5,
        type: 'spring',
        stiffness: 120
      }
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.1,
      textShadow: "0px 0px 2px #ffffff",
      boxShadow: "0px 0px 4px #243E8B",
      transition: {
        duration: 0.3,
      },
    },
  };


  return (
    <div>
      <div className="absolute top-1/4 -left-8 w-40 h-40 xl:w-72 xl:h-60 bg-purple-100 rounded-2xl transform-gpu -rotate-12 z-[-1]"></div>
      <div className='w-full h-screen flex flex-col justify-between px-8 py-12 z-10'>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col mt-16">
            <motion.h1 className="text-4xl md:text-5xl lg-text-7xl 2xl:text-8xl font-bold"
              variants={headerAnimate}
              initial="hidden"
              animate="visible"
            >
              Diseños Detallados
              <br />
              Y Exclusivos

            </motion.h1>
            <motion.p className="text-lg py-6"
              variants={textAnimate}
              initial="hidden"
              animate="visible"
            >


              ¡Explorá diseños, reservá fácilmente y obtené descuentos exclusivos! Viví una experiencia artística y tecnologíca en Fauno Tattoo Web.

            </motion.p>
            <motion.div
              variants={linksAnimate}
              initial="hidden"
              animate="visible"
            >
              <Link to='/products'>
                <motion.button className="px-4 py-2 font-bold bg-white border-4 border-primary rounded-full shadow-md"
                  variants={buttonVariants}
                  whileHover="hover"
                >
                  Ver diseños
                </motion.button>
              </Link>
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <motion.button
                  className="px-4 py-2 ml-4 font-bold bg-white border-4 border-primary rounded-full shadow-md"
                  variants={buttonVariants}
                  whileHover="hover"
                >
                  Reservar turno
                </motion.button>
              </a>
            </motion.div>
          </div>
          <motion.div className="block mx-auto"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .4 }}
          >
            <video className="hidden md:block h-[75%]" autoPlay loop muted>
              <source src={video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        </div>
      </div>
    </div>
    //     {/* <div className="absolute z-0 -left-20 top-0 w-40 h-40 bg-secondary-200 rounded-2xl transform-gpu -rotate-12 lg:-left-40 lg:-top-8 xl:w-80 xl:h-80"></div> */}
  );
};

export default Hero;