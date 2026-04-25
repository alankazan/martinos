import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACTIONS } from "../../constants/launcher";

interface ControllerVisualProps {
  mapping: Record<string, string>;
  activeButton: string | null;
  onSelectButton: (id: string) => void;
  pressedButtons: Set<string>;
}

// ── Button hit-points (calibrated to the SVG controller below) ─────────────
const BUTTONS = [
  { id:"0",  label:"A",    x:608, y:268, color:"#4ade80" },
  { id:"1",  label:"B",    x:642, y:234, color:"#f87171" },
  { id:"2",  label:"X",    x:574, y:234, color:"#60a5fa" },
  { id:"3",  label:"Y",    x:608, y:200, color:"#facc15" },
  { id:"4",  label:"LB",   x:206, y:150, color:"#ff9800" },
  { id:"5",  label:"RB",   x:694, y:150, color:"#ff9800" },
  { id:"6",  label:"LT",   x:188, y:102, color:"#ff9800" },
  { id:"7",  label:"RT",   x:712, y:102, color:"#ff9800" },
  { id:"8",  label:"View", x:370, y:254, color:"#ff9800" },
  { id:"9",  label:"Menu", x:494, y:254, color:"#ff9800" },
  { id:"10", label:"L3",   x:288, y:242, color:"#ff9800" },
  { id:"11", label:"R3",   x:536, y:340, color:"#ff9800" },
  { id:"12", label:"D↑",   x:210, y:322, color:"#ff9800" },
  { id:"13", label:"D↓",   x:210, y:368, color:"#ff9800" },
  { id:"14", label:"D←",   x:186, y:345, color:"#ff9800" },
  { id:"15", label:"D→",   x:234, y:345, color:"#ff9800" },
];

// Left side: ids that show their label on the left column
const LEFT_IDS = new Set(["4","6","8","10","12","13","14","15"]);

// Fixed label Y per id so they don't overlap
const LABEL_Y: Record<string,number> = {
  "6":52, "7":52,
  "4":100,"5":100,
  "8":155,"9":155,
  "10":210,"11":390,
  "14":265,"15":310,
  "12":360,"0":215,
  "13":430,"1":265,
  "2":315,
  "3":165,
};

const ACCENT  = "#ff9800";
const PURPLE  = "#7e57c2";
const DOT_R   = 9;
const LBL_W   = 130;

