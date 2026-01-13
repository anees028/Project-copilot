import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to the "Car"
const socket = io.connect("http://localhost:3001");

function App() {
  const [carData, setCarData] = useState({ speed: 0, rpm: 0, gear: 'P', temp: 90 });
  
  // DRIVER EXPERIENCE LOGIC
  // We calculate "Density" based on speed.
  // 0-10 km/h: "PARKED" (High interaction allowed)
  // 10-80 km/h: "CITY" (Medium interaction)
  // 80+ km/h: "HIGHWAY" (Low interaction - Safety Mode)
  
  let driverMode = 'PARKED';
  if (carData.speed > 10) driverMode = 'CITY';
  if (carData.speed > 80) driverMode = 'HIGHWAY';

  useEffect(() => {
    socket.on("car_signal", (data) => {
      setCarData(data);
    });
    
    // Cleanup on unmount
    return () => socket.off("car_signal");
  }, []);

  return (
    // The Main Dashboard Container
    // We change the background color subtly based on mode to signal the driver
    <div className={`w-screen h-screen flex flex-col text-white transition-colors duration-1000
      ${driverMode === 'HIGHWAY' ? 'bg-black' : 'bg-slate-900'}
    `}>
      
      {/* HEADER: Always Visible, but simplifies on Highway */}
      <header className="p-6 flex justify-between items-center border-b border-slate-800">
        <div className="text-xl font-bold tracking-widest text-blue-400">VW-OS</div>
        <div className="text-sm text-slate-400">
           {/* Clock logic would go here */}
           12:45 PM
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="flex-1 grid grid-cols-12 gap-4 p-6">
        
        {/* LEFT PANEL: SPEEDOMETER (Expands when driving fast) */}
        <section className={`
          flex flex-col justify-center items-center rounded-2xl bg-slate-800 transition-all duration-500
          ${driverMode === 'HIGHWAY' ? 'col-span-12 scale-110' : 'col-span-4'}
        `}>
          <div className="text-slate-400 text-sm uppercase tracking-widest">Speed</div>
          <div className={`font-black transition-all duration-300 ${driverMode === 'HIGHWAY' ? 'text-9xl text-red-500' : 'text-7xl'}`}>
            {Math.floor(carData.speed)}
          </div>
          <div className="text-xl text-slate-500">km/h</div>
          
          {/* Gear Indicator */}
          <div className="mt-4 px-4 py-2 bg-black rounded-lg text-2xl font-mono text-yellow-500">
            {carData.gear}
          </div>
        </section>

        {/* CENTER PANEL: MEDIA / MAPS */}
        {/* THIS IS THE KEY FIX: If we are on Highway, this DISAPPEARS to reduce distraction */}
        {driverMode !== 'HIGHWAY' && (
          <section className="col-span-4 bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center opacity-100 transition-opacity duration-500">
             <div className="w-32 h-32 bg-slate-700 rounded-full mb-4 animate-pulse"></div>
             <h2 className="text-xl font-bold">Spotify</h2>
             <p className="text-slate-400">Playing current track...</p>
             
             {/* Complex buttons only visible in PARKED mode */}
             {driverMode === 'PARKED' && (
               <div className="mt-6 flex gap-4">
                 <button className="px-6 py-2 bg-blue-600 rounded-full">Browse</button>
                 <button className="px-6 py-2 bg-slate-600 rounded-full">Settings</button>
               </div>
             )}
          </section>
        )}

        {/* RIGHT PANEL: CAR STATUS (Tire pressure, etc) */}
        {/* Also hides on Highway */}
        {driverMode !== 'HIGHWAY' && (
          <section className="col-span-4 bg-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-300">Vehicle Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span>RPM</span>
                <span className="font-mono text-blue-400">{Math.floor(carData.rpm)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span>Temp</span>
                <span className="font-mono text-green-400">{carData.temp}°C</span>
              </div>
              <div className="flex justify-between border-b border-slate-700 pb-2">
                <span>Fuel</span>
                <span className="font-mono">{carData.fuel}%</span>
              </div>
            </div>
          </section>
        )}
        
      </main>
    </div>
  );
}

export default App;