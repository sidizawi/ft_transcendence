function initializeTheme() {
    const themeToggleBtn = document.getElementById("theme-toggle");
    const toggleCircle = document.getElementById("toggle-circle");

    if (!themeToggleBtn || !toggleCircle) return;

    let isDarkMode = localStorage.getItem("darkMode") === "true";

    function applyTheme(darkMode) {
        document.body.classList.toggle("dark-mode", darkMode);
        toggleCircle.innerHTML = darkMode ? "🌙" : "☀️";
        localStorage.setItem("darkMode", darkMode);
    }

    applyTheme(isDarkMode);

    themeToggleBtn.removeEventListener("click", toggleDarkMode); // Prevent duplicates
    themeToggleBtn.addEventListener("click", toggleDarkMode);

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        applyTheme(isDarkMode);
    }
}

// Initialize theme toggle on first load
document.addEventListener("DOMContentLoaded", initializeTheme);
