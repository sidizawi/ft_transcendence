// friend.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fs from 'fs';
import path from 'path';
import multer from 'fastify-multer';

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

async function profileRoutes(fastify, options) {
	if (!fastify.db) {
		fastify.decorate('db', db);
	}
	if (!fastify.jwt) {
		await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
	}

	// Servir les fichiers statiques pour les avatars
	fastify.register(require('@fastify/static'), {
		root: path.join(__dirname, '../../uploads/avatars'),
		prefix: '/avatars/'					 // URL prefix (e.g., http://localhost:3000/avatars/)
	});

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

	fastify.get('/gamestats/:game?', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const gameType = request.params.game;

		let query = 'SELECT * FROM game WHERE playerid_1 = ? OR playerid_2 = ?';
		let params = [userId, userId];

		if (gameType !== 'pong' && gameType !== 'p4') {
			return reply.code(400).send({ error: 'Invalid game type' });
		}

		if (gameType) {
			query += ' AND game_type = ?';
			params.push(gameType);
		}

		const games = fastify.db.prepare(query).all(...params);

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/// USER MODIFICATIONS ///
	// Modify username without check
	fastify.put('/profile/username', async (request, reply) => {
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
		const token = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email });
		
		reply.code(200).send({ message: 'Username updated successfully', token });
	  });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Post email then check if already user, if not, send verification code
	fastify.post('/profile/email/request', async (request, reply) => {
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
	fastify.put('/profile/email/verify', async (request, reply) => {
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
		const token = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email });
		
		reply.code(200).send({ message: 'Email updated successfully', token });
	  });
	

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Post new password and send code by mail
	fastify.post('/profile/password/request', async (request, reply) => {
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
	fastify.put('/profile/password/verify', async (request, reply) => {
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
		
		const hashedPassword = await fastify.bcrypt.hash(newPassword);
		
		fastify.db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
		
		delete verificationCodes[userId];
		
		reply.code(200).send({ message: 'Password updated successfully' });
	  });

	
	// Route pour uploader un avatar
	fastify.post('/profile/avatar', { preHandler: upload.single('avatar') }, async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
		const userName = request.user.username;
		if (!request.file) {
			return reply.code(400).send({ error: 'No file uploaded' });
		}

		const validMimeTypes = ['image/jpeg', 'image/png'];
		if (!validMimeTypes.includes(request.file.mimetype)) {
			fs.unlinkSync(request.file.path);
			return reply.code(400).send({ error: 'Invalid file type' });
		}

		const fileExtension = path.extname(request.file.originalname);
		const newFileName = `${userId}-${userName}${fileExtension}`;
		const newFilePath = path.join('uploads/avatars', newFileName);

		fs.renameSync(request.file.path, newFilePath);

		fastify.db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(newFilePath, userId);

		reply.code(200).send({ message: 'Avatar uploaded successfully', avatarPath: newFilePath });
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
}

export default profileRoutes;