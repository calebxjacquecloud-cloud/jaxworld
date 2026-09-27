'use client';

import './styles/base.css';
import './styles/film.css';
import './styles/sections.css';
import Header from './components/Header';
import Overview from './components/Overview';
import Film from './film/Film';
import Franchise from './sections/Franchise';
import Platform from './sections/Platform';
import Console from './sections/Console';
import TwoIntelligences from './sections/TwoIntelligences';
import Market from './sections/Market';
import Thesis from './sections/Thesis';
import Autonomous from './sections/Autonomous';
import Interior from './sections/Interior';
import FinalScale from './sections/FinalScale';
import Brief, { Footer } from './sections/Brief';

/**
 * The VC / strategic-partner narrative, in order:
 *   Film   · problem → inversion → the machine → condition intelligence → productization → deployment
 *   Network · franchise → the Jax World platform → the operating view → two kinds of intelligence
 *   Future · why now → physical AI → autonomous fleets → interior robotics → final scale → the ask
 */
export default function VcSite() {
  return (
    <div className="vx">
      <a className="vx-skip" href="#franchise">
        Skip the film
      </a>
      <Header />
      <main>
        <Film />
        <Franchise />
        <Platform />
        <Console />
        <TwoIntelligences />
        <Market />
        <Thesis />
        <Autonomous />
        <Interior />
        <FinalScale />
        <Brief />
      </main>
      <Footer />
      <Overview />
    </div>
  );
}
