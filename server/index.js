const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// SIMULATION STATE
let carState = {
  speed: 0,      // km/h
  rpm: 800,      // Idle RPM
  gear: 'P',     // P, R, N, D
  temp: 90,      // Celsius
  fuel: 75       // Percentage
};

// INPUT STATE (Controlled by Client)
let input = {
  accelerating: false,
  braking: false,
  reverse: false // To handle 'R' gear
};

io.on('connection', (socket) => {
  console.log('Driver Connected:', socket.id);

  // LISTEN FOR CONTROLS FROM CLIENT
  socket.on('control_input', (data) => {
    // data = { action: 'accelerate', active: true/false }
    if (data.action === 'accelerate') input.accelerating = data.active;
    if (data.action === 'brake') input.braking = data.active;
    if (data.action === 'reverse') input.reverse = data.active;
  });
});

// PHYSICS CONSTANTS
const ACCEL_RATE = 0.8;    // Speed gain per tick
const BRAKE_RATE = 2.5;    // Speed loss per tick (Strong brakes)
const FRICTION_RATE = 0.2; // Natural coasting slowdown
const MAX_SPEED = 240;

// THE PHYSICS LOOP (60Hz)
setInterval(() => {
  
  // 1. GEAR LOGIC
  if (carState.speed === 0 && input.reverse) {
    carState.gear = 'R';
  } else if (carState.speed > 0 || input.accelerating) {
    // If moving or gas pressed (and not in reverse mode), go to Drive
    if (carState.gear !== 'R') carState.gear = 'D'; 
  } else if (carState.speed === 0 && !input.accelerating) {
    carState.gear = 'P';
  }

  // 2. SPEED PHYSICS
  if (carState.gear === 'R') {
     // REVERSE LOGIC (Simpler)
     if (input.accelerating && carState.speed < 40) carState.speed += 0.5;
     else if (!input.accelerating) carState.speed -= 0.5;
     if (carState.speed < 0) carState.speed = 0;

  } else {
     // DRIVE LOGIC
     if (input.accelerating) {
       if (carState.speed < MAX_SPEED) carState.speed += ACCEL_RATE;
     } else if (input.braking) {
       carState.speed -= BRAKE_RATE; // 5x stronger than coasting
     } else {
       carState.speed -= FRICTION_RATE; // Coasting
     }
     
     // Clamp speed to 0
     if (carState.speed < 0) carState.speed = 0;
  }

  // 3. RPM SIMULATION
  // RPM matches speed roughly but has 'idle'
  if (carState.speed === 0) {
    // Idle wobbling
    carState.rpm = 800 + (Math.random() * 20); 
    if (input.accelerating && carState.gear === 'P') carState.rpm = 3000; // Revving in Park
  } else {
    // Linear RPM curve with simulated gear shifts
    // 1st gear: 0-40, 2nd: 40-80, etc.
    let baseRpm = (carState.speed % 60) * 100 + 1000;
    // Add load
    if (input.accelerating) baseRpm += 500;
    carState.rpm = baseRpm;
    if (carState.rpm > 7000) carState.rpm = 7000;
  }

  io.emit('car_signal', carState);

}, 1000 / 60); // 60 FPS update

server.listen(3001, () => {
  console.log('🚗 ENGINE READY on Port 3001');
});