let chatRooms = new Map();
  
function handleNewConn(fastify, data, socket) {
    let id, chatRoom;
    let id1 = `${data.user}-${data.friend}`;
    let id2 = `${data.friend}-${data.user}`;

    if (!chatRooms.get(id1) && !chatRooms.get(id2)) {
        id = id1;
    } else if (chatRooms.get(id1)) {
        id = id1;
    } else {
        id = id2;
    }

    // todo: update read messages;

    chatRoom = chatRooms.get(id);
    if (!chatRoom) {
        let friend = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(data.friend);
        chatRooms.set(id, {
            user1: data.user,
            user1Id: data.userId,
            user2: data.friend,
            user2Id: friend.id,
            user1ws: socket,
            user2ws: null
        });
        chatRoom = chatRooms.get(id);
    } else {
        if (chatRoom.user1 == data.user) {
            chatRoom.user1ws = socket;
        } else {
            chatRoom.user2ws = socket;
        }
    }
    const dbMessages = fastify.db.prepare("SELECT * FROM messages \
        WHERE (sender_id = ? AND recipient_id = ?) \
        OR (sender_id = ? AND recipient_id = ?)")
        .all(chatRoom.user1Id, chatRoom.user2Id, chatRoom.user2Id, chatRoom.user1Id);

    const messages = dbMessages.map((mess) => {
        return {
            text: mess.content,
            sender: mess.sender_id == chatRoom.user1Id ? chatRoom.user1 : chatRoom.user2,
            timestamp: mess.timestamp
        };
    });

    socket.send(JSON.stringify({
        type: "messages",
        messages
    }))
}

function handleClose(data) {
    let id, chatRoom;
    let id1 = `${data.user}-${data.friend}`;
    let id2 = `${data.friend}-${data.user}`;

    if (!chatRooms.get(id1) && !chatRooms.get(id2)) {
        id = id1;
    } else if (chatRooms.get(id1)) {
        id = id1;
    } else {
        id = id2;
    }

    chatRoom = chatRooms.get(id);
    if (!chatRoom) {
        return ;
    }
    if (id == id1) {
        chatRoom.user1ws = null
    } else {
        chatRoom.user2ws = null;
    }
}

function handleNewMessage(fastify, data) {
    let id, chatRoom;
    let id1 = `${data.user}-${data.friend}`;
    let id2 = `${data.friend}-${data.user}`;

    if (data.text && typeof data.text === 'string') {
        data.text = data.text;
    }

    if (!chatRooms.get(id1) && !chatRooms.get(id2)) {
        id = id1;
    } else if (chatRooms.get(id1)) {
        id = id1;
    } else {
        id = id2;
    }

    chatRoom = chatRooms.get(id);
    if (!chatRoom) {
        return ;
    }

    let is_read = false;
    if (chatRoom.user1 == data.user && chatRoom.user2ws) {
        chatRoom.user2ws.send(JSON.stringify({
            type: "message",
            sender: data.user,
            text: data.text,
            timestamp: data.timestamp
        }));
        is_read = true;
    } else if (chatRoom.user2 == data.user && chatRoom.user1ws) {
        chatRoom.user1ws.send(JSON.stringify({
            type: "message",
            sender: data.user,
            text: data.text,
            timestamp: data.timestamp
        }));
        is_read = true;
    }
    let tmp = fastify.db.prepare("INSERT INTO messages (sender_id, recipient_id, content, timestamp, is_read) VALUES (?, ?, ?, ?, ?)");

    if (chatRoom.user1 == data.user) {
        tmp.run(chatRoom.user1Id, chatRoom.user2Id, data.text, data.timestamp, is_read ? 1 : 0);
    } else {
        tmp.run(chatRoom.user2Id, chatRoom.user1Id, data.text, data.timestamp, is_read ? 1 : 0);
    }
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
            }

            // todo: verify token

            socket.on('message', (message) => {
                let data = JSON.parse(message.toString());

                if (data.type == "new") {
                    handleNewConn(fastify, data, socket);
                } else if (data.type == "close") {
                    handleClose(data);
                } else {
                    handleNewMessage(fastify, data);
                }
            });
        });
    });
}