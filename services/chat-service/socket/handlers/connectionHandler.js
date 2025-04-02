export function handleConnection(socket, fastify) {
    const userId = socket.user.id;
    
    // Notify friends that user is online
    const friends = fastify.db.prepare(
        "SELECT userid2 FROM friend WHERE userid1 = ? AND status = 'accepted'"
    ).all(userId);
    
    friends.forEach(friend => {
        const friendSocket = fastify.usersOnline.get(friend.userid2);
        if (friendSocket) {
            friendSocket.emit('friend-status', { 
                userId, 
                username: socket.user.username, 
                status: 'online' 
            });
        }
    });
    
    // Send online friends list to user
    const onlineFriends = fastify.db.prepare(`
        SELECT f.userid2 as userId, u.username 
        FROM friend f
        JOIN users u ON f.userid2 = u.id
        WHERE f.userid1 = ? AND f.status = 'accepted'
    `).all(userId);
    
    const onlineFriendIds = onlineFriends
        .filter(friend => fastify.usersOnline.has(friend.userId))
        .map(friend => ({ userId: friend.userId, username: friend.username }));
    
    socket.emit('online-friends', onlineFriendIds);
}

export function handleDisconnect(socket, fastify) {
    const userId = socket.user.id;
    
    // Notify friends that user is offline
    const friends = fastify.db.prepare(
        "SELECT userid2 FROM friend WHERE userid1 = ? AND status = 'accepted'"
    ).all(userId);
    
    friends.forEach(friend => {
        const friendSocket = fastify.usersOnline.get(friend.userid2);
        if (friendSocket) {
            friendSocket.emit('friend-status', { 
                userId, 
                username: socket.user.username, 
                status: 'offline' 
            });
        }
    });
}