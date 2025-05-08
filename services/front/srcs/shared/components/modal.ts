import { i18n } from "../i18n";

export class ModalManager {
	static openModal(title: string, message: string, callback?: () => void) {
		const modal = document.getElementById("modal");

		if (!modal) {
			return ;
		}

		modal.innerHTML = this.renderModal(title, message, callback !== undefined);
		modal.classList.remove('hidden');
		modal.classList.add("fixed", "inset-0", "z-50", "flex", "items-center", "justify-center", "bg-black/30", "backdrop-blur-sm");

		let closeModal = document.getElementById('closeModal');

		closeModal?.addEventListener('click', () => {
			modal.classList.add('hidden');
		})

		if (callback) {
			let continueModal = document.getElementById('continueModal');
			continueModal?.addEventListener('click', () => {
				modal.classList.add('hidden');
				callback();
			});
		}

		modal.addEventListener("click", (event) => {
			if (event.target == modal) {
				modal.classList.add('hidden');
			}
		})
	}

	static renderModal(title: string, message: string, cont: boolean) : string {
		// todo: translate
		return `
			<div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg max-w-md w-full p-6">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-2xl font-bold text-light-4 dark:text-dark-0 text-center">${title}</h2>
				</div>
				<p class="text-light-4/80 dark:text-dark-0/80 mb-6">${message}</p>
				<div class="mt-4 flex justify-end">
					${cont ? `
						<button id="continueModal" class="bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 px-5 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors mr-2">
							continue
						</button>
					` : ''}
					<button id="closeModal" class="bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 px-5 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
						${i18n.t('close')}
					</button>
				</div>
			</div>
		`;
	}
}
