import { createContext, useState, useContext } from 'react';
import { login, register as registerApi } from '../api/auth';


export const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
    const initToken = localStorage.getItem('token');
    const [token, setToken] = useState(initToken);
    const [isAuthenticated, setIsAuthenticated] = useState(!!initToken);

    const handleLogin = async (email, password) => {
    const result = await login(email, password);
    setToken(result.access_token);
    setIsAuthenticated(true);
    };
    
    const register = async (email, password) => {
        return await registerApi(email, password, "New User");
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
    };


    return (
        <AuthContext.Provider value={{ token, isAuthenticated, handleLogin, handleLogout, register }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  return useContext(AuthContext);
};