import { app } from '../../main';
import { i18n } from '../../shared/i18n';
import { User } from '../../shared/types/user';
import { WebsocketPage } from '../../shared/types/app';
import { TokenManager } from '../../shared/utils/token';
import { TournamentData, TournamentStorage } from '../../shared/types/game';
import { ModalManager } from '../../shared/components/modal';
import { Connect4 } from '../games/connect4';

class Match {
	left: Match | null = null;
	right: Match | null = null;
	parent: Match | null = null;
	winner: string | null = null;
	player1: string | null = null;
	player2: string | null = null;

	round = 1;
  index = 0;

	constructor(left: Match | null = null, right: Match | null = null) {
		this.left = left;
		this.right = right;
	}

	static createMatches(players: string[]) : Match | null {
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
    if (match.left)
      match.left.parent = match;
		match.right = Match.createMatches(players.slice(Math.floor(players.length / 2)));
    if (match.right)
      match.right.parent = match;
		match.round = (match.left?.round || 0) + 1;
		return match
	}

  static indexing(match: Match, idx: number) {
    const queue = [match]

    while (queue.length > 0) {
      const m = queue.shift();
      if (!m)
        continue;

      m.index = idx--;

      if (m.right)
        queue.push(m.right);
      if (m.left)
        queue.push(m.left);
    }
  }

  static updateFromMap(match: Match, map: Map<number, string>) {
    if (map.has(match.index)) {
      match.winner = map.get(match.index) || null;
    }
    if (match.left) {
      this.updateFromMap(match.left, map);
      if (match.left.winner) {
        match.player1 = match.left.winner;
      }
    }
    if (match.right) {
      this.updateFromMap(match.right, map);
      if (match.right.winner) {
        match.player2 = match.right.winner;
      }
    }
  }
}

export class Tournament implements WebsocketPage {

  private data: TournamentData;
  private storage: TournamentStorage | undefined;
  private game: Match | null = null;
  private room: string | null = null;
  private ws : WebSocket | null = null;

  constructor(path: string) {
    this.data = {
      round: 1,
      plays: 0,
      rounds: 0,
    };
    let name = decodeURI(path.split("/").filter((el) => el.length)[1]);
    let storage = localStorage.getItem(`tournament-${name}`);
    if (!storage) {
      // todo: translate
      ModalManager.openModal(i18n.t('tournaments.title'), "tournament not found");
      setTimeout(() => {
        app.router.navigateTo("/tournament");
      }, 100);
      return ;
    }
    //ModalManager.openModal(i18n.t('tournaments.title'), "tournament not found");
    // localStorage.removeItem(`tournament-${name}`);

    this.storage = this.parseStorage(storage);
    this.data.plays = this.storage.players / 2;
    this.data.rounds = Math.log2(this.storage.players);
    if (!this.storage.winners) {
      this.storage.winners = new Map();
    }
    if (this.storage.mode == "local") {
      this.renderWaitingRoom("Creating tournament", true);
      this.generatePlayers(this.storage.players);
      this.renderMatchBoard(this.storage.name);
    } else {
      this.room = this.storage.room!;
      this.renderWaitingRoom("Joining tournament", true);
      // connect to the server
      // display waiting room
      // display players
      // display matches
      // play
    }
  }

  destroy() {
    this.ws?.close();
    this.ws = null;
    this.room = null;
  }

