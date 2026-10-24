"use client";

import { useRef, useState } from "react";
import AppIcon from "@/components/app/icons";

const slides = [
  ["Find your route", "Search Faisalabad routes and stops to plan the right journey.", "Routes"],
  ["Follow the bus live", "See route and bus information as it changes.", "Map"],
  ["Book your seat", "Choose a route, select a seat, and manage your trips.", "Ticket"],
];

export default function Onboarding({ onDone }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);
  const finish = () => {
    try { localStorage.setItem("ss-onboarded", "1"); } catch (_error) {}
    onDone();
  };
  const [title, detail, icon] = slides[index];
  return <div className="ss-onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
      if (touchStart.current == null) return;
      const distance = event.changedTouches[0]?.clientX - touchStart.current;
      touchStart.current = null;
      if (distance < -48) setIndex((value) => Math.min(slides.length - 1, value + 1));
      else if (distance > 48) setIndex((value) => Math.max(0, value - 1));
    }}>
    <button className="ss-onboarding-skip" onClick={finish}>Skip</button>
    <div className="ss-onboarding-art"><span><AppIcon name={icon} size={44} /></span><i /><i /><i /></div>
    <p className="ss-eyebrow">SMART SAFAR · FAISALABAD</p>
    <h2 id="onboarding-title">{title}</h2><p className="ss-muted">{detail}</p>
    <div className="ss-onboarding-dots" aria-label={`Slide ${index + 1} of ${slides.length}`}>{slides.map((item, dot) => <span key={item[0]} className={dot === index ? "active" : ""} />)}</div>
    <button className="ss-primary-button" onClick={() => index === slides.length - 1 ? finish() : setIndex((value) => value + 1)}>{index === slides.length - 1 ? "Get started" : "Next"}</button>
  </div>;
}
