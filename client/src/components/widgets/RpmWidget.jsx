import React from 'react';

export const RpmWidget = ({ rpm }) => {
  // CONFIGURATION
  const MAX_RPM = 8000;
  const RADIUS = 80; // Smaller than Speedometer
  const STROKE = 8;
  const CENTER = RADIUS + 15;
  
  const START_ANGLE = 135;
  const END_ANGLE = 405;

  // --- HELPER FUNCTIONS (Same math as Speedometer) ---
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const calculateAngle = (value) => {
    const percentage = value / MAX_RPM;
    return START_ANGLE + (percentage * (END_ANGLE - START_ANGLE));
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // Render Ticks (0, 1, 2... 8)
  const renderTicks = () => {
    const ticks = [];
    for (let i = 0; i <= 8; i += 1) { // 0 to 8
      const val = i * 1000;
      const angle = calculateAngle(val);
      const isRedline = i >= 6; // Redline starts at 6
      
      const start = polarToCartesian(CENTER, CENTER, RADIUS, angle);
      const end = polarToCartesian(CENTER, CENTER, RADIUS - 8, angle);
      const textPos = polarToCartesian(CENTER, CENTER, RADIUS - 22, angle);

      ticks.push(
        <g key={i}>
          <line
            x1={start.x} y1={start.y}
            x2={end.x} y2={end.y}
            stroke={isRedline ? '#ef4444' : '#94a3b8'} 
            strokeWidth={2}
          />
          <text
            x={textPos.x} y={textPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isRedline ? '#ef4444' : '#94a3b8'}
            className="text-[10px] font-bold font-mono"
          >
            {i}
          </text>
        </g>
      );
    }
    return ticks;
  };

  const needleAngle = calculateAngle(rpm);
  const isRedlining = rpm > 6000;

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <svg width={CENTER * 2} height={CENTER * 2}>
        {/* Background Track */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="#1e293b"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Redline Zone Track (6k-8k) */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, calculateAngle(6000), END_ANGLE)}
          fill="none"
          stroke="#7f1d1d" // Dark Red
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Ticks & Numbers */}
        {renderTicks()}

        {/* Active Arc */}
        <path
          d={describeArc(CENTER, CENTER, RADIUS, START_ANGLE, needleAngle)}
          fill="none"
          stroke={isRedlining ? '#ef4444' : '#fbbf24'} // Amber normally, Red at limit
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="transition-all duration-75 ease-linear"
        />

        {/* Digital Readout */}
        <foreignObject x={CENTER - 40} y={CENTER - 20} width="80" height="40">
           <div className={`text-center font-bold text-xl font-mono ${isRedlining ? 'text-red-500 animate-pulse' : 'text-slate-200'}`}>
             {(rpm / 1000).toFixed(1)}
           </div>
           <div className="text-center text-[8px] text-slate-500 uppercase">x1000</div>
        </foreignObject>
      </svg>
      
      <div className="absolute bottom-2 text-xs text-slate-500 font-bold tracking-widest">RPM</div>
    </div>
  );
};