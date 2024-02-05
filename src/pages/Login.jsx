import React, { useState } from "react";
import { motion } from 'framer-motion';
import { FiLogIn } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  const loading = useSelector((state) => state.ui.loginLoading);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://nodejs-restapi-mysql-fauno-production.up.railway.app/api/clientes/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials:true,
        body: JSON.stringify(formData)
      });

      if (response.ok) {

        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        const errorData = await response.json();
        console.error(errorData);
        alert('Credenciales inválidas');
      }
    } catch (error) { 
      console.error('Error al iniciar sesión:', error);
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
        <InputField
            type="text"
            name="email"
            placeholder="Contraseña"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <InputField
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <SubmitButton loading={loading} />
        </form>
        <p className="text-center mt-6">¿Aún no estás registrado? <Link to='/register' className="text-primary">¡Crea una cuenta!</Link></p>
      </div>
    </motion.div>
  );
};

const InputField = ({ type, name, placeholder, value, onChange, required }) => {
  return (
    <div className="mb-6">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="block w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-primary"
        required={required}
      />
    </div>
  );
};

const SubmitButton = ({ loading }) => {
  return (
    <button
      type="submit"
      className="px-4 py-2 block mt-3 ml-auto text-primary border border-primary hover:text-white hover:bg-primary rounded-md"
      disabled={loading}
    >
      {loading ? <TheSpinner /> : <><span className="inline-flex justify-items-center mr-1"><FiLogIn /></span>Login</>}
    </button>
  );
};

export default Login;
