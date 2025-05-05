import { app } from '../../main';
import { ModalManager } from '../../shared/components/modal';
import { i18n } from '../../shared/i18n';
import { User } from '../../shared/types/user';
import { TokenManager } from '../../shared/utils/token';

export class Tournament {

  constructor(path: string) {
    let name = path.split("/").filter((el) => el.length)[1];
    let storage = localStorage.getItem(`tournament-${name}`);
    if (!storage) {
      setTimeout(() => {
        app.router.navigateTo("/tournament");
      }, 500);
      return ;
    }

    let data = JSON.parse(storage);

    if (data.mode == "local") {
    } else {
    }
  }
}

export class TournamentHomePage {

  private user: User | null;
  private ws: WebSocket | null;
  private room: string | null = null;

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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
            ${i18n.t('games.connect4.description')}
          </p>
          <div class="flex flex-col items-center  w-full">
            <form id="createTournamentForm">
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tournament name
                </label>
                <input id="tournamentName" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
              </div>
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Game
                </label>
                <select name="game" id="game-type" class="w-full mt-1 block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="pong" selected>${i18n.t('games.pong.title')}</option>
                  <option value="p4">${i18n.t('games.connect4.title')}</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="tournamentName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  mode
                </label>
                <select name="mode" id="game-mode" class="w-full mt-1 block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="remote" selected>remote</option>
                  <option value="local">local</option>
                </select>
              </div>
              <div class="mb-4">
                <label for="tournamentPlayers" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  number of players
                </label>
                <input id="tournamentPlayers" type="number" min="4" max="16" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900"/>
              </div>
              <div class="flex items-center justify-start space-x-2 mb-4">
                <input id="tournamentPrivate" type="radio" name="privacy" value="private"/>
                <label for="tournamentPrivate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Private
                </label>
              </div>
              <div class="flex items-center justify-start space-x-2 mb-4">
                <input id="tournamentPublic" checked="true" type="radio" name="privacy" value="public" />
                <label for="tournamentPublic" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Public
                </label>
              </div>
              <div class="mb-4">
                <label for="tournamentCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tournament code *
                </label>
                <input id="tournamentCode" disabled class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-900"/>
              </div>
              <button type="submit" class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
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
      if (players < 4 || players > 16 || players % 2 != 0) {
        showError("numbers of players should be even and between 4 and 16");
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
      if ((event.target as HTMLElement)!.matches('input[name="privacy"]')) {
        const value = (event.target as HTMLElement).getAttribute("value");

        const code = document.getElementById("tournamentCode") as HTMLInputElement;
        code!.value = "";
        if (value == "public") {
          code?.setAttribute("disabled", "");
        } else {
          code?.removeAttribute("disabled");
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
        this.room = message.room;
        this.ws?.close();
        this.ws = null;
        // this.renderWaitingTournamentRoom();
        // todo: open new websocket to join a tournament
        //this.renderWaitingRoom("created", true);
        localStorage.setItem(`tournament-${name}`, JSON.stringify({
          name,
          players,
          code,
          pub,
          game,
          mode: "remote",
        }));

        app.router.navigateTo("/tournament/remote/"+name);
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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p id="waitingTournamentText" class="text-gray-600 dark:text-gray-400 text-center mb-8">
            ${message}
          </p>
          ${leave ? `
            <div class="flex items-center justify-center">
              <button id="leave" class="p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
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
        this.clean();
        app.router.navigateTo("/tournament");
      });
    }
  }

  clean() {
    this.ws?.close();
    this.ws = null;
    this.room = null;
  }

  renderJoinTournamentRoom(data : any = null) {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          ${data == null ?
            `
            <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
              loading tournaments 
            </p>
            ` : ""
          }
          ${
            !data ? "" :
            data.map((room: any) =>
              `
              <div class="flex items-center justify-between mb-4">
                <p class="text-gray-600 dark:text-gray-400 text-center">${room.name} - created by ${room.createdBy} - ${room.game}</p>
                <div class="flex items-center justify-center">
                  ${!room.pub ? `
                    <input id="${room.room}-input" placeholder="tournament code" class="mx-2 block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                  ` : ""
                  }
                  <button room="${room.room}" pub="${room.pub}" class="joinTournamentBtn p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
                    join
                  </button>
                </div>
              </div>
            `).join('')
          }
          ${data && data.length == 0 ? `
            <div class="flex items-center justify-center flex-col mb-4">
              <p class="text-gray-600 dark:text-gray-400 text-center mb-2">there are no open tournament</p>
              <button id="create" class="p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
                Create a new tournament
              </button>
            </div>
            ` : `
              <div class="flex items-center justify-center">
                <button id="leave" class="p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
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
      this.clean();
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
        // todo
        this.clean();
        this.room = data.room;
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

    window.addEventListener("beforeunload", () => {
      this.clean();
      console.log("loaded window");
    });

    this.renderJoinTournamentRoom();
  }

  setupTournamentRoom() {
    if (!this.room) {
      this.clean();
      app.router.navigateTo("/tournament/join");
      return ;
    }

    const main = document.querySelector("main");
  
    main!.innerHTML = `
      <div>
        <h1>welcome</h1>
      </div>
    `;

    //this.ws = 
  }

  renderBtnConn(data: string, name: string, token: string | null): string {
    let className = "tournamentBtn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors";
    if (!token) {
      className = "tournamentBtn not-connected w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors";
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
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
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
