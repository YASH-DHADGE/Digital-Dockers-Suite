import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to check if a JWT token is expired
    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true; // Treat invalid tokens as expired
        }
    };

    useEffect(() => {
        const checkLoggedIn = () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    if (isTokenExpired(token)) {
                        // Token is expired — clear everything
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        console.log('Cleared expired token from localStorage');
                    } else {
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            setUser(JSON.parse(storedUser));
                        }
                    }
                }
            } catch (error) {
                console.error('Auth check failed', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, ...userData } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData)); // Save user data
            setUser(userData);
            return userData;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/auth/register', userData);
            const { token, ...user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user)); // Save user data
            setUser(user);
            return user;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const setUserFromGoogle = useCallback((userData) => {
        setUser(userData);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, setUserFromGoogle }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
