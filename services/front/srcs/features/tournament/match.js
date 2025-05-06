var Match = /** @class */ (function () {
    function Match(left, right) {
        if (left === void 0) { left = null; }
        if (right === void 0) { right = null; }
        this.left = null;
        this.right = null;
        this.winner = null;
        this.player1 = null;
        this.player2 = null;
        this.round = 1;
        this.left = left;
        this.right = right;
    }
    Match.createMatches = function (players) {
        var _a;
        if (players.length <= 1) {
            return null;
        }
        else if (players.length === 2) {
            var match_1 = new Match();
            match_1.player1 = players[0];
            match_1.player2 = players[1];
            return match_1;
        }
        var match = new Match();
        match.left = Match.createMatches(players.slice(0, Math.floor(players.length / 2)));
        match.right = Match.createMatches(players.slice(Math.floor(players.length / 2)));
        match.round = (((_a = match.left) === null || _a === void 0 ? void 0 : _a.round) || 0) + 1;
        return match;
    };
    Match.displayMatches = function (match, depth) {
        if (depth === void 0) { depth = 0; }
        if (match === null) {
            return;
        }
        console.log(Array(depth).join("  ") + "Match:");
        if (match.player1 !== null && match.player2 !== null) {
            console.log(Array(depth + 1).join("  ") + "Player 1: " + match.player1);
            console.log(Array(depth + 1).join("  ") + "Player 2: " + match.player2);
            console.log(Array(depth + 1).join("  ") + "Winner: " + match.winner);
            console.log(Array(depth + 1).join("  ") + "round: " + match.round);
        }
        Match.displayMatches(match.left, depth + 1);
        Match.displayMatches(match.right, depth + 1);
    };
    Match.playMatch = function (match, round) {
        if (round === void 0) { round = 1; }
        var ret = false;
        if (match.player1 !== null
            && match.player2 !== null
            && match.winner === null
            && round === match.round) {
            match.winner = Math.random() < 0.5 ? match.player1 : match.player2;
            console.log("Match between " + match.player1 + " vs " + match.player2 + " won by " + match.winner, "round: " + match.round);
            return (true);
        }
        else {
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
    };
    return Match;
}());
var match = Match.createMatches([1, 2, 3, 4, 5, 6, 7, 8]);
if (match !== null) {
    Match.playMatch(match);
    Match.playMatch(match);
    Match.playMatch(match);
    Match.playMatch(match);
    Match.playMatch(match, 2);
    Match.playMatch(match, 2);
    Match.playMatch(match, 3);
    // Match.displayMatches(match);
    // Match.playMatch(match, 2);
    // Match.displayMatches(match);
    // Match.playMatch(match, 3);
    Match.displayMatches(match);
}
