import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Counts up to a value by writing to the DOM directly, so animation frames never re-render React. */
export function AnimatedNumber({ value }) {
  const nodeRef = useRef(null);
  const displayedValue = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = nodeRef.current;
    const render = (latest) => {
      displayedValue.current = latest;
      node.textContent = Math.round(latest).toLocaleString();
    };

    if (reduceMotion) {
      render(value);
      return undefined;
    }

    const controls = animate(displayedValue.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: render,
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span ref={nodeRef} className="tabular-nums">
      0
    </span>
  );
}
