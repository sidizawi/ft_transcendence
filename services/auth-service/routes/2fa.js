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
                return { error: 'Utilisateur non trouvé' };
            }
      
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
            otpCache[userId] = {
                otp,
                expires: Date.now() + 10 * 60 * 1000
            };
            const mailOptions = {
                from: `"Transcendence" <${process.env.EMAIL_MAIL}>`,
                to: user.email,
                subject: 'Votre code de vérification 2FA',
                text: `Bonjour ${user.username},\n\nVotre code de vérification est : ${otp}\nIl expirera dans 10 minutes.\n\nCordialement,\nL'équipe Transcendence`
            };
      
            await transporter.sendMail(mailOptions);
            reply.code(200);
            return { message: 'OTP envoyé par email' };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500);
            return { error: 'Erreur lors de l\'envoi de l\'email' };
        }
      });
      
    fastify.post('/connection/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
          const { otp } = request.body;
          if (!otp) {
            reply.code(400);
            return { error: 'Le code OTP est requis.' };
          }
          const userId = request.user.id;
          const entry = otpCache[userId];
          if (!entry || Date.now() > entry.expires) {
            reply.code(400);
            return { error: 'Le code OTP a expiré ou n\'existe pas.' };
          }

          if (entry.otp !== otp) {
            reply.code(403);
            return { error: 'Le code OTP est incorrect.' };
          }
          
          await update2faById(1, userId);
          
          delete otpCache[userId];
          reply.code(200);
          return { message: '2FA activé avec succès.' };
        } catch (err) {
          fastify.log.error(err);
          reply.code(500);
          return { error: 'Erreur lors de la vérification du code OTP.' };
        }
    });
      
      /// 2FA Switch ///
    fastify.post('/switch/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
      try {
        const { otp } = request.body;
        if (!otp) {
          reply.code(400);
          return { error: 'Le code OTP est requis.' };
        }
      
        const userId = request.user.id;
        const entry = otpCache[userId];
        if (!entry || Date.now() > entry.expires) {
          reply.code(400);
          return { error: 'Le code OTP a expiré ou n\'existe pas.' };
        }
        if (entry.otp !== otp) {
          reply.code(403);
          return { error: 'Le code OTP est incorrect.' };
        }

        const user = await get2faById(userId);

        if (!user) {
          reply.code(404);
          return { error: 'Utilisateur non trouvé' };
        }
      
        const currentTwoFactorState = user.is_two_factor_enabled;
        const newTwoFactorState = currentTwoFactorState === 1 ? 0 : 1;

        await update2faById(newTwoFactorState, userId);

        delete otpCache[userId];
        const message = newTwoFactorState ? '2FA activé avec succès.' : '2FA désactivé avec succès.';
        reply.code(200);
        return { message };
      } catch (err) {
        fastify.log.error(err);
        reply.code(500);
        return { error: 'Erreur lors de la vérification du code OTP.' };
      }
    });
}

export default twofaRoutes;