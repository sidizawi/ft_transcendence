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
    // Redirect to profile if trying to access auth pages while logged in
    if ((path === '/signin' || path === '/signup') && this.isLoggedIn()) {
      this.navigateTo('/profile');
      return '/profile';
    }

    // Redirect to signin if trying to access protected pages while logged out
    if (path === '/profile' && !this.isLoggedIn()) {
      this.navigateTo('/signin');
      return '/signin';
    }

    return path;
  }
}