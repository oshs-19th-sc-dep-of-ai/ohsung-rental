import "./content.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const Content = ({ id, user }) => {
  const location = useLocation();

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
  const todayText = dateFormatter.format(new Date());

  const actions = isAdmin
    ? [
        {
          title: "대여 현황 관리",
          description:
            "실시간 대여 로그를 확인하고 필요 시 대여 상태를 조정하세요.",
          to: "/Borrow",
          accent: "emerald",
        },
        {
          title: "반납 상황 모니터링",
          description:
            "반납 신청 현황을 한눈에 보고 지연 건을 빠르게 처리합니다.",
          to: "/Return",
          accent: "sky",
        },
        {
          title: "사용자 관리 콘솔",
          description: "학생 계정을 검토하고 필요한 조치를 즉시 수행하세요.",
          to: "/UserManage",
          accent: "violet",
        },
      ]
    : [
        {
          title: "양심 물품 대여하기",
          description:
            "필요한 물품을 선택하고 대여 규칙을 확인한 뒤 바로 대여하세요.",
          to: "/Borrow",
          accent: "emerald",
        },
        {
          title: "반납 신청하기",
          description:
            "대여 후 2일 이내에 반납 신청을 하고 반납하세요.",
          to: "/Return",
          accent: "sky",
        },
        {
          title: "내 이용 기록 보기",
          description:
            "대여 및 반납 이력을 확인하세요.",
          to: "/MyPage",
          accent: "violet",
        },
      ];

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
    : "대여일로부터 2일 이내 반납이 원칙입니다. 파손이나 분실이 발생하면 학생부를 통해 배상 절차가 진행될 수 있어요.";

  return (
    <div className="home-content">
      <section className="home-hero">
        <div className="home-hero__copy">
          <h1>
            {isAdmin
              ? "스마트한 대여 관리, 더 신뢰받는 학생 문화"
              : "필요한 순간에, 빌리러 오성"}
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
            {resolvedId && (
              <div className="home-hero__meta-card">
                <span>사용자 ID</span>
                <strong>{resolvedId}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="home-actions">
        <div className="home-actions__head">
          <h2>{isAdmin ? "관리 바로가기" : "바로가기"}</h2>
        </div>
        <div className="home-actions__grid">
          {actions.map((action, idx) => (
            <Link
              key={action.to}
              to={action.to}
              state={resolvedId ? { ID: resolvedId } : undefined}
              className={`home-action-card home-action-card--${action.accent}`}
            >
              <div className="home-action-card__index" aria-hidden="true">
                {idx + 1}
              </div>
              <div className="home-action-card__body">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
              <span className="home-action-card__cta">
                바로가기
                <svg
                  aria-hidden="true"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M2 6h6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="m5.5 3 3 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-timeline">
        <div className="home-timeline__head">
          <h2>이용 가이드</h2>
        </div>
        <ol className="home-timeline__list">
          {journeySteps.map((step, index) => (
            <li key={step.title} className="home-timeline__item">
              <div className="home-timeline__node" aria-hidden="true">
                <span>{index + 1}</span>
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
    </div>
  );
};

export default Content;
