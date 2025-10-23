import "./Borrow.css";
import React from "react";
import Header from "../../components/B_header";
import Content from "../../components/B_content";
import { useLocation } from "react-router-dom";
import axios from "axios";
axios.defaults.withCredentials = true;

function Borrow() {
  const location = useLocation();
  const id = location.state?.ID || sessionStorage.getItem("ID") || "UNKNOWN";

  return (
    <div className="borrow-page">
      <Header />
      <main className="borrow-main">
        <Content ID={id} />
      </main>
    </div>
  );
}

export default Borrow;

