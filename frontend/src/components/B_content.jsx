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

  const totals = useMemo(() => {
    return categories.reduce(
      (acc, curr) => {
        const total = Number(curr.total) || 0;
        const available = Number(curr.available) || 0;
        return {
          total: acc.total + total,
          available: acc.available + available,
        };
      },
      { total: 0, available: 0 },
    );
  }, [categories]);

  const selectedCategoryMeta = useMemo(
    () => categories.find((item) => item.category === selectedItem),
    [categories, selectedItem],
  );

  const selectedUnit = useMemo(
    () =>
      units.find(
        (unit) => unit.display_no === selectedNo && unit.is_available === 1,
      ),
    [units, selectedNo],
  );

  const handleBorrow = async () => {
    if (!selectedItem || selectedNo == null || busy) {
      return;
    }
    if (!ID) {
      alert("로그인이 필요합니다.");
      return;
    }
    setBusy(true);
    try {
      const chosen = units.find(
        (unit) =>
          unit.display_no === selectedNo && unit.is_available === 1,
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
          <span className="borrow-hero__eyebrow">Borrow Center</span>
          <h1>물품 대여 센터</h1>
          <p>
            필요한 기자재를 빠르게 선택하고 대여를 완료하세요. 선택한
            카테고리의 재고 현황이 실시간으로 반영됩니다.
          </p>
          <div className="borrow-hero__stats">
            <div className="borrow-hero__stat">
              <span>대여 가능</span>
              <strong>{totals.available}</strong>
            </div>
            <div className="borrow-hero__stat">
              <span>전체 재고</span>
              <strong>{totals.total}</strong>
            </div>
            {selectedCategoryMeta && (
              <div className="borrow-hero__stat borrow-hero__stat--accent">
                <span>{selectedCategoryMeta.category}</span>
                <strong>
                  {selectedCategoryMeta.available}/{selectedCategoryMeta.total}
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="borrow-panel">
        <div className="borrow-card">
          <header className="borrow-card__head">
            <div>
              <h2>카테고리 선택</h2>
              <p>카테고리를 선택하면 이용 가능한 번호가 아래에 표시됩니다.</p>
            </div>
            <span className="borrow-card__badge">
              {selectedCategoryMeta
                ? `${selectedCategoryMeta.available} Available`
                : "대기 중"}
            </span>
          </header>

          <div className="borrow-card__body">
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
                const disabled = unit.is_available === 0 || busy;
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
                    aria-label={`${unit.display_no}번${picked ? " (선택됨)" : ""}`}
                  >
                    <span>{unit.display_no}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="borrow-card__footer">
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

      <section className="borrow-note">
        <div className="borrow-note__card">
          <div className="borrow-note__halo" aria-hidden="true" />
          <h3>대여 전 꼭 확인하세요</h3>
          <ul>
            <li>대여 기간은 안내된 규칙에 따라 준수해주세요.</li>
            <li>사용 중 파손이나 문제 발생 시 즉시 담당자에게 알립니다.</li>
            <li>
              반납 신청은 사용 종료 후 2시간 이내에 진행해야 원활히 처리됩니다.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
