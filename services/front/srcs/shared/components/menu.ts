import { app } from '../../main';
import { i18n } from '../i18n';

export class Menu {
  constructor(private isLoggedIn: boolean, private onLogout: () => void) {}

  getMenuItems(): string {
    const menuItems = [
      { href: '/profile', text: i18n.t('profile') },
      { href: '/tournament', text: i18n.t('tournament') },
      { href: '/pong', text: i18n.t('pong') },
      { href: '/connect4', text: i18n.t('connect4') }
    ];

    return `
      <div class="flex flex-col space-y-3">
        ${menuItems.map(item => `
          <a 
            href="${item.href}" 
            data-page="${item.href.substring(1)}"
            class="block text-center font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-lg transform transition-all duration-200 shadow-lg min-w-[200px] text-sm sm:text-base"
          >
            ${item.text}
          </a>
        `).join('')}
        ${this.isLoggedIn 
          ? `<button 
              id="logoutMenuBtn" 
              class="
                w-full text-center font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-lg transform transition-all duration-200 shadow-lg min-w-[200px] text-sm sm:text-base
                text-light-0 dark:text-dark-0
                bg-off-btn-light-0  dark:bg-off-btn-dark-1
                hover:scale-[1.02] hover:opacity-90
              "
            >
              ${i18n.t('logout')}
            </button>`
          : `<a 
              href="/signin" 
              data-page="signin"
              class="block text-center font-bold py-3 sm:py-3.5 px-6 sm:px-8 rounded-lg transform transition-all duration-200 shadow-lg min-w-[200px] text-sm sm:text-base"
            >
              ${i18n.t('signIn')}
            </a>`
        }
      </div>
    `;
  }

  setupEventListeners() {
    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menu-overlay');
    const logoutMenuBtn = document.getElementById('logoutMenuBtn');

    menuBtn?.addEventListener('click', () => this.toggleMenu());
    menuOverlay?.addEventListener('click', (e) => {
      if (e.target === menuOverlay) {
        this.closeMenu();
      }
    });

    logoutMenuBtn?.addEventListener('click', () => {
      this.onLogout();
      this.closeMenu();
    });

    document.querySelectorAll('.menu-box a').forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });
  }

  toggleMenu() {
    const menuOverlay = document.getElementById('menu-overlay');
    menuOverlay?.classList.toggle('active');
  }

  closeMenu() {
    const menuOverlay = document.getElementById('menu-overlay');
    menuOverlay?.classList.remove('active');
  }
}