export const ControllerVisual: React.FC<ControllerVisualProps> = ({
  mapping, activeButton, onSelectButton, pressedButtons,
}) => {
  return (
    <div style={{ width:"100%", height:"100%", minHeight:480, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg viewBox="0 0 900 500" style={{ width:"100%", height:"100%", maxWidth:920 }}>
        <defs>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
          {/* Controller body gradient */}
          <linearGradient id="body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3a50"/>
            <stop offset="100%" stopColor="#22222f"/>
          </linearGradient>
          <linearGradient id="grip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e2e40"/>
            <stop offset="100%" stopColor="#18181f"/>
          </linearGradient>
          <radialGradient id="stick-g" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#4a4a60"/>
            <stop offset="100%" stopColor="#18181f"/>
          </radialGradient>
          <radialGradient id="home-g" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3d2060"/>
            <stop offset="100%" stopColor="#180a30"/>
          </radialGradient>
        </defs>

        {/* ── CONTROLLER BODY ──────────────────────────────────────── */}

        {/* Left grip */}
        <path d="M162,350 Q135,400 128,445 Q125,470 155,478 Q200,488 240,454 Q268,430 276,394 L238,326 Z"
              fill="url(#grip)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>
        {/* Right grip */}
        <path d="M738,350 Q765,400 772,445 Q775,470 745,478 Q700,488 660,454 Q632,430 624,394 L662,326 Z"
              fill="url(#grip)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5"/>

        {/* Main body */}
        <path d="M195,130 L605,130 Q670,130 710,170 Q740,205 738,290 L700,340 L660,326 L624,394 L276,394 L240,326 L200,340 L162,290 Q160,205 190,170 Q220,130 195,130 Z"
              fill="url(#body)" stroke="rgba(255,255,255,0.09)" strokeWidth="2"/>

        {/* Left trigger slab */}
        <path d="M158,125 Q162,84 198,76 L274,76 L290,130 L195,130 Z"
              fill="#2a2a3a" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
        {/* Right trigger slab */}
        <path d="M742,125 Q738,84 702,76 L626,76 L610,130 L705,130 Z"
              fill="#2a2a3a" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>

        {/* Top centre plate */}
        <path d="M310,130 L590,130 Q590,215 450,215 Q310,215 310,130 Z"
              fill="#18181f" opacity="0.6"/>

        {/* ── HARDWARE COMPONENTS ──────────────────────────────────── */}

        {/* Left stick base */}
        <circle cx="288" cy="242" r="40" fill="#111118"/>
        <circle cx="288" cy="242" r="31" fill="url(#stick-g)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

        {/* Right stick base */}
        <circle cx="536" cy="340" r="40" fill="#111118"/>
        <circle cx="536" cy="340" r="31" fill="url(#stick-g)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

        {/* D-Pad cross */}
        <rect x="186" y="325" width="48" height="20" rx="5" fill="#111118"/>
        <rect x="200" y="311" width="20" height="48" rx="5" fill="#111118"/>

        {/* Xbox home button */}
        <circle cx="450" cy="185" r="28" fill="url(#home-g)" stroke="rgba(126,87,194,0.5)" strokeWidth="2"/>
        <text x="450" y="192" textAnchor="middle" fill="rgba(255,255,255,0.75)" style={{fontSize:18,fontWeight:900}}>✕</text>

        {/* View button */}
        <circle cx="370" cy="254" r="13" fill="#202030" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
        <text x="370" y="259" textAnchor="middle" fill="rgba(255,255,255,0.5)" style={{fontSize:9,fontWeight:700}}>⧉</text>

        {/* Menu button */}
        <circle cx="494" cy="254" r="13" fill="#202030" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
        <text x="494" y="259" textAnchor="middle" fill="rgba(255,255,255,0.5)" style={{fontSize:9,fontWeight:700}}>≡</text>

        {/* ABXY face buttons */}
        {[
          {x:608,y:268,c:"#1a3a1a",bc:"#4ade80",t:"A"},
          {x:642,y:234,c:"#3a1a1a",bc:"#f87171",t:"B"},
          {x:574,y:234,c:"#1a2a3a",bc:"#60a5fa",t:"X"},
          {x:608,y:200,c:"#3a3a1a",bc:"#facc15",t:"Y"},
        ].map(b => (
          <g key={b.t}>
            <circle cx={b.x} cy={b.y} r="17" fill={b.c} stroke={b.bc} strokeWidth="1.5" opacity="0.8"/>
            <text x={b.x} y={b.y+5} textAnchor="middle" fill={b.bc}
                  style={{fontSize:11,fontWeight:900,pointerEvents:"none"}}>{b.t}</text>
          </g>
        ))}

        {/* LB / RB bumpers */}
        <rect x="166" y="138" width="82" height="22" rx="8" fill="#252535" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
        <rect x="652" y="138" width="82" height="22" rx="8" fill="#252535" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

        {/* ── CALLOUT DOTS & LABELS ────────────────────────────────── */}
        {BUTTONS.map(btn => {
          const isPressed = pressedButtons.has(btn.id);
          const isActive  = activeButton === btn.id;
          const action    = ACTIONS[mapping[btn.id]];
          const isLeft    = LEFT_IDS.has(btn.id);
          const ly        = LABEL_Y[btn.id] ?? 250;
          const colX      = isLeft ? 15 : 755;
          const lineEndX  = isLeft ? colX + LBL_W : colX;
          const dotColor  = isActive ? PURPLE : ACCENT;

          return (
            <g key={btn.id} onClick={() => onSelectButton(btn.id)} style={{cursor:"pointer"}}>

              {/* Polyline: dot → elbow → column */}
              <polyline
                points={`${btn.x},${btn.y} ${isLeft ? btn.x-18 : btn.x+18},${ly} ${lineEndX},${ly}`}
                fill="none"
                stroke={isActive ? PURPLE : "rgba(255,152,0,0.45)"}
                strokeWidth={isActive ? 1.8 : 1.2}
              />

              {/* Label box */}
              <g transform={`translate(${colX},${ly-13})`}>
                <rect width={LBL_W} height="26" rx="6"
                      fill={isActive ? `${PURPLE}28` : "rgba(255,255,255,0.04)"}
                      stroke={isActive ? PURPLE : "rgba(255,152,0,0.3)"}/>
                <text x="7" y="18"
                      fill={isActive ? "#d0c8ff" : "rgba(255,255,255,0.6)"}
                      style={{fontSize:9.5,fontWeight: isActive ? 800 : 600}}>
                  <tspan fill={isActive ? PURPLE : ACCENT} fontWeight="900">{btn.label}</tspan>
                  {"  "}{action?.label ?? "---"}
                </text>
              </g>

              {/* Glow when pressed */}
              <AnimatePresence>
                {isPressed && (
                  <motion.circle cx={btn.x} cy={btn.y} r={DOT_R+10}
                    fill={btn.color}
                    initial={{opacity:0,scale:0.5}}
                    animate={{opacity:0.6,scale:1.6}}
                    exit={{opacity:0}}
                    style={{filter:"blur(12px)"}}
                  />
                )}
              </AnimatePresence>

              {/* Main callout dot */}
              <motion.circle cx={btn.x} cy={btn.y} r={isActive ? DOT_R+2 : DOT_R}
                fill={isPressed ? btn.color : dotColor}
                stroke={isPressed ? "#fff" : "rgba(0,0,0,0.5)"}
                strokeWidth="2"
                animate={{scale: isPressed ? 0.82 : 1}}
                style={{filter: (isActive||isPressed) ? "url(#glow)" : "none"}}
              />

              <text x={btn.x} y={btn.y+4} textAnchor="middle"
                    fill="#000" style={{fontSize:7,fontWeight:900,pointerEvents:"none"}}>
                {btn.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
