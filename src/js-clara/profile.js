function updateProfilePage() {
    const userName = localStorage.getItem("username") || "Guest";
    const userEmail = localStorage.getItem("userEmail") || "Not logged in";
    const totalGames = localStorage.getItem("totalGames") || 0;
    const gamesWon = localStorage.getItem("gamesWon") || 0;
    const gamesLost = localStorage.getItem("gamesLost") || 0;

    document.getElementById("user-name").textContent = userName;
    document.getElementById("user-email").textContent = userEmail;
    document.getElementById("total-games").textContent = totalGames;
    document.getElementById("games-won").textContent = gamesWon;
    document.getElementById("games-lost").textContent = gamesLost;

    const logoutContainer = document.getElementById("logout-container");
    if (userEmail !== "Not logged in") {
        logoutContainer.innerHTML = '<button id="logout-btn">Logout</button>';
        document.getElementById("logout-btn").addEventListener("click", function() {
            localStorage.removeItem("username");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("totalGames");
            localStorage.removeItem("gamesWon");
            localStorage.removeItem("gamesLost");
            window.location.hash = "#/profile";
        });
    } else {
        logoutContainer.innerHTML = "";
    }
}

function handleNavigation() {
    const page = window.location.hash.substring(2);
    if (page === "profile") {
        updateProfilePage();
        document.getElementById("app").innerHTML = '<h1>TEST</h1>';
        updateProfilePage();
    } else {
        document.getElementById("app").innerHTML = '<h1>HOME PAGE</h1>';
    }
}
window.addEventListener("hashchange", handleNavigation);
document.addEventListener("DOMContentLoaded", handleNavigation);