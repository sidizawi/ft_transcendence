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

  checkAuthAndRedirect(path: string): string {
    if ((path === '/signin' || path === '/signup') && this.isLoggedIn()) {
      this.navigateTo('/profile');
      return '/profile';
    }

    if ((path === '/profile' || path === '/profile/settings') && !this.isLoggedIn()) {
      this.navigateTo('/signin');
      return '/signin';
    }

    return path;
  }
}