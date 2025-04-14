// import { i18n } from '../../shared/i18n';

// export class Pong {
//   render(): string {
//     return `
//       <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
//         <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
//           <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
//             ${i18n.t('games.pong.title')}
//           </h1>
//           <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
//             ${i18n.t('games.pong.description')}
//           </p>
//           <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <button class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
//               ${i18n.t('games.playVsAI')}
//             </button>
//             <button class="w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors">
//               ${i18n.t('games.playVsFriend')}
//             </button>
//           </div>
//         </div>
//       </div>
//     `;
//   }
// }


import { i18n } from '../../shared/i18n';

export class Pong {
  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.pong.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
            ${i18n.t('games.pong.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('games.playVsAI')}
            </button>
            <button class="w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors">
              ${i18n.t('games.playVsFriend')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}