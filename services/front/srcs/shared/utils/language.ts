import { i18n } from '../i18n';

export type Language = {
  code: string;
  name: string;
};

export class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: string;
  
  private languages: Language[] = [
    { code: 'de', name: 'Deutsch' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'nl', name: 'Nederlands' }
  ];

  private constructor() {
    this.currentLanguage = i18n.language || 'en';
  }

  static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  setLanguage(code: string) {
    if (this.languages.some(lang => lang.code === code)) {
      this.currentLanguage = code;
      i18n.changeLanguage(code);
    }
  }

  renderSelector(): string {
    const currentLang = this.languages.find(lang => lang.code === this.currentLanguage);
    
    return `
      <div class="relative inline-block text-left">
        <button
          type="button"
          id="language-selector"
          class="inline-flex items-center justify-center gap-x-2 rounded-lg bg-light-3 dark:bg-dark-2 px-3 py-2 text-sm text-light-0 dark:text-dark-0 hover:bg-light-4 dark:hover:bg-dark-2/90"
        >
          <span>${currentLang?.name}</span>
          <svg class="h-5 w-5 text-light-0 dark:text-dark-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clip-rule="evenodd" />
          </svg>
        </button>

        <div
          id="language-dropdown"
          class="hidden absolute bottom-full mb-2 left-0 z-10 w-40 origin-bottom-left rounded-lg bg-light-0 dark:bg-dark-3 shadow-lg focus:outline-none transform"
          role="menu"
        >
          <div class="py-1" role="none">
            ${this.languages.map(lang => `
              <button
                class="flex w-full items-center px-4 py-2 text-sm text-light-4 dark:text-gray-200 hover:bg-light-1 dark:hover:bg-gray-600 ${lang.code === this.currentLanguage ? 'bg-light-1 dark:bg-gray-600' : ''}"
                role="menuitem"
                data-lang="${lang.code}"
              >
                <span>${lang.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const selector = document.getElementById('language-selector');
    const dropdown = document.getElementById('language-dropdown');

    const closeDropdown = (e: Event) => {
      if (!selector?.contains(e.target as Node)) {
        dropdown?.classList.add('hidden');
        document.removeEventListener('click', closeDropdown);
      }
    };

    selector?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
      if (!dropdown?.classList.contains('hidden')) {
        document.addEventListener('click', closeDropdown);
      }
    });

    dropdown?.querySelectorAll('button[data-lang]').forEach(button => {
      button.addEventListener('click', () => {
        const langCode = button.getAttribute('data-lang');
        if (langCode) {
          this.setLanguage(langCode);
          window.location.reload();
        }
      });
    });
  }
}