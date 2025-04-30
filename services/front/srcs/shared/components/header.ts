import { Theme } from './theme';
import { i18n } from '../i18n';

export class Header {
  private theme: Theme;

  constructor() {
    this.theme = new Theme();
  }

  render(pageTitle: string): string {
    return `
      <nav class="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
        <div class="container mx-auto px-2 py-2.5">
          <div class="flex items-center">
            <button 
              id="menuBtn" 
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-16 6h16"/>
              </svg>
            </button>
            <div class="flex-1 text-center">
              <span id="page-title" class="text-lg font-bold text-orange-darker dark:text-white">
                ${pageTitle}
              </span>
            </div>
            <button 
              id="themeBtn" 
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg"
            >
              ${!this.theme.getCurrentTheme() ? this.theme.getSunIcon() : this.theme.getMoonIcon()}
            </button>
          </div>
        </div>
      </nav>
    `;
  }

  setupEventListeners() {
    const themeBtn = document.getElementById('themeBtn');
    themeBtn?.addEventListener('click', () => this.theme.toggle());
  }
}