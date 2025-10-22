import "./Borrow.css";
import React, { useState } from "react";
import Header from "../../components/B_header";
import Content from "../../components/B_content";
import { useLocation } from "react-router-dom";
import axios from "axios";
axios.defaults.withCredentials = true;

function Borrow() {
  const location = useLocation();
  const id = location.state?.ID || sessionStorage.getItem("ID") || "UNKNOWN";
  console.log("📢 Borrow.jsx - ID:", id); 

  return (
    <>
      <div className="Borrow">
        <Header />
        <Content ID={id} />  
      </div>
    </>
  );
}

export default Borrow;
