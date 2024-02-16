import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Nuevo estado para verificar si el usuario es administrador

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedIsAuthenticated = localStorage.getItem('isAuthenticated');
    const storedAdmin = localStorage.getItem('admin');

    if (storedUser && storedIsAuthenticated) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(JSON.parse(storedIsAuthenticated));
      setIsAdmin(parsedUser && storedAdmin === 'admin'); // Verificar si el usuario es administrador
    }
  }, []);

  const login = (userData,userRole) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(userData && userRole === 'admin'); // Verificar si el usuario es administrador al iniciar sesión
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false); // Cuando el usuario cierra sesión, no es administrador
  };

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', JSON.stringify(true));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      setIsAdmin(false); // Si no está autenticado, no es administrador
    }
  }, [isAuthenticated, user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
