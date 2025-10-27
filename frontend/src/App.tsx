import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./Home";
import NavBar from './components/NavBar/NavBar';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import About from './pages/About/About';

function App() {
  return (
    <Router>
      <NavBar/>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route  path="/about" element={<About/>}/>
      </Routes>
      
    </Router>
  );
}

export default App;