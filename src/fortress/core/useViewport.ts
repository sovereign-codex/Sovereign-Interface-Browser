import { useEffect, useState } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg';

type Orientation = 'portrait' | 'landscape';

interface ViewportState {
  size: { width: number; height: number };
  orientation: Orientation;
  breakpoint: Breakpoint;
}

const getBreakpoint = (width: number): Breakpoint => {
  if (width < 480) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  return 'lg';
};

const getOrientation = (width: number, height: number): Orientation =>
  height >= width ? 'portrait' : 'landscape';

export const useViewport = (): ViewportState => {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        size: { width: 1024, height: 768 },
        orientation: 'landscape',
        breakpoint: 'md',
      };
    }
    const { innerWidth, innerHeight } = window;
    return {
      size: { width: innerWidth, height: innerHeight },
      orientation: getOrientation(innerWidth, innerHeight),
      breakpoint: getBreakpoint(innerWidth),
    };
  });

  useEffect(() => {
    const handleResize = (): void => {
      const { innerWidth, innerHeight } = window;
      setViewport({
        size: { width: innerWidth, height: innerHeight },
        orientation: getOrientation(innerWidth, innerHeight),
        breakpoint: getBreakpoint(innerWidth),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};
