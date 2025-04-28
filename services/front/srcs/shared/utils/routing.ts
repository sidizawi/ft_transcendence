import { TokenManager } from './token';

const host = window.location.hostname;
const USER_API_URL = `http://${host}:3000/user`;

export class Router {
  constructor(
    private onNavigate: (path: string) => void,
    private isLoggedIn: () => boolean
  ) {
    this.handleNavigation();
  }

  private handleNavigation() {
    window.addEventListener('popstate', () => this.onNavigate(window.location.pathname));
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.getAttribute('href')?.startsWith('/')) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href') || '/');
      }
    });
  }

  navigateTo(path: string) {
    history.pushState(null, '', path);
    this.onNavigate(path);
  }

  async checkAuthAndRedirect(path: string): Promise<string> {
    // Redirect to profile if trying to access auth pages while logged in
    if ((path === '/signin' || path === '/signup') && this.isLoggedIn()) {
      this.navigateTo('/profile');
      return '/profile';
    }

    // Redirect to signin if trying to access protected pages while logged out
    if ((path === '/profile' || path === '/profile/settings') && !this.isLoggedIn()) {
      this.navigateTo('/signin');
      return '/signin';
    }

    // Check username for user profile pages
    const userMatch = path.match(/^\/users\/([^/]+)$/);
    if (userMatch && this.isLoggedIn()) {
      const username = userMatch[1];

      // Skip checking for special routes
      if (['signin', 'signup', 'profile', 'friends', 'tournament', 'pong', 'connect4'].includes(username)) {
        return path;
      }

      const currentUser = TokenManager.getUserFromLocalStorage();
      if (currentUser && username === currentUser.username) {
        this.navigateTo('/profile');
        return '/profile';
      }

      try {
        const response = await fetch(`${USER_API_URL}/profile/check-username/${username}`, {
          method: 'GET',
          headers: TokenManager.getAuthHeaders()
        });

        if (!response.ok) {
          this.navigateTo('/404');
          return '/404';
        }

        const data = await response.json();
        if (!data.message || data.message !== 'Username exists') {
          this.navigateTo('/404');
          return '/404';
        }
      } catch (error) {
        console.error('Error checking username:', error);
        this.navigateTo('/404');
        return '/404';
      }
    }

    return path;
  }
}
