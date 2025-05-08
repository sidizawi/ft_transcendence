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
                return { error: 'authService.error.userNotFound' };
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
            return { message: 'authService.message.otpSendByEmail' };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500);
            return { error: 'authService.error.errorSendingEmail' };
        }
      });
      
    fastify.post('/connection/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
          const { otp } = request.body;
          if (!otp) {
            reply.code(400);
            return { error: 'authService.error.otpCodeIsRequired' };
          }
          const userId = request.user.id;
          const entry = otpCache[userId];
          if (!entry || Date.now() > entry.expires) {
            reply.code(401);
            return { error: 'authService.error.otpCodeHasExpiredOrInvalid' };
          }

          if (entry.otp !== otp) {
            reply.code(401);
            return { error: 'authService.error.otpCodeIsInvalid' };
          }
          
          await update2faById(1, userId);
          
          delete otpCache[userId];
          reply.code(200);
          return { message: 'authService.message.twofaEnabled' };
        } catch (err) {
          fastify.log.error(err);
          reply.code(500);
          return { error: 'authService.error.errorVerifyingOtpCode' };
        }
    });
      
      /// 2FA Switch ///
    fastify.post('/switch/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
      try {
        const { otp } = request.body;
        if (!otp) {
          reply.code(400);
          return { error: 'authService.error.otpCodeIsRequired' };
        }
      
        const userId = request.user.id;
        const entry = otpCache[userId];
        if (!entry || Date.now() > entry.expires) {
          reply.code(401);
          return { error: 'authService.error.otpCodeHasExpiredOrInvalid' };
        }
        if (entry.otp !== otp) {
          reply.code(401);
          return { error: 'authService.error.otpCodeIsInvalid' };
        }

        const user = await get2faById(userId);

        if (!user) {
          reply.code(404);
          return { error: 'authService.error.userNotFound' };
        }
      
        const currentTwoFactorState = user.is_two_factor_enabled;
        const newTwoFactorState = currentTwoFactorState === 1 ? 0 : 1;

        await update2faById(newTwoFactorState, userId);

        delete otpCache[userId];
        const message = newTwoFactorState ? 'authService.message.twofaEnabled' : 'authService.message.twofaDisabled';
        reply.code(200);
        return { message };
      } catch (err) {
        fastify.log.error(err);
        reply.code(500);
        return { error: 'authService.error.errorVerifyingOtpCode' };
      }
    });
}

export default twofaRoutes;