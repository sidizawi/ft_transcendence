#!/bin/sh

DB_PATH="/app/data/management.db"

sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    game_data TEXT DEFAULT '{}',
    is_two_factor_enabled INTEGER DEFAULT 0
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
