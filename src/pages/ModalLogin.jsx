import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, Link } from 'react-router-dom';

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

const ModalLogin = ({ message, closeModal }) => {
    const handleCloseModal = () => {
        closeModal();
    };

    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <motion.div className="bg-white rounded-lg p-8 w-80 relative" initial={{ y: '-100vh' }} animate={{ y: 0 }}>
                <button className="absolute top-2 right-2 text-gray-500" onClick={handleCloseModal}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <p className="text-lg font-bold mb-4 text-center">{message}</p>
                <div className="flex justify-center">
                    <NavLink to="/login">
                        <motion.button className="border-primary border-4 text-primary font-bold px-4 py-2 ml-2 rounded-full shadow-lg"
                            variants={buttonVariants}
                            whileHover="hover"
                        >
                            Login
                        </motion.button>
                    </NavLink>
                </div>
                <p className="text-center mt-6">¿Aún no tienes una cuenta? <Link to='/register' className="text-primary">¡Regístrate!</Link></p>
            </motion.div>
        </div>
    );
};

export default ModalLogin;
