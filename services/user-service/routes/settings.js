// friend.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fastifyJwt from '@fastify/jwt';
import fs from 'fs';
import path from 'path';
import multer from 'fastify-multer';
import bcrypt from 'bcrypt';

import { XSSanitizer } from '../../utils/sanitize.js';
import { verificationCodes } from '../index.js';

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

async function settingsRoutes(fastify, options) {
	if (!fastify.jwt) {
		await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
	}

	/// USER MODIFICATIONS ///
	// Demande de mise à jour de profil avec vérification

	fastify.put('/username', async (request, reply) => {
		try {
		await request.jwtVerify();
		const userId = request.user.id;
		let { newUsername } = XSSanitizer(request.body);

		
		if (!newUsername) {
			return reply.code(400).send({ error: 'New username is required' });
		}
		
		const user = fastify.db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
		if (!user) {
			return reply.code(404).send({ error: 'User not found' });
		}
		
		if (newUsername === user.username) {
			return reply.code(200).send({ message: 'Username is already set to this value' });
		}
		
		const usernameExists = fastify.db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername);
		if (usernameExists) {
			return reply.code(400).send({ error: 'Username already taken' });
		}
		
		fastify.db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);
		fastify.db.prepare('UPDATE friend SET username1 = ? WHERE userid1 = ?').run(newUsername, userId);
		fastify.db.prepare('UPDATE friend SET username2 = ? WHERE userid2 = ?').run(newUsername, userId);
		
		const updatedUser = fastify.db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
		const token = fastify.jwt.sign({ id: updatedUser.id });
		
		return reply.code(200).send({ 
			message: 'Username updated successfully', 
			username: newUsername,
			token 
		});
		
		} catch (error) {
		console.error('Username update error:', error);
		return reply.code(500).send({ error: 'Internal server error', details: error.message });
		}
	});


	fastify.post('/update-request', async (request, reply) => {
		try {
			await request.jwtVerify();
			const userId = request.user.id;
			const { newUsername, newEmail, newPassword } = XSSanitizer(request.body);
			
			if (!newUsername && !newEmail && !newPassword) {
				return reply.code(400).send({ error: 'At least one field to update is required' });
			}
			
			const user = fastify.db.prepare('SELECT username, email FROM users WHERE id = ?').get(userId);
			if (!user) {
				return reply.code(404).send({ error: 'User not found' });
			}
			
			if (newUsername && newUsername !== user.username) {
				const usernameExists = fastify.db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername);
				if (usernameExists) {
					return reply.code(400).send({ error: 'Username already taken' });
				}
			}
			
			if (newEmail && newEmail !== user.email) {
				const emailExists = fastify.db.prepare('SELECT id FROM users WHERE email = ?').get(newEmail);
				if (emailExists) {
					return reply.code(400).send({ error: 'Email already in use' });
				}
			}
		
			const verificationCode = crypto.randomInt(100000, 999999).toString();
		
			verificationCodes[userId] = {
				type: 'profile_update',
				code: verificationCode,
				updates: {
					username: newUsername || null,
					email: newEmail || null,
					password: newPassword || null
				},
				expiresAt: Date.now() + 10 * 60 * 1000
			};
			
			const recipientEmail = user.email;
			try {
				await transporter.sendMail({
					from: `"Transcendence" <${process.env.EMAIL_MAIL}>`,
					to: recipientEmail,
					subject: 'Profile Update Verification Code',
					text: `Your verification code to update your profile is: ${verificationCode}. This code will expire in 10 minutes.`,
					html: `
						<h2>Profile Update Request</h2>
						<p>Your verification code to update your profile is: <strong>${verificationCode}</strong></p>
						<p>This code will expire in 10 minutes.</p>
						<p>Changes requested:</p>
						<ul>
						${newUsername ? `<li>Username: ${user.username} → ${newUsername}</li>` : ''}
						${newEmail ? `<li>Email: ${user.email} → ${newEmail}</li>` : ''}
						${newPassword ? '<li>Password: [Password will be updated]</li>' : ''}
						</ul>
					`
				});
				
				reply.code(200).send({ 
					message: 'Verification code sent',
					sentTo: recipientEmail 
				});
			} catch (error) {
				console.error('Error sending email:', error);
				reply.code(500).send({ error: 'Failed to send verification email' });
			}
		} catch (error) {
			console.error('Profile update request error:', error);
			reply.code(500).send({ error: 'Internal server error', details: error.message });
		}
	});
  
	fastify.put('/update-confirm', async (request, reply) => {
		try {
		await request.jwtVerify();
		const userId = request.user.id;
		const { verificationCode } = request.body;
		
		if (!verificationCode) {
			return reply.code(400).send({ error: 'Verification code is required' });
		}
		
		const userVerification = verificationCodes[userId];
		if (!userVerification || userVerification.type !== 'profile_update') {
			return reply.code(400).send({ error: 'No pending update request or invalid verification type' });
		}
		
		if (userVerification.code !== verificationCode) {
			return reply.code(401).send({ error: 'Invalid verification code' });
		}
		
		if (userVerification.expiresAt < Date.now()) {
			delete verificationCodes[userId];
			return reply.code(401).send({ error: 'Verification code has expired' });
		}
		
		const updates = userVerification.updates;
		const updateSQL = [];
		const updateParams = [];
		const updateMessages = [];
		
		const currentUser = fastify.db.prepare('SELECT username, email FROM users WHERE id = ?').get(userId);
		if (!currentUser) {
			return reply.code(404).send({ error: 'User not found' });
		}
		
		const oldUsername = currentUser.username;
		
		if (updates.username && updates.username !== oldUsername) {
			updateSQL.push('username = ?');
			updateParams.push(updates.username);
			updateMessages.push('Username updated');
		}
		
		if (updates.email && updates.email !== currentUser.email) {
			updateSQL.push('email = ?');
			updateParams.push(updates.email);
			updateMessages.push('Email updated');
		}
		
		if (updates.password) {
			const hashedPassword = await bcrypt.hash(updates.password, 10);
			updateSQL.push('password = ?');
			updateParams.push(hashedPassword);
			updateMessages.push('Password updated');
		}
		
		updateParams.push(userId);
		
		if (updateSQL.length > 0) {
			const transaction = fastify.db.transaction(() => {
			fastify.db.prepare(`
				UPDATE users 
				SET ${updateSQL.join(', ')} 
				WHERE id = ?
			`).run(...updateParams);
			
			if (updates.username && updates.username !== oldUsername) {
				fastify.db.prepare('UPDATE friend SET username1 = ? WHERE userid1 = ? AND username1 = ?')
				.run(updates.username, userId, oldUsername);
				
				fastify.db.prepare('UPDATE friend SET username2 = ? WHERE userid2 = ? AND username2 = ?')
				.run(updates.username, userId, oldUsername);
				
				fastify.db.prepare('UPDATE game SET username_1 = ? WHERE playerid_1 = ? AND username_1 = ?')
				.run(updates.username, userId, oldUsername);
				
				fastify.db.prepare('UPDATE game SET username_2 = ? WHERE playerid_2 = ? AND username_2 = ?')
				.run(updates.username, userId, oldUsername);
				
				fastify.db.prepare('UPDATE game SET player_win = ? WHERE player_win = ? AND (playerid_1 = ? OR playerid_2 = ?)')
				.run(updates.username, oldUsername, userId, userId);
				
				fastify.db.prepare('UPDATE game SET player_lost = ? WHERE player_lost = ? AND (playerid_1 = ? OR playerid_2 = ?)')
				.run(updates.username, oldUsername, userId, userId);
			}
			});
			
			transaction();
			
			let token = null;
			if (updates.username || updates.email) {
			const updatedUser = fastify.db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(userId);
			token = fastify.jwt.sign({ 
				id: updatedUser.id
			});
			}
			
			delete verificationCodes[userId];
			
			return reply.code(200).send({ 
			message: 'Profile updated successfully', 
			updates: updateMessages.join(', '),
			token: token
			});
		} else {
			return reply.code(400).send({ error: 'No fields to update' });
		}
		} catch (error) {
		console.error('Profile update confirmation error:', error);
		return reply.code(500).send({ error: 'Failed to update profile', details: error.message });
		}
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
	
		const originalFileName = request.file.originalname;
		const newFilePath = path.join('uploads/avatars', originalFileName);
	
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

	});
    
}

export default settingsRoutes;