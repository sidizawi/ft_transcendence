function handleSignUpForm() {
    
    const signUpForm = document.getElementById("signUp-form");
    if (!signUpForm) return;
        
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const signMessage = document.getElementById("sign-message");

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️";
        }
    });
} // inclure document pour toggle
document.getElementById("signUp-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("✅ event.preventDefault() exécuté, la page ne devrait pas se recharger");
    

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        // Envoie de la requête POST vers le backend
        const response = await fetch("http://localhost:3001/auth/signUp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });
        
        // Récupération et affichage de la réponse
        const data = await response.json();
        if (response.ok) {
        // signMessage.textContent = `✅ ${data.message}`;
            signMessage.textContent = "✅ Sign Up successful! Redirecting...";
            signMessage.className = "success";
            signMessage.classList.remove("hidden");                
            
        } else {
            if (data.error.includes("username")) {
                signMessage.textContent = "❌ This username is already taken. Please choose another one.";
            } else if (data.error.includes("email")) {
                signMessage.textContent = "❌ This email is already taken. Please choose another one.";
            } else if (data.error.includes("password")) {
                signMessage.textContent = "❌ Password must contain at least 8 characters.";
            } else {
                signMessage.textContent = `❌ ${data.error}`;
            }
            signMessage.className = "error";
            signMessage.classList.remove("hidden");
        }
    } catch (err) {
        signMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
        console.error(err);
    }
});
