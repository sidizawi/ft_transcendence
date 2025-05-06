import { i18n } from '../../shared/i18n';

export class Tournament {
  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('tournaments.title')}
          </h1>
          <p class="text-light-4 dark:text-dark-0 text-center mb-8">
            ${i18n.t('tournaments.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button class="w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
              ${i18n.t('tournaments.create')}
            </button>
            <button class="w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
              ${i18n.t('tournaments.join')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}