function getToken() {
    return localStorage.getItem('token');
}

function decodeToken(token) {
    if (!token) return null;

    const payload = token.split('.')[1];  // The playload is the 2nd part of JWT
    const decodedPayload = atob(payload); // Decode in base64
    return JSON.parse(decodedPayload);  // Convert in obj JSON
}

function updateUserInfo() {
    const token = getToken();

    if (token) {
        const decoded = decodeToken(token);

        if (decoded) {
            document.getElementById('username').textContent = decoded.username || 'Username unavailable';
            document.getElementById('email').textContent = decoded.email || 'Email unavailable';
        } else {
            console.log('Error : Invalid Token');
        }
    } else {
        console.log('Token not found in localStorage');
    }
}

function updateProfilePage() {
    updateUserInfo();

    const logoutContainer = document.getElementById("disconnect");
    logoutContainer.addEventListener("click", () => {
        clearToken();
        navigateTo(SIGNUPPATH);
    });
}

function getProfilePage() {
    return `
        
            <div class="row-container">
                <div class="top-row">
                    <section class="profile-container">
                        <!-- Profile Picture & Info -->
                        <div class="pic-area">
                            <div class="profile-pic">
                                <img id="profileImg" src="../img/default-avatar.jpg" alt="Profile Picture">
                            </div>
                            <div class="profile-pic-edit">
                                <input type="file" id="uploadPic" accept="image/*">
                                <label for="uploadPic" id="uploadPicLabel">🖌️</label>
                            </div>
                        </div>
                        <div class="user-info">
                            <h2 id="username"></h2>
                            <p id="email"></p>
                        </div>
                    </section>

                    <!-- Dashboard & Friends Section -->
                    <section class="dashboard-container">
                        <!-- Dashboard Table -->
                        <div class="dashboard" id="tournament">
                            <h3>Dashboard</h3>
                            <table class="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Wins</th>
                                        <th>Losts</th>
                                        <th>Total Games</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td id="gamesWon">0</td>
                                        <td id="gamesLost">0</td>
                                        <td id="totalGames">0</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button id="tournamentBtn">Tournament</button>
                        </div>
                    </section>
                </div>

                <!-- Buttons -->
                <div class="bottom-row">
                    <p id="disconnect">Log Out</p>
                </div>
            </div>
        
    `;
}

function setupProfilePage() {
    if (!isLoggedIn()) {
        navigateTo(SIGNUPPATH);
        return;
    }

    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");

    pageTitle.textContent = "Profile";
    contentDiv.innerHTML = getProfilePage();
    updateProfilePage();
    console.log("Profile page loaded", isLoggedIn());
}
