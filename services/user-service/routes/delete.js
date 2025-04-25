import { verificationCodes } from "../index.js";

async function deleteRoutes(fastify) {

    // Cette route check le mot de passe entre puis envois un code 2FA s'il est correct
	fastify.post('/request', async (request, reply) => {
        try {
          await request.jwtVerify();
          const userId = request.user.id;
          const { password } = XSSanitizer(request.body);
          
            const user = fastify.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
            if (!user) {
              return reply.code(404).send({ error: 'User not found' });
            }
            const userEmail = user.email;
    
          if (!password) {
            return reply.code(400).send({ error: 'Password is required' });
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
      fastify.delete('/confirm', async (request, reply) => {
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

}

export default deleteRoutes;