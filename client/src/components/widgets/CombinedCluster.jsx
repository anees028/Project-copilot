import React from 'react';

export const CombinedCluster = ({ speed, rpm, fuel = 75, temp = 90 }) => {
  // --- CONFIGURATION ---
  const WIDTH = 900;
  const HEIGHT = 400;
  
  // SPEEDOMETER CONFIG (Right Side)
  const SPEED_CENTER = { x: 550, y: 200 };
  const SPEED_RADIUS = 140;
  const MAX_SPEED = 220;
  const SPEED_START_ANGLE = 135;
  const SPEED_END_ANGLE = 405;

  // RPM CONFIG (Left Side - Smaller)
  const RPM_CENTER = { x: 220, y: 230 }; // Lower and to the left
  const RPM_RADIUS = 100;
  const MAX_RPM = 8000;
  const RPM_START_ANGLE = 135;
  const RPM_END_ANGLE = 360; // Doesn't go all the way around

  // --- MATH HELPERS ---
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const calculateAngle = (value, max, start, end) => {
    const percentage = value / max;
    return start + (percentage * (end - start));
  };

  // --- DRAWING FUNCTIONS ---
  
  // 1. GENERATE TICKS FOR SPEEDOMETER
  const renderSpeedTicks = () => {
    const ticks = [];
    for (let i = 0; i <= MAX_SPEED; i += 10) {
      const isMajor = i % 20 === 0;
      const angle = calculateAngle(i, MAX_SPEED, SPEED_START_ANGLE, SPEED_END_ANGLE);
      
      const innerR = isMajor ? SPEED_RADIUS - 20 : SPEED_RADIUS - 10;
      const outerR = SPEED_RADIUS;
      
      const p1 = polarToCartesian(SPEED_CENTER.x, SPEED_CENTER.y, innerR, angle);
      const p2 = polarToCartesian(SPEED_CENTER.x, SPEED_CENTER.y, outerR, angle);
      
      // Text Numbers (Only for major ticks)
      const textP = polarToCartesian(SPEED_CENTER.x, SPEED_CENTER.y, SPEED_RADIUS - 35, angle);

      ticks.push(
        <g key={`speed-${i}`}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
            stroke="white" strokeWidth={isMajor ? 3 : 1} />
          {isMajor && (
            <text x={textP.x} y={textP.y} fill="white" fontSize="18" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fontFamily="monospace">
              {i}
            </text>
          )}
        </g>
      );
    }
    return ticks;
  };

  // 2. GENERATE TICKS FOR RPM
  const renderRpmTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 8; i += 0.5) { // 0 to 8 x1000
      const isMajor = Number.isInteger(i);
      const angle = calculateAngle(i * 1000, MAX_RPM, RPM_START_ANGLE, RPM_END_ANGLE);
      
      const innerR = isMajor ? RPM_RADIUS - 15 : RPM_RADIUS - 8;
      const outerR = RPM_RADIUS;
      
      const p1 = polarToCartesian(RPM_CENTER.x, RPM_CENTER.y, innerR, angle);
      const p2 = polarToCartesian(RPM_CENTER.x, RPM_CENTER.y, outerR, angle);
      
      const textP = polarToCartesian(RPM_CENTER.x, RPM_CENTER.y, RPM_RADIUS - 30, angle);

      // Redline Logic (6k+)
      const isRedline = i >= 6;
      const color = isRedline ? "#ef4444" : "white";

      ticks.push(
        <g key={`rpm-${i}`}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
            stroke={color} strokeWidth={isMajor ? 3 : 1} />
          {isMajor && (
            <text x={textP.x} y={textP.y} fill={color} fontSize="16" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
              {i}
            </text>
          )}
        </g>
      );
    }
    return ticks;
  };

  // 3. FUEL GAUGE (Vertical Bar on Right)
  const renderFuel = () => {
    const x = 780;
    const yTop = 140;
    const height = 120;
    const filledH = (fuel / 100) * height;
    
    return (
      <g>
         {/* Container */}
         <rect x={x} y={yTop} width="16" height={height} rx="4" fill="#1e293b" stroke="#334155" />
         {/* Fill */}
         <rect x={x+2} y={yTop + (height - filledH) + 2} width="12" height={filledH - 4} rx="2" 
               fill={fuel < 20 ? "#ef4444" : "white"} />
         {/* Icons */}
         <text x={x+8} y={yTop - 15} fill="white" textAnchor="middle" fontSize="12">F</text>
         <text x={x+8} y={yTop + height + 20} fill="white" textAnchor="middle" fontSize="12">E</text>
      </g>
    );
  };

  // --- NEEDLE ANGLES ---
  const speedAngle = calculateAngle(speed, MAX_SPEED, SPEED_START_ANGLE, SPEED_END_ANGLE);
  const rpmAngle = calculateAngle(rpm, MAX_RPM, RPM_START_ANGLE, RPM_END_ANGLE);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl">
      
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full max-w-4xl">
       
        <defs>
          {/* GLOW FILTER FOR BLUE RING */}
          <filter id="blue-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* --- BACKGROUND SHAPE (The "Dashboard" Housing) --- */}
        <path d="M 100,350 Q 220,100 400,100 Q 550,100 800,350" fill="none" stroke="#1e293b" strokeWidth="2" opacity="0.5"/>

        {/* ========================================= */}
        {/* LEFT: RPM GAUGE */}
        {/* ========================================= */}
        <g>
          {/* Ticks */}
          {renderRpmTicks()}
          {/* Label */}
          <text x={RPM_CENTER.x} y={RPM_CENTER.y + 60} fill="#94a3b8" fontSize="10" textAnchor="middle" letterSpacing="2">RPM x 1000</text>
          
          {/* NEEDLE (Rotated) */}
          <g transform={`rotate(${rpmAngle}, ${RPM_CENTER.x}, ${RPM_CENTER.y})`}>
            {/* The needle is drawn pointing UP (0 deg), then rotated */}
            <path d={`M ${RPM_CENTER.x - 5},${RPM_CENTER.y} L ${RPM_CENTER.x},${RPM_CENTER.y - RPM_RADIUS + 10} L ${RPM_CENTER.x + 5},${RPM_CENTER.y}`} fill="#ef4444" filter="url(#blue-glow)" />
            <circle cx={RPM_CENTER.x} cy={RPM_CENTER.y} r="8" fill="#334155" stroke="white" strokeWidth="2" />
          </g>
        </g>

        {/* ========================================= */}
        {/* CENTER/RIGHT: SPEEDOMETER (Dominant) */}
        {/* ========================================= */}
        <g>
          {/* Blue Halo Ring */}
          <circle cx={SPEED_CENTER.x} cy={SPEED_CENTER.y} r={SPEED_RADIUS + 5} 
            fill="none" stroke="#3b82f6" strokeWidth="4" strokeOpacity="0.6" filter="url(#blue-glow)" />
            
          {/* Ticks */}
          {renderSpeedTicks()}
          
          {/* Digital Speed Readout (Center) */}
          <text x={SPEED_CENTER.x} y={SPEED_CENTER.y + 50} fill="white" fontSize="24" fontWeight="bold" textAnchor="middle">
             KM/H
          </text>
          <text x={SPEED_CENTER.x} y={SPEED_CENTER.y + 80} fill="white" fontSize="14" textAnchor="middle" opacity="0.7">
             {Math.floor(speed)}
          </text>

          {/* NEEDLE */}
          <g transform={`rotate(${speedAngle}, ${SPEED_CENTER.x}, ${SPEED_CENTER.y})`}>
             {/* Long Red Triangle */}
             <path d={`M ${SPEED_CENTER.x - 6},${SPEED_CENTER.y} L ${SPEED_CENTER.x},${SPEED_CENTER.y - SPEED_RADIUS + 15} L ${SPEED_CENTER.x + 6},${SPEED_CENTER.y}`} 
                   fill="#ef4444" filter="url(#blue-glow)" />
             {/* Center Cap */}
             <circle cx={SPEED_CENTER.x} cy={SPEED_CENTER.y} r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          </g>
        </g>

        {/* ========================================= */}
        {/* RIGHT: FUEL & INFO */}
        {/* ========================================= */}
        {renderFuel()}

        {/* BOTTOM STATUS ICONS */}
        <g transform="translate(420, 360)">
           {/* Simple placeholder icons */}
           <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" strokeWidth="2" />
           <text x="0" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">!</text>
           
           <path transform="translate(30, -5)" d="M0,0 L10,0 L12,10 L-2,10 Z" fill="none" stroke="#fbbf24" strokeWidth="2" />
        </g>

      </svg>
    </div>
  );
};