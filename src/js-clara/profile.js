function updateProfilePage() {

    const logoutContainer = document.getElementById("logout-container");
    if (userEmail !== "Not logged in") {
        logoutContainer.innerHTML = '<button id="logout-btn">Logout</button>';
        // document.getElementById("logout-btn").addEventListener("click", function() {
        //     localStorage.removeItem("username");
        //     localStorage.removeItem("userEmail");
        //     localStorage.removeItem("totalGames");
        //     localStorage.removeItem("gamesWon");
        //     localStorage.removeItem("gamesLost");
        //     window.location.hash = "#/profile";
        // });
    } else {
        logoutContainer.innerHTML = "";
    }
}

// function handleNavigation() {
//     const page = window.location.hash.substring(2);
//     if (page === "profile") {
//         updateProfilePage();
//         document.getElementById("app").innerHTML = '<h1>TEST</h1>';
//         updateProfilePage();
//     } else {
//         document.getElementById("app").innerHTML = '<h1>HOME PAGE</h1>';
//     }
// }
// window.addEventListener("hashchange", handleNavigation);
// document.addEventListener("DOMContentLoaded", handleNavigation);