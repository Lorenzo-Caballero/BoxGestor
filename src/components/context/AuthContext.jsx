import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
    const storedAdmin = localStorage.getItem('admin');

    if (storedUser && storedIsAuthenticated) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(JSON.parse(storedIsAuthenticated));
      if (storedAdmin === 'true') { // Almacenar un valor booleano en lugar de una cadena
        setIsAdmin(true);
      }
    }
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setIsAuthenticated(true);
    if (userRole === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('admin', true); // Almacenar un valor booleano en localStorage
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('admin'); // Eliminar el estado de isAdmin al cerrar sesión
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', JSON.stringify(true));
      localStorage.setItem('admin', JSON.stringify(isAdmin)); // Almacenar el estado de isAdmin
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('admin');
    }
  }, [isAuthenticated, user, isAdmin]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);
