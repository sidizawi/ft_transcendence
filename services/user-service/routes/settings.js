// friend.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fs from 'fs';
import path from 'path';
import multer from 'fastify-multer';
import bcrypt from 'bcrypt';

dotenv.config();

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	host: "smtp.gmail.com",
	secure: true,
	auth: {
	  user: process.env.EMAIL_MAIL, 
	  pass: process.env.EMAIL_APPPASS
	}
});

const upload = multer({ dest: './uploads/avatars/' });

const verificationCodes = {};

async function settingsRoutes(fastify, options) {
	if (!fastify.db) {
		fastify.decorate('db', db);
	}
	if (!fastify.jwt) {
		await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
	}

	// // Servir les fichiers statiques pour les avatars


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/// USER MODIFICATIONS ///
	// Modify username without check
	fastify.put('/username', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const { newUsername } = request.body;
		
		if (!newUsername) {
		  return reply.code(400).send({ error: 'New username is required' });
		}
		
		const existingUser = fastify.db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername);
		if (existingUser) {
		  return reply.code(400).send({ error: 'Username already taken' });
		}
		
		fastify.db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);
		
		const user = fastify.db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
		const token = fastify.jwt.sign({ id: user.id });
		
		reply.code(200).send({ message: 'Username updated successfully', token });
	  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Post email then check if already user, if not, send verification code
	fastify.post('/email/request', async (request, reply) => {
	await request.jwtVerify();
	const userId = request.user.id;
	const { newEmail } = request.body;
	
	if (!newEmail) {
		return reply.code(400).send({ error: 'New email is required' });
	}
	
	const existingUser = fastify.db.prepare('SELECT id FROM users WHERE email = ?').get(newEmail);
	if (existingUser) {
		return reply.code(400).send({ error: 'Email already in use' });
	}
	
	const verificationCode = crypto.randomInt(100000, 999999).toString();
	
	verificationCodes[userId] = {
		type: 'email',
		newEmail: newEmail,
		code: verificationCode,
		expiresAt: Date.now() + 10 * 60 * 1000 
	};
	
	try {
		await transporter.sendMail({
		from: `"Transcendence" <${process.env.SMTP_USER}>`,
		to: newEmail,
		subject: 'Email Change Verification Code',
		text: `Your verification code to change your email is: ${verificationCode}. This code will expire in 10 minutes.`,
		html: `<p>Your verification code to change your email is: <strong>${verificationCode}</strong></p><p>This code will expire in 10 minutes.</p>`
		});
		
		reply.code(200).send({ message: 'Verification code sent to new email' });
	} catch (error) {
		console.error('Error sending email:', error);
		reply.code(500).send({ error: 'Failed to send verification email' });
	}
	});

	// Verify email with code
	// Check if code is correct and not expired 
	fastify.put('/email/verify', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const { verificationCode } = request.body;
		
		if (!verificationCode) {
		  return reply.code(400).send({ error: 'Verification code is required' });
		}
		
		const storedVerification = verificationCodes[userId];
		if (!storedVerification || storedVerification.type !== 'email' || storedVerification.expiresAt < Date.now()) {
		  return reply.code(400).send({ error: 'Invalid or expired verification code' });
		}
		
		if (storedVerification.code !== verificationCode) {
		  return reply.code(400).send({ error: 'Incorrect verification code' });
		}
		
		fastify.db.prepare('UPDATE users SET email = ? WHERE id = ?').run(storedVerification.newEmail, userId);
		
		delete verificationCodes[userId];

		const user = fastify.db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
		const token = fastify.jwt.sign({ id: user.id });
		
		reply.code(200).send({ message: 'Email updated successfully', token });
	  });
	

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Post new password and send code by mail
	fastify.post('/password/request', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const userEmail = request.user.email;
		
		const verificationCode = crypto.randomInt(100000, 999999).toString();

		verificationCodes[userId] = {
			type: 'password',
			code: verificationCode,
			expiresAt: Date.now() + 10 * 60 * 1000 
		};
		
		try {
		await transporter.sendMail({
			from: `"Transcendence" <${process.env.SMTP_USER}>`,
			to: userEmail,
			subject: 'Password Change Verification Code',
			text: `Your verification code to change your password is: ${verificationCode}. This code will expire in 10 minutes.`,
			html: `<p>Your verification code to change your password is: <strong>${verificationCode}</strong></p><p>This code will expire in 10 minutes.</p>`
		});
		
		reply.code(200).send({ message: 'Verification code sent to your email' });
		} catch (error) {
			console.error('Error sending email:', error);
			reply.code(500).send({ error: 'Failed to send verification email' });
		}
	});

	// Check if code is correct and not expired
	fastify.put('/password/verify', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const { verificationCode, newPassword } = request.body;
		
		if (!verificationCode || !newPassword) {
		  return reply.code(400).send({ error: 'Verification code and new password are required' });
		}
		
		const storedVerification = verificationCodes[userId];
		if (!storedVerification || storedVerification.type !== 'password' || storedVerification.expiresAt < Date.now()) {
		  return reply.code(400).send({ error: 'Invalid or expired verification code' });
		}
		
		if (storedVerification.code !== verificationCode) {
		  return reply.code(400).send({ error: 'Incorrect verification code' });
		}
		
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		
		fastify.db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
		
		delete verificationCodes[userId];
		
		reply.code(200).send({ message: 'Password updated successfully' });
	  });

	
	// Route pour uploader un avatar
	fastify.post('/avatar', { preHandler: upload.single('avatar') }, async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		
		if (!request.file) {
			return reply.code(400).send({ error: 'No file uploaded' });
		}
	
		const validMimeTypes = ['image/jpeg', 'image/png'];
		if (!validMimeTypes.includes(request.file.mimetype)) {
			fs.unlinkSync(request.file.path);
			return reply.code(400).send({ error: 'Invalid file type' });
		}
	
		// Utilise le nom d'origine du fichier au lieu de le renommer
		const originalFileName = request.file.originalname;
		const newFilePath = path.join('uploads/avatars', originalFileName);
	
		// Si un fichier du même nom existe déjà, le supprimer d'abord
		if (fs.existsSync(newFilePath)) {
			fs.unlinkSync(newFilePath);
		}
	
		fs.renameSync(request.file.path, newFilePath);
	
		fastify.db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(newFilePath, userId);
	
		reply.code(200).send({ 
			message: 'Avatar uploaded successfully', 
			avatarPath: newFilePath 
		});
	});

	// Inclure l'URL de l'avatar dans les réponses utilisateur
	fastify.get('/profile', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const user = fastify.db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?').get(userId);
		if (!user) {
			return reply.code(404).send({ error: 'User not found' });
		}

		// Ajouter l'URL complète de l'avatar
		user.avatarUrl = user.avatar ? `${request.protocol}://${request.hostname}/avatars/${path.basename(user.avatar)}` : null;

		reply.code(200).send(user);
		//FRONT END : <img src="http://localhost:3000/avatars/1-john_doe.png" alt="Profile avatar" />
		//			  <img src={user.avatarUrl} alt={`Avatar de ${user.username}`} />

		/*
		user ressemble a :

		{
			"id": 1,
			"username": "john_doe",
			"email": "john@example.com",
			"avatar": "uploads/avatars/1-john_doe.png",
			"avatarUrl": "http://localhost:3000/avatars/1-john_doe.png"
		}

		*/
	});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Cette route check le mot de passe entre puis envois un code 2FA s'il est correct
	fastify.post('/delete/request', async (request, reply) => {
	try {
	//TODO: update with new jwt containing only ID
	  await request.jwtVerify();
	  const userId = request.user.id;
	  const userEmail = request.user.email;
	  const { password } = request.body;
	  
	  if (!password) {
		return reply.code(400).send({ error: 'Password is required' });
	  }
	  
	  const user = fastify.db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
	  
	  if (!user) {
		return reply.code(404).send({ error: 'User not found' });
	  }
	  
	  const isPasswordValid = await bcrypt.compare(password, user.password);
	  
	  if (!isPasswordValid) {
		return reply.code(401).send({ error: 'Invalid password' });
	  }
	  
	  const verificationCode = crypto.randomInt(100000, 999999).toString();
	  
	  verificationCodes[userId] = {
		type: 'delete_account',
		code: verificationCode,
		expiresAt: Date.now() + 10 * 60 * 1000
	  };
	  
	  try {
		await transporter.sendMail({
		  from: `"Transcendence" <${process.env.EMAIL_MAIL}>`,
		  to: userEmail,
		  subject: 'Account Deletion Verification Code',
		  text: `Your verification code to delete your account is: ${verificationCode}. This code will expire in 10 minutes. If you did not request this, please secure your account immediately.`,
		  html: `
			<h2>Account Deletion Request</h2>
			<p>Your verification code to delete your account is: <strong>${verificationCode}</strong></p>
			<p>This code will expire in 10 minutes.</p>
			<p><strong>Warning:</strong> If you did not request this, someone might be trying to access your account. Please change your password immediately.</p>
		  `
		});
		
		reply.code(200).send({ message: 'Verification code sent to your email' });
	  } catch (error) {
		console.error('Error sending email:', error);
		reply.code(500).send({ error: 'Failed to send verification email' });
	  }
	} catch (error) {
	  console.error('Delete request error:', error);
	  reply.code(500).send({ error: 'Internal server error' });
	}
  });
  
  // Cette route verifie le code 2FA et supprime le compte s'il est correct
  fastify.delete('/delete/confirm', async (request, reply) => {
	try {
	  await request.jwtVerify();
	  const userId = request.user.id;
	  const { verificationCode } = request.body;
	  
	  if (!verificationCode) {
		return reply.code(400).send({ error: 'Verification code is required' });
	  }
	  
	  const storedVerification = verificationCodes[userId];
	  if (!storedVerification || storedVerification.type !== 'delete_account' || storedVerification.expiresAt < Date.now()) {
		return reply.code(400).send({ error: 'Invalid or expired verification code' });
	  }
	  
	  if (storedVerification.code !== verificationCode) {
		return reply.code(400).send({ error: 'Incorrect verification code' });
	  }
	  
	  // Début de la transaction pour les opérations de suppression
	  const transaction = fastify.db.transaction(() => {
		const userData = fastify.db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId);
		if (userData && userData.avatar) {
		  try {
			const avatarPath = path.resolve(userData.avatar);
			if (fs.existsSync(avatarPath)) {
			  fs.unlinkSync(avatarPath);
			}
		  } catch (error) {
			console.error('Error deleting avatar file:', error);
		  }
		}
		
		fastify.db.prepare('DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?').run(userId, userId);
		
		fastify.db.prepare('DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?').run(userId, userId);
		
		fastify.db.prepare('DELETE FROM friend WHERE userid1 = ? OR userid2 = ?').run(userId, userId);
		if (userData) {
			fastify.db.prepare('DELETE FROM game WHERE playerid_1 = ? OR playerid_2 = ?').run(userId, userId);
		}
		
		fastify.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
	  });
	  
	  transaction();
	  
	  delete verificationCodes[userId];
	  
	  return reply.code(200).send({ 
		message: 'Account successfully deleted' 
	  });
	  
	} catch (error) {
	  console.error('Account deletion error:', error);
	  return reply.code(500).send({ 
		error: 'Failed to delete account', 
		details: error.message 
	  });
	}
  });

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////Route permettant a un user de telecharger toutes ses donnees
	fastify.get('/gdpr/data-export', async (request, reply) => {
		try {
		//TODO: update with new jwt containing only ID
		await request.jwtVerify();
		const userId = request.user.id;
	    const userName = request.user.username;

		const userData = fastify.db.prepare(`
			SELECT id, username, email, avatar, game_data, is_two_factor_enabled, status
			FROM users WHERE id = ?
		`).get(userId);
	
		if (!userData) {
			return reply.code(404).send({ error: 'User not found' });
		}
	
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
	fastify.get('/gdpr/data-portability', async (request, reply) => {
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
	fastify.post('/gdpr/anonymize', async (request, reply) => {
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
	fastify.get('/gdpr/preferences', async (request, reply) => {
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
	fastify.put('/gdpr/preferences', async (request, reply) => {
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
	fastify.post('/gdpr/request', async (request, reply) => {
	try {
		//TODO: update with new jwt containing only ID
		await request.jwtVerify();
		const userId = request.user.id;
		const userEmail = request.user.email;
		const { requestType, details } = request.body;
		
		if (!requestType) {
		return reply.code(400).send({ error: 'Request type is required' });
		}
		
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
	fastify.get('/gdpr/overview', async (request, reply) => {
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

export default settingsRoutes;