  shuffleLst(players: number[]) {
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }
    return players;
  }

  generatePlayers(players: number) {
    let pl = this.shuffleLst([...Array(players).keys()])
      .map((el) => `player #${el + 1}`);

    this.game = Match.createMatches(pl);
    Match.indexing(this.game!, this.storage!.players - 1);
    if (this.storage?.winners?.size) {
      Match.updateFromMap(this.game!, this.storage.winners);
    }
  }

  renderMatchBoard(name: string) {
    const main = document.querySelector("main");

    // todo: add translate
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')} &nbsp;-&nbsp; ${name}
          </h1>
          <div id="matchBoard" class="flex flex-col items-start justify-center mb-4">
          </div>
          ${this.data.round <= this.data.rounds ? `
            <div class="w-full flex items-center justify-center">
              <button id="start" class="p-4 bg-light-3 dark:bg-dark-3 text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
                start
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;

    // todo: translate
    const rounds = ["Final", "Semi-Final", "Quarter-Final", "Eighth-Final", "Qualification"];

    for (let round = 1; round <= this.data.rounds; round++) {
      const matchBoard = document.getElementById("matchBoard");
      matchBoard!.innerHTML += `
        <div class="w-full flex flex-col items-start justify-center mb-4">
          <h2 class="text-xl font-bold text-light-4 dark:text-dark-0 mb-4">${rounds[this.data.rounds - round]}</h2>
          <div id="round-${round}" class="w-full flex flex-col items-center justify-center mb-8">
          </div>
        </div>
      `;
      this.displayMatches(this.game, round);
    }

    const start = document.getElementById("start");
    start?.addEventListener('click', () => {
      if (this.data.round > this.data.rounds)
        return ;
      this.playMatch(this.game!, this.data.round);
      //this.renderMatchBoard(this.data.name);
      this.data.plays--;
      if (this.data.plays == 0) {
        this.data.round++;
        this.data.plays = Math.pow(2, this.data.rounds - this.data.round);
      }
      // todo: translate
      if (this.data.round > this.data.rounds) {
        ModalManager.openModal(i18n.t('tournaments.title'), `the winner is: ${this.game?.winner}`);
      }
      console.log("round: " + this.data.round, "plays: " + this.data.plays, "rounds: " + this.data.rounds);
    });
  }

  displayMatches(match: Match | null, round: number, depth: number = 0) : void {

		if (match === null) {
			return;
		}
		if (round == match.round) {
      const roundDiv = document.getElementById(`round-${round}`);
      roundDiv!.innerHTML += `
        <div class="w-full flex items-center justify-between mb-4 mx-8">
          <p class="text-light-2 dark:text-dark-2 text-center">${match?.player1 || "player #..."} vs ${match?.player2 || "player #..."}</p>
          <p class="text-light-2 dark:text-dark-2 text-center">winner: ${match?.winner || "..."}</p>
        </div>
      `;
		}
		this.displayMatches(match.left, round, depth + 1);
		this.displayMatches(match.right, round, depth + 1);
	}

  parseStorage(storage: string) : TournamentStorage {
    let data = JSON.parse(storage);

    return {
      ...data,
      winners: new Map(data.winners)
    }
  }

  setStorage(name: string) {
    localStorage.setItem(`tournament-${name}`, JSON.stringify({
      ...this.storage,
      winners: Array.from(this.storage!.winners!.entries())
    }))
  }

	playMatch(match: Match, round : number = 1) : boolean {
		let ret = false;
		if (match.player1 !== null 
			&& match.player2 !== null
			&& match.winner === null 
			&& round === match.round) {
      new Connect4("play_local", match.player1, match.player2, (winner: string) => {
        match.winner = winner;
        if (match.parent !== null && match.parent.left == match) {
          match.parent.player1 = match.winner;
        } else if (match.parent !== null && match.parent.right == match) {
          match.parent.player2 = match.winner;
        }
        console.log("Match between " + match.player1 + " vs " + match.player2 + " won by " + match.winner, "round: " + match.round);
        this.renderMatchBoard(this.storage!.name);
        console.log(typeof(this.storage?.winners), this.storage?.winners);
        this.storage?.winners?.set(match.index, winner);
        this.setStorage(this.storage!.name);
      });
			return (true);
		} else {
			if (match.left !== null) {
        if (!ret) {
          ret = this.playMatch(match.left, round);
        }
			}
			if (match.right !== null) {
        if (!ret) {
  				ret = this.playMatch(match.right, round);
        }
			}
		}
		return (ret);
	}

  renderWaitingRoom(message: string, leave: boolean = false) {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p id="waitingTournamentText" class="text-light-2 dark:text-dark-2 text-center mb-8">
            ${message}
          </p>
          ${leave ? `
            <div class="flex items-center justify-center">
              <button id="leave" class="p-4 bg-light-3 dark:bg-dark-1 text-light-1 dark:text-dark-3 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
                Leave
              </button>
            </div>
            `
          : ""}
        </div>
      </div>
    `;

    if (leave) {
      const leave = document.getElementById("leave");

      leave?.addEventListener('click', () => {
        localStorage.removeItem(`tournament-${this.storage?.name}`);
        app.router.navigateTo("/tournament");
      });
    }
  }
}

