function handleSignInForm() {
    
    const signInForm = document.getElementById("signIn-form");
    if (!signInForm) return;
        
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("toggle-password");
    const signInMessage = document.getElementById("signIn-message");

    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁️";
        }
    }); //

//     signInForm.addEventListener("submit", async (event) => {
//         event.preventDefault();

//         const username = document.getElementById("username").value;
//         const email = document.getElementById("email").value;
//         const password = document.getElementById("password").value;
        
//         try {
//             // Envoie de la requête POST vers le backend
//             const response = await fetch("http://localhost:3001/auth/register", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({ username, email, password })
//             });
            
//             // Récupération et affichage de la réponse
//             const data = await response.json();
//             if (response.ok) {
//             // signInMessage.textContent = `✅ ${data.message}`;
//                 signInMessage.textContent = "✅ Sign In successful! Redirecting...";
//                 signInMessage.className = "success";
//                 signInMessage.classList.remove("hidden");



                
                
//             } else {
//                 if (data.error.includes("username")) {
//                     signInMessage.textContent = "❌ This username is incorrect. Please try again.";
//                 } else if (data.error.includes("email")) {
//                     signInMessage.textContent = "❌ This email is incorrect. Please try again.";
//                 } else if (data.error.includes("password")) {
//                     signInMessage.textContent = "❌ This password is incorrect. Please try again.";
//                 } else {
//                     signInMessage.textContent = `❌ ${data.error}`;
//                 }
//                 signInMessage.className = "error";
//                 signInMessage.classList.remove("hidden");
//             }
//         } catch (err) {
//             signInMessage.textContent = `<p style="color:red;">Erreur lors de l'envoi de la requête.</p>`;
//             console.error(err);
//         }
//     });
    
}   
