import { queryGet, queryPost } from "../services/query.js";

let chatRooms = new Map();
  
async function handleNewConn(fastify, data, socket) {
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
        const query = 'SELECT * FROM users WHERE username = ?';
        const params = data.friend;
        const friend = await queryGet(query, params);
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

    const query = 'SELECT * FROM messages \
        WHERE (sender_id = ? AND recipient_id = ?) \
        OR (sender_id = ? AND recipient_id = ?)'
    const params = [chatRoom.user1Id, chatRoom.user2Id, chatRoom.user2Id, chatRoom.user1Id];
    const dbChatRoom = await queryGet(query, params);
    if (!dbChatRoom) {
        socket.send(JSON.stringify({
            type: "messages",
            messages: []
        }))
        return ;
    }
    
    const messages = dbChatRoom.map((mess) => {
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

async function handleNewMessage(fastify, data) {
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
    const query = 'INSERT INTO messages (sender_id, recipient_id, content, timestamp, is_read) VALUES (?, ?, ?, ?, ?)';

    if (chatRoom.user1 == data.user) {
        const params = [chatRoom.user1Id, chatRoom.user2Id, data.text, data.timestamp, is_read ? 1 : 0];
        await queryPost(query, params);
    } else {
        const params = [chatRoom.user2Id, chatRoom.user1Id, data.text, data.timestamp, is_read ? 1 : 0];
        await queryPost(query, params);
    }
}

export default async function messageRoutes(fastify, options) {

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