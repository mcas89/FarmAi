const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const { FarmaAiRoom } = require("./rooms/FarmaAiRoom");

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("FarmaAi Server está online!");
});

const gameServer = new Server({
    server: createServer(app)
});

gameServer.define('farma_room', FarmaAiRoom);

gameServer.listen(port).then(() => {
    console.log(`[Colyseus] Servidor rodando em ws://localhost:${port}`);
});
