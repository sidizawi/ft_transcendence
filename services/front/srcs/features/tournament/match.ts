class Match {
	left: Match | null = null;
	right: Match | null = null;
	winner: number | null = null;
	player1: number | null = null;
	player2: number | null = null;

	round: number = 1;

	constructor(left: Match | null = null, right: Match | null = null) {
		this.left = left;
		this.right = right;
	}

	static createMatches(players: number[]) : Match | null {
		if (players.length <= 1) {
			return null;
		} else if (players.length === 2) {
			let match = new Match();
			match.player1 = players[0];
			match.player2 = players[1];
			return match;
		}
		let match = new Match();
		match.left = Match.createMatches(players.slice(0, Math.floor(players.length / 2)));
		match.right = Match.createMatches(players.slice(Math.floor(players.length / 2)));
		match.round = (match.left?.round || 0) + 1;
		return match
	}

	static displayMatches(match: Match | null, round: number, depth: number = 0) : void {
		if (match === null) {
			return;
		}
		if (round == match.round) {
			console.log(Array(depth).join("  ") + "Match:");
			if (match.player1 !== null || match.player2 !== null) {
				console.log(Array(depth + 1).join("  ") + "Player 1: " + match.player1);
				console.log(Array(depth + 1).join("  ") + "Player 2: " + match.player2);
				console.log(Array(depth + 1).join("  ") + "Winner: " + match.winner);
				console.log(Array(depth + 1).join("  ") + "round: " + match.round);
			}
		}
		Match.displayMatches(match.left, round, depth + 1);
		Match.displayMatches(match.right, round, depth + 1);
	}

	static playMatch(match: Match, round : number = 1) : boolean {
		let ret = false;
		if (match.player1 !== null 
			&& match.player2 !== null
			&& match.winner === null 
			&& round === match.round) {
			match.winner = Math.random() < 0.5 ? match.player1 : match.player2;
			console.log("Match between " + match.player1 + " vs " + match.player2 + " won by " + match.winner, "round: " + match.round);
			return (true);
		} else {
			if (match.left !== null && !ret) {
				ret = Match.playMatch(match.left, round);
				if (match.left.winner !== null) {
					match.player1 = match.left.winner;
				}
			}
			if (match.right !== null && !ret) {
				ret = Match.playMatch(match.right, round);
				if (match.right.winner !== null) {
					match.player2 = match.right.winner;
				}
			}
		}
		return (ret);
	}
}


let match = Match.createMatches([1, 2, 3, 4, 5, 6, 7, 8]);

if (match !== null) {
	Match.playMatch(match);
	Match.playMatch(match);
	Match.playMatch(match);
	Match.playMatch(match);
	Match.playMatch(match, 2);
	Match.playMatch(match, 2);
	Match.playMatch(match, 3);
	Match.displayMatches(match, 1);
	Match.displayMatches(match, 2);
	Match.displayMatches(match, 3);
}

