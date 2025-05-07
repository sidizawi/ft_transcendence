import { LanguageManager } from '../utils/language';
import { i18n } from '../i18n';

export class Footer {
  private languageManager: LanguageManager;

  constructor() {
    this.languageManager = LanguageManager.getInstance();
  }

  render(): string {
    return `
      <footer class="bg-light-0 dark:bg-dark-4">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <div id="language-selector-container" class="w-1/4">
            ${this.languageManager.renderSelector()}
          </div>
          <div class="w-1/2 text-sm text-light-4/80 dark:text-dark-0/80 text-center">
            ${i18n.t('copyright')}
          </div>
          <div class="w-1/4"></div>
        </div>
      </footer>
    `;
  }

  setupEventListeners() {
    this.languageManager.setupEventListeners();
  }
}