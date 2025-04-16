# ✅ ft_transcendence Project Checklist

## 📌 Mandatory Part

- ✅ **Frontend in TypeScript (SPA)**
- ✅ **Dockerized setup (single command launch)**
- ✅ **Fully functional Pong game**
- ✅ **Local multiplayer with shared keyboard**
- ❌ **Tournament system with alias input**
- ❌ **Matchmaking system**
- ✅ **Same rules for all players (speed, etc.)**
- ✅ **No unhandled errors or warnings**
- ✅ **Compatible with latest Firefox**
- [ ] **Security**
  - ✅ Passwords hashed
  - ✅ Protection against SQL injections/XSS
  - ❌ HTTPS (wss for WebSocket)
  - ✅ Validation on user inputs
  - ✅ Sensitive data in `.env`, ignored by Git

---

## 🧩 Modules (Choose at least **7 Major** to reach 100%)

> 🔸 *2 Minor modules = 1 Major module*

### Web
- ✅ 🔹 Use Tailwind CSS with TypeScript (Minor)
- ✅ 🔹 Use SQLite database (Minor)
- ✅ 🔸 Backend with Fastify + Node.js (Major)

### User Management
- ✅ 🔸 Standard user management (auth, avatars, friends, stats, etc.) (Major)
- ✅ 🔸 Remote authentication with Google Sign-In (Major)

### Gameplay & UX
- ✅❌ 🔸 Remote players (Major)
- ✅❌ 🔸 Another game with history and matchmaking (Major)
    - ✅ Develop a new, engaging game to diversify the platform’s offerings and enter-
    tain users.
    - ✅ Implement user history tracking to record and display individual users’ game-
    play statistics.
    - ❌ Create a matchmaking system to allow users to find opponents and participate
    in fair and balanced matches.
    - ✅ Ensure that user game history and matchmaking data are stored securely and
    remain up-to-date.
    - ✅ Optimize the performance and responsiveness of the new game to provide an
    enjoyable user experience. Regularly update and maintain the game to fix
    bugs, add new features, and enhance gameplay.

- ✅❌ 🔸 Live chat (Major)
    - ✅❌ The user should be able to send direct messages to other users.
    - ✅❌ The user should be able to block other users, preventing them from seeing any
    further messages from the blocked account.
    - ❌ The user should be able to invite other users to play a Pong game through the
    chat interface.
    - ❌ The tournament system should be able to notify users about the next game.
    - ❌ The user should be able to access other players’ profiles through the chat
    interface.

### AI & Algo
- ✅ 🔸 AI opponent (not using A*) (Major)
- ❌ 🔹 User and game stats dashboards (Minor)
    - ✅ Create user-friendly dashboards that provide users with insights into their
    gaming statistics.
    - ❌ Develop a separate dashboard for game sessions, showing detailed statistics,
    outcomes, and historical data for each match.
    - ❌ Ensure that the dashboards offer an intuitive and informative user interface
    for tracking and analyzing data.
    - ❌ Implement data visualization techniques, such as charts and graphs, to present
    statistics in a clear and visually appealing manner.
    - ❌ Allow users to access and explore their own gaming history and performance
    metrics conveniently.

### Cybersecurity
- ✅❌ 🔹 GDPR compliance, anonymization, deletion (Minor)
    - ✅❌ Implement GDPR-compliant features that enable users to request anonymiza-
    tion of their personal data, ensuring that their identity and sensitive informa-
    tion are protected.
    - ✅ Provide tools for users to manage their local data, including the ability to
    view, edit, or delete their personal information stored within the system.
    - ✅ Offer a streamlined process for users to request the permanent deletion of
    their accounts, including all associated data, ensuring compliance with data
    protection regulations.
    - ❌ Maintain clear and transparent communication with users regarding their data
    privacy rights, with easily accessible options to exercise these rights.

- ✅ 🔸 2FA + JWT (Major)

### DevOps
- ✅ 🔸 Backend as microservices (Major)

### Accessibility
- ❌ 🔹 All device support (Minor)
- ✅ 🔹 Additional browser support (Minor)
- ✅ 🔹 Multilingual support (≥3 languages) (Minor)

### Server-Side Pong
- ✅ 🔸 Server-side Pong with API (Major)

---

## 🎁 Bonus Part

> Only evaluated if the **mandatory part is perfect**

- [ ] 10 pts for each major module
- [ ] 5 pts for each minor module

## Total
    Major: 
        Partially finished: 3
        Finished: 7
    Minor: 
        Partially finished: 1
        Finished: 4
