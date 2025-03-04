function getErrorPage() {
	return `
		<div>
			<h1>404</h1>
			<p>Page not found</p>
		</div>
	`;
}

function setErrorPage() {
	const contentDiv = document.getElementById("content");
    const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Not Found";
	contentDiv.innerHTML = getErrorPage();
}