import traceback
from datetime import timedelta

from flask import Blueprint, jsonify, request, session, url_for
from werkzeug.security import generate_password_hash

from ..utils.database_util import DatabaseManager

profile_bp = Blueprint("profile", __name__)

STATUS_LABELS = {
    0: "\ub300\uc5ec\uc911",
    1: "\ubc18\ub0a9 \uc694\uccad",
    2: "\ubc18\ub0a9 \uc644\ub8cc",
}


def _get_student_id():
    return session.get("session_student_id") or session.get("student_id")


@profile_bp.route("/profile", methods=["GET"])
def profile():
    student_id = _get_student_id()

    if not student_id:
        return (
            jsonify(
                {
                    "message": "\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.",
                    "status": "error",
                    "redirect_url": url_for("auth.login"),
                }
            ),
            401,
        )

    try:
        db = DatabaseManager()

        student_result = db.query(
            """
            SELECT student_id, student_name
              FROM Students
             WHERE student_id = %(student_id)s
            """,
            student_id=student_id,
        ).result

        if not student_result:
            return (
                jsonify(
                    {
                        "message": "\ud559\uc0dd \uc815\ubcf4\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
                        "status": "error",
                    }
                ),
                404,
            )

        student = student_result[0]

        rentals = db.query(
            """
            SELECT p.product_name,
                   r.rental_time,
                   r.return_time,
                   r.rental_status,
                   r.id,
                   r.product_id
              FROM Rentals r
              JOIN Products p ON r.product_id = p.product_id
             WHERE r.student_id = %(student_id)s
             ORDER BY r.rental_time DESC
            """,
            student_id=student_id,
        ).result

        rental_records = [
            {
                "product_name": rental[0],
                "rental_time": rental[1].strftime("%Y-%m-%d %H:%M:%S") if rental[1] else None,
                "return_time": rental[2].strftime("%Y-%m-%d %H:%M:%S") if rental[2] else None,
                "status_code": rental[3],
                "status": STATUS_LABELS.get(rental[3], "\uc54c \uc218 \uc5c6\uc74c"),
                "expected_return_time": (
                    (rental[1] + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S")
                    if rental[1] and rental[3] in (0, 1)
                    else None
                ),
                "rental_id": rental[4],
                "product_id": rental[5],
            }
            for rental in rentals
        ]

        return (
            jsonify(
                {
                    "student": {
                        "student_id": student[0],
                        "student_name": student[1],
                    },
                    "rentals": rental_records,
                }
            ),
            200,
        )

    except Exception:
        print("profile route error:", traceback.format_exc())
        return (
            jsonify(
                {
                    "message": "\uc11c\ubc84 \ub0b4\ubd80 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.",
                    "status": "error",
                }
            ),
            500,
        )


@profile_bp.route("/change_password", methods=["POST"])
def change_password():
    student_id = _get_student_id()
    if not student_id:
        return (
            jsonify(
                {
                    "message": "\ub85c\uadf8\uc778\uc774 \ud544\uc694\ud569\ub2c8\ub2e4.",
                    "status": "error",
                }
            ),
            401,
        )

    data = request.get_json() or {}
    new_password = data.get("new_password")

    if not new_password:
        return (
            jsonify(
                {
                    "message": "\uc0c8 \ube44\ubc00\ubc88\ud638\uac00 \ud544\uc694\ud569\ub2c8\ub2e4.",
                    "status": "error",
                }
            ),
            400,
        )

    try:
        db = DatabaseManager()
        db.query(
            """
            UPDATE Students
               SET student_pw = SHA2(%(student_pw)s, 256)
             WHERE student_id = %(student_id)s
            """,
            student_pw=new_password,
            student_id=student_id,
        )
        db.commit()

        return (
            jsonify(
                {
                    "message": "\ube44\ubc00\ubc88\ud638\uac00 \uc131\uacf5\uc801\uc73c\ub85c \ubcc0\uacbd\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
                    "status": "success",
                }
            ),
            200,
        )

    except Exception:
        print("change_password error:", traceback.format_exc())
        return (
            jsonify(
                {
                    "message": "\uc11c\ubc84 \uc624\ub958",
                    "status": "error",
                }
            ),
            500,
        )
