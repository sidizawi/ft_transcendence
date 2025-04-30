let sockets = new Map(); // key: username, value: socket
let users = new Map(); // key: socket, value: {user, userId}

function handleNewChatRoom(fastify, data, socket) {
    let friendId = fastify.db.prepare("SELECT id FROM users WHERE username = ?").get(data.friend).id;
    const dbMessages = fastify.db.prepare("SELECT * FROM messages \
        WHERE (sender_id = ? AND recipient_id = ?) \
        OR (sender_id = ? AND recipient_id = ?)")
        .all(data.userId, friendId, friendId, data.userId);

    const messages = dbMessages.map((mess) => {
        return {
            text: mess.content,
            sender: mess.sender_id == data.userId ? data.user : data.friend,
            timestamp: mess.timestamp
        };
    })

    socket.send(JSON.stringify({
        type: "messages",
        friend: data.friend,
        messages
    }))
}

function handleNewConn(data, socket) {
    sockets[data.user] = socket;
    users[socket] = {
        user: data.user,
        userId: data.userId
    };
}

function handleNewMessage(fastify, data) {
    if (data.friend in sockets) {
        sockets[data.friend].send(JSON.stringify({
            type: "message",
            sender: data.user,
            text: data.text,
            timestamp: data.timestamp,
            friend: data.friend
        }));
    }

    let friendId;
    if (data.friend in sockets) {
        friendId = users[sockets[data.friend]].userId;
    } else {
        friendId = fastify.db.prepare("SELECT id FROM users WHERE username = ?").get(data.friend).id
    }
    let tmp = fastify.db.prepare("INSERT INTO messages (sender_id, recipient_id, content, timestamp) VALUES (?, ?, ?, ?)");
    tmp.run(data.userId, friendId, data.text, data.timestamp);
}

export default async function messageRoutes(fastify, options) {
    // Get conversations
    fastify.get('/conversations', async (request, reply) => {
        await request.jwtVerify();
        const userId = request.user.id;
        
        const conversations = fastify.db.prepare(`
            SELECT 
                c.id, 
                CASE 
                    WHEN c.user1_id = ? THEN c.user2_id
                    ELSE c.user1_id
                END as otherUserId,
                u.username as otherUsername,
                m.content as lastMessage,
                m.timestamp as lastMessageTime,
                (SELECT COUNT(*) FROM messages 
                 WHERE recipient_id = ? AND sender_id = otherUserId AND is_read = 0) as unreadCount
            FROM conversations c
            JOIN users u ON (c.user1_id = ? AND u.id = c.user2_id) OR (c.user2_id = ? AND u.id = c.user1_id)
            LEFT JOIN messages m ON m.id = c.last_message_id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.updated_at DESC
        `).all(userId, userId, userId, userId, userId, userId);
        
        if (!conversations || conversations.length === 0) {
            return reply.code(204).send({ message: 'No conversations found' });
        }

        reply.code(201);
        return { conversations };
    });

    // Get messages for a conversation with a specific user
    fastify.get('/history/:userId', async (request, reply) => {
        await request.jwtVerify();
        const currentUserId = request.user.id;
        const otherUserId = parseInt(request.params.userId);
        
        // Check if users are friends
        const areFriends = fastify.db.prepare(`
            SELECT COUNT(*) as count FROM friend 
            WHERE userid1 = ? AND userid2 = ? AND status = 'accepted'
        `).get(currentUserId, otherUserId);
        
        if (areFriends.count === 0) {
            return reply.code(403).send({ error: 'You can only view messages from friends' });
        }
        
        // Get messages between the two users
        const messages = fastify.db.prepare(`
            SELECT 
                m.id,
                m.sender_id as senderId,
                m.recipient_id as recipientId,
                u.username as senderUsername,
                m.content,
                m.timestamp,
                m.is_read as isRead
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
            ORDER BY m.timestamp ASC
        `).all(currentUserId, otherUserId, otherUserId, currentUserId);

        if (!messages || messages.length === 0) {
            return reply.code(204).send({ message: 'No messages found' });
        }

        // Mark messages as read
        fastify.db.prepare(`
            UPDATE messages 
            SET is_read = 1 
            WHERE sender_id = ? AND recipient_id = ? AND is_read = 0
        `).run(otherUserId, currentUserId);
        
        reply.code(201);
        return { messages };
    });

    fastify.register(async function (fastify) {
        fastify.get('/', {websocket: true}, (socket, req) => {
            const { token } = req.query;
            
            if (!token) {
                socket.close();
                return ;
            }

    		fastify.jwt.verify(token);

            socket.on('message', (message) => {
                let data = JSON.parse(message.toString());

                console.log("Received message:", data);
                if (!data.user || !data.userId) {
                    socket.close();
                    return ;
                }

                if (data.type == "new") {
                    handleNewConn(data, socket);
                } else if (data.type == "newChat") {
                    handleNewChatRoom(fastify, data, socket);
                } else {
                    handleNewMessage(fastify, data);
                }
            });

            socket.on('close', () => {
                let user = users[socket];
                if (user) {
                    delete sockets[user.user];
                    delete users[socket];
                    fastify.log.info(`Client disconnected ${user.user}`);
                }
            });
        });
    });
}