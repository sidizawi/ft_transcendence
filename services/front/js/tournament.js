function getTournamentPage() {
	return `<p>Welcome to your Tournament!</p>`;
}

function setTournamentPage() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Tournament";
	contentDiv.innerHTML = getTournamentPage();
}
