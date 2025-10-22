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

    // 기본 선택: 첫 카테고리
    if (list.length && !selectedItem) {
      setSelectedItem(list[0].category);
    }
  };

  const loadProducts = async (category) => {
    if (!category) return;
    const { data } = await axios.get("http://localhost:5000/products", {
      params: { category },
      withCredentials: true,
    });
    setUnits(data.products || []);
    setSelectedNo(null); // 카테고리 바뀌면 번호 선택 초기화
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts(selectedItem);
  }, [selectedItem]);

  // 대여 처리
  const handleBorrow = async () => {
    if (!selectedItem || selectedNo == null || busy) return;
    if (!ID) {
      alert("로그인이 필요합니다.");
      return;
    }
    setBusy(true);
    try {
      // display_no → product_id 매칭
      const chosen = units.find(u => u.display_no === selectedNo && u.is_available === 1);
      if (!chosen) {
        alert("선택한 번호는 대여할 수 없습니다.");
        return;
      }

      const body = {
        student_id: ID,
        display_no: selectedNo,
        category: selectedItem,
      };
      const res = await axios.post("http://localhost:5000/rent", body, { withCredentials: true });
      if (res.data?.status === "success") {
        alert("대여가 완료되었습니다.");
        // 재고 업데이트
        await loadProducts(selectedItem);
        await loadCategories();
      } else {
        alert(res.data?.message ?? "대여 처리 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("대여 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="canvas-wrap">
      <div className="borrow-container">
        {/* 제목 */}
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
