document.addEventListener("DOMContentLoaded", () => {
    const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");
    // const pageSubtitle = document.getElementById("page-subtitle");

    function loadPage(page, addToHistory = true) {
        fetch(`${page}.html`)
            .then(response => response.text())
            .then(data => {
                contentDiv.innerHTML = data;
                pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
                // pageSubtitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

                if (addToHistory) {
                    history.pushState({ page }, "", `${page}.html`);
                }

                if (page === "Profile") updateProfilePage(); //pq des majuscules aux deux?
                if (page === "SignUp") handleSignUpForm();
                if (page === "SignIn") handleSignInForm();
            })
            .catch(() => {
                contentDiv.innerHTML = "<h1>Page Not Found</h1>";
            });
    }

    document.querySelectorAll("a[data-page]").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = event.target.getAttribute("data-page");
            loadPage(page);
        });
    });

    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.page) {
            let page = event.state.page.replace(".html", ""); // Retirer .html si présent
            loadPage(page, false);
        } else {
            loadPage("home", false);
        }
    });
    window.loadPage = loadPage;
});
