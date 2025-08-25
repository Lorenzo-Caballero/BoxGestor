import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AperturaDeCaja from "./pages/AperturaDeCaja";
import CierreDeCaja from "./pages/CierreDeCaja";
import Balance from "./pages/Balance";
import Billeteras from "./pages/Billeteras";

const AppGames = () => {
  const location = useLocation();

  return (
    <AnimatePresence exitBeforeEnter>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AperturaDeCaja />} />
        <Route path="/cerrar-caja" element={<CierreDeCaja />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/billeteras" element={<Billeteras />} />
 
      </Routes>
    </AnimatePresence>
  );
};

export default AppGames;
