import Starburst from './Starburst';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <Starburst className="footer__burst" />
          <span className="logo__jax">JAX</span>
          <span className="logo__world">WORLD</span>
          <span className="logo__script">Carwash-O-Matic</span>
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <a href="#wash">The wash</a>
          <a href="#motion">Motion system</a>
          <a href="#modular">Modular</a>
          <a href="#platform">Platform</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer__disclaimer">
          Jax World Carwash-O-Matic is an early-stage autonomous vehicle-care concept. Product visuals illustrate the proposed system architecture and
          experience.
        </p>
        <p className="footer__small mono">© 2026 Jax World · Concept demonstration · Sample data where shown</p>
      </div>
    </footer>
  );
}
