function updateAuthButton() {
    const authButton = document.querySelector('.menu-box a[data-page="signUp"]');

    if (!authButton) return;

    if (isLoggedIn()) {
        authButton.textContent = "Log Out";
        authButton.setAttribute("data-page", "");
        authButton.setAttribute("href", "#");
        authButton.addEventListener("click", (event) => {
            event.preventDefault();
            clearToken();
            updateAuthButton(); // Update the button without reloading the page
        });
    } else {
        authButton.textContent = "Sign Up / Sign In";
        authButton.setAttribute("data-page", "signUp");
        authButton.setAttribute("href", "signUp");
        authButton.addEventListener("click", signUpHandler); // re-add signUp handler
    }
}

// A helper to handle sign-up behavior
function signUpHandler(event) {
    navigateTo(SIGNUPPATH);
}


function initializeMenu() {
    const menuButton = document.getElementById("menu-button");
    const menuOverlay = document.getElementById("menu-overlay");

    if (!menuButton || !menuOverlay) return;

    updateAuthButton();

    function toggleMenu() {
        menuOverlay.classList.toggle("active");
    }

    menuButton.removeEventListener("click", toggleMenu); // Avoid duplicate listeners
    menuButton.addEventListener("click", toggleMenu);

    document.querySelectorAll(".menu-box a").forEach(link => {
        link.removeEventListener("click", closeMenu);
        link.addEventListener("click", closeMenu);
    });

    function closeMenu() {
        menuOverlay.classList.remove("active");
    }

    menuOverlay.addEventListener("click", (event) => {
        if (!event.target.closest(".menu-box")) {
            menuOverlay.classList.remove("active");
        }
    });
}

// Initialize menu on first load
document.addEventListener("DOMContentLoaded", initializeMenu);
