function handleSignUpForm() {
    
    const signUpForm = document.getElementById("signUp-form");
    if (!signUpForm) return;
        
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const signUpMessage = document.getElementById("signUp-message");

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️";
        }
    });

    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        try {
            // Envoie de la requête POST vers le backend
            const response = await fetch("http://localhost:3001/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });
            
            // Récupération et affichage de la réponse
            const data = await response.json();
            if (response.ok) {
            // signUpMessage.textContent = `✅ ${data.message}`;
                signUpMessage.textContent = "✅ Sign Up successful! Redirecting...";
                signUpMessage.className = "success";
                signUpMessage.classList.remove("hidden");

                //ajout de la redirection ici
                
                
            } else {
                if (data.error.includes("username")) {
                    signUpMessage.textContent = "❌ This username is already taken. Please choose another one.";
                } else if (data.error.includes("email")) {
                    signUpMessage.textContent = "❌ This email is already taken. Please choose another one.";
                } else if (data.error.includes("password")) {
                    signUpMessage.textContent = "❌ Password must contain at least 8 characters.";
                } else {
                    signUpMessage.textContent = `❌ ${data.error}`;
                }
                signUpMessage.className = "error";
                signUpMessage.classList.remove("hidden");
            }
        } catch (err) {
            signUpMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
            console.error(err);
        }
    });
    
}   
