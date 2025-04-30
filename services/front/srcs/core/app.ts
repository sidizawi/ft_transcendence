import '../style.css';
import { BrowserCompatibility } from '../shared/utils/browserCheck';
import { Menu } from '../shared/components/menu';
import { Auth } from '../features/auth/auth';
import { Profile } from '../features/profile/profile';
import { Settings } from '../features/profile/settings';
import { Friends } from '../features/friends/friends';
import { Router } from '../shared/utils/routing';
import { User } from '../shared/types/user';
import { Tournament, TournamentHomePage } from '../features/tournament/tournament';
import { Pong, PongHomePage } from '../features/games/pong';
import { Connect4, Connect4HomePage } from '../features/games/connect4';
import { Header } from '../shared/components/header';
import { Footer } from '../shared/components/footer';
import { i18n } from '../shared/i18n';
import { TokenManager } from '../shared/utils/token';
import { Chat } from '../shared/components/chat';
import { NotFound } from '../shared/components/notFound';
import { FriendProfile } from '../features/profile/friendProfile';

export class TranscendenceApp {
  private state = {
    user: null as User | null,
    currentPage: 'home'
  };

  public router: Router;

  private menu: Menu;
  private auth: Auth;
  private header: Header;
  private footer: Footer;
  private connect4: Connect4HomePage;
  private pong: PongHomePage;
  //private friendsList: FriendsList | null = null;

  constructor() {
    // Check if user is already logged in
    const token = TokenManager.getToken();
    if (token) {
      const user = TokenManager.getUserFromLocalStorage();
      if (user) {
        this.state.user = user;
        // Restore user data from localStorage if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          this.state.user = JSON.parse(storedUser);
        }
      }
    }

    this.menu = new Menu(this.isLoggedIn(), () => this.handleLogout());
    this.auth = new Auth((user) => this.handleLogin(user));
    this.connect4 = new Connect4HomePage();
    this.pong = new PongHomePage();
    this.router = new Router(
      () => this.renderCurrentPage(),
      () => this.isLoggedIn()
    );
    this.header = new Header();
    this.footer = new Footer();

