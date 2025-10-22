// src/shared/Router.jsx
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/Home/Home";
import Borrow from "../pages/Borrow/Borrow";
import MyPage from "../pages/MyPage/MyPage";
import Info from "../pages/MyPage/ChangeInfo";
import UserManage from "../pages/UserManage/UserManage";
import Login from "../pages/Login/Login";
import Return from "../pages/Return/Return";
import AdminRoute from "../routes/AdminRoute";   // ✅ 추가

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Borrow" element={<Borrow />} />
        <Route path="/MyPage" element={<MyPage />} />
        <Route path="/Info" element={<Info />} />
        <Route path="/UserManage" element={<UserManage />} />
        {/* ✅ /admin 보호: 관리자만 접근 가능 */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <UserManage />
            </AdminRoute>
          }
        />
        <Route path="/Login" element={<Login />} />
        <Route path="/Return" element={<Return />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
