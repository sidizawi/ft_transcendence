export function verifyToken(socket, next, fastify) {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication error: Token not provided'));
        }
        
        const decoded = fastify.jwt.verify(token);
        socket.user = decoded;
        next();
    } catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
}