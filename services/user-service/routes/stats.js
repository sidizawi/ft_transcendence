// stats.js
import dotenv from 'dotenv';

import { queryPost, queryAll } from '../services/query.js';
import { getUserById,
	getUserByUsername,
 } from '../services/userService.js';

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

		const userExist = await getUserById(userId);
		if (!userExist) {
			return reply.code(404).send({ error: 'User not found' });
		}
		const userName = userExist.username;
		if (!opponent || !score || !game) {
			return reply.code(400).send({ error: 'Missing required fields' });
		}

		if (game !== 'pong' && game !== 'p4') {
			return reply.code(400).send({ error: 'Invalid game type' });
		}

		const opponentExist = await getUserByUsername(opponent);
		if (!opponentExist) {
			return reply.code(404).send({ error: 'Opponent not found' });
		}

		const opponentId = opponentExist.id;
		const opponentName = opponentExist.username;
		const [userScore, opponentScore] = score.split('-').map(Number);

		const playerWon = userScore > opponentScore ? userName : opponentName;
		const playerLost = userScore > opponentScore ? opponentName : userName;

		const query = `INSERT INTO game (playerid_1, playerid_2, username_1, username_2, game_type, score_1, score_2, player_win, player_lost) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
		const params = [
			userId,
			opponentId,
			userName,
			opponentName,
			game,
			userScore,
			opponentScore,
			playerWon,
			playerLost,
		];
		await queryPost(query, params);
		
		reply.code(201).send({ message: 'Game saved' });
  	});


	fastify.get('/gameshistory/:game?', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;
	  
		if (gameType && gameType !== 'pong' && gameType !== 'p4') {
		  return reply.code(400).send({ error: 'Invalid game type' });
		}
		
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
	  
		const games = await queryAll(query, params);
	  
		if (!games || games.length === 0) {
		  return reply.code(204).send({ msg: 'No content' });
		}
	  
		if (games.length > 10) {
		  games.splice(10);
		}
	  
		const formattedGames = games.map(game => {
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

	fastify.get('/gamestats/:game?', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;
		
		let query = 'SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?)';
		let params = [userId, userId];
		
		if (gameType && gameType !== 'pong' && gameType !== 'p4') {
			return reply.code(400).send({ error: 'Invalid game type' });
		}
		if (gameType) {
			query += ' AND game_type = ?';
			params.push(gameType);
		}
		
		const games = await queryAll(query, params);
		if (!games || games.length === 0) {
			return reply.code(204).send({ msg: 'No content' });
		}
		
		const stats = {
			totalGames: games.length,
			wins: games.filter(game => {
			// Determine the current user's username based on which player they are.
			const currentUserName = game.playerid_1 === userId ? game.username_1 : game.username_2;
			return game.player_win === currentUserName;
			}).length,
			losses: games.filter(game => {
			const currentUserName = game.playerid_1 === userId ? game.username_1 : game.username_2;
			return game.player_lost === currentUserName;
			}).length,
			winrate: 0
		};
		
		stats.winrate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
		
		if (games.length > 10) games.splice(10);
		
		reply.code(200).send(stats);
	});
	  
}

export default statsRoutes;