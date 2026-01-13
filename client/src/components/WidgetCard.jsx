import React from 'react';
import { clsx } from 'clsx';

// This is the container for every widget
// It handles the "Glass" look and the editing state
export const WidgetCard = ({ children, title, icon: Icon, className, isEditing, ...props }) => {
  return (
    <div 
      {...props}
      className={clsx(
        "h-full w-full rounded-3xl p-4 flex flex-col relative overflow-hidden transition-all duration-300",
        // The Glassmorphism Style
        "bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-2xl",
        // Edit Mode Highlight
        isEditing && "border-blue-500/50 shadow-blue-500/20 animate-pulse cursor-move",
        className
      )}
    >
      {/* Widget Header */}
      <div className="flex items-center gap-2 mb-2 text-slate-400">
        {Icon && <Icon size={16} />}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      
      {/* Widget Content */}
      <div className="flex-1 relative z-10">
        {children}
      </div>

      {/* Background Glow (Aesthetic touch) */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  );
};