function initializeTheme(): void {
    const themeToggleBtn = document.getElementById("theme-toggle") as HTMLButtonElement | null;
    const toggleCircle = document.getElementById("toggle-circle") as HTMLSpanElement | null;

    if (!themeToggleBtn || !toggleCircle) return;

    let isDarkMode: boolean = localStorage.getItem("darkMode") === "true";

    function applyTheme(darkMode: boolean): void {
        document.body.classList.toggle("dark-mode", darkMode);
        toggleCircle.innerHTML = darkMode ? "🌙" : "☀️";
        localStorage.setItem("darkMode", darkMode.toString());
    }

    function toggleDarkMode(): void {
        isDarkMode = !isDarkMode;
        applyTheme(isDarkMode);
    }

    applyTheme(isDarkMode);

    themeToggleBtn.removeEventListener("click", toggleDarkMode); // Évite les doublons
    themeToggleBtn.addEventListener("click", toggleDarkMode);
}

// Initialiser le thème au chargement du DOM
document.addEventListener("DOMContentLoaded", initializeTheme);
