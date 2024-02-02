import React, { useState } from "react";
import { motion } from 'framer-motion';
import { FiLogIn } from 'react-icons/fi';
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/actions/auth-actions';
import TheSpinner from "../layout/TheSpinner";

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

const Login = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.ui.loginLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = {
      email: email,
      password: password
    };
  
    try {
      const response = await fetch('https://nodejs-restapi-mysql-fauno-production.up.railway.app/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        const data = await response.json();
        // Guardar el token en el almacenamiento local del navegador
        localStorage.setItem('token', data.token);
        // Redireccionar al usuario a la página de inicio
        history.push('/home');
      } else {
        // Manejar el caso de credenciales inválidas
        const errorData = await response.json();
        console.error(errorData.message);
        // Mostrar un mensaje de error al usuario
        alert('Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      // Mostrar un mensaje de error genérico al usuario
      alert('Error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
    }
  };
  

  return (
    <motion.div className="w-[80%] mx-auto mt-40 mb-52"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="w-[320px] sm:w-[400px] rounded shadow-xl border-2 border-solid px-4 sm:px-8 py-20 mx-auto">
        <h2 className="text-3xl uppercase tracking-wider font-bold text-center mb-12 select-none">
          <span className="text-primary">Fauno</span>
          <span className="text-secondary-200">Tattoo</span>
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="block w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-primary"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Contraseña"
              className="block w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-primary"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 block mt-3 ml-auto text-primary border border-primary hover:text-white hover:bg-primary rounded-md"
            disabled={loading}
          >
            {loading ? <TheSpinner /> : <><span className="inline-flex justify-items-center mr-1"><FiLogIn /></span>Login</>}
          </button>
        </form>
        <p className="text-center mt-6">¿Aún no estás registrado? <Link to='/register' className="text-primary">¡Crea una cuenta!</Link></p>
      </div>
    </motion.div>
  );
};

export default Login;
