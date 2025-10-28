import "./content.css";
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const fullDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const toDate = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatFullDate = (value) => {
  const parsed = toDate(value);
  return parsed ? fullDateFormatter.format(parsed) : "-";
};

const derivePlannedReturnDate = (expected, rentalTime) => {
  const expectedDate = toDate(expected);
  if (expectedDate) {
    return expectedDate;
  }
  const rentalDate = toDate(rentalTime);
  if (!rentalDate) {
    return null;
  }
  const dueDate = new Date(rentalDate);
  dueDate.setDate(dueDate.getDate() + 2);
  return dueDate;
};

const formatCountdown = (targetDate) => {
  if (!targetDate) {
    return "정보 없음";
  }
  const now = new Date();
  let diff = targetDate.getTime() - now.getTime();
  if (diff > 0) {
    const dayMs = 1000 * 60 * 60 * 24;
    const hourMs = 1000 * 60 * 60;
    const minuteMs = 1000 * 60;

    const days = Math.floor(diff / dayMs);
    diff -= days * dayMs;
    const hours = Math.floor(diff / hourMs);
    diff -= hours * hourMs;
    const minutes = Math.floor(diff / minuteMs);

    if (days > 0) {
      return `${days}일 ${hours}시간 ${minutes}분 남음`;
    }
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    }
    return `${minutes}분 남음`;
  }
  if (Math.abs(diff) < 1000 * 60) {
    return "지금까지";
  }
  return "기한 초과";
};

const getStatusTone = (statusCode) => {
  if (statusCode === 0) {
    return "active";
  }
  if (statusCode === 1) {
    return "pending";
  }
  return "default";
};

