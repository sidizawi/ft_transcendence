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

    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        console.log("✅ event.preventDefault() exécuté, la page ne devrait pas se recharger");
        
    
        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        console.log("✅ username", username);
        console.log("✅ email", email);
        console.log("✅ password", password)

        // try {
        //     // Envoie de la requête POST vers le backend
        //     const response = await fetch("http://localhost:3001/auth/signUp", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json"
        //         },
        //         body: JSON.stringify({ username, email, password })
        //     });
            
        //     // Récupération et affichage de la réponse
        //     const data = await response.json();
        //     if (response.ok) {
        //     // signMessage.textContent = `✅ ${data.message}`;
        //         signMessage.textContent = "✅ Sign Up successful! Redirecting...";
        //         signMessage.className = "success";
        //         signMessage.classList.remove("hidden");                
                
        //     } else {
        //         if (data.error.includes("username")) {
        //             signMessage.textContent = "❌ This username is already taken. Please choose another one.";
        //         } else if (data.error.includes("email")) {
        //             signMessage.textContent = "❌ This email is already taken. Please choose another one.";
        //         } else if (data.error.includes("password")) {
        //             signMessage.textContent = "❌ Password must contain at least 8 characters.";
        //         } else {
        //             signMessage.textContent = `❌ ${data.error}`;
        //         }
        //         signMessage.className = "error";
        //         signMessage.classList.remove("hidden");
        //     }
        // } catch (err) {
        //     signMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
        //     console.error(err);
        // }
    });
} // inclure document pour toggle

function getSignUpPage() {
    return `
        <p class="switch">Already have an account? -> <a href="signIn" data-page="signIn">Sign In</a></p>

        <form id="signUp-form">
            <label for="username">Username:</label>
            <input type="text" id="username" >
            <span class="error-message" id="username-error"></span>

            <label for="email">Email:</label>
            <input type="email" id="email" >
            <span class="error-message" id="email-error"></span>

            <label for="password">Password:</label>
            <div class="password-container">
                <input type="password" id="password" >
                <span id="toggle-password" class="eye-icon">👁️</span>
            </div>
            <span class="error-message" id="password-error"></span>

            <div id="sign-page">
            <button type="submit">Sign Up</button>
            </div>
        </form>

        <p id="sign-message" class="hidden"></p>

        <!-- External authentication link -->
        <!-- <p><a href="https://login.42.fr/oauth/authorize" id="auth-42" target="_blank">Login with 42</a></p> -->
        <p><a href="" id="auth-42" target="_blank">Login with 42</a></p>
    `
}


function setupSingUpPage() {

    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");
    // const pageSubtitle = document.getElementById("page-subtitle");

    pageTitle.textContent = "Sign Up";
    // pageSubtitle.textContent = "Create your account";
    contentDiv.innerHTML = getSignUpPage();

    handleSignUpForm();
    contentDiv.querySelectorAll("a[data-page]").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = event.target.getAttribute("data-page");
            handleRoutes(page);
        });
    });
}
