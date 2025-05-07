import { i18n } from '../i18n';

export class NotFound {
  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="text-center">
          <h1 class="text-9xl font-bold text-light-3 dark:text-dark-1">404</h1>
          <p class="mt-4 text-2xl font-semibold text-light-4 dark:text-dark-0">
            ${i18n.t('pageNotFound')}
          </p>
          <p class="mt-2 text-light-4/80 dark:text-dark-0/80">
            ${i18n.t('pageNotFoundDesc')}
          </p>
          <a 
            href="/"
            class="inline-block mt-8 px-6 py-3 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors"
          >
            ${i18n.t('backToHome')}
          </a>
        </div>
      </div>
    `;
  }
}