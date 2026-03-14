import { createContext, useState, useContext, useEffect } from 'react';
import { login, register as registerApi } from '../api/auth';
import { getMe } from '../api/users';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const initToken = localStorage.getItem('token');
    const initUserEmail = localStorage.getItem('userEmail');
    
    const [token, setToken] = useState(initToken);
    const [isAuthenticated, setIsAuthenticated] = useState(!!initToken);
    const [user, setUser] = useState(initUserEmail ? { email: initUserEmail } : null);

    // On app load — if token exists, fetch full user from DB (covers page refresh)
    useEffect(() => {
        if (initToken) {
            getMe()
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userEmail');
                    setIsAuthenticated(false);
                });
        }
    }, []);

    const handleLogin = async (email, password) => {
        const result = await login(email, password);
        localStorage.setItem('token', result.access_token);
        localStorage.setItem('userEmail', email);
        setToken(result.access_token);
        setIsAuthenticated(true);
        const meResponse = await getMe(); // fetch full user including monthly_budget
        setUser(meResponse.data);
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