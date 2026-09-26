'use client';

import Header from './Header';
import WashExperience from './WashExperience';
import WashRecap from './sections/WashRecap';
import MotionAnalogy from './sections/MotionAnalogy';
import DeploymentVisual from './sections/DeploymentVisual';
import PhysicalAI from './PhysicalAI';
import AutonomousFuture from './AutonomousFuture';
import InteriorPhase from './InteriorPhase';
import OperationsPlatform from './OperationsPlatform';
import CallToAction from './sections/CallToAction';
import Footer from './Footer';

export default function Site() {
  return (
    <>
      <a className="skip" href="#after-demo">
        Skip the interactive demo
      </a>
      <Header />
      <main id="top">
        <WashExperience />
        <div id="after-demo" />
        <WashRecap />
        <MotionAnalogy />
        <DeploymentVisual />
        <PhysicalAI />
        <AutonomousFuture />
        <InteriorPhase />
        <OperationsPlatform />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
