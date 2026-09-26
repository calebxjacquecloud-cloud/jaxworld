import Starburst from './Starburst';
import ActIndicator from './ActIndicator';

export default function Header() {
  return (
    <header className="site-header">
      <a className="logo" href="#top" aria-label="Jax World Carwash-O-Matic, back to top">
        <Starburst className="logo__burst" />
        <span className="logo__jax">JAX</span>
        <span className="logo__world">WORLD</span>
        <span className="logo__script">Carwash-O-Matic</span>
      </a>
      <ActIndicator />
      <nav className="site-nav" aria-label="Primary">
        <a href="#machine">Machine</a>
        <a href="#modular">System</a>
        <a href="#platform">Network</a>
        <a href="#future">Future</a>
        <a className="site-nav__cta" href="#contact">
          Request<span className="site-nav__long"> the brief</span>
        </a>
      </nav>
    </header>
  );
}
