function handleSignInForm() {
    
    const signInForm = document.getElementById("signIn-form");
    if (!signInForm) return;
        
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const signInMessage = document.getElementById("sign-message");

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️";
        }
    });

    signInForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const login = document.getElementById("user-identifier").value;
        const password = document.getElementById("password").value;

        try {
            // Envoie de la requête POST vers le backend
            const response = await fetch("http://localhost:3001/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ login, password })
            });
            
            // Récupération et affichage de la réponse
            const data = await response.json();
            if (response.ok) {
                signInMessage.textContent = "✅ Sign In successful! Redirecting...";
                signInMessage.className = "success";
                signInMessage.classList.remove("hidden");

                const token = data.token; //RECUP TOKEN
                localStorage.setItem("token", token);
                console.log("signIn token = ", token);
                setTimeout(() => {
                    updateAuthButton();
                    navigateTo(PROFILEPATH);
                }, 750);

            } else {
                if (data.error.includes("username")) {
                    signInMessage.textContent = "❌ This username is incorrect. Please try again.";
                } else if (data.error.includes("email")) {
                    signInMessage.textContent = "❌ This email is incorrect. Please try again.";
                } else if (data.error.includes("password")) {
                    signInMessage.textContent = "❌ This password is incorrect. Please try again.";
                } else {
                    signInMessage.textContent = `❌ ${data.error}`;
                }
                signInMessage.className = "error";
                signInMessage.classList.remove("hidden");
            }
        } catch (err) {
            signInMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
            console.error(err);
        }
    });
}

function getSignInPage() {
    return `
        <div id="content">
        <p class="switch">New here? <a href="signUp" data-page="signUp">Create an account</a></p>

        <form id="signIn-form">
        <label for="user-identifier">Username or Email</label>
        <input type="text" id="user-identifier" required>
        <span class="error-message" id="identifier-error"></span>
        
        <label for="password">Password</label>
        <div class="password-container">
                <input type="password" id="password" required>
                <span id="toggle-password" class="eye-icon">👁️</span>
                </div>
                <span class="error-message" id="password-error"></span>
                <div id="sign-page">
                <button type="submit">Sign In</button>
            </div>
            </form>
            
            <p id="sign-message" class="hidden"></p>
            
        <!-- External authentication link -->
        <p><a href="http://localhost:3001/google" id="auth-google" target="_blank">Sign in with Google</a></p>
        </div>
    `;
}

function setupSingInPage() {

    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");

    pageTitle.textContent = "Sign In";
    contentDiv.innerHTML = getSignInPage();

    handleSignInForm();
    contentDiv.querySelectorAll("a[data-page]").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = event.target.getAttribute("data-page");
            handleRoutes(page);
        });
    });
}
