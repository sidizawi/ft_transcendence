function getHomePage() {
	return `
		<p>Welcome to Home Page</p>
        <p>This is the default home page content.</p>
	`;
}

function setHomePage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Home";
	contentDiv.innerHTML = getHomePage();
}
