from flask import Blueprint, request, jsonify, session
from ..utils.database_util import DatabaseManager

# 블루프린트
rental_return_bp = Blueprint('rental_return', __name__)

# 상태 상수 (DB와 통일)
RENTAL_STATUS_RENTED = 0           # 대여중
RENTAL_STATUS_PENDING_RETURN = 1   # 반납대기
RENTAL_STATUS_RETURNED = 2         # 반납완료


def _get_student_id_from_session():
    return session.get("session_student_id") or session.get("student_id")


# 반납 요청(프론트엔드에서 `/rental_request_return/:id` 호출)
@rental_return_bp.route('/rental_request_return/<int:rental_id>', methods=['POST'])
def rental_request_return(rental_id):
    student_id = _get_student_id_from_session()
    if not student_id:
        return jsonify({
            "message": "로그인이 필요합니다.",
            "status": "error"
        }), 401

    db = DatabaseManager()

    # 반납 '요청' 단계에서는 return_time을 찍지 않음.
    # 현재 상태가 '대여중(0)'일 때만 '반납대기(1)'로 변경.
    result = db.query(
        """
        UPDATE Rentals
           SET rental_status = %(pending)s
         WHERE id = %(rental_id)s
           AND student_id = %(student_id)s
           AND rental_status = %(rented)s
        """,
        pending=RENTAL_STATUS_PENDING_RETURN,
        rental_id=rental_id,
        student_id=student_id,
        rented=RENTAL_STATUS_RENTED,
    )
    db.commit()

    if result.affected_rows == 0:
        # 조건 불일치(본인 소유 아님, 이미 반납대기/완료, 존재하지 않는 대여 등)
        return jsonify({
            "message": "반납 요청에 실패했습니다.",
            "status": "error"
        }), 400

    return jsonify({
        "message": "반납 요청이 접수되었습니다.",
        "status": "success"
    }), 200
