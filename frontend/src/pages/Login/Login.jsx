// src/pages/Login/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          student_id: studentId,
          password: password,
        },
        { withCredentials: true }
      );

      alert(response.data.message);

      // 로그인
      const { status, is_admin, admin_id, student_id } = response.data || {};
      const isSuccess = status === "success" || status === "admin" || is_admin === true;

      if (isSuccess) {
        if (admin_id)   sessionStorage.setItem("ADMIN_ID", admin_id);
        if (student_id) sessionStorage.setItem("ID", student_id);

        navigate("/", {
          replace: true,
          ...(student_id ? { state: { id: student_id } } : {}),
        });
        return;
      }

      // 실패 케이스는 서버가 내려준 message로 alert 이미 출력됨
    } catch (error) {
      alert("로그인 실패: " + (error.response?.data?.message || "서버 오류"));
    }
  };

  return (
    <div className="Login">
      <div className="container">
        <h1>로그인</h1>
        <form onSubmit={handleLogin}>
          <label htmlFor="studentId">학교ID:</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            placeholder="7자리 숫자"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />

          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="비밀번호를 입력해 주세요"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">로그인</button>
        </form>

        <p className="info-text">
          기본 비밀번호는 마이페이지에서 변경할 수 있어요!
        </p>
      </div>
    </div>
  );
}

export default Login;
