from flask import Blueprint, request, jsonify, session
from ..utils.database_util import DatabaseManager
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

# 상태 상수 (DB와 통일)
RENTAL_STATUS_RENTED = 0           # 대여중
RENTAL_STATUS_PENDING_RETURN = 1   # 반납대기
RENTAL_STATUS_RETURNED = 2         # 반납완료


def _is_admin():
    return bool(session.get('admin_id') or session.get('is_admin'))


# (예시) 관리자 로그인
@admin_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    admin_id = data.get("admin_id")
    if not admin_id:
        return jsonify({"message": "admin_id가 필요합니다.", "status":"error"}), 400

    session['admin_id'] = admin_id
    session['is_admin'] = True
    return jsonify({"message": "관리자 로그인 성공", "status":"success"}), 200


@admin_bp.route('/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_id', None)
    session.pop('is_admin', None)
    return jsonify({"message": "관리자 로그아웃", "status":"success"}), 200


# (예시) 물품 추가
@admin_bp.route('/admin/add_product', methods=['POST'])
def add_product():
    if not _is_admin():
        return jsonify({"message": "관리자 권한이 필요합니다.", "status": "error"}), 403

    data = request.get_json(silent=True) or {}
    product_name = data.get("product_name")
    category = data.get("category")
    quantity = data.get("quantity", 0)

    if not product_name or not category:
        return jsonify({"message": "필수 값이 누락되었습니다.", "status": "error"}), 400

    db = DatabaseManager()
    db.query(
        """
        INSERT INTO Products (product_name, category, quantity)
        VALUES (%(name)s, %(cat)s, %(qty)s)
        """,
        name=product_name, cat=category, qty=quantity
    )
    db.commit()

    return jsonify({"message": "물품이 추가되었습니다!", "status": "success"}), 200


# (예시) 물품 삭제
@admin_bp.route('/admin/delete_product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    if not _is_admin():
        return jsonify({"message": "관리자 권한이 필요합니다.", "status": "error"}), 403

    db = DatabaseManager()
    db.query("DELETE FROM Products WHERE product_id=%(pid)s", pid=product_id)
    db.commit()

    return jsonify({"message": "물품이 삭제되었습니다!", "status": "success"}), 200


# ✅ 관리자용 대여 목록 조회
@admin_bp.route('/admin/rentals', methods=['GET'])
def list_rentals():
    """
    Query params (옵션):
      - status: all | rented | pending | returned  (기본: all)
    응답 형태: [{ id, name, items:[...], count:[...], date:[Y,M,D], deadline:[Y,M,D], state:bool, status:int }, ...]
       - state == True  → "반납 대기" 강조 (호환 유지)
       - status         → 0(대여중) / 1(반납대기) / 2(반납완료)
       - deadline       → rental_time + 2 days
    """
    if not _is_admin():
        return jsonify({"message": "관리자 권한이 필요합니다.", "status": "error"}), 403

    status = (request.args.get("status") or "all").lower()
    status_map = {
        "rented":   RENTAL_STATUS_RENTED,
        "pending":  RENTAL_STATUS_PENDING_RETURN,
        "returned": RENTAL_STATUS_RETURNED
    }

    where = ""
    params = {}
    if status in status_map:
        where = "WHERE r.rental_status = %(st)s"
        params["st"] = status_map[status]

    db = DatabaseManager()
    rows = db.query(
        f"""
        SELECT r.id, r.student_id, s.student_name, r.product_id, p.product_name,
               r.rental_time, r.return_time, r.rental_status
          FROM Rentals r
          JOIN Students s ON s.student_id = r.student_id
          JOIN Products p ON p.product_id = r.product_id
          {where}
         ORDER BY r.id DESC
        """,
        **params
    ).result

    def to_arr_date(dt):
        """MySQL DATETIME(datetime 또는 str) → [Y,M,D]"""
        if dt is None:
            return None
        if isinstance(dt, datetime):
            return [dt.year, dt.month, dt.day]
        s = str(dt).split(" ")[0]
        y, m, d = map(int, s.split("-"))
        return [y, m, d]

    result = []
    for (rid, sid, sname, pid, pname, rtime, ret_time, rstatus) in rows:
        if isinstance(rtime, datetime):
            rtime_dt = rtime
        elif rtime is None:
            rtime_dt = None
        else:
            y, m, d = map(int, str(rtime).split(" ")[0].split("-"))
            rtime_dt = datetime(y, m, d)

        deadline_dt = (rtime_dt + timedelta(days=2)) if rtime_dt else None

        result.append({
            "id": rid,
            "name": sname,
            "items": [pname],       # Rentals는 단일 product_id
            "count": [1],           # 수량 1(필요 시 스키마 확장)
            "date": to_arr_date(rtime_dt) or [],
            "deadline": to_arr_date(deadline_dt) or [],
            "state": (rstatus == RENTAL_STATUS_PENDING_RETURN),  # 기존 호환
            "status": int(rstatus),                               # ✅ 추가: 실제 상태 값
        })

    return jsonify({"status":"success", "rentals": result}), 200


# ✅ (신규) 관리자: 대여중(0) → 반납대기(1) 전환
@admin_bp.route('/admin/mark_pending/<int:rental_id>', methods=['POST'])
def mark_pending(rental_id):
    if not _is_admin():
        return jsonify({"message": "관리자 권한이 필요합니다.", "status": "error"}), 403

    db = DatabaseManager()
    res = db.query(
        """
        UPDATE Rentals
           SET rental_status = %(pending)s
         WHERE id = %(rental_id)s
           AND rental_status = %(rented)s
        """,
        pending=RENTAL_STATUS_PENDING_RETURN,
        rented=RENTAL_STATUS_RENTED,
        rental_id=rental_id
    )
    db.commit()

    if res.affected_rows == 0:
        return jsonify({"message": "반납대기로 변경할 수 없습니다.", "status": "error"}), 400

    return jsonify({"message": "반납대기로 변경되었습니다.", "status": "success"}), 200


# 반납 승인 (관리자 전용)
@admin_bp.route('/admin/approve_return/<int:rental_id>', methods=['POST'])
def approve_rental_return(rental_id):
    if not _is_admin():
        return jsonify({
            "message": "관리자 권한이 필요합니다.",
            "status": "error"
        }), 403

    db = DatabaseManager()
    result = db.query(
        """
        UPDATE Rentals
           SET rental_status = %(returned)s,
               return_time   = NOW()
         WHERE id = %(rental_id)s
           AND rental_status = %(pending)s
        """,
        returned=RENTAL_STATUS_RETURNED,
        pending=RENTAL_STATUS_PENDING_RETURN,
        rental_id=rental_id
    )
    db.commit()

    if result.affected_rows == 0:
        return jsonify({
            "message": "반납 승인에 실패했습니다.",
            "status": "error"
        }), 400

    return jsonify({
        "message": "반납이 승인되었습니다!",
        "status": "success"
    }), 200
