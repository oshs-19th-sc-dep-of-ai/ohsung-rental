import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./B_content.css";

export default function BContent({ ID }) {
  const [categories, setCategories] = useState([]); // [{category, total, available}]
  const [selectedItem, setSelectedItem] = useState(""); // 선택 카테고리
  const [units, setUnits] = useState([]); // [{product_id, display_no, is_available, product_name}]
  const [selectedNo, setSelectedNo] = useState(null); // 선택 번호(display_no)
  const [busy, setBusy] = useState(false); // 중복 클릭/로딩 방지

  const loadCategories = async () => {
    const { data } = await axios.get("http://localhost:5000/categories", {
      withCredentials: true,
    });
    const list = data.categories || [];
    setCategories(list);
    if (list.length && !selectedItem) {
      setSelectedItem(list[0].category);
    }
  };

  const loadProducts = async (category) => {
    if (!category) {
      return;
    }
    const { data } = await axios.get("http://localhost:5000/products", {
      params: { category },
      withCredentials: true,
    });
    setUnits(data.products || []);
    setSelectedNo(null);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts(selectedItem);
  }, [selectedItem]);

  const blockedDisplayNos = useMemo(
    () =>
      new Set(
        units
          .filter((unit) => unit.is_available === 3)
          .map((unit) => unit.display_no),
      ),
    [units],
  );

  const selectedUnit = useMemo(() => {
    if (selectedNo == null || blockedDisplayNos.has(selectedNo)) {
      return null;
    }
    return units.find(
      (unit) => unit.display_no === selectedNo && unit.is_available === 1,
    );
  }, [units, selectedNo, blockedDisplayNos]);

  useEffect(() => {
    if (selectedNo != null && blockedDisplayNos.has(selectedNo)) {
      setSelectedNo(null);
    }
  }, [blockedDisplayNos, selectedNo]);

  const categorySummary = useMemo(() => {
    return categories.reduce(
      (acc, item) => {
        acc.total += Number(item.total) || 0;
        acc.available += Number(item.available) || 0;
        return acc;
      },
      { total: 0, available: 0 },
    );
  }, [categories]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.category === selectedItem) ?? null,
    [categories, selectedItem],
  );

  const handleBorrow = async () => {
    if (!selectedItem || selectedNo == null || busy) {
      return;
    }
    if (!ID) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (blockedDisplayNos.has(selectedNo)) {
      alert("선택한 번호는 현재 대여할 수 없습니다.");
      return;
    }
    setBusy(true);
    try {
      const chosen = units.find(
        (unit) =>
          unit.display_no === selectedNo &&
          unit.is_available === 1 &&
          !blockedDisplayNos.has(unit.display_no),
      );
      if (!chosen) {
        alert("선택한 번호를 다시 확인해주세요.");
        return;
      }

      const endpoint = `http://localhost:5000/rent_product/${chosen.product_id}`;
      const res = await axios.post(endpoint, {}, { withCredentials: true });
      if (res.data?.status === "success") {
        alert("대여가 완료되었습니다.");
        await loadProducts(selectedItem);
        await loadCategories();
      } else {
        alert(res.data?.message ?? "대여 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error(error);
      alert("대여 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const hasCategories = categories.length > 0;

  return (
    <div className="borrow-shell">
      <section className="borrow-hero">
        <div className="borrow-hero__copy">
          <span className="borrow-hero__eyebrow">대여하기</span>
          <h1>물품 대여</h1>
          <p>원하는 물품을 선택하고 대여 신청을 해보세요.</p>
        </div>

        <div className="borrow-hero__meta">
          <div className="borrow-panel borrow-panel--guide">
            <h3>주의사항</h3>
            <ul className="borrow-guide__list">
              <li>대여 기간은 <strong>2일</strong> 입니다.</li>
              <li>사용 중 파손이나 문제 발생 시 즉시 학생회에 연락하세요.</li>
              <li>
                반납 신청은 지정된 장소에 반납 후 반납신청을 진행해주세요.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="borrow-panels">
        <div className="borrow-panel">
          <div className="borrow-panel__head">
            <h2>물품 선택</h2>
            <span className="borrow-panel__meta">
              {selectedCategory
                ? `${selectedCategory.available}/${selectedCategory.total}`
                : hasCategories
                ? `${categorySummary.available}/${categorySummary.total}`
                : "0/0"}
            </span>
          </div>

          <div className="borrow-panel__body">
            {hasCategories ? (
              <div className="borrow-chip-group" role="tablist">
                {categories.map(({ category, total, available }) => {
                  const active = selectedItem === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`borrow-chip ${active ? "is-active" : ""}`}
                      onClick={() => setSelectedItem(category)}
                      disabled={busy}
                      aria-pressed={active}
                    >
                      <span className="borrow-chip__label">{category}</span>
                      <span className="borrow-chip__meta">
                        {available}/{total}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="borrow-empty">
                아직 대여 가능한 카테고리가 없습니다.
              </p>
            )}

            <div className="borrow-grid">
              {units.map((unit) => {
                const picked = selectedNo === unit.display_no;
                const isBlocked = blockedDisplayNos.has(unit.display_no);
                const disabled = unit.is_available === 0 || isBlocked || busy;
                return (
                  <button
                    key={unit.product_id}
                    type="button"
                    disabled={disabled}
                    className={`borrow-slot ${
                      picked ? "is-selected" : ""
                    } ${disabled ? "is-disabled" : ""}`}
                    onClick={() => setSelectedNo(unit.display_no)}
                    aria-pressed={picked}
                    aria-label={`${unit.display_no}번${
                      picked ? " (선택됨)" : ""
                    }${isBlocked ? " (대여 불가)" : ""}`}
                  >
                    <span>{unit.display_no}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="borrow-panel__footer">
            <div className="borrow-selected">
              <span>선택한 번호</span>
              <strong>{selectedNo ?? "--"}</strong>
              {selectedUnit?.product_name && (
                <small>{selectedUnit.product_name}</small>
              )}
            </div>
            <button
              type="button"
              className="borrow-cta"
              onClick={handleBorrow}
              disabled={!selectedNo || busy}
            >
              {busy ? "처리 중..." : "대여 신청"}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
