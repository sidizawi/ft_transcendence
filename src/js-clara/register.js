document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    
    // Récupération des valeurs du formulaire
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const responseDiv = document.getElementById('response');
    
    try {
      // Envoie de la requête POST vers le backend
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
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