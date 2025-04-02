export function handleMessage(socket, data, fastify) {
    try {
        const { recipientId, content } = data;
        const senderId = socket.user.id;
        
        if (!recipientId || !content) {
            socket.emit('error', { message: 'Recipient ID and content are required' });
            return;
        }
        
        // Check if users are friends
        const friendship = fastify.db.prepare(
            "SELECT * FROM friend WHERE userid1 = ? AND userid2 = ? AND status = 'accepted'"
        ).get(senderId, recipientId);
        
        if (!friendship) {
            socket.emit('error', { message: 'You can only message users who are your friends' });
            return;
        }
        
        // Check if recipient has blocked sender
        const blocked = fastify.db.prepare(
            "SELECT * FROM friend WHERE userid1 = ? AND userid2 = ? AND status = 'blocked'"
        ).get(recipientId, senderId);
        
        if (blocked) {
            socket.emit('error', { message: 'Unable to send message' });
            return;
        }
        
        // Save message to database
        const stmt = fastify.db.prepare(
            "INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)"
        );
        const result = stmt.run(senderId, recipientId, content);
        const messageId = result.lastInsertRowid;
        
        // Get message with timestamp
        const message = fastify.db.prepare(
            "SELECT * FROM messages WHERE id = ?"
        ).get(messageId);
        
        // Update or create conversation
        updateConversation(fastify, senderId, recipientId, messageId);
        
        // Send message to recipient if online
        const recipientSocket = fastify.usersOnline.get(Number(recipientId));
        if (recipientSocket) {
            recipientSocket.emit('private-message', {
                id: messageId,
                senderId,
                senderUsername: socket.user.username,
                content,
                timestamp: message.timestamp,
                isRead: false
            });
        }
        
        // Confirm to sender that message was sent
        socket.emit('message-sent', {
            id: messageId,
            recipientId,
            content,
            timestamp: message.timestamp
        });
    } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
}

function updateConversation(fastify, user1Id, user2Id, messageId) {
    // Ensure consistent ordering of user IDs (smaller ID first)
    const [smallerId, largerId] = user1Id < user2Id 
        ? [user1Id, user2Id] 
        : [user2Id, user1Id];
    
    // Check if conversation exists
    const conversation = fastify.db.prepare(
        "SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?"
    ).get(smallerId, largerId);
    
    if (conversation) {
        // Update existing conversation
        fastify.db.prepare(
            "UPDATE conversations SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).run(messageId, conversation.id);
    } else {
        // Create new conversation
        fastify.db.prepare(
            "INSERT INTO conversations (user1_id, user2_id, last_message_id) VALUES (?, ?, ?)"
        ).run(smallerId, largerId, messageId);
    }
}