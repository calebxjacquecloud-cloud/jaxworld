'use client';

import Header from './Header';
import WashExperience from './WashExperience';
import DeploymentVisual from './sections/DeploymentVisual';
import OperationsPlatform from './OperationsPlatform';
import PhysicalAI from './PhysicalAI';
import AutonomousFuture from './AutonomousFuture';
import InteriorPhase from './InteriorPhase';
import FinalVision from './FinalVision';
import CallToAction from './sections/CallToAction';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

/**
 * The story, in order: garage + road trip (problem) → the machine → the
 * container (system) → where it goes → the network → the thesis → the
 * autonomous future → roadmap → final vision → the ask. The how-it-works
 * reference sits collapsed at the end.
 */
export default function Site() {
  return (
    <>
      <a className="skip" href="#after-demo">
        Skip to overview
      </a>
      <Header />
      <main id="top">
        <WashExperience />
        <div id="after-demo" />
        <DeploymentVisual />
        <OperationsPlatform />
        <PhysicalAI />
        <AutonomousFuture />
        <InteriorPhase />
        <FinalVision />
        <CallToAction />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}
