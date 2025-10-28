import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Header from "../../components/M_header";
import "./MyPage.css";
import { useNavigate } from "react-router-dom";

function MyPage() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/profile", { withCredentials: true })
      .then((response) => {
        setStudentInfo(response.data.student);
        setRentals(response.data.rentals || []);
      })
      .catch((error) => {
        console.error("프로필 정보를 불러오지 못했습니다.", error);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/check_session", { withCredentials: true })
      .then((res) => {
        const { admin_id, is_admin } = res.data || {};
        setIsAdmin(Boolean(admin_id || is_admin));
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/logout",
        {},
        { withCredentials: true },
      );
      sessionStorage.removeItem("ID");
      sessionStorage.removeItem("ADMIN_ID");
      navigate("/", { replace: true });
    } catch (error) {
      alert(`로그아웃 실패: ${error?.response?.data?.message ?? "서버 오류"}`);
    }
  };

  const summary = useMemo(() => {
    return rentals.reduce(
      (acc, curr) => {
        if (curr.status_code === 0) {
          acc.active += 1;
        } else if (curr.status_code === 1) {
          acc.pending += 1;
        } else if (curr.status_code === 2) {
          acc.completed += 1;
        }
        return acc;
      },
      { active: 0, pending: 0, completed: 0 },
    );
  }, [rentals]);

  const latestRental = useMemo(() => rentals[0] ?? null, [rentals]);

  const heroStats = useMemo(
    () => [
      { label: "대여 중", value: summary.active, tone: "emerald" },
      { label: "반납 신청", value: summary.pending, tone: "amber" },
      { label: "반납 완료", value: summary.completed, tone: "violet" },
    ],
    [summary],
  );

  const renderDeadline = (expected) => {
    if (!expected) {
      return "반납 완료";
    }
    const now = new Date();
    const target = new Date(expected);
    let diff = target - now;
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const minutes = Math.floor(diff / (1000 * 60));
      return `${days}일 ${hours}시간 ${minutes}분 남음`;
    }
    if (Math.abs(diff) < 1000 * 60) {
      return "지금까지";
    }
    return "기한 초과";
  };

  const renderStatusBadge = (status, statusCode) => {
    let badgeClass = "mypage-badge";
    if (statusCode === 0) {
      badgeClass += " mypage-badge--active";
    } else if (statusCode === 1) {
      badgeClass += " mypage-badge--pending";
    } else if (statusCode === 2) {
      badgeClass += " mypage-badge--completed";
    }
    return <span className={badgeClass}>{status}</span>;
  };

  const renderReturnInfo = (rentalTime, returnTime) => {
    if (returnTime) {
      return returnTime;
    }
    if (!rentalTime) {
      return "반납기일 정보 없음";
    }
    const dueDate = new Date(rentalTime);
    if (Number.isNaN(dueDate.getTime())) {
      return "반납기일 정보 없음";
    }
    dueDate.setDate(dueDate.getDate() + 2);
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, "0");
    const day = String(dueDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="mypage-page">
      <Header />
      <main className="mypage-main">
        <section className="mypage-hero">
          <div className="mypage-hero__copy">
            <span className="mypage-hero__eyebrow">내 페이지</span>
            <h1>내 페이지</h1>
            <p>
              대여 현황과 계정 관리를 한눈에 확인하고 필요한 작업을 바로 진행해
              보세요.
            </p>
          </div>
          <div className="mypage-hero__meta">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className={`mypage-hero__meta-card mypage-hero__meta-card--${stat.tone}`}
              >
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
            <div className="mypage-hero__meta-card mypage-hero__meta-card--identity">
              <span>회원 정보</span>
              <strong>{studentInfo?.student_name ?? "-"}</strong>
              <p>ID · {studentInfo?.student_id ?? "-"}</p>
              <p>
                최근 대여 ·{" "}
                {latestRental?.rental_time ? latestRental.rental_time : "기록 없음"}
              </p>
            </div>
          </div>
        </section>

        <section className="mypage-panels">
          <div className="mypage-panel">
            <div className="mypage-panel__head">
              <h2>계정 관리</h2>
              <p>계정과 관련된 작업을 여기에서 빠르게 처리할 수 있어요.</p>
            </div>
            <div className="mypage-actions__buttons">
              <button
                type="button"
                className="mypage-button"
                onClick={() => navigate("/info")}
              >
                비밀번호 변경
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="mypage-button mypage-button--alt"
                  onClick={() => navigate("/admin")}
                >
                  관리자 콘솔
                </button>
              )}
              <button
                type="button"
                className="mypage-button mypage-button--ghost"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          </div>

          <div className="mypage-panel mypage-panel--secondary">
            <div className="mypage-panel__head">
              <h2>대여·반납 기록</h2>
            </div>

            {rentals.length === 0 ? (
              <div className="mypage-empty">
                아직 대여한 물품이 없어요. 홈에서 마음에 드는 기자재를 찾아
                대여해 보세요.
              </div>
            ) : (
              <div className="mypage-history__table">
                <table>
                  <thead>
                    <tr>
                      <th>물품명</th>
                      <th>대여일</th>
                      <th>반납일</th>
                      <th>상태</th>
                      <th>반납 예정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((item) => (
                      <tr key={item.rental_id}>
                        <td data-label="물품명">{item.product_name}</td>
                        <td data-label="대여일">{item.rental_time ?? "-"}</td>
                        <td data-label="반납일">
                          {renderReturnInfo(item.rental_time, item.return_time)}
                        </td>
                        <td data-label="상태">
                          {renderStatusBadge(item.status, item.status_code)}
                        </td>
                        <td data-label="반납 예정">
                          {renderDeadline(item.expected_return_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default MyPage;
