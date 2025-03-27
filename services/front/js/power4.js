function getPower4Page() {
	return `
	    <div id="content">
			<p>Game coming soon!</p>
		</div>
	`;
}

function setPower4Page() {
	const contentDiv = document.getElementById("content");
	const pageTitle = document.getElementById("page-title");

	pageTitle.textContent = "Power4";
	contentDiv.innerHTML = getPower4Page();
}
