#!/bin/bash

DB_PATH="/app/data/management.db"

# Generate SQL script for test data
cat > /tmp/populate_test_data.sql << 'EOF'
INSERT INTO users (id, username, email, password, status) VALUES
  (1, 'guest', 'guest@example.com', '$2a$10$xVqYLhNEMayfBU6KYH5O8.Yw7P/BxGlv7QKQSUh7mQHxEUflA3qfG', 1),
  (2, 'test', 'test@test.com', '$2b$10$PSbKYCGgiuf03Py0aFU4sO1cvpQUG2YtI0/owHwTQV/FiipARwnwi', 1),
  (3, 'leo', 'leo@19.be', '$2b$10$5v.v8ZNhVepVYTFlZintZOiUEFaJC44tbh9WHo1kz4p48oa3YEpWy', 0);

INSERT INTO friend (userid1, userid2, username1, username2, status) VALUES
  (2, 3, 'player2', 'player4', 'accepted'),
  (3, 2, 'player3', 'player5', 'accepted');

INSERT INTO game (playerid_1, playerid_2, username_1, username_2, game_type, score_1, score_2, player_win, player_lost) VALUES
  (1, 2, 'guest', 'test', 'pong', 5, 3, 'guest', 'test'),
  (2, 1, 'test', 'guest', 'pong', 5, 2, 'guest', 'test'),
  (2, 1, 'test', 'guest', 'pong', 1, 5, 'test', 'guest'),
  (1, 3, 'guest', 'leo', 'pong', 4, 5, 'leo', 'guest'),
  (1, 3, 'guest', 'leo', 'p4', 12, 11, 'guest', 'leo'),
  (1, 3, 'guest', 'leo', 'p4', 12, 11, 'leo', 'guest'),
  (2, 3, 'test', 'leo', 'p4', 14, 13, 'test', 'leo'),
  (2, 3, 'test', 'leo', 'p4', 13, 14, 'leo', 'test'),
  (2, 3, 'test', 'leo', 'pong', 5, 0, 'test', 'leo');
EOF

# Run the SQL script against your database
sqlite3 "$DB_PATH" < /tmp/populate_test_data.sql

echo "Test data has been populated into $DB_PATH"

# Pour garder le conteneur en vie:
exec tail -f /dev/null