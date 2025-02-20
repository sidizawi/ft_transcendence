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
                    history.pushState({ page }, "", page);
                }

                if (page === "profile") updateProfilePage();
                if (page === "signUp") handleSignUpForm();
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
            loadPage(event.state.page, false);
        } else {
            loadPage("profile", false);
        }
    });

    const initialPage = window.location.hash.replace("#", "") || "home";
    showPage(initialPage);

    window.addEventListener("popstate", (event) => {
        const pageId = event.state? event.state.page: "home";
        if (document.getElementById(pageId)) {
            showPage(pageId);
        }
    });
});
