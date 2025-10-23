import "./header.css";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const Header = ({ user }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState(
    user?.isAdmin ? "admin" : user ? "student" : null,
  );
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [resolvedId, setResolvedId] = useState(user?.id ?? null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.isAdmin ? "admin" : "student");
      setDisplayName(user.name ?? "");
      setResolvedId(user.id ?? null);
      return;
    }

    let active = true;
    axios
      .get("http://localhost:5000/check_session", { withCredentials: true })
      .then((response) => {
        if (!active) {
          return;
        }
        if (response?.data?.status === "success") {
          const sid = response.data.student_id || response.data.admin_id;
          const nm =
            response.data.student_name ||
            (response.data.admin_id ? "관리자" : "");
          setRole(response.data.admin_id ? "admin" : "student");
          setDisplayName(nm ?? "");
          setResolvedId(sid ?? null);
        } else {
          setRole(null);
          setDisplayName("");
          setResolvedId(null);
        }
      })
      .catch(() => {
        if (active) {
          setRole(null);
          setDisplayName("");
          setResolvedId(null);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("home-panel-open", panelOpen);
    return () => {
      document.body.classList.remove("home-panel-open");
    };
  }, [panelOpen]);

  const linkState = useMemo(
    () => (resolvedId ? { ID: resolvedId } : undefined),
    [resolvedId],
  );

  const navLinks = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "대여 관리", to: "/Borrow" },
        { label: "반납 현황", to: "/Return" },
        { label: "사용자 관리", to: "/UserManage" },
      ];
    }
    return [
      { label: "대여하기", to: "/Borrow" },
      { label: "반납하기", to: "/Return" },
      { label: "내 기록", to: "/MyPage" },
    ];
  }, [role]);

  const identityTarget = role === "admin" ? "/UserManage" : "/MyPage";
  const identityLabel = role === "admin" ? "관리 콘솔" : "내 페이지";

  const handleLogoClick = () => {
    navigate("/");
    setPanelOpen(false);
  };

  const togglePanel = () => {
    setPanelOpen((prev) => !prev);
  };

  const closePanel = () => setPanelOpen(false);

  const roleClass = role ?? "guest";
  const roleText =
    role === "admin" ? "관리자" : role === "student" ? "학생" : "게스트";

  return (
    <>
      <header className="home-header">
        <div className="home-header__inner">
          <button
            type="button"
            className="home-header__brand"
            onClick={handleLogoClick}
          >
            <img
              className="home-header__logo"
              src="schooljjang.png"
              alt="천안오성고 로고"
            />
            <div className="home-header__brand-copy">
              <span className="home-header__wordmark">양심물품 대여</span>
              <span className="home-header__tagline">
                Ohsung Rental System
              </span>
            </div>
          </button>

          <nav className="home-header__nav">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                state={linkState}
                className="home-header__link"
                onClick={closePanel}
              >
                <span>{item.label}</span>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M1 6h8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="m6 1 4 5-4 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={`home-header__menu ${panelOpen ? "is-open" : ""}`}
            onClick={togglePanel}
            aria-expanded={panelOpen}
            aria-controls="home-header-panel"
            aria-label={panelOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {mounted &&
        createPortal(
          <>
            <div
              className={`home-header__overlay${panelOpen ? " is-active" : ""}`}
              role="presentation"
              onClick={closePanel}
            />

            <aside
              id="home-header-panel"
              className={`home-header__panel${panelOpen ? " is-open" : ""}`}
              aria-hidden={!panelOpen}
            >
              <div className="home-header__panel-header">
                <div className="home-header__panel-identity">
                  <span
                    className={`home-header__panel-role home-header__panel-role--${roleClass}`}
                  >
                    {roleText}
                  </span>
                  <div className="home-header__panel-name">
                    {displayName || "로그인이 필요합니다"}
                  </div>
                  {resolvedId && (
                    <div className="home-header__panel-id">ID {resolvedId}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="home-header__panel-close"
                  onClick={closePanel}
                  aria-label="메뉴 닫기"
                >
                  <span />
                  <span />
                </button>
              </div>

              <Link
                to={identityTarget}
                state={linkState}
                className="home-header__panel-cta"
                onClick={closePanel}
              >
                <span>{identityLabel}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <nav className="home-header__panel-nav">
                {navLinks.map((item) => (
                  <Link
                    key={`panel-${item.to}`}
                    to={item.to}
                    state={linkState}
                    className="home-header__panel-link"
                    onClick={closePanel}
                  >
                    <span>{item.label}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ))}
              </nav>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
};

export default Header;
