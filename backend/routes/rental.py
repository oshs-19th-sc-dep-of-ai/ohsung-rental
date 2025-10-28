# React에서 물품을 대여할 때, API 호출하면 해당 제품을 대여 가능
# 대여 가능한지 확인 후 가능하면 DB에 저장하고 상태 변경

from flask import Blueprint, request, jsonify, session
from ..utils.database_util import DatabaseManager
from flask_cors import cross_origin

# 블루프린트
rental_bp = Blueprint('rental', __name__)

# 상태 코드
RENTAL_STATUS_RENTED = 0           # 대여중
RENTAL_STATUS_PENDING_RETURN = 1   # 반납대기
RENTAL_STATUS_RETURNED = 2         # 반납완료
RENTAL_STATUS_OVERDUE = 3          # 연체

def _get_current_sid():
    """
    세션에 저장된 로그인 ID 키를 유연하게 수용.
    (프로젝트 내 기존/신규 키 혼재 대응)
    """
    return (
        session.get('session_student_id')  # 권장 키
        or session.get('student_id')       # 기존 키
        or session.get('admin_id')         # (선택) 관리자로도 대여 허용 시
    )

# 물품 대여 (React에서 `/rent_product/:id` 호출)
@rental_bp.route('/rent_product/<int:product_id>', methods=['POST'])
@cross_origin(supports_credentials=True)  # 자격증명(쿠키) 포함 요청 허용
def rent_product(product_id):
    db = DatabaseManager()

    # 연체 상태 갱신
    db.query(
        """
        UPDATE Rentals
           SET rental_status = %(overdue)s
         WHERE rental_status IN (%(rented)s, %(pending)s)
           AND return_time IS NOT NULL
           AND return_time < NOW()
        """,
        overdue=RENTAL_STATUS_OVERDUE,
        rented=RENTAL_STATUS_RENTED,
        pending=RENTAL_STATUS_PENDING_RETURN,
    )
    db.commit()

    # 1) 로그인 확인
    sid = _get_current_sid()
    if not sid:
        return jsonify({
            "status": "error",
            "message": "로그인이 필요합니다."
        }), 401

    # 2) 이미 대여 중/반납대기인지 확인
    inuse = db.query(
        "SELECT 1 FROM Rentals "
        "WHERE product_id=%(pid)s AND rental_status IN (0,1) "
        "LIMIT 1",
        pid=product_id
    ).result
    if inuse:
        return jsonify({
            "status": "error",
            "message": "이미 대여 중인 제품입니다."
        }), 400

    # 3) 대여 등록 (0 = 대여중)
    db.query(
        "INSERT INTO Rentals (student_id, product_id, rental_time, return_time, rental_status) "
        "VALUES (%(sid)s, %(pid)s, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), %(st)s)",
        sid=sid, pid=product_id, st=RENTAL_STATUS_RENTED
    )
    db.commit()

    return jsonify({
        "status": "success",
        "message": "대여가 완료되었습니다!"
    }), 200


# (사용 중일 경우) JSON 바디로 product_id를 받는 대여 요청
@rental_bp.route('/rental_request', methods=['POST'])
@cross_origin(supports_credentials=True)
def rental_request():
    db = DatabaseManager()

    # 연체 상태 갱신
    db.query(
        """
        UPDATE Rentals
           SET rental_status = %(overdue)s
         WHERE rental_status IN (%(rented)s, %(pending)s)
           AND return_time IS NOT NULL
           AND return_time < NOW()
        """,
        overdue=RENTAL_STATUS_OVERDUE,
        rented=RENTAL_STATUS_RENTED,
        pending=RENTAL_STATUS_PENDING_RETURN,
    )
    db.commit()

    # 1) 로그인 확인
    sid = _get_current_sid()
    if not sid:
        return jsonify({
            "status": "error",
            "message": "로그인이 필요합니다."
        }), 401

    data = request.get_json() or {}
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({
            "status": "error",
            "message": "제품 ID가 필요합니다."
        }), 400

    # 2) 이미 대여 중/반납대기인지 확인
    inuse = db.query(
        "SELECT 1 FROM Rentals "
        "WHERE product_id=%(pid)s AND rental_status IN (0,1) "
        "LIMIT 1",
        pid=product_id
    ).result
    if inuse:
        return jsonify({
            "status": "error",
            "message": "이미 대여 중인 제품입니다."
        }), 400

    # 3) 대여 등록 (0 = 대여중)
    db.query(
        "INSERT INTO Rentals (student_id, product_id, rental_time, return_time, rental_status) "
        "VALUES (%(sid)s, %(pid)s, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), %(st)s)",
        sid=sid, pid=product_id, st=RENTAL_STATUS_RENTED
    )
    db.commit()

    return jsonify({
        "status": "success",
        "message": "대여 완료"
    }), 200
