import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialAuth(): { isAuthenticated: boolean; user: { email: string } | null } {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null };
  }
  const stored = localStorage.getItem('freelunch_auth');
  if (stored) {
    const parsed = JSON.parse(stored);
    return { isAuthenticated: true, user: parsed };
  }
  return { isAuthenticated: false, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState(getInitialAuth);

  const login = (email: string) => {
    const userData = { email };
    localStorage.setItem('freelunch_auth', JSON.stringify(userData));
    setAuthState({ isAuthenticated: true, user: userData });
  };

  const logout = () => {
    localStorage.removeItem('freelunch_auth');
    setAuthState({ isAuthenticated: false, user: null });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: authState.isAuthenticated, user: authState.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Generate a random math challenge
export function generateMathChallenge(): { question: string; answer: number } {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let a: number, b: number, answer: number;

  switch (operation) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a - b;
      break;
    case '*':
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      break;
    default:
      a = 1;
      b = 1;
      answer = 2;
  }

  return {
    question: `${a} ${operation} ${b}`,
    answer,
  };
}
