function initializeMenu(): void {
    const menuButton = document.getElementById("menu-button") as HTMLElement | null;
    const menuOverlay = document.getElementById("menu-overlay") as HTMLElement | null;

    if (!menuButton || !menuOverlay) return;

    function toggleMenu(): void {
        menuOverlay.classList.toggle("active");
    }

    function closeMenu(): void {
        menuOverlay.classList.remove("active");
    }

    menuButton.removeEventListener("click", toggleMenu); // Évite les écouteurs en double
    menuButton.addEventListener("click", toggleMenu);

    document.querySelectorAll<HTMLAnchorElement>(".menu-box a").forEach(link => {
        link.removeEventListener("click", closeMenu);
        link.addEventListener("click", closeMenu);
    });

    menuOverlay.addEventListener("click", (event: MouseEvent) => {
        if (!(event.target as HTMLElement).closest(".menu-box")) {
            menuOverlay.classList.remove("active");
        }
    });
}

// Initialise le menu après le chargement du DOM
document.addEventListener("DOMContentLoaded", initializeMenu);
