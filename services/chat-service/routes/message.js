import { queryGet, queryAll, queryPost } from "../services/query.js";

let sockets = new Map(); // key: username, value: socket
let users = new Map(); // key: socket, value: {user, userId}

async function handleNewChatRoom(data, socket) {
    let query = 'SELECT id FROM users WHERE username = ?';
    let friend = await queryGet(query, data.friend);

    query = "SELECT * FROM messages \
        WHERE (sender_id = ? AND recipient_id = ?) \
        OR (sender_id = ? AND recipient_id = ?)"
    let dbMessages = await queryAll(query, [data.userId, friend.id, friend.id, data.userId]);

    const messages = dbMessages.map((mess) => {
        return {
            text: mess.content,
            sender: mess.sender_id == data.userId ? data.user : data.friend,
            timestamp: mess.timestamp
        };
    });

    socket.send(JSON.stringify({
        type: "messages",
        friend: data.friend,
        messages
    }))
}

function handleNewConn(data, socket) {
    sockets.set(data.user, socket);
    users.set(socket, {
        user: data.user,
        userId: data.userId
    });
    changeStatus(data.user, true);
}

async function handleNewMessage(data) {
    let query;
    let friend = null;
    if (sockets.has(data.friend)) {
        let friendSocket = sockets.get(data.friend);

        if (friendSocket.readyState === 1) {
            friendSocket.send(JSON.stringify({
                type: "message",
                sender: data.user,
                text: data.text,
                timestamp: data.timestamp,
                friend: data.user
            }));
            if (users.has(friendSocket)) {
                friend = users.get(friendSocket);
                if (friend) {
                    friend = friend.userId;
                }
            }
        }
    }

    if (!friend) {
        query = "SELECT id FROM users WHERE username = ?";
        friend = await queryGet(query, data.friend);
        friend = friend.id;
    }
    query = "INSERT INTO messages (sender_id, recipient_id, content, timestamp) VALUES (?, ?, ?, ?)";
    query = await queryPost(query, [data.userId, friend, data.text, data.timestamp]);
}

async function changeStatus(username, status) {
    let query = "UPDATE users SET status = ? WHERE username = ?";
    await queryPost(query, [status ? 1 : 0, username]);
    console.log(`User ${username} is now ${status ? 'online' : 'offline'}`);
}

export default async function messageRoutes(fastify, options) {

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
                    handleNewChatRoom(data, socket);
                } else {
                    handleNewMessage(data);
                }
            });

            socket.on('close', () => {
                let user = users.get(socket);
                if (user) {
                    sockets.delete(user.user);
                    users.delete(socket);
                    changeStatus(user.user, false);
                    fastify.log.info(`Client disconnected ${user.user}`);
                }
            });
        });
    });
}
