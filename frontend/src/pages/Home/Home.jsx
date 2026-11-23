import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/header";
import Content from "../../components/content";
import Footer from "../../components/footer";
import "./Home.css";

axios.defaults.withCredentials = true;

function Home() {
  const [isLogined, setIsLogined] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const res = await axios.get("http://localhost:5000/check_session", {
          withCredentials: true,
        });
        if (!active) {
          return;
        }
        if (res.data.status === "success") {
          const sid = res.data.student_id || res.data.admin_id;
          const nm =
            res.data.student_name || (res.data.admin_id ? "관리자" : null);
          setUser(
            sid ? { id: sid, name: nm, isAdmin: !!res.data.admin_id } : null,
          );
          setIsLogined(true);
        } else {
          setIsLogined(false);
        }
      } catch {
        if (active) {
          setIsLogined(false);
        }
      }
    };
    checkSession();
    return () => {
      active = false;
    };
  }, []);

  if (isLogined === null) {
    return (
      <div className="home-loading">
        <div className="home-loading__orbit" aria-hidden="true" />
        <p>세션을 확인하고 있어요...</p>
      </div>
    );
  }

  if (!isLogined) {
    return <Navigate to="/Login" />;
  }

  return (
    <div className="home-page">
      <Header user={user} />
      <main className="home-main">
        <Content id={user?.id} user={user} />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
