import "./UserManage.css";
import React, { useEffect, useState } from "react";
import Header from "../../components/header";
import Content from "../../components/UM_content";
import axios from "axios";

axios.defaults.withCredentials = true;  // 모든 요청에 credentials 포함

function UserManage() {
  const [adminID, setAdminID] = useState(null);

  useEffect(() => {
    // 세션 확인 API 호출
    axios
      .get("http://localhost:5000/check_session")
      .then((res) => {
        console.log("현재 세션 정보:", res.data); // 디버깅용
        const { admin_id, is_admin } = res.data;
        // 관리자 세션인지 명확하게 확인하여 카드 렌더 결정
        if (is_admin && admin_id) setAdminID(admin_id);
        else setAdminID(null);
      })
      .catch((err) => {
        console.error("세션 확인 실패:", err);
        setAdminID(null);
      });
  }, []);

  const headerUser = adminID ? { id: adminID, name: "관리자", isAdmin: true } : null;

  return (
    <div className="UserManage">
      <Header user={headerUser} />
      <main className="UserManage__content">
        {adminID ? (
          <Content ID={adminID} />
        ) : (
          <p className="UserManage__status">세션 확인 중...</p>
        )}
      </main>
    </div>
  );
}

export default UserManage;
