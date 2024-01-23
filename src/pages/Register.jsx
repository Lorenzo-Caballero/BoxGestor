import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { motion } from 'framer-motion';

import { FaUserAlt } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdEmail } from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from '../store/actions/auth-actions';
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

const Register = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.ui.registerLoading);
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      password: Yup.string().required("Required"),
      password_confirmation: Yup.string()
        .oneOf([Yup.ref("password"), null], "Passwords must match")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      try {
        const response = await fetch('https://nodejs-restapi-mysql-fauno-production.up.railway.app/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
  
        if (response.ok) {
          // Registro exitoso, puedes realizar acciones adicionales si es necesario
          console.log('Usuario registrado exitosamente');
          // Despacha la acción de registro para actualizar el estado en Redux
          await dispatch(register(values));
        } else {
          // Manejar el caso en que la respuesta no sea exitosa
          console.error('Error al registrar usuario:', response.statusText);
        }
      } catch (error) {
        console.error('Error al realizar la solicitud POST:', error);
      }
    },
  });

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
        {loading ? <TheSpinner /> : 
        <form onSubmit={formik.handleSubmit}>
          <div className="flex flex-col space-y-1 mb-4">
            <label htmlFor="name" className="font-semibold tracking-wider">
              Nombre
            </label>
            <div className="flex py-1">
              <span className="flex items-center justify-center border border-gray-300 border-r-0 py-2 px-3 bg-gray-300  text-black">
                <FaUserAlt />
              </span>
              <input
                type="text"
                name="name"
                id="name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className="form-input rounded-r w-full"
                placeholder="Tu nombre"
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="text-xs font-semibold text-red-600">
                {formik.errors.name}
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-1 mb-4">
            <label htmlFor="email" className="font-semibold tracking-wider">
              Email
            </label>
            <div className="flex py-1">
              <span className="flex items-center justify-center border border-gray-300 border-r-0 py-2 px-3 bg-gray-300  text-black">
                <MdEmail />
              </span>
              <input
                type="email"
                name="email"
                id="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className="form-input rounded-r w-full"
                placeholder="ejemplo@gmail.com"
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs font-semibold text-red-600">
                {formik.errors.email}
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-1 mb-4">
            <label htmlFor="password" className="font-semibold tracking-wider">
              Contraseña
            </label>
            <div className="flex py-1">
              <span className="flex items-center justify-center border border-gray-300 border-r-0 py-2 px-3 bg-gray-300  text-black">
                <RiLockPasswordFill />
              </span>
              <input
                type="password"
                name="password"
                id="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className="form-input rounded-r w-full"
                placeholder="********"
              />
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-red-600">{formik.errors.password}</p>
            )}
          </div>
          <div className="flex flex-col space-y-1 mb-4">
            <label
              htmlFor="password_confirmation"
              className="font-semibold tracking-wider"
            >
              Confirmar Contraseña
            </label>
            <div className="flex py-1">
              <span className="flex items-center justify-center border border-gray-300 border-r-0 py-2 px-3 bg-gray-300  text-black">
                <RiLockPasswordFill />
              </span>
              <input
                type="password"
                name="password_confirmation"
                id="password_confirmation"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password_confirmation}
                className="form-input rounded-r w-full"
                placeholder="********"
              />
            </div>
            {formik.touched.password_confirmation &&
              formik.errors.password_confirmation && (
                <p className="text-xs text-red-600">
                  {formik.errors.password_confirmation}
                </p>
              )}
          </div>
          <hr />
          <button
            type="submit"
            className="px-4 py-2 block mt-3 ml-auto text-primary border border-primary hover:text-white hover:bg-primary rounded-md"
          >
            <span className="inline-flex justify-content-center mr-1 text-center">
              <FiLogIn />{" "}
            </span>
            Enviar
          </button>
        </form>
        }
        <p className="text-center mt-6">
          Ya tenes una cuenta?{" "}
          <Link to="/login" className="text-primary">
            Iniciá sesión
          </Link>{" "}
        </p>
      </div>
    </motion.div>
  );
};

export default Register;