    this.checkBrowserCompatibility();
    this.initializeApp();
    this.renderCurrentPage();
  }

  private checkBrowserCompatibility() {
    if (!BrowserCompatibility.check()) {
      BrowserCompatibility.showWarning();
    }
  }

  private isLoggedIn(): boolean {
    return !!this.state.user;
  }

  private handleLogin(user: User) {
    this.state.user = user;
    this.menu = new Menu(true, () => this.handleLogout());
    this.initializeApp();
    this.router.navigateTo('/profile');
  }

  private handleLogout() {
    // this.chat.clean();
    // todo
    TokenManager.removeToken();
    localStorage.removeItem('user');
    this.state.user = null;
    this.menu = new Menu(false, () => this.handleLogout());
    this.initializeApp();
    this.router.navigateTo('/signin');
  }

  private getPageTitle(path: string): string {
    const chatMatch = path.match(/^\/chat\/(.+)$/);
    if (chatMatch) {
      return i18n.t('chat');
    }

    const userMatch = path.match(/^\/user\/(.+)$/);
    if (userMatch) {
      return userMatch[1];
    }

    switch (path) {
      case '/':
        return 'Home';
      case '/profile':
        return i18n.t('profile');
      case '/profile/settings':
        return i18n.t('editProfile');
      case '/friends':
        return i18n.t('friends');
      case '/tournament':
        return i18n.t('tournament');
      case '/pong':
        return i18n.t('pong');
      case '/connect4':
        return i18n.t('connect4');
      case '/signin':
        return i18n.t('signIn');
      case '/signup':
        return i18n.t('signUp');
      case '/404':
        return i18n.t('pageNotFound');
      default:
        return 'Transcendence';
    }
  }

  private initializeApp() {
    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        ${this.header.render(this.getPageTitle(window.location.pathname))}

        <div 
          id="menu-overlay" 
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        >
          <div class="menu-box bg-transparent rounded-lg">
            ${this.menu.getMenuItems()}
          </div>
        </div>

        <main id="main-content" class="container mx-auto px-4 py-8 flex-grow">
        </main>

        <div id="modal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 hidden"></div>

        ${this.footer.render()}
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.header.setupEventListeners();
    this.footer.setupEventListeners();
    this.menu.setupEventListeners();
  }

  private renderCurrentPage() {
    const path = this.router.checkAuthAndRedirect(window.location.pathname);
    const main = document.querySelector('main');
    if (!main) return;

    const chatMatch = path.match(/^\/chat\/(.+)$/);
    if (chatMatch && this.state.user) {
      const username = chatMatch[1];
      const chat = new Chat(username);
      main.innerHTML = chat.render();
      chat.setupEventListeners();
      return;
    }

    const userMatch = path.match(/^\/users\/(.+)$/); //attention autorise tout apres /users
    if (userMatch && this.state.user) {
      const username = userMatch[1];
      const friendProfile = new FriendProfile(username, '/img/default-avatar.jpg');
      main.innerHTML = friendProfile.render();
      friendProfile.setupEventListeners();
      return;
    } //fct a checker

    const connect4Match = path.match(/^\/connect4\/(.+)$/)
    if (connect4Match) {
      if (connect4Match[1] === 'friend_list') {
        new Connect4HomePage("friend_list");
        return ;
      }
      new Connect4(connect4Match[1]);
      return ;
    }

    const pongMatch = path.match(/^\/pong\/(.+)$/)
    if (pongMatch) {
      if (pongMatch[1] === 'playVsFriend') {
        new PongHomePage("friend_list");
        return ;
      }
      new Pong(pongMatch[1]);
      return ;
    }

    const tournamentMatch = path.match(/^\/tournament\/(.+)$/)
    if (tournamentMatch) {
      console.log(tournamentMatch[1]);
      if (tournamentMatch[1] == "join" || tournamentMatch[1] == "create") {
        new TournamentHomePage(tournamentMatch[1]);
        return ;
      }
      new Tournament(tournamentMatch[1]);
      return ;
    }

    switch (path) {
      case '/':
        this.renderHomePage(main);
        break;
      case '/profile':
        if (this.state.user) {
          const profile = new Profile(this.state.user, () => this.handleLogout());
          main.innerHTML = profile.render();
          profile.setupEventListeners();
        }
        break;
      case '/profile/settings':
        if (this.state.user) {
          const settings = new Settings(this.state.user);
          main.innerHTML = settings.render();
          settings.setupEventListeners();
        }
        break;
      case '/friends':
        if (this.state.user) {
          const friends = new Friends();
          main.innerHTML = friends.render();
          friends.setupEventListeners();
        }
        break;
      case '/tournament':
      case '/tournament/':
        new TournamentHomePage();
        break;
      case '/pong':
      case '/pong/':
        main.innerHTML = this.pong.render();
        this.pong.setupEventListener();
        break;
      case '/connect4':
      case '/connect4/':
        main.innerHTML = this.connect4.render();
        this.connect4.setupEventListener();
        break;
      case '/signin':
        main.innerHTML = this.auth.renderSignIn();
        this.auth.setupAuthEventListeners(false);
        break;
      case '/signup':
        main.innerHTML = this.auth.renderSignUp();
        this.auth.setupAuthEventListeners(true);
        break;
      default:
        const notFound = new NotFound();
        main.innerHTML = notFound.render();
        break;
    }

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = this.getPageTitle(path);
    }
  }

  private renderHomePage(main: Element) {
    main.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 class="text-4xl font-bold mb-6 text-gray-800 dark:text-white">${i18n.t('welcome')}</h1>
        <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl">
          ${i18n.t('description')}
        </p>
        <div class="space-y-4">
          <button 
            id="getStartedBtn" 
            class="bg-orange dark:bg-nature text-white dark:text-nature-lightest px-6 py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
          >
            ${i18n.t('getStarted')}
          </button>
        </div>
      </div>
    `;

    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', () => {
        this.router.navigateTo('/signup');
      });
    }
  }
}
