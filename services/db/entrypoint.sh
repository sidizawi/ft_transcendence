#!/bin/sh

DB_PATH="/app/data/management.db"

sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    status BOOLEAN NOT NULL CHECK (status IN (0, 1)) DEFAULT 0
);
CREATE TABLE IF NOT EXISTS friend (
    userid1 INTEGER,
    userid2 INTEGER,
    username1 TEXT NOT NULL,
    username2 TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (userid1, userid2),
    FOREIGN KEY (userid1) REFERENCES users(id),
    FOREIGN KEY (userid2) REFERENCES users(id),
    FOREIGN KEY (username1) REFERENCES users(username),
    FOREIGN KEY (username2) REFERENCES users(username)
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    last_message_id INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    FOREIGN KEY (last_message_id) REFERENCES messages(id)
);
EOF

#JSON friends in friendlist
    # id of your friend
    # status : sending, receiving, accepted, blocked
#Exemple: if we are id = 1
    #{2:'sending', 4:'accepted', 8:receiving, 6:'blocked'}
    #we need id 2 to accept/decline our request
    #we are friend with id 4
    #we need to accept/decline from id 8
    #id 4 is blocked


# Pour garder le conteneur en vie:
exec tail -f /dev/null
