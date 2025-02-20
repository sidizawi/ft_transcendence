function handleLoginForm(): void {
    const loginForm = document.getElementById("login-form") as HTMLFormElement | null;
    if (!loginForm) return;

    const passwordInput = document.getElementById("password") as HTMLInputElement | null;
    const togglePassword = document.getElementById("toggle-password") as HTMLButtonElement | null;
    const responseDiv = document.getElementById("response") as HTMLDivElement | null;

    if (!passwordInput || !togglePassword || !responseDiv) return;

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈"; // Change icon
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️"; // Change icon
        }
    });

    loginForm.addEventListener("submit", async (e: Event) => {
        e.preventDefault(); // Empêche le rechargement de la page

        // Récupération des valeurs du formulaire
        const username = (document.getElementById("username") as HTMLInputElement)?.value;
        const email = (document.getElementById("email") as HTMLInputElement)?.value;
        const password = passwordInput.value;

        if (!username || !email || !password) {
            responseDiv.innerHTML = `<p style="color:red;">Tous les champs sont requis.</p>`;
            return;
        }

        try {
            // Envoi de la requête POST vers le backend
            const response = await fetch("http://localhost:3001/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            // Récupération et affichage de la réponse
            const data = await response.json();
            if (response.ok) {
                responseDiv.innerHTML = `<p style="color:green;">${data.message}</p>`;
            } else {
                responseDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
            }
        } catch (err) {
            responseDiv.innerHTML = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
            console.error(err);
        }
    });
}

// Initialiser le formulaire une fois le DOM chargé
document.addEventListener("DOMContentLoaded", handleLoginForm);
