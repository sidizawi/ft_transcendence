async function gdprRoutes(fastify) {

    ////Route permettant a un user de telecharger toutes ses donnees
	fastify.get('/data-export', async (request, reply) => {
		try {
		await request.jwtVerify();
		const userId = request.user.id;

		const userData = fastify.db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
	
		if (!userData) {
			return reply.code(404).send({ error: 'User not found' });
		}
		
		const userName = userData.username;

		const friendships = fastify.db.prepare(`
			SELECT * FROM friend 
			WHERE userid1 = ? OR userid2 = ?
		`).all(userId, userId);
	
		const messages = fastify.db.prepare(`
			SELECT * FROM messages 
			WHERE sender_id = ? OR recipient_id = ?
		`).all(userId, userId);
	
		const games = fastify.db.prepare(`
			SELECT * FROM game 
			WHERE playerid_1 = ? OR playerid_2 = ?
		`).all(userId, userId);
	
		const fullUserData = {
			personalInfo: userData,
			friendships,
			messages,
			gameHistory: games
		};
	
		reply.header('Content-Disposition', `attachment; filename="user_data_${userName}.json"`);
		reply.type('application/json').send(fullUserData);
		} catch (error) {
		console.error('Data export error:', error);
		reply.code(500).send({ error: 'Failed to export user data' });
		}
	});

	//// Route permettant a un user de telecharger ses donnees dans un format portable
	fastify.get('/data-portability', async (request, reply) => {
		try {
		  await request.jwtVerify();
		  const userId = request.user.id;
	  
		  const userData = fastify.db.prepare(`
			SELECT username, email, avatar, game_data, is_two_factor_enabled
			FROM users WHERE id = ?
		  `).get(userId);
	  
		  if (!userData) {
			return reply.code(404).send({ error: 'User not found' });
		  }
	  
		  const portableData = {
			user: {
			  username: userData.username,
			  email: userData.email,
			  preferences: JSON.parse(userData.game_data || '{}'),
			  security: {
				twoFactorEnabled: Boolean(userData.is_two_factor_enabled)
			  }
			}
		  };
	  
		  reply.header('Content-Disposition', `attachment; filename="portable_data_${userId}.json"`);
		  reply.type('application/json').send(portableData);
		} catch (error) {
		  console.error('Data portability error:', error);
		  reply.code(500).send({ error: 'Failed to generate portable user data' });
		}
	  });

	//// route d'anonymisation des donnees
	fastify.post('/anonymize', async (request, reply) => {
	try {
		await request.jwtVerify();
		const userId = request.user.id;
		const { password } = request.body;
		
		if (!password) {
		return reply.code(400).send({ error: 'Password is required for confirmation' });
		}
		
		const user = fastify.db.prepare('SELECT password, username, email FROM users WHERE id = ?').get(userId);
		if (!user) {
		return reply.code(404).send({ error: 'User not found' });
		}
		
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
		return reply.code(401).send({ error: 'Invalid password' });
		}
		
		const anonymousUsername = `anonymous_${crypto.randomBytes(8).toString('hex')}`;
		const anonymousEmail = `anonymous_${crypto.randomBytes(8).toString('hex')}@anonymized.local`;
		
		const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
		
		const transaction = fastify.db.transaction(() => {
		fastify.db.prepare(`
			UPDATE users 
			SET username = ?, email = ?, password = ?, avatar = NULL, game_data = '{}', is_two_factor_enabled = 0
			WHERE id = ?
		`).run(anonymousUsername, anonymousEmail, randomPassword, userId);
		
		fastify.db.prepare(`
			UPDATE messages 
			SET content = '[Message removed]' 
			WHERE sender_id = ?
		`).run(userId);
		});
		
		transaction();
		
		return reply.code(200).send({ 
		message: 'Account has been anonymized successfully',
		info: 'Your personal information has been removed but your game statistics and message structure remain for system integrity'
		});
	} catch (error) {
		console.error('Anonymization error:', error);
		reply.code(500).send({ error: 'Failed to anonymize account', details: error.message });
		}
	});

	//// Route de preference de confidentialite
	fastify.get('/preferences', async (request, reply) => {
		try {
		  await request.jwtVerify();
		  const userId = request.user.id;
	  
		  // Récupérer les préférences actuelles
		  const userPrefs = fastify.db.prepare(`
			SELECT game_data, is_two_factor_enabled
			FROM users WHERE id = ?
		  `).get(userId);
	  
		  if (!userPrefs) {
			return reply.code(404).send({ error: 'User not found' });
		  }
	  
		  // Extraire et formater les préférences
		  const gameData = JSON.parse(userPrefs.game_data || '{}');
		  
		  // Vérifier ou créer les sections de confidentialité
		  if (!gameData.privacyPreferences) {
			gameData.privacyPreferences = {
			  showOnlineStatus: true,
			  showGameHistory: true,
			  allowFriendRequests: true,
			  allowDirectMessages: true
			};
		  }
	  
		  reply.code(200).send({
			preferences: gameData.privacyPreferences,
			security: {
			  twoFactorEnabled: Boolean(userPrefs.is_two_factor_enabled)
			}
		  });
		} catch (error) {
		  console.error('Get preferences error:', error);
		  reply.code(500).send({ error: 'Failed to retrieve privacy preferences' });
		}
	  });
	  
	  // Mettre à jour les préférences de confidentialité
	fastify.put('/preferences', async (request, reply) => {
	try {
		await request.jwtVerify();
		const userId = request.user.id;
		const { preferences } = request.body;
		
		if (!preferences) {
		return reply.code(400).send({ error: 'Preferences object is required' });
		}
		
		const userData = fastify.db.prepare('SELECT game_data FROM users WHERE id = ?').get(userId);
		if (!userData) {
		return reply.code(404).send({ error: 'User not found' });
		}
		
		const gameData = JSON.parse(userData.game_data || '{}');
		gameData.privacyPreferences = {
		...gameData.privacyPreferences,
		...preferences
		};
		
		fastify.db.prepare('UPDATE users SET game_data = ? WHERE id = ?')
		.run(JSON.stringify(gameData), userId);
		
		reply.code(200).send({ 
		message: 'Privacy preferences updated successfully',
		preferences: gameData.privacyPreferences
		});
	} catch (error) {
		console.error('Update preferences error:', error);
		reply.code(500).send({ error: 'Failed to update privacy preferences' });
	}
	});

	  //// Route pour faire une demande speciale 
	fastify.post('/request', async (request, reply) => {
	try {
		await request.jwtVerify();
		const userId = request.user.id;
		const { requestType, details } = request.body;
		
		if (!requestType) {
		return reply.code(400).send({ error: 'Request type is required' });
		}
		
		const user = fastify.db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
		if (!user) {
		return reply.code(404).send({ error: 'User not found' });
		}
		const userEmail = user.email;

		fastify.db.prepare(`
		INSERT INTO gdpr_requests (user_id, email, request_type, details, status, created_at)
		VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
		`).run(userId, userEmail, requestType, details || '');
		
		await transporter.sendMail({
		from: `"Transcendence GDPR" <${process.env.EMAIL_MAIL}>`,
		to: userEmail,
		subject: 'GDPR Request Confirmation',
		text: `We have received your ${requestType} request and will process it within 30 days.`,
		html: `
			<h2>GDPR Request Confirmation</h2>
			<p>We have received your <strong>${requestType}</strong> request and will process it within 30 days.</p>
			<p>Request details: ${details || 'No additional details provided'}</p>
		`
		});
		
		reply.code(200).send({ 
		message: 'Your GDPR request has been submitted successfully',
		info: 'We will process your request within 30 days as required by GDPR regulations'
		});
	} catch (error) {
		console.error('GDPR request error:', error);
		reply.code(500).send({ error: 'Failed to submit GDPR request' });
	}
	});

	////Route pour afficher un resume des donnees personnelles
	fastify.get('/overview', async (request, reply) => {
		try {
		await request.jwtVerify();
		const userId = request.user.id;
		
		// Récupérer un résumé des données
		const user = fastify.db.prepare('SELECT username, email, avatar FROM users WHERE id = ?').get(userId);
		
		// Compter les éléments associés
		const friendCount = fastify.db.prepare('SELECT COUNT(*) as count FROM friend WHERE userid1 = ? OR userid2 = ?').get(userId, userId);
		const messageCount = fastify.db.prepare('SELECT COUNT(*) as count FROM messages WHERE sender_id = ? OR recipient_id = ?').get(userId, userId);
		const gameCount = fastify.db.prepare('SELECT COUNT(*) as count FROM game WHERE playerid_1 = ? OR playerid_2 = ?').get(userId, userId);
		
		reply.code(200).send({
			personalInfo: {
			username: user.username,
			email: user.email,
			hasAvatar: !!user.avatar
			},
			dataOverview: {
			friends: friendCount.count,
			messages: messageCount.count,
			games: gameCount.count
			},
			gdprOptions: [
			{ id: 'export', label: 'Export all my data' },
			{ id: 'portability', label: 'Get portable data format' },
			{ id: 'anonymize', label: 'Anonymize my account' },
			{ id: 'delete', label: 'Delete my account permanently' }
			]
		});
		} catch (error) {
		console.error('Data overview error:', error);
		reply.code(500).send({ error: 'Failed to retrieve data overview' });
		}
	});

}

export default gdprRoutes;