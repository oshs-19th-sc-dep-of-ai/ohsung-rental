import "./UM_content.css";
import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const RENTAL_STATUS = {
  RENTED: 0,
  PENDING: 1,
  RETURNED: 2,
  OVERDUE: 3,
};

const Content = ({ ID }) => {
  const dayArr = useMemo(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }, []);

  const toDate = (arr) => new Date(arr[0], arr[1] - 1, arr[2]);
  const daysDiff = (deadlineArr, baseArr) =>
    Math.ceil((toDate(deadlineArr) - toDate(baseArr)) / (1000 * 60 * 60 * 24));

  const todayDate = useMemo(() => toDate(dayArr), [dayArr]);

  const [rentalData, setRentalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOverdueRental = useCallback((rental) => {
    if (!rental) return false;
    if (rental.status === RENTAL_STATUS.OVERDUE) {
      return true;
    }
    if (rental.status !== RENTAL_STATUS.RENTED) {
      return false;
    }
    if (!Array.isArray(rental.deadline) || rental.deadline.length < 3) {
      return false;
    }
    return todayDate > toDate(rental.deadline);
  }, [todayDate]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/admin/rentals?status=all",
          { withCredentials: true },
        );
        if (!alive) return;
        setRentalData(res.data?.rentals || []);
        setError("");
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          `요청에 실패했습니다 (${e?.response?.status || "네트워크 오류"})`;
        setError(msg);
        console.error("대여 목록 조회 실패:", e?.response?.data || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleReturnAction = async (rental) => {
    if (!rental) {
      return;
    }

    try {
      if (rental.status === RENTAL_STATUS.PENDING) {
        const res = await axios.post(
          `http://localhost:5000/admin/approve_return/${rental.id}`,
        );
        alert(res.data?.message || "반납 승인이 완료되었습니다.");
        setRentalData((prev) => prev.filter((r) => r.id !== rental.id));
      } else if (
        rental.status === RENTAL_STATUS.RENTED ||
        rental.status === RENTAL_STATUS.OVERDUE
      ) {
        const res = await axios.post(
          `http://localhost:5000/admin/mark_pending/${rental.id}`,
        );
        alert(res.data?.message || "반납 대기로 전환했습니다.");
        setRentalData((prev) =>
          prev.map((r) =>
            r.id === rental.id
              ? { ...r, status: RENTAL_STATUS.PENDING, state: true }
              : r,
          ),
        );
      }
    } catch (e) {
      alert(e?.response?.data?.message || "요청 처리에 실패했습니다.");
    }
  };

  const filtered = useMemo(
    () =>
      (rentalData || []).filter(
        (r) => r.status !== RENTAL_STATUS.RETURNED,
      ),
    [rentalData],
  );

  const sortedData = useMemo(() => {
    const copied = [...filtered];
    const safeAbsDiff = (rental) => {
      if (!Array.isArray(rental?.deadline) || rental.deadline.length < 3) {
        return 0;
      }
      return Math.abs(daysDiff(rental.deadline, dayArr));
    };

    copied.sort((a, b) => {
      const pendingA = a.status === RENTAL_STATUS.PENDING;
      const pendingB = b.status === RENTAL_STATUS.PENDING;
      if (pendingA && !pendingB) return -1;
      if (!pendingA && pendingB) return 1;
      if (pendingA && pendingB) {
        return safeAbsDiff(b) - safeAbsDiff(a);
      }

      const overdueA = isOverdueRental(a);
      const overdueB = isOverdueRental(b);
      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;

      return safeAbsDiff(b) - safeAbsDiff(a);
    });
    return copied;
  }, [filtered, dayArr, isOverdueRental]);

  if (loading) {
    return (
      <div className="UMcontent">
        <div className="UMcontent__body">
          <div className="UMcontent__status">대여 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="UMcontent">
      <div className="UMcontent__body">
        <h2>대여 현황</h2>
        <p className="UMcontent__caption">오늘 날짜: {dayArr.join(". ")}</p>
        {ID && (
          <p className="UMcontent__caption">관리자 ID: {ID}</p>
        )}
        <div className="legend">
          <span className="legend-chip orange">반납 승인 대기</span>
          <span className="legend-chip purple">연체</span>
          <span className="legend-chip blue">정상 진행</span>
        </div>
        <div className="line" />

        {error && <div className="UMcontent__error">오류: {error}</div>}

        <div className="container">
          {sortedData.length === 0 ? (
            <div className="UMcontent__status">표시할 대여 건이 없습니다.</div>
          ) : (
            sortedData.map((rental) => {
              const isPending = rental.status === RENTAL_STATUS.PENDING;
              const isOverdue = isOverdueRental(rental);
              const hasDeadline =
                Array.isArray(rental.deadline) && rental.deadline.length === 3;
              const diff = hasDeadline ? daysDiff(rental.deadline, dayArr) : null;
              const dLabel =
                diff === null
                  ? "정보 없음"
                  : diff >= 0
                  ? `D-${diff}`
                  : `D+${Math.abs(diff)}`;
              const rentalItems = (rental.items || [])
                .map((item, idx) => `${item} ${rental.count[idx]}개`)
                .join(", ");
              const statusTone = isPending ? "pending" : isOverdue ? "overdue" : "active";
              const statusText = isPending
                ? "반납 승인 대기"
                : isOverdue
                ? "연체"
                : "정상 진행";
              const deadlineText = hasDeadline
                ? rental.deadline.join(". ")
                : "정보 없음";
              const canProcess =
                rental.status === RENTAL_STATUS.RENTED ||
                rental.status === RENTAL_STATUS.PENDING ||
                rental.status === RENTAL_STATUS.OVERDUE;
              const buttonDisabled = !canProcess;
              const buttonLabel = isPending
                ? "반납 승인"
                : isOverdue
                ? "연체 반납 처리"
                : "반납 처리";
              const buttonTitle = buttonDisabled
                ? "현재 상태에서는 처리할 수 없습니다."
                : undefined;

              const displayNo = rental.display_no ?? rental.product_id ?? rental.id;
              return (
                <div
                  key={rental.id}
                  className={`block ${
                    isPending ? "highlight" : isOverdue ? "warn" : ""
                  }`}
                >
                  <div className="block__head">
                    <div>
                      <h4 className="block__title">
                        {rental.name} {rental.student_id && `(${rental.student_id})`}
                      </h4>
                      <p className="block__subtitle">물품 ID · {displayNo}</p>
                    </div>
                    <span className={`status-badge status-badge--${statusTone}`}>{statusText}</span>
                  </div>

                  <div className="block__details">
                    <div><strong>대여 품목</strong>: {rentalItems}</div>
                    <div><strong>대여일</strong>: {rental.date?.join(". ")}</div>
                    <div><strong>반납 예정일</strong>: {deadlineText} ({dLabel})</div>
                  </div>

                  <button
                    className={`DeleteButton ${
                      isPending ? "highlight" : isOverdue ? "warn" : ""
                    }`}
                    onClick={() => handleReturnAction(rental)}
                    disabled={buttonDisabled}
                    title={buttonTitle}
                  >
                    {buttonLabel}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Content;
