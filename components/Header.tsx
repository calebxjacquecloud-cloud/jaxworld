import Starburst from './Starburst';

export default function Header() {
  return (
    <header className="site-header">
      <a className="logo" href="#top" aria-label="Jax World Carwash-O-Matic, back to top">
        <Starburst className="logo__burst" />
        <span className="logo__jax">JAX</span>
        <span className="logo__world">WORLD</span>
        <span className="logo__script">Carwash-O-Matic</span>
      </a>
      <nav className="site-nav" aria-label="Primary">
        <a href="#wash">The wash</a>
        <a href="#motion">Motion</a>
        <a href="#modular">Modular</a>
        <a href="#platform">Platform</a>
        <a className="site-nav__cta" href="#contact">
          Partner<span className="site-nav__long"> with Jax World</span>
        </a>
      </nav>
    </header>
  );
}
