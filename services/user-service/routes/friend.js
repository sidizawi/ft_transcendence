async function friendRoutes(fastify, options) {
    fastify.get('/gamestats/:game/:username', async (request, reply) => {
        const { game, username} = request.params;

        if (!['pong', 'p4'].includes(game)){
            return reply.code(400).send({ error: 'Invalid game type'});
        }

        const userExists = fastify.db.prepare('SELECT * FROM users where username = ?').get(username);
        if (!userExists){
            return reply.code(400).send({ error: 'Username doesnt exist'});
        }
        const userId = userExists.id;

        const query = 'SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?) AND game_type = ?';
        const params = [userId, userId, game];

        const games = fastify.db.prepare(query).all(...params);
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
        
        return reply.code(201).send(stats)
    });

    fastify.get('/gameshistory/:game/:username', async(request, reply) => {
        const { game, username} = request.params;

        if (!['pong', 'p4'].includes(game)){
            return reply.code(400).send({ error: 'Invalid game type'});
        }

        const userExists = fastify.db.prepare('SELECT * FROM users where username = ?').get(username);
        if (!userExists){
            return reply.code(400).send({ error: 'Username doesnt exist'});
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

        const history = fastify.db.prepare(query).all(...params);


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
 
        return reply.code(201).send(formattedGames);
    });

    fastify.get('/avatar/:username', async (request, reply) => {
        const { username} = request.params;

        const userExists = fastify.db.prepare('SELECT * FROM users where username = ?').get(username);
        if (!userExists){
            return reply.code(400).send({ error: 'Username doesnt exist'});
        }
        
        return reply.code(201).send(userExists.avatar);
    });
}

export default friendRoutes;