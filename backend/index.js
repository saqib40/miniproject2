const express = require("express");
const http = require('http');
const routes = require("./routes/routes");
const { setupWebSocketServer } = require('./config/ws');
const { setWebSocketServer } = require('./protected/existing-machine'); // Import setWebSocketServer
const path = require('path');

const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4000;

const cors = require("cors");
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use(express.json());
// Connect to database
require("./config/db").connect();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/v1", routes);

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
const wss = setupWebSocketServer(server);

// Pass WebSocket server instance to existing-machine.js
setWebSocketServer(wss); // Call setWebSocketServer with the WebSocket server instance

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
