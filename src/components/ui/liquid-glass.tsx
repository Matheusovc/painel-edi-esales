"use client";

import React from "react";

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  /** 'nav' = blue-tinted floating navbar style; 'card' = dark neutral content card */
  variant?: "nav" | "card";
}

const VARIANTS = {
  nav: {
    gradient: [
      "linear-gradient(160deg,",
      "rgba(65,85,175,0.88) 0%,",
      "rgba(30,42,95,0.90) 50%,",
      "rgba(18,25,65,0.92) 100%)",
    ].join(" "),
    shimmer: "radial-gradient(ellipse 60% 40% at 25% 0%, rgba(255,255,255,0.11) 0%, transparent 70%)",
    reflex:  "radial-gradient(ellipse 50% 40% at 85% 100%, rgba(130,80,255,0.10) 0%, transparent 70%)",
    shadow: [
      "0 0 0 1px rgba(255,255,255,0.16)",
      "0 8px 40px rgba(0,0,0,0.65)",
      "0 4px 28px rgba(70,100,255,0.28)",
      "0 1px 0 rgba(255,255,255,0.30) inset",
      "0 -1px 0 rgba(0,0,0,0.20) inset",
    ].join(", "),
    cursor: "cursor-pointer",
  },
  card: {
    gradient: [
      "linear-gradient(160deg,",
      "rgba(22,30,65,0.86) 0%,",
      "rgba(10,14,35,0.90) 55%,",
      "rgba(6,9,22,0.93) 100%)",
    ].join(" "),
    shimmer: "radial-gradient(ellipse 50% 35% at 20% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)",
    reflex:  "radial-gradient(ellipse 40% 30% at 90% 100%, rgba(80,50,180,0.07) 0%, transparent 70%)",
    shadow: [
      "0 0 0 1px rgba(255,255,255,0.10)",
      "0 4px 24px rgba(0,0,0,0.55)",
      "0 2px 16px rgba(40,60,160,0.16)",
      "0 1px 0 rgba(255,255,255,0.18) inset",
      "0 -1px 0 rgba(0,0,0,0.15) inset",
    ].join(", "),
    cursor: "cursor-default",
  },
} as const;

export const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
  variant = "nav",
}) => {
  const v = VARIANTS[variant];

  const glassStyle: React.CSSProperties = {
    boxShadow: v.shadow,
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex overflow-hidden transition-all duration-500 ${v.cursor} ${className}`}
      style={glassStyle}
    >
      {/* Layer 1: backdrop blur + SVG distortion */}
      <div
        className="absolute inset-0 z-0 rounded-[inherit]"
        style={{
          backdropFilter: "blur(20px) saturate(180%) brightness(1.08)",
          WebkitBackdropFilter: "blur(20px) saturate(180%) brightness(1.08)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />

      {/* Layer 2: base tint */}
      <div
        className="absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: v.gradient }}
      />

      {/* Layer 3: top-left shimmer */}
      <div
        className="absolute inset-0 z-20 rounded-[inherit] pointer-events-none"
        style={{ background: v.shimmer }}
      />

      {/* Layer 4: bottom-right purple reflex */}
      <div
        className="absolute inset-0 z-20 rounded-[inherit] pointer-events-none"
        style={{ background: v.reflex }}
      />

      {/* Layer 5: top edge specular highlight */}
      <div
        className="absolute left-0 right-0 top-0 z-30 pointer-events-none rounded-t-[inherit]"
        style={{
          height: "2px",
          background: [
            "linear-gradient(90deg,",
            "transparent 0%,",
            "rgba(255,255,255,0.15) 8%,",
            "rgba(255,255,255,0.68) 28%,",
            "rgba(255,255,255,0.88) 50%,",
            "rgba(255,255,255,0.68) 72%,",
            "rgba(255,255,255,0.15) 92%,",
            "transparent 100%)",
          ].join(" "),
        }}
      />

      {/* Layer 6: left edge specular */}
      <div
        className="absolute top-0 left-0 bottom-0 z-30 pointer-events-none rounded-l-[inherit]"
        style={{
          width: "1px",
          background: [
            "linear-gradient(180deg,",
            "rgba(255,255,255,0.50) 0%,",
            "rgba(255,255,255,0.18) 40%,",
            "transparent 100%)",
          ].join(" "),
        }}
      />

      {/* Content */}
      <div className="relative z-40 w-full">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
};

export const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }} aria-hidden="true">
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="180"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);
