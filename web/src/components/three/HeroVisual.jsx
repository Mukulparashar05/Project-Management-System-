import { Component, lazy, Suspense, useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { SceneFallback } from './SceneFallback.jsx';
import { isWebGL2Available } from './webgl.js';

// Loaded on demand so three.js never delays the login form.
const ProjectOrbitScene = lazy(() => import('./ProjectOrbitScene.jsx'));

class SceneErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('3D scene unavailable, showing the static illustration instead.', error);
  }

  render() {
    return this.state.failed ? <SceneFallback /> : this.props.children;
  }
}

/**
 * Decorative hero visual. Falls back to a static SVG when WebGL 2 is missing, the scene
 * fails to load or render, or the GPU context is lost. It never affects the auth forms.
 */
export function HeroVisual({ variant = 'full' }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [webglAvailable] = useState(isWebGL2Available);
  const [contextLost, setContextLost] = useState(false);

  if (!webglAvailable || contextLost) return <SceneFallback />;

  return (
    <SceneErrorBoundary>
      <Suspense fallback={null}>
        <ProjectOrbitScene
          variant={variant}
          reducedMotion={reducedMotion}
          onContextLost={() => setContextLost(true)}
        />
      </Suspense>
    </SceneErrorBoundary>
  );
}
