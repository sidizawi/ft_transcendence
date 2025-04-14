import { i18n } from '../i18n';

export class NotFound {
  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="text-center">
          <h1 class="text-9xl font-bold text-orange dark:text-nature">404</h1>
          <p class="mt-4 text-2xl font-semibold text-gray-800 dark:text-white">
            ${i18n.t('pageNotFound')}
          </p>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            ${i18n.t('pageNotFoundDesc')}
          </p>
          <a 
            href="/"
            class="inline-block mt-8 px-6 py-3 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
          >
            ${i18n.t('backToHome')}
          </a>
        </div>
      </div>
    `;
  }
}