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

        try {
            // Envoie de la requête POST vers le backend
            const response = await fetch("http://localhost:3001/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });
            
            // Récupération et affichage de la réponse
            const data = await response.json();
            if (response.ok) {
                signMessage.textContent = "✅ Sign Up successful! Redirecting...";
                signMessage.className = "success";
                signMessage.classList.remove("hidden");
                // navigateTo(SIGNINPATH);

                const token = data.token; //RECUP TOKEN
                localStorage.setItem("token", token);
                console.log("signIn token = ", token);
                setTimeout(() => {
                    updateAuthButton();
                    navigateTo(PROFILEPATH);
                }, 750);

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


    // document.getElementById('auth-google').addEventListener("click", async (event) => {
    //     event.preventDefault();

    //     try {
    //         // Envoie de la requête POST vers le backend
    //         const response = await fetch("http://localhost:3001/google");

    //         const data = await response.json();
    //         if (data.status === 302) {

    //             const data = await response.json();
    //             if (data.response.ok) {
    //                 const token = data.token; //RECUP TOKEN
    //                 localStorage.setItem("token", token);
    //                 console.log("signIn token = ", token);
    //                 setTimeout(() => {
    //                     updateAuthButton();
    //                     navigateTo(PROFILEPATH);
    //                 }, 750);
    //             } else {
    //                 signMessage.textContent = `❌ ${data.error}`;
    //                 signMessage.className = "error";
    //                 signMessage.classList.remove("hidden");
    //             }
    //         }
    //     } catch (err) {
    //         signMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
    //         console.error(err);
    //     }
    // });
    
    // Handle the click event for the "Sign In with Google" button
    document.getElementById('auth-google').addEventListener("click", (event) => {
        event.preventDefault();

        // Redirect the user to the Google OAuth page (handled by your backend)
        window.location.href = "http://localhost:3001/google";  // Adjust this URL if needed
    });

    // Check if we're in the /google/callback route (after Google OAuth)
    if (window.location.pathname === "/google/callback") {
        // Make a request to the backend to get the token from the callback route
        fetch("http://localhost:3001/google/callback", {
            method: "GET",  // Adjust the method if needed
            headers: {
                // You may need to add any required headers, like cookies or authentication tokens
            }
        })
        .then((response) => response.json())
        .then((data) => {
            // Check if the token is available in the response
            const token = data.token;

            if (token) {
                console.log("\n\n");
                console.log(token);
                console.log("\n\n");
                localStorage.setItem('token', token);
                updateAuthButton();
                navigateTo(PROFILEPATH);
            } else {
                console.error('No token found in the response.');
                document.getElementById('signMessage').textContent = 'Error: No token found.';
            }
        })
        .catch((error) => {
            console.error('Error while fetching token:', error);
            document.getElementById('signMessage').textContent = 'An error occurred while trying to log in with Google.';
        });
    }

}

function getSignUpPage() {
    return `
        <div id="content">
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
        <button id="auth-google">Sign in with Google</button>
        </div>
    `
}


function setupSingUpPage() {

    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");

    pageTitle.textContent = "Sign Up";
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
