function handleRoutes(page, isPopState = false) {
    // console.log();

    if (!page) {
        page = location.pathname.replace("/", "");
        if (page === "") {
            page = HOMEPATH;
        }
    }
    if (!isPopState) {
        history.pushState({ page }, "", page);
    }
    if (page == SIGNUPPATH) {
        setupSingUpPage();
    } else if (page == SIGNINPATH) {
        setupSingInPage();
    } else if (page == PROFILEPATH) {
        setupProfilePage();
    } else if (page == PONGPATH) {
        setPongPage();
    } else if (page == TOURNAMENTPATH) {
        setTournamentPage();
    } else if (page == POWER4PATH) {
        setPower4Page();
    } else if (page == HOMEPATH) {
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
    // console.log(location)
    // location.reload = handleRoutes(null);
    window.handleRoutes = handleRoutes;
    window.loadPage = handleRoutes(null);
});
