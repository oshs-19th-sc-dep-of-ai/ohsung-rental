import "./UM_content.css";
import { useRef, useState, useMemo, useEffect } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

const Content = (props) => {
  const containerRef = useRef(null); // 드래그 컨테이너
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 오늘 날짜 [Y,M,D]
  const today = new Date();
  const dayArr = useMemo(
    () => [today.getFullYear(), today.getMonth() + 1, today.getDate()],
    [today]
  );

  // 날짜 도우미
  const toDate = (arr) => new Date(arr[0], arr[1] - 1, arr[2]);
  const daysDiff = (deadlineArr, baseArr) =>
    Math.ceil((toDate(deadlineArr) - toDate(baseArr)) / (1000 * 60 * 60 * 24));

  // 드래그 핸들러
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };
  const handleMouseLeaveOrUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.clientX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // 데이터 상태
  const [rentalData, setRentalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // 관리자 대여 목록 가져오기 — 모든 상태
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axios.get("http://localhost:5000/admin/rentals?status=all", { withCredentials: true });
        if (!alive) return;
        setRentalData(res.data?.rentals || []);
        setError("");
      } catch (e) {
        const msg = e?.response?.data?.message || `요청 실패 (${e?.response?.status || "네트워크"})`;
        setError(msg);
        console.error("대여 목록 조회 실패:", e?.response?.data || e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 반납 버튼 동작: status에 따라 분기
  const handleReturnAction = async (rental) => {
    try {
      if (rental.status === 1) {
        const res = await axios.post(`http://localhost:5000/admin/approve_return/${rental.id}`);
        alert(res.data?.message || "반납 승인 성공");
        setRentalData((prev) => prev.filter((r) => r.id !== rental.id));
      } else if (rental.status === 0) {
        const res = await axios.post(`http://localhost:5000/admin/mark_pending/${rental.id}`);
        alert(res.data?.message || "반납대기로 변경");
        setRentalData((prev) =>
          prev.map((r) => (r.id === rental.id ? { ...r, status: 1, state: true } : r))
        );
      }
      // status===2(완료)는 아래 필터로 렌더 자체가 안 됨
    } catch (e) {
      alert(e?.response?.data?.message || "요청 실패");
    }
  };

  // 렌더 전에 "반납완료(status===2)"는 제외
  const filtered = useMemo(
    () => (rentalData || []).filter((r) => r.status !== 2),
    [rentalData]
  );

  // 정렬 (불변성 유지)
  const sortedData = useMemo(() => {
    const copied = [...filtered];
    copied.sort((a, b) => {
      const overdueA = a.status === 0 && (toDate(dayArr) > toDate(a.deadline));
      const overdueB = b.status === 0 && (toDate(dayArr) > toDate(b.deadline));
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
        <div className="c"><h3>대여 목록 불러오는 중...</h3></div>
      </div>
    );
  }

  return (
    <div className="UMcontent">
      <div className="c">
        <h2>📆 오늘의 날짜: {dayArr.join(". ")}</h2>
        <h2>대여현황</h2>
        <div className="line"></div>
        <div>
          <span className="orange">주황색은</span> 반납 대기중,{" "}
          <span className="purple">보라색은</span> 연체중,{" "}
          <span className="blue">파란색은</span> 정상 상태입니다.
        </div>

        {error && (
          <div style={{ color: "#c00", padding: "8px 0" }}>오류: {error}</div>
        )}

        <div
          className="container"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
        >
          {sortedData.length === 0 ? (
            <div style={{ padding: 16, color: "#666" }}>표시할 대여가 없습니다.</div>
          ) : (
            sortedData.map((rental) => {
              const isPending = rental.status === 1;
              const isOverdue = rental.status === 0 && (toDate(dayArr) > toDate(rental.deadline));
              const d = daysDiff(rental.deadline, dayArr);
              const dLabel = d >= 0 ? `D-${d}` : `D+${Math.abs(d)}`;

              return (
                <div
                  key={rental.id}
                  className={`block ${isPending ? "highlight" : isOverdue ? "warn" : ""}`}
                >
                  <div>
                    ID: {rental.id} {rental.name}
                    <br />
                    대여품: {rental.items.map((item, i) => `${item} ${rental.count[i]}개`).join(", ")}
                    <br />
                    대여일: {rental.date.join(".")}
                    <br />
                    반납일: {rental.deadline.join(".")} ({dLabel})
                  </div>

                  <button
                    className={`DeleteButton ${isPending ? "highlight" : isOverdue ? "warn" : ""}`}
                    onClick={() => handleReturnAction(rental)}
                  >
                    {isPending ? "승인" : "반납"}
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
