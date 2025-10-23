import "./footer.css";

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="home-footer__inner">
        <div className="home-footer__brand">
          <div className="home-footer__mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="home-footer__title">양심물품 대여</p>
            <p className="home-footer__subtitle">천안오성고 AI융합부</p>
          </div>
        </div>

        <div className="home-footer__links">
          <a
            href="https://www.instagram.com/os.19.sc/"
            target="_blank"
            rel="noreferrer"
          >
            학생회 인스타그램
          </a>
          <a href="mailto:admin@ohsung.hs.kr">문의하기</a>
        </div>

        <p className="home-footer__copyright">
          © {new Date().getFullYear()} Ohsung Rental. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
