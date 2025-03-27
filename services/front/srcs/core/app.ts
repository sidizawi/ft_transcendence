import '../style.css';
import { BrowserCompatibility } from '../shared/utils/browserCheck';
import { Menu } from '../shared/components/menu';
import { Auth } from '../features/auth/auth';
import { Profile } from '../features/profile/profile';
import { Router } from '../shared/utils/routing';
import { User } from '../shared/types/user';
import { Tournament } from '../features/tournament/tournament';
import { Pong } from '../features/games/pong';
import { Connect4 } from '../features/games/connect4';
import { Header } from '../shared/components/header';
import { Footer } from '../shared/components/footer';
import { i18n } from '../shared/i18n';
import { TokenManager } from '../shared/utils/token';
import { FriendsList } from '../shared/components/friends';

export class TranscendenceApp {
  private state = {
    user: null as User | null,
    currentPage: 'home'
  };

  private menu: Menu;
  private auth: Auth;
  private router: Router;
  private header: Header;
  private footer: Footer;
  private friendsList: FriendsList | null = null;

  constructor() {
    // Check if user is already logged in
    const token = TokenManager.getToken();
    if (token) {
      const user = TokenManager.getUserFromToken();
      if (user) {
        this.state.user = user;
        this.friendsList = new FriendsList();
      }
    }

    this.menu = new Menu(this.isLoggedIn(), () => this.handleLogout());
    this.auth = new Auth((user) => this.handleLogin(user));
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
    this.friendsList = new FriendsList();
    this.menu = new Menu(true, () => this.handleLogout());
    this.initializeApp();
    this.router.navigateTo('/profile');
  }

  private handleLogout() {
    TokenManager.removeToken();
    this.state.user = null;
    this.friendsList = null;
    this.menu = new Menu(false, () => this.handleLogout());
    this.initializeApp();
    this.router.navigateTo('/signin');
  }

  private getPageTitle(path: string): string {
    switch (path) {
      case '/':
        return 'Home';
      case '/profile':
        return i18n.t('profile');
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
      default:
        return 'Transcendence';
    }
  }

  private initializeApp() {
    const menuOverlay = document.getElementById('menu-overlay');
    const wasMenuOpen = menuOverlay?.classList.contains('active');

    document.body.innerHTML = `
      <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        ${this.header.render(this.getPageTitle(window.location.pathname))}

        <div 
          id="menu-overlay" 
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 backdrop-blur-sm ${wasMenuOpen ? 'active' : ''}"
        >
          <div class="menu-box bg-transparent rounded-lg">
            ${this.menu.getMenuItems()}
          </div>
        </div>

        <main id="main-content" class="container mx-auto px-4 py-8 flex-grow">
        </main>

        ${this.footer.render()}
        ${this.friendsList ? this.friendsList.render() : ''}
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.header.setupEventListeners();
    this.footer.setupEventListeners();
    this.menu.setupEventListeners();
    this.friendsList?.setupEventListeners();
  }

  private renderCurrentPage() {
    const path = this.router.checkAuthAndRedirect(window.location.pathname);
    const main = document.querySelector('main');
    if (!main) return;

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
      case '/tournament':
        const tournament = new Tournament();
        main.innerHTML = tournament.render();
        break;
      case '/pong':
        const pong = new Pong();
        main.innerHTML = pong.render();
        break;
      case '/connect4':
        const connect4 = new Connect4();
        main.innerHTML = connect4.render();
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
        this.renderHomePage(main);
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
