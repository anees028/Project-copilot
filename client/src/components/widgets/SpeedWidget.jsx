import React from 'react';

export const SpeedWidget = ({ speed, rpm }) => {
  // --- CONFIGURATION ---
  const MAX_SPEED = 220; // As requested
  const MAX_RPM = 8000;
  
  // Dimensions
  const RADIUS = 120; // Bigger circle
  const STROKE = 4;
  const CENTER = RADIUS + 20; // Center point of SVG (with padding)
  
  // Angles (260 degree gauge, open at bottom)
  const START_ANGLE = 140; 
  const END_ANGLE = 400;
  
  // --- HELPER FUNCTIONS ---
  
  // Convert polar coordinates to Cartesian (x,y) for drawing SVG lines
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Map speed to angle
  const calculateAngle = (value) => {
    const percentage = value / MAX_SPEED;
    return START_ANGLE + (percentage * (END_ANGLE - START_ANGLE));
  };

  // Generate Ticks (0, 20, 40... 220)
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i <= MAX_SPEED; i += 20) {
      const angle = calculateAngle(i);
      const isActive = speed >= i; // Light up if we passed this speed
      
      // Calculate positions for tick lines
      const start = polarToCartesian(CENTER, CENTER, RADIUS, angle);
      const end = polarToCartesian(CENTER, CENTER, RADIUS - 10, angle); // 10px long ticks
      
      // Calculate position for numbers
      const textPos = polarToCartesian(CENTER, CENTER, RADIUS - 30, angle);

      ticks.push(
        <g key={i} className="transition-all duration-300">
          {/* The Tick Line */}
          <line
            x1={start.x} y1={start.y}
            x2={end.x} y2={end.y}
            stroke={isActive ? '#ffffff' : '#334155'} // White if active, Slate-700 if not
            strokeWidth={isActive ? 3 : 2}
          />
          {/* The Number */}
          <text
            x={textPos.x} y={textPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isActive ? '#ffffff' : '#475569'} // White if active, Slate-600 if not
            className={`text-[10px] font-bold font-mono ${isActive ? 'opacity-100' : 'opacity-50'}`}
          >
            {i}
          </text>
        </g>
      );
    }
    return ticks;
  };

  // Arc Path Generator
  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Dynamic Colors based on speed
  let speedColor = "text-blue-400";
  let strokeColor = "#60a5fa";
  if (speed > 100) { speedColor = "text-emerald-400"; strokeColor = "#34d399"; }
  if (speed > 160) { speedColor = "text-red-500"; strokeColor = "#ef4444"; }

  // Needle Angle
  const needleAngle = calculateAngle(speed);
  const needleTip = polarToCartesian(CENTER, CENTER, RADIUS - 5, needleAngle);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none">
      
      {/* THE MAIN GAUGE SVG */}
      <svg width={CENTER * 2} height={CENTER * 1.8} className="overflow-visible">
        
        {/* 1. Background Track (The dark arc) */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="#1e293b" // Slate-800
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* 2. The Ticks and Numbers */}
        {renderTicks()}

        {/* 3. The Active Speed Arc (Fills up as you go) */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, needleAngle)}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE + 2} // Slightly thicker
          strokeLinecap="round"
          filter="url(#glow)" // Add glow effect
          className="transition-all duration-100 ease-linear"
        />

        {/* 4. Definition for Glow Filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 5. Center Digital Readout */}
        <foreignObject x={CENTER - 60} y={CENTER - 50} width="120" height="100">
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`text-6xl font-black tracking-tighter ${speedColor}`}>
              {Math.floor(speed)}
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              km/h
            </div>
          </div>
        </foreignObject>

      </svg>

      {/* RPM SECTION (Below the Gauge) */}
      {/* <div className="w-full px-8 -mt-8">
        <div className="flex justify-between items-end mb-1">
           <span className="text-[10px] text-slate-500 font-bold">RPM</span>
           <span className="font-mono text-sm text-slate-300">
             {(rpm / 1000).toFixed(1)} <span className="text-[10px] text-slate-500">x1000</span>
           </span>
        </div>
        
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
          <div className="absolute right-[20%] w-0.5 h-full bg-red-900/50 z-10"></div>
          
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-white to-red-500 transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ width: `${(rpm / MAX_RPM) * 100}%` }} 
          />
        </div>
      </div> */}

    </div>
  );
};