const Content = ({ id, user }) => {
  const location = useLocation();
  const [rentals, setRentals] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [rentalsError, setRentalsError] = useState(null);

  const locationId = location.state?.id;
  const locationUpperId = location.state?.ID;

  useEffect(() => {
    if (locationId) {
      sessionStorage.setItem("ID", locationId);
    }
  }, [locationId]);

  useEffect(() => {
    if (id) {
      sessionStorage.setItem("ID", id);
    }
  }, [id]);

  const resolvedId = useMemo(
    () =>
      id ??
      locationUpperId ??
      locationId ??
      sessionStorage.getItem("ID"),
    [id, locationUpperId, locationId],
  );

  const isAdmin = user?.isAdmin || resolvedId === "caoshsadmin";
  const todayText = formatFullDate(new Date());
  const userName = user?.name || (isAdmin ? "관리자" : null);

  useEffect(() => {
    if (isAdmin || !resolvedId) {
      setRentals([]);
      setRentalsLoading(false);
      setRentalsError(null);
      return;
    }

    let active = true;
    setRentalsLoading(true);
    setRentalsError(null);

    axios
      .get("http://localhost:5000/profile", { withCredentials: true })
      .then((response) => {
        if (!active) {
          return;
        }
        const fetched = response.data?.rentals;
        setRentals(Array.isArray(fetched) ? fetched : []);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        console.error("대여 정보를 불러오는 중 오류 발생", error);
        setRentalsError("대여 정보를 불러오지 못했습니다.");
        setRentals([]);
      })
      .finally(() => {
        if (active) {
          setRentalsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin, resolvedId]);

  const activeRentals = useMemo(
    () => rentals.filter((item) => item.status_code !== 2),
    [rentals],
  );

  const completedRentals = useMemo(
    () => rentals.filter((item) => item.status_code === 2),
    [rentals],
  );

  const journeySteps = isAdmin
    ? [
        {
          title: "현황 파악",
          detail: "대여·반납 통계를 확인하고 주의가 필요한 건을 체크합니다.",
        },
        {
          title: "대응 및 조정",
          detail: "반납 지연이나 파손 등 이슈를 기록하고 필요한 안내를 진행합니다.",
        },
        {
          title: "커뮤니케이션",
          detail: "학생과 소통하며 원활한 대여 문화를 만들어 갑니다.",
        },
      ]
    : [
        {
          title: "대여 선택",
          detail: "원하는 물품을 고르고 주의사항을 확인한 뒤 대여합니다.",
        },
        {
          title: "책임 있게 사용",
          detail: "정해진 기간 동안 깨끗하게 사용하고 손상에 주의하세요.",
        },
        {
          title: "반납",
          detail: "반납 신청 후 안내에 따라 지정 장소에 물품을 반환하세요.",
        },
      ];



  const noteBody = isAdmin
    ? "학생들의 대여 문화를 지키는 핵심 관리자입니다. 대여 현황을 꼼꼼하게 살피고 문제가 생기면 즉시 대응해 주세요."
    : "대여일로부터 2일 이내 반납이 원칙입니다. 파손이나 분실이 발생하면 학생회를 통해 배상 절차가 진행될 수 있어요.";

  return (
    <div className="home-content">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1>
            {isAdmin
              ? "대여 관리 계정입니다"
              : "필요한 순간, 작은 도움을 건네는 곳"}
          </h1>
          <p>
            {isAdmin
              ? "대여와 반납 흐름을 한눈에 파악하세요."
              : "필요할때 있는 당신의 물품 대여 서비스."}
          </p>
          <div className="home-hero__meta">
            <div className="home-hero__meta-card">
              <span>오늘</span>
              <strong>{todayText}</strong>
            </div>
            {userName && (
              <div className="home-hero__meta-card">
                <span>이름</span>
                <strong>{userName}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {!isAdmin && (
        <section className="home-rentals">
          <div className="home-rentals__head">
            <h2>나의 대여 현황</h2>
            <p>현재 대여 중인 물품과 반납 일정을 확인하세요.</p>
          </div>
          {rentalsLoading ? (
            <div className="home-rentals__placeholder">대여 정보를 불러오는 중...</div>
          ) : rentalsError ? (
            <div className="home-rentals__placeholder" role="alert">
              {rentalsError}
            </div>
          ) : activeRentals.length === 0 ? (
            <div className="home-rentals__placeholder">
              현재 대여 중인 물품이 없어요.
            </div>
          ) : (
            <ul className="home-rentals__list">
              {activeRentals.map((item) => {
                const plannedReturn = derivePlannedReturnDate(
                  item.expected_return_time,
                  item.rental_time,
                );
                const dueText = plannedReturn
                  ? formatFullDate(plannedReturn)
                  : "반납 예정일 정보 없음";
                const countdown = plannedReturn
                  ? formatCountdown(plannedReturn)
                  : "정보 없음";
                const tone = getStatusTone(item.status_code);

                return (
                  <li key={item.rental_id} className="home-rentals__item">
                    <div className="home-rentals__item-head">
                      <h3>{item.product_name}</h3>
                      <span className={`home-rentals__status home-rentals__status--${tone}`}>
                        {item.status ?? "상태 정보 없음"}
                      </span>
                    </div>
                    <dl className="home-rentals__meta">
                      <div>
                        <dt>대여일</dt>
                        <dd>{formatFullDate(item.rental_time)}</dd>
                      </div>
                      <div>
                        <dt>남은 시간</dt>
                        <dd>{countdown}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}



      {!isAdmin && (
      <section className="home-timeline">
        <div className="home-timeline__head">
          <h2>이용 가이드</h2>
        </div>
        <ol className="home-timeline__list">
          {journeySteps.map((step) => (
            <li key={step.title} className="home-timeline__item">
              <div className="home-timeline__node" aria-hidden="true">
                <span>•</span>
                <div className="home-timeline__spark" />
              </div>
              <div className="home-timeline__content">
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      )}

      {!isAdmin && (
      <section className="home-note">
        <div className="home-note__card">
          <div className="home-note__halo" aria-hidden="true" />
          <h3>{isAdmin ? "관리자 체크 포인트" : "대여 시 꼭 기억하세요"}</h3>
          <p>{noteBody}</p>
          {!resolvedId && (
            <p className="home-note__warning">
              세션 정보를 찾을 수 없어요. 다시 로그인하면 기능을 이용할 수
              있습니다.
            </p>
          )}
        </div>
      </section>
      )}
    </div>
  );
};

export default Content;
