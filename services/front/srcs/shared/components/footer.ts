import { LanguageManager } from '../utils/language';
import { i18n } from '../i18n';

export class Footer {
  private languageManager: LanguageManager;

  constructor() {
    this.languageManager = LanguageManager.getInstance();
  }

  render(): string {
    return `
      <footer class="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <div id="language-selector-container" class="w-1/4">
            ${this.languageManager.renderSelector()}
          </div>
          <div class="w-1/2 text-sm text-gray-600 dark:text-gray-400 text-center">
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