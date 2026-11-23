// GSAP, set up once. Every animated component imports from here, so the plugins are
// registered before any of them runs.
//
// ScrollTrigger ties motion to the scroll (the landing's pinned stuck scene); DrawSVG draws
// a line along its length (the map's stem, the trace). Both are free since GSAP 3.13.

import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);

/** True when the system asks for less motion: the page then shows everything finished. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, useGSAP };
