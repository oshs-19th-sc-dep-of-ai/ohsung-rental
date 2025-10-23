from pathlib import Path

from flask                 import Flask
from flask_cors            import CORS
from flask_session         import Session

from utils.database_util import DatabaseManager
from utils.config_util import ConfigManager as Config

from routes.auth import auth_bp
from routes.profile_route import profile_bp
from routes.rental import rental_bp
from routes.rental_return import rental_return_bp
from routes.admin import admin_bp
from routes.catalog import catalog_bp

app = Flask(__name__)

# 프론트엔드와 세션 유지 가능하게 설정 (프론트엔드에서 꼭 withCredentials: true 확인!)
ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS(app, supports_credentials=True, resources={r"/*": {"origins": ALLOWED_ORIGINS}})
Config().read_file(str(Path(__file__).resolve().with_name("config.json")))

# Flask 세션 설정 추가
app.config['SECRET_KEY']         = Config().get()["Session"]["Key"]
app.config['SESSION_TYPE']       = Config().get()["Session"]["Type"]
app.config['SESSION_PERMANENT']  = Config().get()["Session"]["Permanent"]
app.config['SESSION_USE_SIGNER'] = Config().get()["Session"]["UseSigner"]
app.config['SESSION_KEY_PREFIX'] = Config().get()["Session"]["KeyPrefix"]

# ★ 로컬 개발환경에서 쿠키 전달 보장 (CORS + 다른 포트 사용 시 필수)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'   # 프론트/백엔드 포트가 달라도 쿠키 전달
app.config['SESSION_COOKIE_SECURE']   = False   # http 환경에서는 False (https에서만 True)

Session(app)

# 데이터베이스 연결 초기화
DatabaseManager().connect(
    host     = Config().get()["Database"]["Host"],
    username = Config().get()["Database"]["Username"],
    password = Config().get()["Database"]["Password"],
)

# 블루프린트 등록
app.register_blueprint(auth_bp)           # 로그인 & 로그아웃
app.register_blueprint(profile_bp)        # 프로필 조회
app.register_blueprint(rental_bp)         # 대여 기능
app.register_blueprint(rental_return_bp)  # 반납 기능
app.register_blueprint(admin_bp)          # 어드민(관리자) 기능
app.register_blueprint(catalog_bp)        # 제품 조회

if __name__ == '__main__':
    try:
        app.run(debug=True)
    except KeyboardInterrupt:
        DatabaseManager().close()
