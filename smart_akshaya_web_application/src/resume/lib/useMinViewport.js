import { useState, useEffect } from 'react';

/** Minimum viewport width for Resume Studio (laptop / monitor). */
export const RESUME_STUDIO_MIN_WIDTH = 1024;

/** True when viewport width is at least `minWidth` px (e.g. laptop / monitor). */
export function useMinViewport(minWidth) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= minWidth : true
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [minWidth]);

  return matches;
}
