import "./UM_content.css";
import { useState, useMemo, useEffect } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const Content = ({ ID }) => {
  const dayArr = useMemo(() => {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }, []);

  const toDate = (arr) => new Date(arr[0], arr[1] - 1, arr[2]);
  const daysDiff = (deadlineArr, baseArr) =>
    Math.ceil((toDate(deadlineArr) - toDate(baseArr)) / (1000 * 60 * 60 * 24));

  const [rentalData, setRentalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    try {
      if (rental.status === 1) {
        const res = await axios.post(
          `http://localhost:5000/admin/approve_return/${rental.id}`,
        );
        alert(res.data?.message || "반납 승인이 완료되었습니다.");
        setRentalData((prev) => prev.filter((r) => r.id !== rental.id));
      } else if (rental.status === 0) {
        const res = await axios.post(
          `http://localhost:5000/admin/mark_pending/${rental.id}`,
        );
        alert(res.data?.message || "반납 대기로 전환했습니다.");
        setRentalData((prev) =>
          prev.map((r) =>
            r.id === rental.id ? { ...r, status: 1, state: true } : r,
          ),
        );
      }
    } catch (e) {
      alert(e?.response?.data?.message || "요청 처리에 실패했습니다.");
    }
  };

  const filtered = useMemo(
    () => (rentalData || []).filter((r) => r.status !== 2),
    [rentalData],
  );

  const sortedData = useMemo(() => {
    const copied = [...filtered];
    copied.sort((a, b) => {
      const overdueA = a.status === 0 && toDate(dayArr) > toDate(a.deadline);
      const overdueB = b.status === 0 && toDate(dayArr) > toDate(b.deadline);
      const diffA = Math.abs(daysDiff(a.deadline, dayArr));
      const diffB = Math.abs(daysDiff(b.deadline, dayArr));
      if (a.status === 1 && b.status !== 1) return -1;
      if (a.status !== 1 && b.status === 1) return 1;
      if (a.status === 1 && b.status === 1) return diffB - diffA;
      if (overdueA && !overdueB) return -1;
      if (!overdueA && overdueB) return 1;
      return diffB - diffA;
    });
    return copied;
  }, [filtered, dayArr]);

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
        <h2>관리자 대여 현황</h2>
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
              const isPending = rental.status === 1;
              const isOverdue =
                rental.status === 0 && toDate(dayArr) > toDate(rental.deadline);
              const diff = daysDiff(rental.deadline, dayArr);
              const dLabel = diff >= 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
              const rentalItems = (rental.items || [])
                .map((item, idx) => `${item} ${rental.count[idx]}개`)
                .join(", ");

              return (
                <div
                  key={rental.id}
                  className={`block ${
                    isPending ? "highlight" : isOverdue ? "warn" : ""
                  }`}
                >
                  <div className="block__details">
                    <div>
                      <strong>대여자</strong>: {rental.name} (ID: {rental.id})
                    </div>
                    <div>
                      <strong>대여 품목</strong>: {rentalItems}
                    </div>
                    <div>
                      <strong>대여일</strong>: {rental.date?.join(". ")}
                    </div>
                    <div>
                      <strong>반납 예정일</strong>:{" "}
                      {rental.deadline?.join(". ")} ({dLabel})
                    </div>
                  </div>

                  <button
                    className={`DeleteButton ${
                      isPending ? "highlight" : isOverdue ? "warn" : ""
                    }`}
                    onClick={() => handleReturnAction(rental)}
                  >
                    {isPending ? "반납 승인" : "반납 처리"}
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
