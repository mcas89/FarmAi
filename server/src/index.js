const { Server, matchMaker } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");
const { FarmaAiRoom } = require("./rooms/FarmaAiRoom");
const { DuelRoom } = require("./rooms/DuelRoom");

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("FarmaAi Server está online!");
});

app.get("/api/online", async (req, res) => {
    try {
        const rooms = await matchMaker.query({ name: "farma_room" });
        const total = rooms.reduce((acc, room) => acc + room.clients, 0);
        res.json({ online: total });
    } catch (e) {
        console.error("Erro ao consultar online:", e);
        res.json({ online: 0 });
    }
});

const gameServer = new Server({
    server: createServer(app)
});

gameServer.define("farma_room", FarmaAiRoom);
gameServer.define("duel_room", DuelRoom);

gameServer.listen(port).then(() => {
    console.log(`[GameServer] O servidor está rodando na porta ${port}`);
});
