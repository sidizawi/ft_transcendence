import { i18n } from "../i18n";

export class ModalManager {
	static openModal(title: string, message: string) {
		const modal = document.getElementById("modal");

		if (!modal) {
			return ;
		}

		modal.innerHTML = this.renderModal(title, message);
		modal.classList.remove('hidden');

		let closeModal = document.getElementById('closeModal');

		closeModal?.addEventListener('click', () => {
			modal.classList.add('hidden');
		})

		modal.addEventListener("click", (event) => {
			if (event.target != modal) {
				modal.classList.add('hidden');
			}
		})
	}

	static renderModal(title: string, message: string) : string {
		return `
			<div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center">${title}</h2>
				</div>
				<p class="text-gray-600 dark:text-gray-400 mb-6">${message}</p>
				<div class="mt-4 flex justify-end">
					<button id="closeModal" class="bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 px-5 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
					${i18n.t('close')}
					</button>
				</div>
			</div>
		`;
	}
}
