import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Music, Map, Zap, Gauge, Lock, Move, GripVertical } from "lucide-react";

// Drag & Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Components
import { WidgetCard } from "./components/WidgetCard";
import { CombinedCluster } from "./components/widgets/CombinedCluster"; // Ensure this path is correct!

const socket = io.connect("http://localhost:3001");

// --- SORTABLE WRAPPER ---
function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: props.disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    gridColumn: props.span,
    gridRow: props.rowSpan,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${props.className}`}
    >
      {!props.disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-50 cursor-grab p-1 bg-white/10 rounded-md hover:bg-white/20"
        >
          <GripVertical size={14} className="text-white/70" />
        </div>
      )}
      {props.children}
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [carData, setCarData] = useState({
    speed: 0,
    rpm: 0,
    gear: "P",
    temp: 90,
    fuel: 75,
  });
  const [isEditing, setIsEditing] = useState(false);

  // FIX: defined 'cluster' here to match the renderWidget function
  const [items, setItems] = useState(["cluster", "map", "media", "status"]);
  const [themeColor, setThemeColor] = useState("#3b82f6");

  useEffect(() => {
    socket.on("car_signal", (data) => {
      setCarData(data);
      if (data.speed > 5 && isEditing) setIsEditing(false);
    });
    return () => socket.off("car_signal");
  }, [isEditing]);

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
  const isParked = carData.speed < 5;

  // --- RENDER LOGIC ---
  const renderWidget = (id) => {
    switch (id) {
      case "cluster":
        return (
          // We don't use WidgetCard here because the SVG has its own border/background
          // We just wrap it in a div that fills the grid area
          <div className="w-full h-full relative group">
            {isEditing && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-3xl z-40 pointer-events-none animate-pulse"></div>
            )}

            <CombinedCluster
              speed={carData.speed}
              rpm={carData.rpm}
              fuel={carData.fuel}
              theme={themeColor} // <--- PASS THE NEW PROP
            />
          </div>
        );

      case "map":
        if (isHighway) return null;
        return (
          <WidgetCard title="Navigation" icon={Map} className="bg-slate-800">
            <div className="w-full h-full bg-slate-800/50 flex items-center justify-center rounded-xl relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(#60a5fa 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              ></div>
              <div className="text-center z-10">
                <div className="text-3xl text-blue-400">↱</div>
                <div className="font-bold">200m</div>
                <div className="text-xs text-slate-400">Main St.</div>
              </div>
            </div>
          </WidgetCard>
        );

      case "media":
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

      case "status":
        return (
          <WidgetCard title="Status" icon={Zap}>
            <div className="grid grid-cols-3 gap-2 h-full items-center text-center">
              <div>
                <div className="text-xl font-mono text-emerald-400">
                  {carData.temp}°
                </div>
                <div className="text-[10px] text-slate-500">TEMP</div>
              </div>
              <div>
                <div className="text-xl font-mono text-blue-400">
                  {carData.fuel}%
                </div>
                <div className="text-[10px] text-slate-500">FUEL</div>
              </div>
              <div>
                <div className="text-xl font-mono text-slate-200">
                  {carData.gear}
                </div>
                <div className="text-[10px] text-slate-500">GEAR</div>
              </div>
            </div>
          </WidgetCard>
        );
      default:
        return <div className="text-red-500">Error: Unknown Widget {id}</div>;
    }
  };

  const getSpan = (id) => {
    // CLUSTER LOGIC:
    // Highway: Takes full screen width (12 cols)
    // City: Takes most of screen (8 cols)
    if (id === "cluster")
      return isHighway
        ? { col: "span 12", row: "span 6" }
        : { col: "span 8", row: "span 4" };

    // MAP LOGIC
    if (id === "map") return { col: "span 4", row: "span 4" };

    // MEDIA & STATUS
    if (id === "media") return { col: "span 4", row: "span 2" };
    if (id === "status") return { col: "span 4", row: "span 2" }; // Adjusted to fill grid

    return { col: "span 3", row: "span 2" };
  };

  useEffect(() => {
    // 1. Key Down (Pressing Gas/Brake)
    const handleKeyDown = (e) => {
      // Prevent default scrolling for arrows
      if (["ArrowUp", "ArrowDown"].indexOf(e.code) > -1) {
        e.preventDefault();
      }

      if (e.key === "ArrowUp") {
        socket.emit("control_input", { action: "accelerate", active: true });
      }
      if (e.key === "ArrowDown") {
        socket.emit("control_input", { action: "brake", active: true });
      }
      if (e.key === "r" || e.key === "R") {
        socket.emit("control_input", { action: "reverse", active: true });
      }
    };

    // 2. Key Up (Releasing Gas/Brake)
    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp") {
        socket.emit("control_input", { action: "accelerate", active: false });
      }
      if (e.key === "ArrowDown") {
        socket.emit("control_input", { action: "brake", active: false });
      }
      if (e.key === "r" || e.key === "R") {
        socket.emit("control_input", { action: "reverse", active: false });
      }
    };

    // Add listeners to window
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col transition-colors duration-1000 ${
        isHighway ? "bg-black" : "bg-slate-950"
      } text-white`}
    >
      {/* HEADER */}
      <header className="h-16 px-8 flex items-center justify-between bg-slate-900/50 z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Zap className="text-yellow-400 fill-current" />
          <span className="font-bold text-xl tracking-widest font-mono">
            CO-PILOT
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* NEW: COLOR PICKER (Only visible when customizing) */}
          {isEditing && (
            <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 mr-4 animate-in fade-in slide-in-from-top-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Theme
              </span>
              {/* Preset Colors */}
              {[
                "#3b82f6", // Blue (Default)
                "#ef4444", // Sport Red
                "#10b981", // Eco Green
                "#f59e0b", // Comfort Amber
                "#8b5cf6", // Royal Purple
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-4 h-4 rounded-full border border-white/20 transition-all hover:scale-125 ${
                    themeColor === color ? "ring-2 ring-white scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => isParked && setIsEditing(!isEditing)}
            disabled={!isParked}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2
               ${
                 isEditing
                   ? "bg-blue-600 text-white"
                   : "bg-slate-800 text-slate-400"
               }
               ${!isParked && "opacity-30 cursor-not-allowed"}
             `}
          >
            {isEditing ? "DONE" : "CUSTOMIZE"}
            {isParked ? <Move size={12} /> : <Lock size={12} />}
          </button>
        </div>
      </header>

      {/* DRAGGABLE GRID */}
      <main className="flex-1 p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 grid-rows-6 gap-6 h-full w-full">
              {items.map((id) => {
                const spans = getSpan(id);
                if (isHighway && id !== "cluster") return null; // Safety Mode

                return (
                  <SortableItem
                    key={id}
                    id={id}
                    disabled={!isEditing}
                    span={spans.col}
                    rowSpan={spans.row}
                    className="transition-all duration-500"
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
