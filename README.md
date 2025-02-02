starting ft_transcendence
```
                           +--------------------------------+
                           |        Navigateur Web          |
                           | (Frontend en Vanilla JavaScript)|
                           +---------------+----------------+
                                           |
                                requêtes HTTP & WS (WebSockets)
                                           |
                           +---------------v----------------+
                           |       Backend Django           |
                           |  (WSGI/ASGI, conteneur Docker)   |
                           +---------------+----------------+
                                           |
           +-------------------------------+-------------------------------+
           |                               |                               |
   +---------------+              +----------------+              +------------------+
   |    Users      |              |     Games      |              |   Tournaments    |
   | (Auth, JWT,   |              | (Session, AI,  |              | (Scores enregistrés|
   |    2FA)       |              |  Remote players|              |  sur Blockchain)  |
   +------+--------+              +-------+--------+              +-------+----------+
          |                               |                               |
          +--------------+----------------+----------------+--------------+
                         |                |                |
                         |         +------v------+   +-----v-----+
                         |         |    Stats    |   |    Chat   |
                         |         | (Dashboards)|   | (Live via |
                         |         |             |   | Channels) |
                         |         +------+------|   +-----+-----+
                         |                |                |
                         +----------------+----------------+
                                           |
                                  +--------v---------+
                                  | PostgreSQL       |
                                  | (Base de données)|
                                  +--------+---------+
                                           |
                                  +--------v---------+
                                  |      Redis       |
                                  | (Support WS et   |
                                  |  Django Channels)|
                                  +------------------+
```