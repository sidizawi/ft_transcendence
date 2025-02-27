function initializeMenu() {
    const menuButton = document.getElementById("menu-button");
    const menuOverlay = document.getElementById("menu-overlay");

    if (!menuButton || !menuOverlay) return;

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
