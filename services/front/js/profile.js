function updateProfilePage() {
    const logoutContainer = document.getElementById("logout-container");
    logoutContainer.addEventListener("click", () => {
        clearToken();
        navigateTo(HOMEPATH);
    });
}

function getProfilePage() {
    return `
        <div id="content">
            <div class="row-container">
                <div class="top-row">
                    <div class="column-container">
                        <div class="left-profile-page">
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

                        <div class="buffer-profile-page"></div>

                        <!-- Friends Section (full right column) -->
                        <div class="right-profile-page">
                            <section class="friends-section" id="friend">
                                <h3>Friends</h3>
                                <ul id="friends">Une page qui présente les critères de sélection et la définition du roman pour
                                    établir la liste des plus longs romans. Elle mentionne aussi d'autres textes de grande
                                    longueur,
                                    tels que des encyclopédies, des sagas ou des fanfictions.</ul>
                                <button id="addFriendBtn">Add</button>
                            </section>
                        </div>
                    </div>
                </div>


                <!-- Buttons -->
                <div class="bottom-row">
                    <div id="logout-container">
                        <button id="logout-btn">Log Out</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupProfilePage() {
    if (!isLoggedIn()) {
        navigateTo(HOMEPATH);
        return;
    }

    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");

    pageTitle.textContent = "Profile";
    contentDiv.innerHTML = getProfilePage();
    updateProfilePage();
    console.log("Profile page loaded", isLoggedIn());
}
