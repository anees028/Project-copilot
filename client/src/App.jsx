import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Music, Map, Zap, Gauge, Lock, Move, GripVertical } from 'lucide-react';

// Modern Drag & Drop Libraries
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Components
import { WidgetCard } from './components/WidgetCard';
import { SpeedWidget } from './components/widgets/SpeedWidget';
import { RpmWidget } from './components/widgets/RpmWidget';

const socket = io.connect("http://localhost:3001");

// --- SORTABLE WIDGET WRAPPER ---
// This wrapper makes any div draggable
function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id, disabled: props.disabled });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto', // Bring to front when dragging
    gridColumn: props.span, // Preserve grid span
    gridRow: props.rowSpan,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${props.className}`}>
       {/* Drag Handle (Only visible when editing) */}
       {!props.disabled && (
         <div {...attributes} {...listeners} className="absolute top-2 right-2 z-50 cursor-grab p-1 bg-white/10 rounded-md hover:bg-white/20">
            <GripVertical size={14} className="text-white/70" />
         </div>
       )}
       {props.children}
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [carData, setCarData] = useState({ speed: 0, rpm: 0, gear: 'P', temp: 90, fuel: 75 });
  const [isEditing, setIsEditing] = useState(false);
  
  // Widget Order State (We move these IDs around)
  const [items, setItems] = useState(['speed', 'rpm', 'map', 'media', 'status']);

  // CAR DATA LISTENER
  useEffect(() => {
    socket.on("car_signal", (data) => {
      setCarData(data);
      // Safety: Auto-exit edit mode if moving
      if (data.speed > 30 && isEditing) setIsEditing(false);
    });
    return () => socket.off("car_signal");
  }, [isEditing]);

  // DRAG AND DROP SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const isHighway = carData.speed > 80;
  const isParked = carData.speed < 30;

  // Render Logic: We map the ID to the actual Component
  const renderWidget = (id) => {
    switch(id) {
      case 'speed':
        return (
          <WidgetCard title="Telemetry" icon={Gauge} className={isHighway ? 'border-red-900/50' : ''}>
            <SpeedWidget speed={carData.speed} rpm={carData.rpm} />
          </WidgetCard>
        );
      case 'rpm':
        return (
          <WidgetCard title="Engine" icon={Zap} className="border-l-4 border-l-yellow-500/20">
             <RpmWidget rpm={carData.rpm} />
          </WidgetCard>
        );
      case 'map':
        // Hide map on highway
        if (isHighway) return null;
        return (
          <WidgetCard title="Navigation" icon={Map} className="bg-slate-800">
             <div className="w-full h-full bg-slate-800/50 flex items-center justify-center rounded-xl relative overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
               <div className="text-center z-10">
                 <div className="text-3xl">↱</div>
                 <div className="font-bold">200m</div>
               </div>
             </div>
          </WidgetCard>
        );
      case 'media':
        if (isHighway) return null;
        return (
           <WidgetCard title="Media" icon={Music}>
               <div className="flex items-center gap-4 h-full">
                 <div className="w-12 h-12 bg-purple-500 rounded-lg shadow-lg"></div>
                 <div>
                   <div className="font-bold text-sm">Blinding Lights</div>
                   <div className="text-xs text-slate-400">The Weeknd</div>
                 </div>
               </div>
            </WidgetCard>
        );
      case 'status':
        return (
            <WidgetCard title="Status" icon={Zap}>
              <div className="grid grid-cols-3 gap-2 h-full items-center text-center">
                 <div><div className="text-xl font-mono text-emerald-400">{carData.temp}°</div><div className="text-[10px] text-slate-500">TEMP</div></div>
                 <div><div className="text-xl font-mono text-blue-400">{carData.fuel}%</div><div className="text-[10px] text-slate-500">FUEL</div></div>
                 <div><div className="text-xl font-mono text-slate-200">P</div><div className="text-[10px] text-slate-500">GEAR</div></div>
              </div>
            </WidgetCard>
        );
      default: return null;
    }
  };

  // Grid Span Logic (Visual Sizing)
  // We define how big each widget should be in the CSS Grid
  const getSpan = (id) => {
    if (isHighway && id === 'speed') return { col: 'span 12', row: 'span 6' };
    if (isHighway && id === 'rpm') return { col: 'span 4', row: 'span 6' };
    if (id === 'speed') return { col: 'span 4', row: 'span 4' };
    if (id === 'rpm') return { col: 'span 3', row: 'span 3' };
    if (id === 'map') return { col: 'span 5', row: 'span 4' };
    if (id === 'media') return { col: 'span 3', row: 'span 2' };
    if (id === 'status') return { col: 'span 3', row: 'span 2' };
    return { col: 'span 3', row: 'span 2' };
  };

  return (
    <div className={`w-screen h-screen overflow-hidden flex flex-col transition-colors duration-1000 ${isHighway ? 'bg-black' : 'bg-slate-950'} text-white`}>
      
      {/* HEADER */}
      <header className="h-16 px-8 flex items-center justify-between bg-slate-900/50 z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Zap className="text-yellow-400 fill-current" />
          <span className="font-bold text-xl tracking-widest font-mono">CO-PILOT</span>
        </div>
        <div className="flex items-center gap-4">
           {/* EDIT BUTTON */}
           <button 
             onClick={() => isParked && setIsEditing(!isEditing)}
             disabled={!isParked}
             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2
               ${isEditing ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-400'}
               ${!isParked && 'opacity-30 cursor-not-allowed'}
             `}
           >
             {isEditing ? 'DONE' : 'CUSTOMIZE'}
             {isParked ? <Move size={12}/> : <Lock size={12}/>}
           </button>
        </div>
      </header>

      {/* DRAGGABLE GRID */}
      <main className="flex-1 p-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={rectSortingStrategy}>
            
            <div className="grid grid-cols-12 grid-rows-6 gap-6 h-full w-full">
              {items.map((id) => {
                const spans = getSpan(id);
                // If on Highway, hide non-essential widgets entirely
                if (isHighway && id !== 'speed' && id !== 'status') return null;

                return (
                  <SortableItem 
                    key={id} 
                    id={id} 
                    disabled={!isEditing}
                    span={spans.col}
                    rowSpan={spans.row}
                    className={`bg-slate-900/40 rounded-3xl transition-all duration-500 ${spans.col} ${spans.row}`}
                  >
                    {renderWidget(id)}
                  </SortableItem>
                );
              })}
            </div>

          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}

export default App;