function getHomePage() {
	return `
	    <div id="content">
			<p>Welcome to Home Page</p>
			<p>This is the default home page content.</p>
		</div>
	`;
}

function setHomePage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Home";
	contentDiv.innerHTML = getHomePage();
}
