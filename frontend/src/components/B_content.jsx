import React, { useEffect, useState } from "react";
import axios from "axios";
import "./B_content.css";

export default function BContent({ ID }) {
  const [categories, setCategories] = useState([]);      // [{category, total, available}]
  const [selectedItem, setSelectedItem] = useState("");  // 선택 카테고리
  const [units, setUnits] = useState([]);                // [{product_id, display_no, is_available}]
  const [selectedNo, setSelectedNo] = useState(null);    // 선택 번호(display_no)
  const [busy, setBusy] = useState(false);               // 중복 클릭/로딩 방지

  // 공통: 카테고리/제품 로더
  const loadCategories = async () => {
    const { data } = await axios.get("http://localhost:5000/categories", { withCredentials: true });
    const list = data.categories || [];
    setCategories(list);
    if (list.length > 0) setSelectedItem(prev => prev || list[0].category);
  };

  const loadProducts = async (category) => {
    const { data } = await axios.get("http://localhost:5000/products", {
      params: { category },
      withCredentials: true
    });
    setUnits(data.products || []);
    setSelectedNo(null);
  };

  // 1) 카테고리 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 2) 선택된 카테고리의 제품 로드
  useEffect(() => {
    if (selectedItem) loadProducts(selectedItem);
  }, [selectedItem]);

  // 3) 대여 요청
  const handleBorrow = async () => {
    if (busy) return;
    if (!ID) { alert("로그인이 필요합니다."); return; }
    const chosen = units.find(u => u.display_no === Number(selectedNo));
    if (!chosen) { alert("물품 번호를 선택하세요."); return; }

    try {
      setBusy(true);

      // (1) 낙관적 업데이트: 바로 비활성화로 표시
      setUnits(prev =>
        prev.map(u =>
          u.product_id === chosen.product_id ? { ...u, is_available: 0 } : u
        )
      );

      // (2) 서버 요청
      await axios.post(
        `http://localhost:5000/rent_product/${chosen.product_id}`,
        {},
        { withCredentials: true }
      );

      // (3) 서버 데이터로 재검증 동기화
      await loadProducts(selectedItem);

      alert("대여 요청 완료!");
    } catch (err) {
      // 실패 시 롤백
      setUnits(prev =>
        prev.map(u =>
          u.product_id === chosen.product_id ? { ...u, is_available: 1 } : u
        )
      );
      const msg = err?.response?.data?.message || "대여 요청 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setSelectedNo(null);
      setBusy(false);
    }
  };

  return (
    /* ⬇️ 캔버스 스케일/중앙 래퍼 (화면이 좁으면 비율 축소) */
    <div className="canvas-wrap">
      {/* ⬇️ 실제 콘텐츠 박스: 항상 중앙, 고정 폭 */}
      <div className="borrow-container">
        <h2 className="borrow-title">물품 대여 시스템</h2>

        {/* 카테고리 라디오 */}
        <div className="category-row">
          {categories.map(({ category, total }) => (
            <label key={category} className="category-radio">
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedItem === category}
                onChange={() => setSelectedItem(category)}
                disabled={busy}
              />
              <span>{category} ({total})</span>
            </label>
          ))}
        </div>

        {/* 번호 그리드 */}
        <div className="number-section">
          <h3 className="number-title">대여할 {selectedItem || "물품"} 선택</h3>
          <div className="number-grid">
            {units.map(u => {
              const picked = selectedNo === u.display_no;
              const disabled = u.is_available === 0 || busy;
              return (
                <button
                  key={u.product_id}
                  disabled={disabled}
                  className={`num-btn ${picked ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                  onClick={() => setSelectedNo(u.display_no)}
                  aria-pressed={picked}
                  aria-label={`${selectedItem} ${u.display_no}${u.is_available === 0 ? " (대여중)" : ""}`}
                >
                  {u.display_no}
                </button>
              );
            })}
          </div>
        </div>

        {/* 대여 버튼: 위아래 두껍게 + 가로 꽉 */}
        <button
          className="rent-button rent-button--full"
          onClick={handleBorrow}
          disabled={!selectedNo || busy}
        >
          {busy ? "처리 중..." : "대여"}
        </button>
      </div>
    </div>
  );
}
