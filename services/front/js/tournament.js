function getTournamentPage() {
	return `
	    <div id="content">
		<p>Welcome to your Tournament!</p>
		</div>
	`;
}

function setTournamentPage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Tournament";
	contentDiv.innerHTML = getTournamentPage();
}
