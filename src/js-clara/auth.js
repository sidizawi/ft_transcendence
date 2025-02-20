// function handleLoginForm() {
//     const loginForm = document.getElementById("login-form");
//     if (!loginForm) return;

//     const passwordInput = document.getElementById("password");
//     const togglePassword = document.getElementById("toggle-password");
//     const loginMessage = document.getElementById("login-message");

//     togglePassword.addEventListener("click", () => {
//         if (passwordInput.type === "password") {
//             passwordInput.type = "text";
//             togglePassword.textContent = "🙈"; // Change icon
//         } else {
//             passwordInput.type = "password";
//             togglePassword.textContent = "👁️"; // Change icon
//         }
//     });

//     loginForm.addEventListener("submit", (event) => {
//         event.preventDefault();

//         // Get values
//         const username = document.getElementById("username").value.trim();
//         const email = document.getElementById("email").value.trim();
//         const password = passwordInput.value.trim();

//         // Get error elements
//         const usernameError = document.getElementById("username-error");
//         const emailError = document.getElementById("email-error");
//         const passwordError = document.getElementById("password-error");

//         let isValid = true;

//         // Validate username
//         if (username === "") {
//             usernameError.textContent = "Username is required.";
//             isValid = false;
//         } else {
//             usernameError.textContent = "";
//         }

//         // Validate email format
//         const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (email === "") {
//             emailError.textContent = "Email is required.";
//             isValid = false;
//         } else if (!emailPattern.test(email)) {
//             emailError.textContent = "Invalid email format.";
//             isValid = false;
//         } else {
//             emailError.textContent = "";
//         }

//         // Validate password
//         if (password === "") {
//             passwordError.textContent = "Password is required.";
//             isValid = false;
//         } else {
//             passwordError.textContent = "";
//         }

//         // If validation fails, show an error message
//         if (!isValid) {
//             loginMessage.textContent = "❌ Please fix the errors above.";
//             loginMessage.className = "error";
//             loginMessage.classList.remove("hidden");
//             return;
//         }

//         // Simulate a successful login
//         localStorage.setItem("isLoggedIn", "true");
//         localStorage.setItem("username", username);
//         localStorage.setItem("userEmail", email);

//         // Show success message
//         loginMessage.textContent = "✅ Login successful! Redirecting...";
//         loginMessage.className = "success";
//         loginMessage.classList.remove("hidden");

//         // Wait 1.5 seconds and redirect to profile
//         setTimeout(() => {
//             window.location.hash = "#/profile";
//         }, 1500);
//     });
// }

// function handleNavigation() {
//     const page = window.location.hash.substring(2);
//     if (page === "profile") {
//         updateProfilePage();
//         document.getElementById("app").innerHTML = '<h1>TEST</h1>';
//         updateProfilePage();
//     } else {
//         document.getElementById("app").innerHTML = '<h1>HOME PAGE</h1>';
//     }
// }
// window.addEventListener("hashchange", handleNavigation);
// document.addEventListener("DOMContentLoaded", handleNavigation);

function handleSignUpForm() {
    const signUpForm = document.getElementById("signUp-form");
    if (!signUpForm) return;

    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const signUpMessage = document.getElementById("signUp-message");

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈"; // Change icon
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️"; // Change icon
        }
    });





    signUpForm.addEventListener("submit", async (event) => {
        event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    const responseDiv = document.getElementById("response");
    
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
        // responseDiv.innerHTML = `<p style="color:green;">${data.message}</p>`;
            signUpMessage.textContent = "✅ Sign Up successful! Redirecting...";
            signUpMessage.className = "success";
            signUpMessage.classList.remove("hidden");
        } else {
            // responseDiv.innerHTML = `<p style="color:red;">${data.error}</p>`;
            signUpMessage.textContent = "❌ ${data.error}";
            signUpMessage.className = "error";
            signUpMessage.classList.remove("hidden");
            return; //?
        }
    } catch (err) {
        responseDiv.innerHTML = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
        console.error(err);
    }
    });
}

        
//         let isValid = true;

//         // Validate username
//         if (username === "") {
//             usernameError.textContent = "Username is required.";
//             isValid = false;
//         } else {
//             usernameError.textContent = "";
//         }

//         // Validate email format
//         const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (email === "") {
//             emailError.textContent = "Email is required.";
//             isValid = false;
//         } else if (!emailPattern.test(email)) {
//             emailError.textContent = "Invalid email format.";
//             isValid = false;
//         } else {
//             emailError.textContent = "";
//         }

//         // Validate password
//         if (password === "") {
//             passwordError.textContent = "Password is required.";
//             isValid = false;
//         } else {
//             passwordError.textContent = "";
//         }

//         // If validation fails, show an error message
//         if (!isValid) {
//             signUpMessage.textContent = "❌ Please fix the errors above.";
//             signUpMessage.className = "error";
//             signUpMessage.classList.remove("hidden");
//             return;
//         }

//         // Simulate a successful signUp
//         localStorage.setItem("isLoggedIn", "true");
//         localStorage.setItem("username", username);
//         localStorage.setItem("userEmail", email);

//         // Show success message
//         signUpMessage.textContent = "✅ Sign Up successful! Redirecting...";
//         signUpMessage.className = "success";
//         signUpMessage.classList.remove("hidden");

//         // Wait 1.5 seconds and redirect to profile
//         setTimeout(() => {
//             window.location.hash = "#/profile";
//         }, 1500);
//     });
// }

// function handleNavigation() {
//     const page = window.location.hash.substring(2);
//     if (page === "profile") {
//         updateProfilePage();
//         document.getElementById("app").innerHTML = '<h1>TEST</h1>';
//         updateProfilePage();
//     } else {
//         document.getElementById("app").innerHTML = '<h1>HOME PAGE</h1>';
//     }
// }
// window.addEventListener("hashchange", handleNavigation);
// document.addEventListener("DOMContentLoaded", handleNavigation);