const { Room } = require("colyseus");
const { Schema, type } = require("@colyseus/schema");

class DuelPlayer extends Schema {
    constructor() {
        super();
        this.score = 0; // Cliques absolutos processados
    }
}
type("string")(DuelPlayer.prototype, "id");
type("string")(DuelPlayer.prototype, "name");
type("string")(DuelPlayer.prototype, "model");
type("number")(DuelPlayer.prototype, "score");
type("boolean")(DuelPlayer.prototype, "connected");

class DuelState extends Schema {
    constructor() {
        super();
        this.player1 = new DuelPlayer();
        this.player2 = new DuelPlayer();
    }
}
type("string")(DuelState.prototype, "status"); // 'waiting', 'countdown', 'playing', 'finished'
type("number")(DuelState.prototype, "timeLeft");
type("number")(DuelState.prototype, "betAmount");
type(DuelPlayer)(DuelState.prototype, "player1");
type(DuelPlayer)(DuelState.prototype, "player2");
type("string")(DuelState.prototype, "winnerId"); // null ou UID do vencedor

class DuelRoom extends Room {
    constructor() {
        super();
        this.maxClients = 2; // Apenas 1v1
        this.countdownTimer = null;
        this.gameTimer = null;
    }

    onCreate(options) {
        this.setState(new DuelState());
        this.state.status = 'waiting';
        this.state.betAmount = options.betAmount || 0;
        this.state.timeLeft = 45; // 45 segundos padrão
        this.setPatchRate(50); // 50ms para altíssima fluidez (20 ticks/sec)

        console.log(`[DuelRoom] Sala Criada: ${this.roomId} - Aposta: ${this.state.betAmount}`);

        this.onMessage("hit_batch", (client, data) => {
            if (this.state.status !== 'playing') return;

            const isP1 = client.sessionId === this.state.player1.id;
            const player = isP1 ? this.state.player1 : this.state.player2;
            const opponent = isP1 ? this.state.player2 : this.state.player1;

            // data.score contém a quantidade TOTAL de cliques que o cliente já deu na partida
            if (data.score > player.score) {
                // Validação básica de cheat (Speedhack)
                const diff = data.score - player.score;
                if (diff > 15) { 
                    console.warn(`[Anti-Cheat] UID ${player.name} tentou enviar ${diff} hits de uma vez! Ignorando.`);
                    return; 
                }
                
                player.score = data.score;
            }

            // Checa Vitória por Domínio (Knockout)
            const maxDiff = 200; // Ajustável conforme balanceamento
            if (player.score - opponent.score >= maxDiff) {
                this.endGame(player.id);
            }
        });
    }

    onJoin(client, options) {
        console.log(`[DuelRoom] Jogador entrou: ${options.name}`);
        
        let p;
        if (!this.state.player1.id) {
            p = this.state.player1;
        } else {
            p = this.state.player2;
        }

        p.id = client.sessionId;
        p.name = options.name || 'Jogador';
        p.model = options.model || 'san.vrm';
        p.connected = true;

        if (this.state.player1.id && this.state.player2.id) {
            this.startCountdown();
        }
    }

    startCountdown() {
        this.state.status = 'countdown';
        this.state.timeLeft = 3;
        
        this.countdownTimer = this.clock.setInterval(() => {
            this.state.timeLeft -= 1;
            if (this.state.timeLeft <= 0) {
                this.countdownTimer.clear();
                this.startGame();
            }
        }, 1000);
    }

    startGame() {
        this.state.status = 'playing';
        this.state.timeLeft = 45;

        this.gameTimer = this.clock.setInterval(() => {
            this.state.timeLeft -= 1;
            if (this.state.timeLeft <= 0) {
                this.gameTimer.clear();
                // Fim de jogo por tempo
                if (this.state.player1.score > this.state.player2.score) {
                    this.endGame(this.state.player1.id);
                } else if (this.state.player2.score > this.state.player1.score) {
                    this.endGame(this.state.player2.id);
                } else {
                    this.endGame("draw"); // Empate
                }
            }
        }, 1000);
    }

    endGame(winnerSessionId) {
        if (this.state.status === 'finished') return;
        
        if (this.gameTimer) this.gameTimer.clear();
        this.state.status = 'finished';
        this.state.winnerId = winnerSessionId;

        const isDraw = winnerSessionId === "draw";

        console.log(`[DuelRoom] Jogo Terminou! Vencedor: ${winnerSessionId}`);

        // O servidor avisa aos clientes quem ganhou e a quantidade gerada
        this.broadcast("game_over", {
            winnerSessionId: winnerSessionId,
            player1: {
                name: this.state.player1.name,
                score: this.state.player1.score
            },
            player2: {
                name: this.state.player2.name,
                score: this.state.player2.score
            },
            betAmount: this.state.betAmount,
            isDraw: isDraw
        });

        // Desconecta a sala em 5 segundos
        this.clock.setTimeout(() => {
            this.disconnect();
        }, 5000);
    }

    async onLeave(client, consented) {
        console.log(`[DuelRoom] Jogador saiu: ${client.sessionId}`);
        
        const isP1 = client.sessionId === this.state.player1.id;
        const p = isP1 ? this.state.player1 : this.state.player2;
        p.connected = false;

        // Se sair durante a partida, o outro ganha por W.O.
        if (this.state.status === 'playing' || this.state.status === 'countdown') {
            const opponent = isP1 ? this.state.player2 : this.state.player1;
            console.log(`[DuelRoom] Vitória por W.O. para ${opponent.name}`);
            this.endGame(opponent.id);
        }
    }

    onDispose() {
        console.log(`[DuelRoom] Sala destruída: ${this.roomId}`);
    }
}

module.exports = { DuelRoom };
