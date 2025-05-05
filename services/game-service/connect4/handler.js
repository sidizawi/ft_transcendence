import { getCountGameByPlayerId,
	insertGame
} from "../services/gameService.js";

let ROWS = 6;
let COLS = 7;

let rooms = new Map();

async function getRoomId(fastify, data) {
	const userGames = await getCountGameByPlayerId(data.id);
	console.log("user games", userGames);
	return `${data.id}-game-${userGames.count || 0}`;
}

async function handleNewConn(fastify, data, socket) {
	if (data.room) {
		const room = rooms.get(data.room);
		if (!room) {
			socket.send(JSON.stringify({
				mode: "close",
				message: "room_invalid",
			}));
			return ;
		}
		if (room.player2Username) {
			socket.send(JSON.stringify({
				mode: "close",
				message: "can't play in this room"
			}))
		}
		room.player2Username = data.username;
		room.playerid_2 = data.id;
		room.player2ws = socket;
		const color = ['R', 'Y'][Math.floor(Math.random() * 2)];
		socket.send(JSON.stringify({
			mode: "connected",
			color: color,
			opponent: room.player1Username
		}));
		room.player1ws.send(JSON.stringify({
			mode: "connected",
			color: color == 'R' ? 'Y' : 'R',
			opponent: room.player2Username
		}))
		return ;
	}
	const roomId = await getRoomId(fastify, data);
	rooms.set(roomId, {
		playerid_1: data.id,
		player1Username: data.username,
		playerid_2: null,
		player2Username: null,
		player1ws: socket,
		player2ws: null,
		columns: new Array(7).fill(5),
		data: new Array(42).fill('X'),
		type: data.type,
	});
	if (data.type == "playVsAI") {
		socket.send(JSON.stringify({
			mode: "connected",
			color: 'R',
			opponent: "AI",
			room: roomId
		}))
		return ;
	}
	socket.send(JSON.stringify({
		mode: "created",
		room: roomId
	}));
}

function   checkWin(data) {
	let idx, count, coin;
	for (let i = 0; i < ROWS; i++) {
		for (let j = 0; j < COLS; j++ ) {
			coin = data[i * COLS + j];
			if (i < 3 && coin != 'X') {
				// rows from top to bottom
				count = 0;
				for (let k = i; k < i + 4; k++) {
					idx = k * COLS + j;
					if (data[idx] != coin) {
						break ;
					}
					count++;
				}
				if (count == 4) {
					return (true);
				}
			}
			if (j < 4 && coin != 'X') {
				// cols from left to right 
				count = 0;
				for (let k = j; k < j + 4; k++) {
					idx = i * COLS + k;
					if (data[idx] != coin) {
						break;
					}
					count++;
				}
				if (count == 4) {
					return (true);
				}
			}
			if (i < 3 && j < 4 && coin != 'X') {
				// diag from top to bottom right
				count = 0;
				for (let k = 0; k < 4; k++) {
					idx = (i + k) * COLS + j + k;
					if (data[idx] != coin) {
						break;
					}
					count++;
				}
				if (count == 4) {
					return (true);
				}
			}
			if (i > 2 && j < 4 && coin != 'X') {
				// diag from bottom to top right
				count = 0;
				for (let k = 0; k < 4; k++) {
					idx = (i - k) * COLS + j + k;
					if (data[idx] != coin) {
						break;
					}
					count++;
				}
				if (count == 4) {
					return (true);
				}
			}
		}
	}
	return (false);
}

function playAI(fastify, room) {
	let col = Math.floor(Math.random() * COLS);

	while (room.columns[col] < 0) {
		col = Math.floor(Math.random() * COLS);
	}

	let row = room.columns[col];
	room.data[row * COLS + col] = 'Y';
	room.columns[col]--;

	room.player1ws.send(JSON.stringify({
		mode: "played",
		col
	}));

	if (checkWin(room.data)) {
		room.player1ws.send(JSON.stringify({
			mode: "win",
			winner: false
		}));
		return ;
	}

	if (room.data.every((elem) => elem != 'X')) {
		room.player1ws.send(JSON.stringify({
			mode: "tie",
		}));
		return ;
	}
}

async function handlePlay(fastify, data) {
	let room = rooms.get(data.room);

	let row = room.columns[data.col];
	room.data[row * COLS + data.col] = data.color;
	room.columns[data.col]--;

	// todo : check how to save data when playing against an AI (maybe the first user is the AI)
	if (checkWin(room.data)) {
		room.player1ws.send(JSON.stringify({
			mode: "win",
			winner: data.id == room.playerid_1
		}));

		if (room.type == "playVsAI") {
			// todo: save to db
			return ;
		}

		room.player2ws.send(JSON.stringify({
			mode: "win",
			winner: data.id == room.playerid_2
		}));
		
		if (data.id == room.playerid_1) {
			const params = [
				room.playerid_1, 
				room.playerid_2, 
				room.player1Username, 
				room.player2Username, 
				"p4",
				1,
				0,
				room.player1Username,
				room.player2Username
			];
			await insertGame(params);
		} else {
			const params = [
				room.playerid_1, 
				room.playerid_2, 
				room.player1Username, 
				room.player2Username, 
				"p4",
				0,
				1,
				room.player2Username,
				room.player1Username
			];
			await insertGame(params);
		}
		rooms.delete(data.room);
		return ;
	}

	if (room.data.every((elem) => elem != 'X')) {

		room.player1ws.send(JSON.stringify({
			mode: "tie",
		}));

		if (room.type == "playVsAI") {
			// todo: save to db
			return ;
		}

		room.player2ws.send(JSON.stringify({
			mode: "tie",
		}));

		// todo: to check
		const params = [
			room.playerid_1, 
			room.playerid_2, 
			room.player1Username, 
			room.player2Username, 
			"p4",
			0,
			0,
			room.player1Username,
			room.player2Username,
		];

		await insertGame(params);

		rooms.delete(data.room);
		return ;
	}

	if (room.type == "playVsAI") {
		setTimeout(() => {
			playAI(fastify, room);
		}, 1000);
		return ;
	}

	if (room.playerid_1 == data.id) {
		room.player2ws.send(JSON.stringify({
			mode: 'played',
			col: data.col
		}));
	} else {
		room.player1ws.send(JSON.stringify({
			mode: 'played',
			col: data.col
		}));
	}
}

export const connect4Handler = async (fastify) => {
	fastify.get("/connect4/friend", { websocket: true }, (socket, req) => {
		const { token } = req.query;

		if (!token) {
			socket.close();
		}

		// todo: verify token

		socket.on("message", async (message) => {
			const data = JSON.parse(message.toString());

			console.log("data received", data);
			if (data.mode == "new") {
				await handleNewConn(fastify, data, socket);
			} else if (data.mode == "play") {
				await handlePlay(fastify, data);
			}
		});
	});
}
