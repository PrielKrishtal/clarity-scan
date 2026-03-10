import { createContext, useState, useContext } from 'react';
import { login, register as registerApi } from '../api/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const initToken = localStorage.getItem('token');
    const initUserEmail = localStorage.getItem('userEmail');
    
    const [token, setToken] = useState(initToken);
    const [isAuthenticated, setIsAuthenticated] = useState(!!initToken);
    const [user, setUser] = useState(initUserEmail ? { email: initUserEmail } : null);

    const handleLogin = async (email, password) => {
        const result = await login(email, password);
        setToken(result.access_token);
        setIsAuthenticated(true);
        setUser({ email });
        localStorage.setItem('userEmail', email);
    };
    
    const register = async (email, password) => {
        return await registerApi(email, password, "New User");
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated, user, handleLogin, handleLogout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  return useContext(AuthContext);
};