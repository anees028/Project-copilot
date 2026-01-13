const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // This is your React Client URL
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

// SIMULATION LOOP (The "Engine")
// We simulate the car accelerating and braking automatically
let accelerating = true;

setInterval(() => {
  // 1. Simulate Speed Physics
  if (accelerating) {
    carState.speed += 0.5; // Accelerate
    if (carState.speed > 120) accelerating = false; // Start braking at 120km/h
  } else {
    carState.speed -= 0.8; // Brake hard
    if (carState.speed <= 0) {
      carState.speed = 0;
      accelerating = true; // Start accelerating again
    }
  }

  // 2. Simulate RPM based on Speed (Rough logic)
  if (carState.speed === 0) {
    carState.rpm = 800 + Math.random() * 50; // Idle wobble
    carState.gear = 'P';
  } else {
    carState.rpm = 1500 + (carState.speed * 25); 
    carState.gear = 'D';
    
    // Simulate Gear Shifts (RPM drops)
    if (carState.rpm > 3500) carState.rpm -= 1000;
  }

  // 3. Emit Data to Dashboard (Client)
  io.emit('car_signal', carState);

}, 100); // Update every 100ms (10Hz)

server.listen(3001, () => {
  console.log('🚗 CAR ECU STARTED on Port 3001');
});