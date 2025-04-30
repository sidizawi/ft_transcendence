let tournamentRooms = new Map();
let openTournaments = [];

function handleCreateTournament(socket, data) {
	const id = `${crypto.randomUUID()}-game-${data.game}`;

	tournamentRooms.set(id, {
		createdBy: data.username,
		name: data.name,
		code: data.code,
		pub: data.pub,
		game: data.game,
		numPlayers: data.players,
		players: [
			{
				userId: data.userId,
				username: data.username,
				socket
			}
		],
	});

	openTournaments.push(id);
	
	socket.send(JSON.stringify({
	 	mode: "created",
	 	room: id,
	 }));
}

/*
	one tournament
	{
		createdBy: data.userId,
		name: data.name,
		code: data.code,
		pub: data.pub,
		game: data.game
		numPlayers: data.players,
		players: [
			{
				userId: data.userId,
				username: data.username,
				socket,
				//games: []
				//groups: []
				//group: null
			}
		],
	}
*/

function handleListTournament(socket) {
	const lst = openTournaments.map((id) => {
		let room = tournamentRooms.get(id);
		if (!room) {
			return null;
		}
		return {
			room: id,
			name: room.name,
			pub: room.pub,
			game: room.game,
			createdBy: room.createdBy
		};
	}).filter((obj) => obj != null);

	socket.send(JSON.stringify({
		mode: "list",
		lst
	}));
}

function handleJoinTournament(socket, data) {
	// data : room, code, userId, username 

	const room = tournamentRooms.get(data.room);

	if (!room) {
		socket.send(JSON.stringify({
			mode: "cant_join",
			message: `invalid room` 
		}));
		return ;
	}

	if (room.numPlayers == room.players.length) {
		if (data.room in openTournaments) {
			openTournaments.splice(openTournaments.indexOf(data.room), 1);
		}

		socket.send(JSON.stringify({
			mode: "cant_join",
			message: `room ${room.name} is full` 
		}));
		return ;
	}

	if (!room.pub && room.code != data.code) {
		socket.send(JSON.stringify({
			mode: "cant_join",
			message: "bad code"
		}));
		return ;
	}

	room.players.push({
		userId: data.userId,
		username: data.username,
		socket
	});

	socket.send(JSON.stringify({
		mode: "joined",
		room: data.room,
	}))

	// todo: check number of players and lock, send to others
}

export const tournamentHandler = async (fastify) => {
	fastify.get("/tournament", {websocket: true}, (socket, req) => {
		const { token } = req.query;

		if (!token) {
			socket.close();
		}

		fastify.jwt.verify(token);

		socket.on("message", (message) => {
			const data = JSON.parse(message.toString());

			console.log("tournament data received", data);

			if (!data.userId || !data.username) {
				socket.send(JSON.stringify({
					mode: "close",
					message: "invalid_identifier",
				}));
				return ;
			}

			if (data.mode == "create") {
				handleCreateTournament(socket, data);
			} else if (data.mode == "list") {
				handleListTournament(socket);
			} else if (data.mode == "join") {
				handleJoinTournament(socket, data);
			}
		});

		socket.on("close", () => {
			// todo: remove user from the room
			console.log("connection closed");
		})
	})
}
