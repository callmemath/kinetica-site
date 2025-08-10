import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { apiService, type RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<{ requiresVerification: boolean }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  updateUser: (userData: User) => void;
  logout: (navigate?: () => void) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiService.setToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔑 useAuth.login called with:', { email, password });
    setIsLoading(true);
    
    try {
      console.log('📞 Calling apiService.login...');
      const response = await apiService.login({ email, password });
      console.log('📬 useAuth received response:', response);
      
      if (response.success && response.data?.requiresOtp) {
        console.log('✅ Login successful, OTP required');
        return { requiresOtp: true };
      } else {
        console.log('❌ Login failed, throwing error');
        // Handle error response from backend
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.log('💥 useAuth.login caught error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      console.log('🏁 useAuth.login finally block');
      setIsLoading(false);
    }
  };

  const verifyLoginOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.verifyOtp({
        email,
        otp,
        type: 'LOGIN'
      });
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        setUser(user);
        setToken(token);
        apiService.setToken(token);
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        return { requiresVerification: true };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.verifyOtp({
        email,
        otp,
        type: 'REGISTRATION'
      });
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        setUser(user);
        setToken(token);
        apiService.setToken(token);
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        throw new Error(response.message || 'Registration verification failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = async (navigate?: () => void) => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      apiService.setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Se è fornita una funzione di navigazione, la esegue
      if (navigate) {
        navigate();
      }
    }
  };

  const value = {
    user,
    token,
    login,
    verifyLoginOtp,
    register,
    verifyRegistrationOtp,
    updateUser,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
