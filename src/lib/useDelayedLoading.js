"use client";

import { useEffect, useRef, useState } from "react";

export default function useDelayedLoading(isLoading, { delay = 150, minDuration = 300 } = {}) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    let timer;
    if (isLoading && !visible) {
      timer = window.setTimeout(() => { shownAt.current = Date.now(); setVisible(true); }, delay);
    } else if (!isLoading && visible) {
      timer = window.setTimeout(() => setVisible(false), Math.max(0, minDuration - (Date.now() - shownAt.current)));
    }
    return () => window.clearTimeout(timer);
  }, [isLoading, visible, delay, minDuration]);
  return visible;
}
