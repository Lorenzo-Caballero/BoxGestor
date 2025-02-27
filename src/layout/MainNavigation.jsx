import React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux"
import { NavLink } from "react-router-dom";
import { XIcon } from "@heroicons/react/solid";
import { motion } from "framer-motion";
import HambergurMenu from "../assets/HambergurMenu.svg";
import { useAuth } from "../components/context/AuthContext";
import ImageUploadModal from "../components/products/ImageUploadModal";
const MainNavigation = () => {
  const [showNav, setShowNav] = useState(false);
  const { isAuthenticated, logout, user, isAdmin } = useAuth(); // Obtenemos los valores del contexto
  const [showDropdown, setShowDropdown] = useState(false); // Estado para controlar el dropdown
  const [showDesignDropdown, setShowDesignDropdown] = useState(false); // Estado para controlar el dropdown de "Diseño"
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Estado para controlar la apertura del modal de subida de imagen
  const totalItems = useSelector((state) => state.cart.totalQuantity);
  const [cartQuantity, setCartQuantity] = useState(0);

  // Leer y mapear los datos del carrito desde localStorage
  const calculateCartQuantity = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  useEffect(() => {
    // Actualiza la cantidad del carrito al cargar el componente
    setCartQuantity(calculateCartQuantity());

    // Escucha cambios en localStorage para mantener sincronizado el contador
    const handleStorageChange = () => {
      setCartQuantity(calculateCartQuantity());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
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
      <div className="flex justify-between items-center w-full h-full px-8 sm:mb-6">
        <div className="flex">
          <div className="flex items-center">
            <motion.div
              className="w-[50px] h-[50px]"
              drag
              dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
              dragElastic={0.7}
            >
              <NavLink to="/">
                <motion.img
                  src={""}
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
                  <span className="text-purple-300">Tattoo</span>
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

        {/* Sección del carrito y login */}
        <div className="hidden md:flex items-center">
          <NavLink to="/cart" className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-8 w-8 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13l-1.5-6M7 13h10m-6 6a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"
              />
            </svg>
            {cartQuantity > 0 && (
              <span className="absolute -top-1 -right-2 bg-secondary-100 text-white text-sm font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartQuantity}
              </span>
            )}
          </NavLink>

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
        </div>

        {/* Botón de menú hamburguesa para pantallas pequeñas */}
        <div className="md:hidden cursor-pointer" onClick={navHandler}>
          {!showNav ? (
            <img src={HambergurMenu} alt="Menu" />
          ) : (
            <XIcon className="w-5" />
          )}
        </div>
      </div>

      {/* Menú de navegación para pantallas pequeñas */}
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

        {/* Aquí el carrito y login en la versión móvil */}
        <div className="flex flex-col items-center ">
          <NavLink to="/cart" className="relative ml-1">  {/* Aquí agregué -ml-1 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-8 w-8 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13l-1.5-6M7 13h10m-6 6a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z"
              />
            </svg>
            {cartQuantity > 0 && (
              <span className="absolute -top-1 -right-2 bg-secondary-100 text-white text-sm font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartQuantity}
              </span>
            )}
          </NavLink>

          {!isAuthenticated && (
            <NavLink
              onClick={navHandler}
              to="/login"
              className="border-primary border-4 text-primary font-bold px-10 py-2 ml-8 rounded-full shadow-lg"
            >
              Login
            </NavLink>
          )}
        </div>


      </ul>
    </div>
  );
};

export default MainNavigation;
