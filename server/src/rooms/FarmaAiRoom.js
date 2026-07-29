const { Room } = require("colyseus");
const { Schema, type, MapSchema } = require("@colyseus/schema");

// O Esquema define os dados que serão sincronizados com todos os clientes
class Player extends Schema {}
type("string")(Player.prototype, "id");
type("string")(Player.prototype, "name");
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
type("number")(Player.prototype, "rotation");
type("number")(Player.prototype, "score");
type("string")(Player.prototype, "animation");
type("string")(Player.prototype, "model");

class FarmaAiState extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
    }
}
type({ map: Player })(FarmaAiState.prototype, "players");

class FarmaAiRoom extends Room {
    constructor() {
        super();
        this.maxClients = 100;
    }

    onCreate (options) {
        this.setState(new FarmaAiState());

        // Recebe atualização de movimento do cliente
        this.onMessage("position", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x;
                player.y = data.y;
                player.z = data.z;
                player.rotation = data.rotation;
            }
        });

        // Recebe atualização de animação do cliente
        this.onMessage("animation", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.animation = data.animation;
            }
        });

        // Recebe atualização de aura/score
        this.onMessage("updateScore", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.score = data.score;
            }
        });
        
        console.log(`[FarmaAiRoom] Sala criada!`);
    }

    onJoin (client, options) {
        console.log(`[FarmaAiRoom] Jogador entrou: ${client.sessionId}`);
        
        const newPlayer = new Player();
        newPlayer.id = client.sessionId;
        newPlayer.name = options.name || "Jogador";
        newPlayer.x = 0;
        newPlayer.y = 0;
        newPlayer.z = 0;
        newPlayer.rotation = 0;
        newPlayer.score = 0;
        newPlayer.animation = "Idle";
        newPlayer.model = options.model || "san.vrm";

        this.state.players.set(client.sessionId, newPlayer);
    }

    onLeave (client, consented) {
        console.log(`[FarmaAiRoom] Jogador saiu: ${client.sessionId}`);
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log(`[FarmaAiRoom] Sala descartada.`);
    }
}

module.exports = { FarmaAiRoom };
