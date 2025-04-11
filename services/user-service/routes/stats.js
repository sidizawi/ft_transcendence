// stats.js
import dotenv from 'dotenv';

dotenv.config();

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
	  
		if (gameType && gameType !== 'pong' && gameType !== 'p4') {
		  return reply.code(400).send({ error: 'Invalid game type' });
		}
	  
		// The query uses a CASE expression to pick the avatar of the opponent:
		// if the current user is player 1, then the avatar comes from users where id = playerid_2,
		// otherwise it comes from users where id = playerid_1.
		const query = `
		  SELECT 
			g.*,
			CASE 
			  WHEN g.playerid_1 = ? THEN (SELECT avatar FROM users WHERE id = g.playerid_2)
			  ELSE (SELECT avatar FROM users WHERE id = g.playerid_1)
			END as avatar
		  FROM game g
		  WHERE (g.playerid_1 = ? OR g.playerid_2 = ?)
		  ${gameType ? ' AND g.game_type = ?' : ''}
		  ORDER BY g.date DESC
		`;
		const params = gameType ? [userId, userId, userId, gameType] : [userId, userId, userId];
	  
		const games = fastify.db.prepare(query).all(...params);
	  
		if (!games || games.length === 0) {
		  return reply.code(204).send({ msg: 'No content' });
		}
	  
		if (games.length > 10) {
		  games.splice(10);
		}
	  
		const formattedGames = games.map(game => {
		  console.log("game avatar", game.playerid_2, game.username_2, game.avatar);
		  return {
			id: game.id,
			// Determine the opponent's username:
			opponent: game.playerid_1 === userId ? game.username_2 : game.username_1,
			// Format the score appropriately:
			score: game.playerid_1 === userId ? `${game.score_1}-${game.score_2}` : `${game.score_2}-${game.score_1}`,
			playerWin: game.playerid_1 === userId ? game.player_win : game.player_lost,
			game: game.game_type,
			date: game.date,
			avatar: game.avatar  // This now correctly holds the opponent's avatar string.
		  };
		});
	  
		reply.code(200).send(formattedGames);
	  });
	  


	// fastify.get('/gameshistory/:game?', async (request, reply) => {
	// 	await request.jwtVerify();
	// 	const userId = request.user.id;
	// 	const gameType = request.params.game;

	// 	let query = 'SELECT g.*, u.avatar FROM game g JOIN users u WHERE (playerid_1 = ? OR playerid_2 = ?)';
	// 	let params = [userId, userId];

	// 	if (gameType && gameType !== 'pong' && gameType !== 'p4') {
	// 		return reply.code(400).send({ error: 'Invalid game type' });
	// 	}

	// 	if (gameType) {
	// 		query += ' AND game_type = ?';
	// 		params.push(gameType);
	// 	}
	// 	query += ' ORDER BY date DESC';
	// 	const games = fastify.db.prepare(query).all(...params);
		
	// 	if (games.length === 0 || !games) {
	// 		return reply.code(204).send({ msg: 'No content' });
	// 	}

	// 	if (games.length > 10){
	// 		games.splice(10);
	// 	}

	// 	const formattedGames = games.map(game => {
	// 		console.log("game avatar", game.playerid_2, game.username_2, game.avatar); ////////////
	// 		return {
	// 			id: game.id,
	// 			opponent: game.playerid_1 === userId ? game.username_2 : game.username_1,
	// 			score: game.playerid_1 === userId ? `${game.score_1}-${game.score_2}` : `${game.score_2}-${game.score_1}`,
	// 			playerWin: game.playerid_1 === userId ? game.player_win : game.player_lost,
	// 			game: game.game_type,
	// 			date: game.date,
	// 			avatar: game.avatar
	// 		};
	// 	});

	// 	reply.code(200).send(formattedGames);
  	// });

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