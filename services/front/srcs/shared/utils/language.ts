import { i18n } from '../i18n';
import { SVGIcons } from '../../shared/components/svg';

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
          class="inline-flex items-center justify-center gap-x-2 rounded-lg bg-light-3 dark:bg-dark-1 px-3 py-2 text-sm text-light-0 dark:text-dark-4 hover:bg-light-4 dark:hover:bg-dark-0"
        >
          <span>${currentLang?.name}</span>
          ${SVGIcons.getLanguageIcon()}
        </button>

        <div
          id="language-dropdown"
          class="hidden absolute bottom-full mb-2 left-0 z-10 w-40 origin-bottom-left rounded-lg bg-light-0 dark:bg-dark-4 shadow-lg focus:outline-none transform"
          role="menu"
        >
          <div class="py-1" role="none">
            ${this.languages.map(lang => `
              <button
                class="flex w-full items-center px-4 py-2 text-sm text-light-4 dark:text-dark-0 hover:bg-light-1 dark:hover:bg-dark-3 ${lang.code === this.currentLanguage ? 'bg-light-1 dark:bg-dark-3' : ''}"
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