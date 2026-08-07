"use client";

import { useEffect, useRef } from "react";

export default function ScrollReveal({ children, className = "", delay = 0 }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add("is-visible");
        observer.unobserve(element);
      }
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={elementRef} className={`scroll-reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` }}>{children}</div>;
}
