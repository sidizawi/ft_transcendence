function updateProfilePage() {
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
                            <h2 id="username">username</h2>
                            <p id="email">email</p>
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
