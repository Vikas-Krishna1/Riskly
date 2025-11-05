import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import NavBar from "./components/NavBar/NavBar";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import About from "./pages/About/About";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProtectedRoute from "./components/protectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />

        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />

          {/* ✅ Protected Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
