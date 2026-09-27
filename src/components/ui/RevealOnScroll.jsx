"use client";

import { useEffect, useRef } from "react";

export default function RevealOnScroll({ children, className = "", style }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element?.classList.add("is-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add("is-visible");
        observer.unobserve(element);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={elementRef} style={style} className={`reveal-on-scroll ${className}`}>{children}</div>;
}
