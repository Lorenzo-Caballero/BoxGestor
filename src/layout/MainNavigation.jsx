import React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/solid";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import machinetattoo from '../assets/machine.png';
import HambergurMenu from "../assets/HambergurMenu.svg";
// import Logo from '../assets/logo.svg';
import NavCartButton from "../components/cart/NavCartButton";
import { logout } from "../store/actions/auth-actions";

const MainNavigation = () => {
  const [showNav, setShowNav] = useState(false);
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const token = useSelector((state) => state.auth.token);

  const navHandler = () => {
    setShowNav(!showNav);
  };

  const logoutUser = async () => {
    await dispatch(logout()); // Llama a la acción de logout
    setShowNav(false); // Cambia el estado local después de que el logout se complete
    window.location.reload(); // Recarga la página
  };

  const svgVariants = {
    hidden: { rotate: -180 },
    visible: {
      rotate: 0,
      transition: { duration: 1 },
    },
  };

  const pathVariants = {
    hidden: {
      opacity: 0,
      pathLength: 0,
    },
    visible: {
      opacity: 1,
      pathLength: 1,
      transition: {
        duration: 3,
        ease: "easeInOut",
      },
    },
  };
  const imageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
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
    <div className="w-full h-[80px]">
      <div className="flex  justify-between items-center w-full h-full px-8 sm:mb-6">
        <div className="flex">
          <div className="flex items-center">
            <motion.div
              className="w-[50px] h-[50px]"
              drag
              dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
              dragElastic={0.7}
            >
              {/* <NavLink to='/'><img src={Logo} alt="" /></NavLink> */}
              <NavLink to="/">
                <motion.img
                  src={machinetattoo}
                  alt="Machine Tattoo"
                  height="50"
                  width="50"
                  variants={imageVariants}
                  initial="hidden"
                  animate="visible"
                />
              </NavLink>
            </motion.div>
            <motion.div
              initial={{ y: -250 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
            >
              <NavLink to="/">
                <h1 className="text-3xl font-bold ml-2 select-none">
                  <span className="text-primary">Fauno</span>
                  <span className="text-secondary-200">Tattoo</span>
                </h1>
              </NavLink>
            </motion.div>
          </div>
          <ul className="hidden md:flex items-center lg:ml-8">
            <li>
              <NavLink className="ml-4 p-2 lg:text-lg font-semibold" to="/">
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                className="ml-2 p-2 lg:text-lg font-semibold"
                to="/about"
              >
                Sobre Mi
              </NavLink>
            </li>
            <li>
              <NavLink
                className="ml-2 p-2 lg:text-lg font-semibold"
                to="/products"
              >
                Diseños
              </NavLink>
            </li>
            <li>
              <NavLink
                className="ml-2 p-2 lg:text-lg font-semibold"
                to="/games"
              >
                Juegos
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="hidden md:flex">
          <NavCartButton />
          {!isAuthenticated && (
            <NavLink to="/login">
              <motion.button className="border-primary border-4 text-primary font-bold px-4 py-2 ml-2 rounded-full shadow-lg"
                variants={buttonVariants}
                whileHover="hover"
              >
                Login
              </motion.button>
            </NavLink>
          )}
          {isAuthenticated && (
            <motion.button
              onClick={logoutUser}
              className="border-primary border-4 text-primary font-bold px-4 py-2 ml-2 rounded-full shadow-lg"
              variants={buttonVariants}
              whileHover="hover"
            >
              Logout
            </motion.button>
          )}
        </div>
        <div className="md:hidden cursor-pointer" onClick={navHandler}>
          {!showNav ? (
            <img src={HambergurMenu} alt="" />
          ) : (
            <XIcon className="w-5" />
          )}
        </div>
      </div>

      <ul
        className={
          !showNav
            ? "hidden"
            : "md:hidden px-8 py-4 bg-white w-full h-[20rem] relative z-20"
        }
      >
        <li className="border-b-2 border-zinc-300 w-full text-lg font-semibold text-gray-600">
          <NavLink to="/" onClick={navHandler}>
            Inicio
          </NavLink>
        </li>
        <li className="border-b-2 border-zinc-300 w-full mt-4 text-lg font-semibold text-gray-600">
          <NavLink to="/about" onClick={navHandler}>
            Sobre Mi
          </NavLink>
        </li>
        <li className="border-b-2 border-zinc-300 w-full mt-4 text-lg font-semibold text-gray-600">
          <NavLink to="/products" onClick={navHandler}>
            Diseños
          </NavLink>
        </li>
        <li className="border-b-2 border-zinc-300 w-full mt-4 text-lg font-semibold text-gray-600">
              <NavLink
                className="ml-2 p-2 lg:text-lg font-semibold"
                to="/games"
              >
              Juegos
              </NavLink>
            </li>
      
        <div className="flex flex-col items-center m-4 space-y-4">
          <div onClick={navHandler}>
            <NavCartButton />
          </div>
          {!isAuthenticated && (
            <NavLink
              onClick={navHandler}
              to="/login"
              className="border-primary border-4 text-primary font-bold px-9 py-2 ml-2 rounded-full shadow-lg"
            >
              Login
            </NavLink>
          )}
          {isAuthenticated && (
            <button
              onClick={logoutUser}
              className="border-primary border-4 text-primary font-bold px-9 py-2 ml-2 rounded-full shadow-lg"
            >
              Logout
            </button>
          )}
        </div>
      </ul>
    </div>
  );
};

export default MainNavigation;
