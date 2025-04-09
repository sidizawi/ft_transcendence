// stats.js
import dotenv from 'dotenv';

dotenv.config();

const verificationCodes = {};

async function statsRoutes(fastify, options) {
	/*
	 * Oppement: The opponent's username
	 * score: The score of the game in the format "userScore-opponentScore"
	 * game: The type of game played, either pong or p4
	*/
	fastify.post('/savegamestat', async (request, reply) => {
		const { opponent, score, game } = request.body;
		await request.jwtVerify();

		const userId = request.user.id;
		const userName = request.user.username;

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

	fastify.get('/gameshistory/:game?', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;

		let query = 'SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?)';
		let params = [userId, userId];

		if (gameType !== 'pong' && gameType !== 'p4') {
			return reply.code(400).send({ error: 'Invalid game type' });
		}

		if (gameType) {
			query += ' AND game_type = ?';
			params.push(gameType);
		}
		query += ' ORDER BY date DESC';
		const games = fastify.db.prepare(query).all(...params);
		
		if (games.length === 0 || !games) {
			return reply.code(204).send({ msg: 'No content' });
		}

		if (games.length > 10){
			games.splice(10);
		}

		const formattedGames = games.map(game => {
			return {
				id: game.id,
				opponent: game.playerid_1 === userId ? game.username_2 : game.username_1,
				score: game.playerid_1 === userId ? `${game.score_1}-${game.score_2}` : `${game.score_2}-${game.score_1}`,
				playerWin: game.playerid_1 === userId ? game.player_win : game.player_lost,
				game: game.game_type,
				date: game.date
			};
		});

		reply.code(200).send(formattedGames);
  	});

	fastify.get('/gamestats/:game?', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;

		let query = 'SELECT * FROM game WHERE playerid_1 = ? OR playerid_2 = ?';
		let params = [userId, userId];

		if (gameType && gameType !== 'pong' && gameType !== 'p4') {
			return reply.code(400).send({ error: 'Invalid game type' });
		}

		if (gameType) {
			query += ' AND game_type = ?';
			params.push(gameType);
		}

		const games = fastify.db.prepare(query).all(...params);

		if (games.length === 0 || !games) {
			return reply.code(204).send({ msg: 'No content' });
		}

		const stats = {
			totalGames: games.length,
			wins: games.filter(game => game.player_win === (game.playerid_1 === userId ? game.username_1 : game.username_2)).length,
			losses: games.filter(game => game.player_lost === (game.playerid_1 === userId ? game.username_1 : game.username_2)).length,
			winrate: 0
		};
		stats.winrate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
		
		reply.code(200).send(stats);
	});
}

export default statsRoutes;