export class TournamentHomePage implements WebsocketPage {

  private user: User | null;
  private ws: WebSocket | null;

  constructor(path: string | null = null) {
    this.ws = null;
    this.user = TokenManager.getUserFromLocalStorage();

    if (!path) {
      this.setupTournamentPage();
    } else if (path == "create") {
      this.setupCreateTournament();
    } else if (path == "join") {
      this.setupJoinTournament();
    }
  }

  destroy() {
    this.ws?.close();
    this.ws = null;
  }

  setupTournamentPage() {
    const main = document.querySelector("main");

    // todo add previous btn
    main!.innerHTML = this.render()

    const tournamentBtn = document.querySelectorAll(".tournamentBtn");

    tournamentBtn.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        btn = event.target as HTMLElement
        const type = btn.getAttribute("data");

        if (btn.classList.contains("not-connected")) {
          return ;
        }

        if (type == "create") {
          app.router.navigateTo("/tournament/create");
        } else {
          app.router.navigateTo("/tournament/join");
        }
      });
    })
  }

  setupCreateTournament() {
    const main = document.querySelector("main");

    // todo: translate
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p class="text-light-4/80 dark:text-dark-0/80 text-center mb-8">
            ${i18n.t('games.connect4.description')}
          </p>
          <div class="flex flex-col items-center  w-full">
            <form id="createTournamentForm">
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  Tournament name
                </label>
                <input id="tournamentName"
                  class="
                    mt-1 block w-full rounded-md px-3 py-2 text-sm
                    border border-light-4/30 dark:border-dark-0/30
                    bg-input dark:bg-dark-4
                    text-light-4 ark:text-dark-0
                    focus:outline-none
                    focus:border-light-3 dark:focus:border-dark-1
                    focus:ring-2
                    focus:ring-light-0 dark:focus:ring-dark-4
                  "/>
                </div>
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  Game
                </label>
                <select name="game" id="game-type" 
                class="w-full mt-1 block rounded-md border-gray-300 dark:text-dark-3 dark:bg-dark-3 dark:text-dark-0 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="pong" selected>${i18n.t('games.pong.title')}</option>
                  <option value="p4">${i18n.t('games.connect4.title')}</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  mode
                </label>
                <select name="mode" id="game-mode" class="w-full mt-1 block rounded-md border-gray-300 dark:text-dark-3 dark:bg-dark-3 dark:text-dark-0 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="remote" selected>remote</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="tournamentPlayers" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  number of players
                </label>
                <select name="players" id="tournamentPlayers" class="w-full mt-1 block rounded-md border-gray-300 dark:text-dark-3 dark:bg-dark-3 dark:text-dark-0 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="4" selected>4</option>
                  <option value="8">8</option>
                  <option value="16">16</option>
                  <option value="32">32</option>
                </select>
              </div>
              <div class="flex items-center justify-start space-x-2 mb-4">
                <input id="tournamentPrivate" type="radio" name="privacy" value="private"/>
                <label for="tournamentPrivate" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  Private
                </label>
              </div>
              <div class="flex items-center justify-start space-x-2 mb-4">
                <input id="tournamentPublic" checked="true" type="radio" name="privacy" value="public" />
                <label for="tournamentPublic" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  Public
                </label>
              </div>
              <div class="mb-4">
                <label for="tournamentCode" class="block text-sm font-medium text-light-4 dark:text-dark-0">
                  Tournament code *
                </label>
                <input id="tournamentCode" disabled
                class="
                    mt-1 block w-full rounded-md px-3 py-2 text-sm
                    border border-light-4/30 dark:border-dark-0/30
                    bg-input dark:bg-dark-4
                    text-light-4 ark:text-dark-0
                    focus:outline-none
                    focus:border-light-3 dark:focus:border-dark-1
                    focus:ring-2
                    focus:ring-light-0 dark:focus:ring-dark-4
                    disabled:bg-light-1 dark:disabled:bg-dark-3
                  "/>
              </div>
              <button type="submit" class="w-full bg-light-3 dark:bg-dark-2 text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                Creat
              </button>
              <div id="error-message" class="mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 hidden"></div>
            </form>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById("createTournamentForm");

    function showError(message: string) {
      const error = document.getElementById("error-message");
      error!.innerText = message;
      error?.classList.remove("hidden");
    }

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      document.getElementById("error-message")?.classList.add("hidden");

      const game = (document.getElementById("game-type") as HTMLInputElement).value;
      const mode = (document.getElementById("game-mode") as HTMLInputElement).value;
      const code = (document.getElementById("tournamentCode") as HTMLInputElement).value;
      const name = (document.getElementById("tournamentName") as HTMLInputElement).value;
      const pub = (document.getElementById("tournamentPublic") as HTMLInputElement).checked;
      const players = parseInt((document.getElementById("tournamentPlayers") as HTMLInputElement).value);

      if (!name.length) {
        showError("tournament name shouldn't be empty");
        return ;
      }
      if (!pub && !code.length) {
        showError("tournament code shouldn't be empty");
        return ;
      }
      if (players < 4 || players > 32 || players % 4 != 0) {
        showError("numbers of players should be a multiple of 4 and between 4 and 32");
        return ;
      }
      if (!game.length || (game != "p4" && game != "pong")) {
        showError("bad game type");
        return ;
      }

      if (mode == "remote") {
        this.createRemoteTournament(name, players, code, game, pub);
      } else {
        this.createLocalTournament(name, players, code, game, pub);
      }
    })

    form?.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target!.matches('input[name="privacy"]')) {
        const value = target.value;

        const code = document.getElementById("tournamentCode") as HTMLInputElement;
        const mode = (document.getElementById("game-mode") as HTMLInputElement).value;

        code!.value = "";
        if (value == "public") {
          code?.setAttribute("disabled", "");
        } else if (mode == "remote") {
          code?.removeAttribute("disabled");
        }
      }
      if (target!.matches('#game-mode')) {
        const pub = document.getElementById("tournamentPublic") as HTMLInputElement;
        const code = document.getElementById("tournamentCode") as HTMLInputElement;
        const players = (document.getElementById("tournamentPlayers") as HTMLSelectElement);
        const options = players.getElementsByTagName("option");
        if (target.value == "local") {
          pub.checked = true;
          code.setAttribute("disabled", "");
          for (let i = 0; i < options.length; i++) {
            if (options[i].value != "4") {
              options[i].setAttribute("disabled", "");
            } else {
              options[i].setAttribute("selected", "");
            }
          }
          players.value = "4";
        } else {
          for (let i = 0; i < options.length; i++) {
            if (options[i].value != "4") {
              options[i].removeAttribute("disabled");
            }
          }
        }
      }
    })
  }

  createLocalTournament(name: string, players: number, code: string, game: string, pub: boolean) {
    localStorage.setItem(`tournament-${name}`, JSON.stringify({
      name,
      players,
      code,
      pub,
      game,
      mode: "local",
      room: null,
      winners: null,
    }));

    app.router.navigateTo("/tournament/local/"+name);
  }

  createRemoteTournament(name: string, players: number, code: string, game: string, pub: boolean) {
    const token = TokenManager.getToken();

    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${protocol}://${window.location.hostname}:3000/game/tournament${token ? "?token="+token : ""}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        mode: "create",
        name,
        players,
        code,
        pub,
        game,
        userId: this.user?.id,
        username: this.user?.username,
      }));

    }
    
    this.ws.onmessage = (e) => {
      const message = JSON.parse(e.data);

      console.log("create message received:", message);
      if (message.mode == "created") {
        this.ws?.close();
        this.ws = null;
        localStorage.setItem(`tournament-${message.room}`, JSON.stringify({
          name,
          players,
          code,
          pub,
          game,
          mode: "remote",
          room: message.room,
          winners: null,
        }));

        app.router.navigateTo("/tournament/remote/"+message.room);
      }
    }

    this.renderWaitingRoom("Creating the tournament");
  }

  renderWaitingRoom(message: string, leave: boolean = false) {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p id="waitingTournamentText" class="text-gray-600 dark:text-dark-2 text-center mb-8">
            ${message}
          </p>
          ${leave ? `
            <div class="flex items-center justify-center">
              <button id="leave" class="p-4 bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                Leave
              </button>
            </div>
            `
          : ""}
        </div>
      </div>
    `;

    if (leave) {
      const leave = document.getElementById("leave");

      leave?.addEventListener('click', () => {
        app.router.navigateTo("/tournament");
      });
    }
  }

  renderJoinTournamentRoom(data : any = null) {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          ${data == null ?
            `
            <p class="text-gray-600 dark:text-dark-2 text-center mb-8">
              loading tournaments 
            </p>
            ` : ""
          }
          ${
            !data ? "" :
            data.map((room: any) =>
              `
              <div class="flex items-center justify-between mb-4">
                <p class="text-gray-600 dark:text-dark-2 text-center">${room.name} - created by ${room.createdBy} - ${room.game}</p>
                <div class="flex items-center justify-center">
                  ${!room.pub ? `
                    <input id="${room.room}-input" placeholder="tournament code" class="mx-2 block rounded-md border-gray-300 dark:text-dark-3 dark:bg-dark-3 dark:text-dark-0 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                  ` : ""
                  }
                  <button room="${room.room}" pub="${room.pub}" class="joinTournamentBtn p-4 bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                    join
                  </button>
                </div>
              </div>
            `).join('')
          }
          ${data && data.length == 0 ? `
            <div class="flex items-center justify-center flex-col mb-4">
              <p class="text-gray-600 dark:text-dark-2 text-center mb-2">there are no open tournament</p>
              <button id="create" class="p-4 bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                Create a new tournament
              </button>
            </div>
            ` : `
              <div class="flex items-center justify-center">
                <button id="leave" class="p-4 bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                  Leave
                </button>
              </div>
            `
          }
        </div>
      </div>
    `;

    const leave = document.getElementById("leave");
    const create = document.getElementById("create");

    leave?.addEventListener('click', () => {
      app.router.navigateTo("/tournament");
    });

    create?.addEventListener('click', () => {
      app.router.navigateTo("/tournament/create");
    });
    
    const joinBtns = document.querySelectorAll(".joinTournamentBtn");

    joinBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const room = (e.target as HTMLElement).getAttribute("room");
        const pub = (e.target as HTMLElement).getAttribute("pub") == "true";

        let code = null;
        if (!pub) {
          code = (document.getElementById(`${room}-input`) as HTMLInputElement)?.value;
        }

        this.ws?.send(JSON.stringify({
          mode: "join",
          room,
          code,
          userId: this.user?.id,
          username: this.user?.username,
        }));

        this.renderWaitingRoom("waiting to join");
      })
    })
  }

  setupJoinTournament() {

    const token = TokenManager.getToken();

    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${protocol}://${window.location.hostname}:3000/game/tournament${token ? "?token="+token : ""}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        mode: "list",
        userId: this.user?.id,
        username: this.user?.username
      }));
    }

    // todo: traduction
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("received data", data);
      if (data.mode == "list") {
        this.renderJoinTournamentRoom(data.lst);
      } else if (data.mode == "joined") {
        // todo: send to tournament remote page
        this.destroy(); // todo: remove this
        this.renderWaitingRoom("joined", true);
      } else if (data.mode == "cant_join") {
        this.ws?.send(JSON.stringify({
          mode: "list",
          userId: this.user?.id,
          username: this.user?.username
        }))
        this.renderJoinTournamentRoom();
        ModalManager.openModal(i18n.t('tournaments.title'), data.message);
      }
    }

    // todo: check this
    //window.addEventListener("beforeunload", () => {
    //  this.destroy();
    //  console.log("loaded window");
    //});

    this.renderJoinTournamentRoom();
  }

  renderBtnConn(data: string, name: string, token: string | null): string {
    let className = "tournamentBtn w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors";
    if (!token) {
      // todo: check if not connected
      className = "tournamentBtn not-connected w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors";
    }
    return `
      <button data="${data}" class="${className}">
        ${name}
      </button>
    `;
  }

  render(): string {
    const token = TokenManager.getToken();

    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p class="text-light-4 dark:text-dark-0 text-center mb-8">
            ${i18n.t('tournaments.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${this.renderBtnConn("create", i18n.t('tournaments.create'), token)}
            ${this.renderBtnConn("join", i18n.t('tournaments.join'), token)}
          </div>
        </div>
      </div>
    `;
  }
}
