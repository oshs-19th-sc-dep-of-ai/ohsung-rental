// src/App.jsx
import "./App.css";
import Router from "./shared/Router";
import axios from "axios";

import './styles/global.css';

axios.defaults.withCredentials = true;

function App() {
  return <Router />;
}

export default App;
