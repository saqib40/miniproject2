const express = require("express");
const routes = require("./routes/routes");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4000;

require("./config/db").connect();

app.use("/v1", routes);
app.listen(PORT, () => {
    console.log(`App is listening at ${PORT}`);
});