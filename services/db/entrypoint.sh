#!/bin/sh

DB_PATH="/app/data/management.db"

#echo "Vérification de la présence de $DB_PATH ..."

#if [ ! -f "$DB_PATH" ]; then
#    echo "La base n'existe pas encore, création..."
    
    # On crée la base et la table
    sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    game_data TEXT DEFAULT '{}'
);
EOF

#    echo "Base et table 'users' créées."
#else
#    echo "La base existe déjà, rien à faire."
#fi

# Pour garder le conteneur en vie:
exec tail -f /dev/null
