import { queryGet, queryAll, queryPost } from "../services/query.js";
import { getUserByUsername } from "../services/userService.js";
import { getGameByPlayerIdAndGameType } from "../services/gameService.js";

async function friendRoutes(fastify, options) {
    fastify.get('/gamestats/:game/:username', async (request, reply) => {
        const { game, username} = request.params;

        if (!['pong', 'p4'].includes(game)){
            return reply.code(400).send({ error: 'Invalid game type'});
        }

        const userExists = await getUserByUsername(username);
        if (!userExists){
            return reply.code(400).send({ error: 'Username does not exist'});
        }

        const userId = userExists.id;

        const params = [userId, userId, game];
        const games = await getGameByPlayerIdAndGameType(params);

        if (!games || games.length === 0){
            return reply.code(204).send({msg: 'No content'});
        }

        const stats = {
            totalGames: games.length,
            wins: games.filter(game => {
                return game.player_win === username;
            }).length,
            losses: games.filter(game => {
                return game.player_lost === username;
            }).length,
            winrate: 0
        }

        stats.winrate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        
        return reply.code(200).send(stats);
    });

    fastify.get('/gameshistory/:game/:username', async(request, reply) => {
        const { game, username} = request.params;

        if (!['pong', 'p4'].includes(game)){
            return reply.code(400).send({ error: 'Invalid game type'});
        }

        const userExists = await getUserByUsername(username);
        if (!userExists){
            return reply.code(400).send({ error: 'Username does not exist'});
        }

        const userId = userExists.id;

        const query = `
            SELECT g.*,
            CASE 
			  WHEN g.playerid_1 = ? THEN (SELECT avatar FROM users WHERE id = g.playerid_2)
			  ELSE (SELECT avatar FROM users WHERE id = g.playerid_1)
			END as avatar
            FROM game g 
            WHERE (g.playerid_1 = ? OR g.playerid_2 = ?) AND g.game_type = ?
            ORDER BY g.date DESC`;
        const params = [userId, userId, userId, game];
        const history = await queryAll(query, params);

        if (!history || history.length === 0) {
            return reply.code(204).send({ msg: 'No content' });
        }
        
        if (history.length > 10) {
            history.splice(10);
        }

        const formattedGames = history.map(game => {
            return {
                opponent: game.playerid_1 === userId ? game.username_2 : game.username_1,
                score: game.playerid_1 === userId ? `${game.score_2}-${game.score_1}` : `${game.score_1}-${game.score_2}`,
			    playerWin: game.playerid_1 === userId ? game.player_win : game.player_lost,
                date: game.date,
			    avatar: game.avatar
            }
        });
 
        return reply.code(200).send(formattedGames); 
    });

    fastify.get('/avatar/:username', async (request, reply) => {
        const { username} = request.params;

        const userExists = await getUserByUsername(username);
        if (!userExists){
            return reply.code(404).send({ error: 'Username does not exist'}); 
        }
        
        return reply.code(200).send(userExists.avatar); 
    });
}

export default friendRoutes;