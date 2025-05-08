import { verificationCodes } from "../index.js";
import { beginTransaction, 
  commitTransaction, 
  rollbackTransaction
} from "../services/query.js";
import { getUserById,
  getAvatarById,
  deleteUserById
} from "../services/userService.js";
import { deleteGameByPlayerId } from "../services/gameService.js";
import { deleteFriendById } from "../services/friendService.js";
import { deleteMessageById } from "../services/messageService.js";
import { deleteConversationById } from "../services/conversationService.js";

async function deleteRoutes(fastify) {

    // This route checks the password and sends a 2FA code if it is correct
	fastify.post('/request', async (request, reply) => {
        try {
          await request.jwtVerify();
          const userId = request.user.id;
          const { password } = XSSanitizer(request.body);
          
            const user = await getUserById(userId);
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
    
    //TODO: test transaction
    // This route verifies the 2FA code and deletes the account if it is correct
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
        
        try {
            // Start of transaction for deletion operations
            await beginTransaction();
              const userData = await getAvatarById(userId);
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
              
              await deleteConversationById(userId);
              await deleteMessageById(userId);
              await deleteFriendById(userId);
              
              if (userData) {
                  await deleteGameByPlayerId(userId);
              }
              
              await deleteUserById(userId);
              await commitTransaction();
        } catch (error) {
            await rollbackTransaction();
            return reply.code(500).send({ error: 'Failed to delete account', details: error.message });
        }
        
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