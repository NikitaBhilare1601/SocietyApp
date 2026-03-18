import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import "./index.css";
import "intro.js/introjs.css";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Societies from "./pages/Societies";
import Members from "./pages/Members";
import Wings from "./pages/Wings";
import ImportPage from "./pages/Import";
import Settings from "./pages/Settings";
import Logs from "./pages/Logs";
import Profile from "./pages/Profile";


import { ToastProvider } from "./components/ui/Toast";


export function App() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, []);

  const isAuthenticated = localStorage.getItem("user") !== null;

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/societies" element={isAuthenticated ? <Societies /> : <Navigate to="/" />} />
          <Route path="/wings" element={isAuthenticated ? <Wings /> : <Navigate to="/" />} />
          <Route path="/members" element={isAuthenticated ? <Members /> : <Navigate to="/" />} />
          <Route path="/import" element={isAuthenticated ? <ImportPage /> : <Navigate to="/" />} />
          <Route path="/logs" element={isAuthenticated ? <Logs /> : <Navigate to="/" />} />

          <Route path="/import" element={isAuthenticated ? <ImportPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
