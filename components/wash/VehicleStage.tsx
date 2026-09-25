'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { WashScene } from './WashScene';

/**
 * Hosts the WebGL canvas. The Three.js scene is imported lazily so the page
 * shell and hero copy paint before any 3D code downloads.
 */
export default function VehicleStage({ sceneRef }: { sceneRef: MutableRefObject<WashScene | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    let scene: WashScene | null = null;
    let ro: ResizeObserver | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    import('./WashScene')
      .then(({ WashScene }) => {
        if (cancelled) return;
        scene = new WashScene(canvas);
        const resize = () => {
          const r = canvas.getBoundingClientRect();
          scene?.resize(r.width, r.height);
        };
        resize();
        ro = new ResizeObserver(resize);
        ro.observe(canvas);
        sceneRef.current = scene;
        setStatus('ready');
      })
      .catch((err) => {
        console.error('Wash scene failed to start', err);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      ro?.disconnect();
      sceneRef.current = null;
      scene?.dispose();
    };
  }, [sceneRef]);

  return (
    <div className="stage" data-status={status}>
      <canvas ref={canvasRef} className="stage__canvas" aria-hidden="true" />
      {status === 'loading' && <p className="stage__status mono">Initialising bay · loading geometry…</p>}
      {status === 'error' && (
        <p className="stage__status mono">
          3D preview unavailable on this device. The wash sequence is described in the captions and below.
        </p>
      )}
    </div>
  );
}
