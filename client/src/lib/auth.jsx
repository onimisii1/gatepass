import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

// "Context" lets any component ask "who is logged in?" without passing
// the user down through every component by hand.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // On first load: if a token is saved, ask the API who it belongs to.
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setToken(null)) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  function login({ token, user }) {
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
