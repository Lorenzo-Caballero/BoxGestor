import React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/solid";
import { motion } from "framer-motion";
import conejita from '../assets/coneji-removebg-preview.png';
import HambergurMenu from "../assets/HambergurMenu.svg";
import NavCartButton from "../components/cart/NavCartButton";
import { useAuth } from "../components/context/AuthContext";
import ImageUploadModal from "../components/products/ImageUploadModal";
const MainNavigation = () => {
  const [showNav, setShowNav] = useState(false);
  const { isAuthenticated, logout, user, isAdmin } = useAuth(); // Obtenemos los valores del contexto
  const [showDropdown, setShowDropdown] = useState(false); // Estado para controlar el dropdown
  const [showDesignDropdown, setShowDesignDropdown] = useState(false); // Estado para controlar el dropdown de "Diseño"
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Estado para controlar la apertura del modal de subida de imagen

  const openImageModal = () => {
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  const toggleDesignDropdown = () => {
    setShowDesignDropdown(!showDesignDropdown);
  };
  const navHandler = () => {
    setShowNav(!showNav);
  };

  const logoutUser = async () => {
    logout();
    localStorage.removeItem('admin'); // Elimina el estado de administrador al cerrar sesión
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
                  src={conejita}
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
                  <span className="text-primary">Lennita</span>
                  <span className="text-purple-300">BB</span>
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

          </ul>
        </div>
        <div className="hidden md:flex">
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

          {isAuthenticated && isAdmin && (
            <div className="relative">
              <button
                className="rounded-full w-10 h-10 bg-gray-200 flex items-center justify-center ml-2"
                onClick={toggleDesignDropdown}
              >
                Crear +
              </button>
              {showDesignDropdown && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg mt-2">
                  <button
                    className="p-2 w-full text-left hover:bg-gray-200"
                    onClick={openImageModal}
                  >
                    Diseño
                  </button>
                </div>
              )}
            </div>
          )}


          <ImageUploadModal
            isOpen={isImageModalOpen}
            onClose={closeImageModal}
          />
          {isAuthenticated && ( // Mostrar el botón de usuario redondo solo si está autenticado
            <div className="relative">
              <button
                className="rounded-full w-10 h-10 bg-gray-200 flex items-center justify-center ml-2"
                onClick={toggleDropdown}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg mt-2">
                  <p className="p-2">{user}</p>
                  <button
                    onClick={logoutUser}
                    className="p-2 w-full text-left hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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


        <div className="flex flex-col items-center m-4 space-y-4">

          {!isAuthenticated && (
            <NavLink
              onClick={navHandler}
              to="/login"
              className="border-primary border-4 text-primary font-bold px-9 py-2 ml-2 rounded-full shadow-lg"
            >
              Login
            </NavLink>
          )}
          <div className="flex items-center md:hidden">
            {isAuthenticated && isAdmin && (
              <div className="relative">
                <button
                  className="rounded-full w-10 h-10 bg-gray-200 flex items-center justify-center ml-2"
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    openImageModal();
                  }}
                >
                  Crear +
                </button>

                {showDesignDropdown && (
                  <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg mt-2">
                    <button
                      className="p-2 w-full text-left hover:bg-gray-200"
                      onTouchEnd={openImageModal}
                    >
                      Diseño
                    </button>
                  </div>
                )}
              
              </div>
              
            )}
              <ImageUploadModal
            isOpen={isImageModalOpen}
            onClose={closeImageModal}
          />
            {isAuthenticated && (
              <div className="relative">
                <button
                  className="rounded-full w-10 h-10 bg-gray-200 flex items-center justify-center ml-2"
                  onClick={toggleDropdown}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg mt-2">
                    <p className="p-2">{user}</p>
                    <button
                      onClick={logoutUser}
                      className="p-2 w-full text-left hover:bg-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>



        </div>
      </ul>
    </div>
  );
};

export default MainNavigation;
