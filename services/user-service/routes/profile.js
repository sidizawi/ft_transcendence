// friend.js
import dotenv from 'dotenv';
dotenv.config();

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

	fastify.get('/gameshistory', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const games = fastify.db.prepare('SELECT * FROM game WHERE playerid_1 = ? OR playerid_2 = ? ORDER BY date DESC').all(userId, userId);

		if (games.length === 0 || !games) {
			return reply.code(404).send({ error: 'No games found' });
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

	fastify.get('/gameshistory/:game', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;

		const games = fastify.db.prepare('SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?) AND game_type = ? ORDER BY date DESC').all(userId, userId, gameType);
		
		if (games.length === 0 || !games) {
			return reply.code(404).send({ error: 'No games found' });
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

	fastify.get('/gamestats', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const games = fastify.db.prepare('SELECT * FROM game WHERE playerid_1 = ? OR playerid_2 = ?').all(userId, userId);

		if (games.length === 0 || !games) {
			return reply.code(404).send({ error: 'No games found' });
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

	fastify.get('/gamestats/:game', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;
		const games = fastify.db.prepare('SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?) AND game_type = ?').all(userId, userId, gameType);

		if (games.length === 0 || !games) {
			return reply.code(404).send({ error: 'No games found' });
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

export default profileRoutes;