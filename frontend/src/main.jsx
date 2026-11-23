import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import axios from "axios";
import Return from "./pages/Return/Return";

axios.defaults.withCredentials = true;  

axios.defaults.baseURL = "http://localhost:5000"
const root = createRoot(document.getElementById("root"));

root.render(
  <App />
);
