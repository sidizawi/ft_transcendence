function handleRoutes(page, isPopState = false) {
    if (!page) {
        page = location.pathname.replace("/", "");
        if (page === "") {
            page = "home";
        }
    }
    if (!isPopState) {
        history.pushState({ page }, "", page);
    }
    if (page == "signUp") {
        setupSingUpPage();
    } else if (page == "signIn") {
        setupSingInPage();
    } else if (page == "profile") {
        setupProfilePage();
    } else if (page == "pong") {
        setPongPage();
    } else if (page == "tournament") {
        setTournamentPage();
    } else if (page == "power4") {
        setPower4Page();
    } else if (page == "home") {
        setHomePage();
    } else {
        setErrorPage();
    }
}

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("a[data-page]").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const page = event.target.getAttribute("data-page");
            handleRoutes(page);
        });
    });

    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.page) {
            let page = event.state.page.replace(".html", ""); // Retirer .html si présent
            handleRoutes(page, true);
        } else {
            handleRoutes(null, true);
        }
    });
    window.loadPage = handleRoutes(null);
});
