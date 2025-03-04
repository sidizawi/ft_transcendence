function getPongPage() {
	return `
		<p>Game coming soon!</p>
	`;
}

function setPongPage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Pong";
	contentDiv.innerHTML = getPongPage();
}
