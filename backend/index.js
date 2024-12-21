const express = require("express");
const http = require('http');
const routes = require("./routes/routes");
const { setupWebSocketServer } = require('./config/ws');

const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4000;

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

// Start server
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});