import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        {
          student_id: studentId,
          password,
        },
        { withCredentials: true },
      );

      alert(response.data.message);

      const { status, is_admin, admin_id, student_id } = response.data || {};
      const isSuccess =
        status === "success" || status === "admin" || is_admin === true;

      if (isSuccess) {
        if (admin_id) {
          sessionStorage.setItem("ADMIN_ID", admin_id);
        }
        if (student_id) {
          sessionStorage.setItem("ID", student_id);
        }

        navigate("/", {
          replace: true,
          ...(student_id ? { state: { id: student_id } } : {}),
        });
        return;
      }

      setError(response.data?.message ?? "로그인에 실패했습니다.");
    } catch (loginError) {
      setError(
        loginError.response?.data?.message ?? "로그인 중 서버 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page simple">
      <section className="login-card">
        <header className="login-card__head">
          <h1>로그인</h1>
          <p>학교 또는 관리자 계정으로 로그인하세요.</p>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="studentId">학교 ID</label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="예: 20725"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="계정 비밀번호를 입력하세요"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <footer className="login-card__foot">
          기본 비밀번호는 첫 로그인 후 반드시 변경해 주세요.
        </footer>
      </section>
    </div>
  );
}

export default Login;
