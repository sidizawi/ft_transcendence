export const connect4Handler = async (fastify) => {
	fastify.get("/connect4", { websocket: true }, (socket, req) => {
		socket.on("message", (message) => {
			const data = JSON.parse(message.toString());

			console.log("received data", data);
		});
	});
}
