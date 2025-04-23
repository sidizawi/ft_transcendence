import { app } from '../../main';
import { i18n } from '../../shared/i18n';
import { User } from '../../shared/types/user';
import { TokenManager } from '../../shared/utils/token';

export class Tournament {

  private ws: WebSocket | null;
  private user: User | null;

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
        const type = (event.target as HTMLElement).getAttribute("data");

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
            ${i18n.t('games.connect4.title')}
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

      this.setupTournamentWS(name, players, code, pub);
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

  setupTournamentWS(name: string, players: number, code: string, pub: boolean) {
    const token = TokenManager.getToken();

    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${protocol}://${window.location.hostname}:3000/game/connect4/tournament${token ? "?token="+token : ""}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        mode: "create",
        name,
        players,
        code,
        pub,
        userId: this.user?.id,
        username: this.user?.username,
      }));
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("received data", data);
    }

    this.renderWaitingTournamentRoom();
  }

  renderWaitingTournamentRoom() {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.connect4.title')}
          </h1>
          <!-- todo: change from websocket -->
          <p id="waitingTournamentText" class="text-gray-600 dark:text-gray-400 text-center mb-8">
            waiting for others
          </p>
          <div class="flex items-center justify-center">
            <button id="leave" class="p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              Leave
            </button>
          </div>
        </div>
      </div>
    `;

    const leave = document.getElementById("leave");

    leave?.addEventListener('click', () => {
      app.router.navigateTo("/tournament");
    });
  }

  renderJoinTournamentRoom(data : any = null) {
    const main = document.querySelector("main");

    // todo: add translate
    // add previous btn
    main!.innerHTML = `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.connect4.title')} tournament
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
            data.lst.map((room: any) =>
              `
              <div class="flex items-center justify-between mb-4">
                <p class="text-gray-600 dark:text-gray-400 text-center">${room.name}</p>
                <div class="flex items-center justify-center">
                  ${!room.pub ? `<input id="${room.room}-input" placeholder="tournament code" class="mx-2 block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"/>` : ""}
                  <button room="${room.room}" pub="${room.pub}" class="joinTournamentBtn p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
                    join
                  </button>
                </div>
              </div>
            `).join('')
          }
          <div class="flex items-center justify-center">
            <button id="leave" class="p-4 bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              Leave
            </button>
          </div>
        </div>
      </div>
    `;

    const leave = document.getElementById("leave");

    leave?.addEventListener('click', () => {
      app.router.navigateTo("/connect4");
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

        this.renderWaitingTournamentRoom();
      })
    })
  }

  setupJoinTournament() {

    const token = TokenManager.getToken();

    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    this.ws = new WebSocket(`${protocol}://${window.location.hostname}:3000/game/connect4/tournament${token ? "?token="+token : ""}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        mode: "list",
        userId: this.user?.id,
        username: this.user?.username
      }));
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log("received data", data);
      if (data.mode == "list") {
        this.renderWaitingTournamentRoom();
      }
    }

    this.ws.onclose = () => {}
    this.renderWaitingTournamentRoom();
  }

  render(): string {
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
            <button data="create" class="tournamentBtn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('tournaments.create')}
            </button>
            <button data="join" class="tournamentBtn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('tournaments.join')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}