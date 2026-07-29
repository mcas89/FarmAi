const { Room } = require("colyseus");
const { Schema, type, MapSchema } = require("@colyseus/schema");

// O Esquema define os dados que serão sincronizados com todos os clientes
class Vector3Schema extends Schema {}
type("number")(Vector3Schema.prototype, "x");
type("number")(Vector3Schema.prototype, "y");
type("number")(Vector3Schema.prototype, "z");

class Player extends Schema {
    constructor() {
        super();
    }
}
type("string")(Player.prototype, "id");
type("string")(Player.prototype, "name");
type("string")(Player.prototype, "model");      // modelo VRM do jogador ex: 'san.vrm'
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
type("number")(Player.prototype, "rotation");
type("number")(Player.prototype, "aura");       // pontuação de aura (era "score")
type("string")(Player.prototype, "animation");
type("boolean")(Player.prototype, "leftFarm");  // braço esquerdo ativo
type("boolean")(Player.prototype, "rightFarm"); // braço direito ativo

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
        this.maxClients = 30;
    }

    onCreate (options) {
        this.setState(new FarmaAiState());
        
        // 30 atualizações de estado por segundo (padrão é 20)
        // Aumentar demais (ex: 60) pode sobrecarregar clientes mobile
        this.setPatchRate(1000 / 30);

        // Recebe atualização de movimento do cliente
        this.onMessage("position", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = data.x ?? player.x;
                player.y = data.y ?? player.y;
                player.z = data.z ?? player.z;
                player.rotation = data.rotation ?? player.rotation;
            }
        });

        // Recebe atualização de animação do cliente (idle, walk, run, farm)
        this.onMessage("animation", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.animation = data.animation;
                // Sincroniza os braços de farm
                if (data.leftFarm !== undefined) player.leftFarm = data.leftFarm;
                if (data.rightFarm !== undefined) player.rightFarm = data.rightFarm;
            }
        });

        // Recebe atualização de aura/score
        this.onMessage("updateScore", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.aura = data.score ?? data.aura ?? player.aura;
            }
        });

        // Chat — broadcast para todos na sala
        this.onMessage("chat", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            this.broadcast("chat", {
                sender: player?.name || message.sender || 'Jogador',
                text: message.text,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        });
        
        console.log(`[FarmaAiRoom] Sala criada!`);
    }

    onJoin (client, options) {
        console.log(`[FarmaAiRoom] Jogador entrou: ${client.sessionId} | nome: ${options.name} | modelo: ${options.model}`);
        
        const newPlayer = new Player();
        newPlayer.id = client.sessionId;
        newPlayer.name = options.name || "Jogador";
        newPlayer.model = options.model || "san.vrm";
        newPlayer.x = 0;
        newPlayer.y = 0;
        newPlayer.z = 0;
        newPlayer.rotation = 0;
        newPlayer.aura = options.aura || 0;
        newPlayer.animation = "idle";
        newPlayer.leftFarm = false;
        newPlayer.rightFarm = false;

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
