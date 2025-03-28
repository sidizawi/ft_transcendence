// friend.js
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import db         from '../db.js';

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
	console.log(`${request.method} ${request.url} ${reply.statusCode}`);
	done();
});

fastify.decorate('db', db);

async function profileRoutes(fastify, options) {

	fastify.post('/savegamestat', async (request, reply) => {
		const { opponent, score, game } = request.body;
		await request.jwtVerify();

		const userId = request.user.id;
		const userName = request.user.username;
		//   const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]); TODO refactor

		const opponentExist = fastify.db.prepare('SELECT * FROM users WHERE username = ?').get(opponent);
		if (!opponentExist) {
			return reply.code(404).send({ error: 'Opponent not found' });
		}

		const opponentId = opponentExist.id;
		const opponentName = opponentExist.username;
		const [userScore, opponentScore] = score.split('-').map(Number);

		const playerWon = userScore > opponentScore ? userName : opponentName;
		const playerLost = userScore > opponentScore ? opponentName : userName;

		fastify.db.prepare('INSERT INTO game (playerid_1, playerid_2, username_1, username_2, game_type, score_1, score_2, player_win, player_lost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
			.run(
				userId,
				opponentId,
				userName,
				opponentName,
				game,
				userScore,
				opponentScore,
				playerWon,
				playerLost
			);
		reply.code(201).send({ message: 'Game saved' });
  	});

}

export default profileRoutes;