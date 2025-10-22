// src/routes/AdminRoute.jsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/check_session");
        const { is_admin, admin_id } = res.data || {};
        if (!alive) return;
        setAllowed(Boolean(is_admin && admin_id));
      } catch {
        if (!alive) return;
        setAllowed(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div>세션 확인 중...</div>;
  if (!allowed) return <Navigate to="/Login" replace />;

  return children;
}
