import React from "react";
import { motion } from 'framer-motion';
import { FiLogIn } from 'react-icons/fi'
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/actions/auth-actions';
import TheSpinner from "../layout/TheSpinner";
import { useEffect } from "react";
import GoogleLogin from "react-google-login";
import { gapi } from "gapi-script";

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
  const clientID = "417226731712-1inb78b3omeqcd3p6sp37onjl4fv6efq.apps.googleusercontent.com";

  useEffect(() => {
    const start = () => {
      gapi.auth2.init({
        clientId: clientID,
      })
    }
    gapi.load("client:auth2", start)
  }, [])

  const onSuccess = (response) => {
    console.log(response)
  }

  const onFailure = () => {
    console.log("Algo salio mal");
  }


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
        {   /*   <div className="btn flex justify-center items-center">
          <GoogleLogin
            clientId={clientID}
            onSuccess={onSuccess}
            onFailure={onFailure}
            cookiePolicy={"single_host_policy"}
          />
        </div>
*/}
        <button
          type="submit"
          className="px-4 py-2 block mt-3 ml-auto text-primary border border-primary hover:text-white hover:bg-primary rounded-md"
        >
          <span className="inline-flex justify-items-center mr-1"><FiLogIn /> </span>
          Login
        </button>

        <p className="text-center mt-6">Aún no estas registrado? <Link to='/register' className="text-primary">Crea una cuenta!</Link> </p>
      </div>
    </motion.div>
  );
};

export default Login;
