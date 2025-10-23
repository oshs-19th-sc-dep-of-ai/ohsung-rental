from flask import Blueprint, request, jsonify
from utils.database_util import DatabaseManager

catalog_bp = Blueprint("catalog", __name__)

def _as_dict_rows(rows, keys):
    if not rows:
        return []
    if isinstance(rows[0], (list, tuple)):
        return [dict(zip(keys, r)) for r in rows]
    return rows

@catalog_bp.route("/categories", methods=["GET"])
def list_categories():
    db = DatabaseManager()
    sql = """
      SELECT
        p.category,
        COUNT(*) AS total,
        SUM(
          CASE WHEN EXISTS (
            SELECT 1 FROM Rentals r
            WHERE r.product_id = p.product_id
              AND r.rental_status IN (0,1)  -- 0: 대여중, 1: 반납대기
          ) THEN 0 ELSE 1 END
        ) AS available
      FROM Products p
      WHERE p.available = 1
      GROUP BY p.category
      ORDER BY p.category
    """
    res = db.query_many(sql, {})  # 쿼리값
    rows = _as_dict_rows(res.result, ["category", "total", "available"])
    return jsonify({"status": "success", "categories": rows}), 200

@catalog_bp.route("/products", methods=["GET"])
def list_products():
    category = request.args.get("category")
    if not category:
        return jsonify({"status": "error", "message": "category is required"}), 400

    db = DatabaseManager()
    sql = """
      SELECT
        p.product_id,
        p.product_name,
        p.product_id AS display_no,
        CASE WHEN EXISTS (
          SELECT 1 FROM Rentals r
          WHERE r.product_id = p.product_id
            AND r.rental_status IN (0,1)
        ) THEN 0 ELSE 1 END AS is_available
      FROM Products p
      WHERE p.available = 1 AND p.category = %(category)s
      ORDER BY p.product_id
    """
    res = db.query_many(sql, {"category": category})  # 쿼리값
    rows = _as_dict_rows(res.result, ["product_id", "product_name", "display_no", "is_available"])
    return jsonify({"status": "success", "products": rows}), 200
