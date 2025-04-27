import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  telegramId: string;
  did: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (telegramId: string, did: string) => void;
  logout: () => void;
}

const defaultContext: AuthContextType = {
  user: null,
  login: () => {},
  logout: () => {}
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check if there's stored user data in localStorage
    const storedUser = localStorage.getItem('auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (telegramId: string, did: string) => {
    const userData = {
      telegramId,
      did,
      isAuthenticated: true
    };
    
    // Save to localStorage
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 