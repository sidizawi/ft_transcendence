let ROWS = 6;
let COLS = 7;

let rooms = new Map();
let links = new Map();

function getRoomId(fastify, data) {
	const userGames = fastify.db.prepare("SELECT COUNT(*) FROM game WHERE playerid_1 = ? OR playerid_2 = ?").get(data.id, data.id);
	return `${data.id}-game-${userGames.count || 0}`;
}

function handleNewConn(fastify, data, socket) {
	if (data.room) {
		const room = rooms.get(data.room);
		if (!room) {
			socket.send(JSON.stringify({
				mode: "close",
				message: "room_invalid",
			}));
			return ;
		}
		room.playerid_2 = data.id;
		room.player2ws = socket;
		const color = ['R', 'Y'][Math.floor(Math.random() * 2)];
		console.log("color", color);
		socket.send(JSON.stringify({
			mode: "connected",
			color: color
		}));
		room.player1ws.send(JSON.stringify({
			mode: "connected",
			color: color == 'R' ? 'Y' : 'R'
		}))
		return ;
	}
	const roomId = getRoomId(fastify, data);
	rooms.set(roomId, {
		playerid_1: data.id,
		playerid_2: null,
		player1ws: socket,
		player2ws: null,
		columns: new Array(7).fill(5),
		data: new Array(42).fill('X'),
	});
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

function handlePlay(fastify, data) {
	let room = rooms.get(data.room);

	if (room.columns[data.col] < 0) {
		// todo: send error
		return ;
	}
	let row = room.columns[data.col];
	room.data[row * COLS + data.col] = data.color;
	room.columns[data.col]--;

	for (let i = 0; i < ROWS; i++) {
		console.log(room.data.slice(i * COLS, i * COLS + COLS).join(" "));
	}

	if (checkWin(room.data)) {
		room.player1ws.send(JSON.stringify({
			mode: "win",
			winner: data.id == room.playerid_1
		}));

		room.player2ws.send(JSON.stringify({
			mode: "win",
			winner: data.id == room.playerid_2
		}));

		// tood: save to db
		rooms.delete(data.room);
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

		socket.on("message", (message) => {
			const data = JSON.parse(message.toString());

			console.log("received", data);
			if (data.mode == "new") {
				handleNewConn(fastify, data, socket);
			} else if (data.mode == "play") {
				handlePlay(fastify, data);
			}
		});
	});
}
