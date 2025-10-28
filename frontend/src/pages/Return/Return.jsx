import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import Header from "../../components/header";
import "./Return.css";

const STATUS_LABELS = {
  0: "대여 중",
  1: "반납 신청",
  2: "반납 완료",
};

const STATUS_TEXT_TO_CODE = {
  "대여 중": 0,
  "반납 신청": 1,
  "반납 완료": 2,
};

const normalizeRentals = (items) =>
  (items ?? []).map((item) => {
    const code =
      typeof item.status_code === "number"
        ? item.status_code
        : STATUS_TEXT_TO_CODE[item.status] ?? 0;
    const label = item.status ?? STATUS_LABELS[code] ?? "알 수 없음";
    return { ...item, status_code: code, status: label };
  });

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
};

function Return() {
  const location = useLocation();
  const ID = location.state?.ID || sessionStorage.getItem("ID");

  const [student, setStudent] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/profile", {
          withCredentials: true,
        });
        if (!alive) {
          return;
        }
        setStudent(res.data?.student ?? null);
        setRentals(normalizeRentals(res.data?.rentals));
        setError("");
      } catch (err) {
        if (!alive) {
          return;
        }
        const message =
          err?.response?.data?.message ||
          `대여 현황을 불러오지 못했습니다. (code: ${err?.response?.status ?? "unknown"})`;
        setError(message);
        setStudent(null);
        setRentals([]);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const activeRentals = useMemo(
    () => rentals.filter((item) => item.status_code === 0),
    [rentals],
  );

  const pendingRentals = useMemo(
    () => rentals.filter((item) => item.status_code === 1),
    [rentals],
  );

  const inProgressRentals = useMemo(
    () => rentals.filter((item) => item.status_code !== 2),
    [rentals],
  );

  const completedRentals = useMemo(
    () => rentals.filter((item) => item.status_code === 2),
    [rentals],
  );

  // Header determines role via check_session. Avoid passing partial user
  // data that could misclassify admins as students.

  const heroStats = useMemo(
    () => [
      {
        label: "대여 중",
        value: loading ? "—" : activeRentals.length,
        tone: "emerald",
      },
      {
        label: "반납 신청",
        value: loading ? "—" : pendingRentals.length,
        tone: "amber",
      },
      {
        label: "반납 완료",
        value: loading ? "—" : completedRentals.length,
        tone: "violet",
      },
    ],
    [activeRentals.length, pendingRentals.length, completedRentals.length, loading],
  );

  const handleReturn = async (rental) => {
    if (!rental || rental.status_code !== 0 || processingId) {
      return;
    }

    setProcessingId(rental.rental_id);
    try {
      const res = await axios.post(
        `http://localhost:5000/rental_request_return/${rental.rental_id}`,
        {},
        { withCredentials: true },
      );
      alert(res.data?.message || "반납 신청이 접수되었습니다.");

      setRentals((prev) =>
        normalizeRentals(
          prev.map((item) =>
            item.rental_id === rental.rental_id
              ? { ...item, status_code: 1, status: STATUS_LABELS[1] }
              : item,
          ),
        ),
      );
    } catch (err) {
      alert(err?.response?.data?.message || "반납 신청을 처리하지 못했어요.");
    } finally {
      setProcessingId(null);
    }
  };

  const renderRentalCard = (item, isActiveSection = true) => {
    const isPending = item.status_code === 1;
    const isRented = item.status_code === 0;
    const isCompleted = item.status_code === 2;
    const disableAction =
      !isActiveSection || !isRented || processingId === item.rental_id;
    const buttonText = isPending
      ? "승인 대기중"
      : isRented
      ? "반납 신청"
      : "완료";
    const statusTone = isCompleted ? "completed" : isPending ? "pending" : "active";

    const displayNo = item.display_no ?? item.product_id;

    return (
      <article
        key={item.rental_id}
        className={`rental-card${isCompleted ? " rental-card--completed" : ""}`}
      >
        <div className="rental-card__header">
          <div>
            <h4 className="rental-card__title">{item.product_name}</h4>
            <p className="rental-card__subtitle">물품 ID · {displayNo}</p>
          </div>
          <span className={`status-badge status-badge--${statusTone}`}>
            {item.status}
          </span>
        </div>

        <dl className="rental-card__meta">
          <div className="rental-card__meta-item">
            <dt>대여일</dt>
            <dd>{formatDateTime(item.rental_time)}</dd>
          </div>
          {item.expected_return_time && (
            <div className="rental-card__meta-item">
              <dt>반납 예정</dt>
              <dd>{formatDateTime(item.expected_return_time)}</dd>
            </div>
          )}
        </dl>

        {isActiveSection && (
          <button
            type="button"
            onClick={() => handleReturn(item)}
            disabled={disableAction}
            className="return-card__action"
          >
            {processingId === item.rental_id ? "처리 중..." : buttonText}
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="return-page">
      {/* Let Header resolve role via /check_session to avoid misclassification */}
      <Header />
      <main className="return-main">
        <section className="return-hero">
          <div className="return-hero__copy">
            <span className="return-hero__eyebrow">반납하기</span>
            <h1>대여 현황과 반납 진행 상태</h1>
            <p>
              대여 중인 물품과 반납 신청 현황을 확인하세요.
            </p>
          </div>

          <div className="return-hero__meta">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className={`return-hero__meta-card return-hero__meta-card--${stat.tone}`}
              >
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
            <div className="return-hero__meta-card return-hero__meta-card--identity">
              <span>이름</span>
              <strong>
                {student
                  ? `${student.student_name}`
                  : "로그인 정보 없음"}
              </strong>

            </div>
          </div>
        </section>

        {error && <div className="return-alert return-alert--error">{error}</div>}

        {loading ? (
          <div className="return-loading">
            <span className="return-spinner" aria-hidden="true" />
            대여 정보를 불러오는 중입니다...
          </div>
        ) : (
          <section className="return-panels">
            <div className="return-panel">
              <div className="return-panel__head">
                <h2>대여 중 · 반납 진행 중</h2>
                <span className="return-chip">{inProgressRentals.length}건</span>
              </div>
              {inProgressRentals.length === 0 ? (
                <p className="return-empty">현재 대여 중인 물품이 없습니다.</p>
              ) : (
                <div className="return-grid">
                  {inProgressRentals.map((item) => renderRentalCard(item, true))}
                </div>
              )}
              {pendingRentals.length > 0 && (
                <p className="return-hint">
                  반납 신청된 물품은 학생회가 순차적으로 확인합니다.
                </p>
              )}
            </div>

            <div className="return-panel return-panel--guide">
              <h3>주의사항</h3>
              <ul className="return-guide__list">
                <li>
                  대여일로부터 <strong>2일 이내</strong>에 반납을 완료해 주세요.
                </li>
                <li>
                  파손 또는 분실 시 <strong>학생회</strong>와 협의하여 배상이 필요할
                  수 있습니다.
                </li>
                <li>
                  반납에 대한 문의가 있으면 <strong>학생회</strong>로 연락해 주세요.
                </li>
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Return;
