function getPongPage() {
	return `
	    <div id="content">
			<p>Game coming soon!</p>
		</div>
	`;
}

function setPongPage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Pong";
	contentDiv.innerHTML = getPongPage();
}
