import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./Home";
import NavBar from './components/NavBar/NavBar';

function App() {
  return (
    <Router>
      <NavBar/>
      <Routes>
        <Route path="/home" element={<Home />} />
      </Routes>
      
    </Router>
  );
}

export default App;