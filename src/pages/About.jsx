import React from 'react';
import { motion } from 'framer-motion';

import PageHero from '../layout/PageHero';
//import { ABOUT_IMG_URL } from '../utils/constants';


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
};

const underlineAnimate = {
    hidden: {
        opacity: 0,
        pathLength: 0,
    },
    visible: {
        opacity: 1,
        pathLength: 1,
        transition: {
            delay: 1,
            duration: .8,
        },
    },
};


const About = () => {


    return (
        <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <PageHero title="Sobre mi" />
            <div className='w-full py-32'>
                <div className='w-[85vw] flex mx-auto'>
                    <div className='grid sm:grid-cols-1 md:grid-cols-2 gap-8'>
                        <div>
                            <img alt="" />
                        </div>
                        <div>
                            <motion.h2 className='text-4xl lg:text-6xl font-bold capitalize tracking-wider'
                                initial={{ opacity: 0, y: 60 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: .5 }}
                            >
                                Mi historia
                                <svg
                                    className="svg-underline stroke-[#ffb81c] relative z-10 w-1/2"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    strokeWidth={7}
                                    viewBox="0 0 422 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <motion.path
                                        d="M3 9C118.957 4.47226 364.497 -1.86658 419 9"
                                        variants={underlineAnimate}
                                        initial="hidden"
                                        animate="visible"
                                    />
                                </svg>
                            </motion.h2>
                            <motion.p className='leading-10 text-gray-600 py-8 text-lg'
                                initial={{ opacity: 0, y: 60 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: .5, duration: .8 }}
                            >
                            Buenas! Soy Fauno, tatuador apasionado de la costa de Mar Chiquita, Santa Clara del Mar, Argentina. Mi pasión es transformar tu inspiración en tinta, creando piezas que reflejen tu esencia.
                            En Fauno Tattoo, cada diseño es una expresión, una marca de autenticidad en tu piel.
                            Listo para dar vida a tus ideas, ¡hablemos de tu próximo tatuaje!
                            </motion.p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.main>
    );
};

export default About;