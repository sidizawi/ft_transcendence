import { verifyToken } from './middleware/authMiddleware.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleConnection, handleDisconnect } from './handlers/connectionHandler.js';

export function setupSocketHandlers(fastify) {
    const io = fastify.io;

    // Authentication middleware
    io.use((socket, next) => {
        verifyToken(socket, next, fastify);
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const username = socket.user.username;
        
        console.log(`User connected: ${username} (${userId})`);
        
        // Store socket in online users map
        fastify.usersOnline.set(userId, socket);
        
        // Handle new connection
        handleConnection(socket, fastify);
        
        // Handle private messages
        socket.on('private-message', (data) => {
            handleMessage(socket, data, fastify);
        });
        
        // Handle typing indicator
        socket.on('typing', (data) => {
            const recipientSocket = fastify.usersOnline.get(Number(data.recipientId));
            if (recipientSocket) {
                recipientSocket.emit('user-typing', {
                    senderId: userId,
                    senderUsername: username
                });
            }
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
            handleDisconnect(socket, fastify);
            fastify.usersOnline.delete(userId);
            console.log(`User disconnected: ${username} (${userId})`);
        });
    });
} 