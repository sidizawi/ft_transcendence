import { getUserById,
    get2faById,
    update2faById
 } from "../services/userService.js";

async function twofaRoutes(fastify) {
 
    const otpCache = {};
    
    fastify.post('/email/send', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            await request.jwtVerify();
            const userId = request.user.id;
      
            const user = await getUserById(userId);
            if (!user) {
                reply.code(404);
                return { error: 'User not found' };
            }
      
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
            otpCache[userId] = {
                otp,
                expires: Date.now() + 10 * 60 * 1000
            };
            const mailOptions = {
                from: `"Transcendence" <${process.env.EMAIL_MAIL}>`,
                to: user.email,
                subject: 'Your 2FA verification code',
                text: `Hello ${user.username},\n\nYour verification code is: ${otp}\nIt will expire in 10 minutes.\n\nSincerely,\nThe Transcendence team`
            };
      
            await transporter.sendMail(mailOptions);
            reply.code(200);
            return { message: 'OTP sent by email' };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500);
            return { error: 'Error sending email' };
        }
      });
      
    fastify.post('/connection/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
          const { otp } = request.body;
          if (!otp) {
            reply.code(400);
            return { error: 'OTP code is required' };
          }
          const userId = request.user.id;
          const entry = otpCache[userId];
          if (!entry || Date.now() > entry.expires) {
            reply.code(401);
            return { error: 'OTP code has expired or does not exist' };
          }

          if (entry.otp !== otp) {
            reply.code(401);
            return { error: 'OTP code is incorrect' };
          }
          
          await update2faById(1, userId);
          
          delete otpCache[userId];
          reply.code(200);
          return { message: '2FA successfully activated' };
        } catch (err) {
          fastify.log.error(err);
          reply.code(500);
          return { error: 'Error verifying OTP code' };
        }
    });
      
      /// 2FA Switch ///
    fastify.post('/switch/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
      try {
        const { otp } = request.body;
        if (!otp) {
          reply.code(400);
          return { error: 'OTP code is required' };
        }
      
        const userId = request.user.id;
        const entry = otpCache[userId];
        if (!entry || Date.now() > entry.expires) {
          reply.code(401);
          return { error: 'OTP code has expired or does not exist' };
        }
        if (entry.otp !== otp) {
          reply.code(401);
          return { error: 'OTP code is incorrect' };
        }

        const user = await get2faById(userId);

        if (!user) {
          reply.code(404);
          return { error: 'User not found' };
        }
      
        const currentTwoFactorState = user.is_two_factor_enabled;
        const newTwoFactorState = currentTwoFactorState === 1 ? 0 : 1;

        await update2faById(newTwoFactorState, userId);

        delete otpCache[userId];
        const message = newTwoFactorState ? '2FA successfully activated' : '2FA successfully deactivated';
        reply.code(200);
        return { message };
      } catch (err) {
        fastify.log.error(err);
        reply.code(500);
        return { error: 'Error verifying OTP code' };
      }
    });
}

export default twofaRoutes;