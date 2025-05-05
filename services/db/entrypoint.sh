#!/bin/sh

DB_PATH="/app/data/management.db"

sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    privacy TEXT DEFAULT '{}',
    is_two_factor_enabled BOOLEAN DEFAULT 0,
    status BOOLEAN NOT NULL CHECK (status IN (0, 1)) DEFAULT 0,
    google BOOLEAN DEFAULT 0
);
CREATE TABLE IF NOT EXISTS friend (
    userid1 INTEGER,
    userid2 INTEGER,
    username1 TEXT NOT NULL,
    username2 TEXT NOT NULL,
    status TEXT NOT NULL,
    PRIMARY KEY (userid1, userid2),
    FOREIGN KEY (userid1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (userid2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (username1) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (username2) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS game (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playerid_1 INTEGER NOT NULL,
    playerid_2 INTEGER NOT NULL,
    username_1 TEXT NOT NULL,
    username_2 TEXT NOT NULL,
    game_type TEXT NOT NULL,
    score_1 INTEGER NOT NULL,
    score_2 INTEGER NOT NULL,
    player_win TEXT NOT NULL,
    player_lost TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playerid_1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (playerid_2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (username_1) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (username_2) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (player_win) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (player_lost) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    request_type TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    processed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
#exec tail -f /dev/null

sh /init.sh