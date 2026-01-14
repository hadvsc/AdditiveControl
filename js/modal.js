const modal = document.getElementById("confirmModal");


/**
 * Mostra um modal de confirmação com uma mensagem e botões de confirmação e cancelamento.
 * 
 * Se o botão de confirmação for nulo, ele não aparecerá no modal.
 * Se o botão de cancelamento for nulo, ele também não aparecerá no modal.
 * 
 * @param {string} message - A mensagem a ser exibida no modal.
 * @param {string|null} [confirmText="Confirmar"] - O texto do botão de confirmação.
 * @param {string|null} [cancelText="Cancelar"] - O texto do botão de cancelamento.
 * 
 * @returns {Promise<boolean>} - Uma promise que resolve com true se o botão de confirmação for clicado e false se o botão de cancelamento for clicado.
 */
export function showConfirmModal(message, confirmText = "Confirmar", cancelText = "Cancelar") {
	return new Promise(resolve => {
		modal.innerHTML = `
			<div class="modal-content">
				<p>${message}</p>

				<div class="modal-actions">
					${confirmText ? `<button id="ok" class="btn-danger">${confirmText}</button>` : ""}
					${cancelText ? `<button id="cancel" class="btn-secondary">${cancelText}</button>` : ""}
				</div>
			</div>
		`;

		modal.classList.add("active");

		if(confirmText) modal.querySelector("#ok").onclick = () => close(true);
		if(cancelText) modal.querySelector("#cancel").onclick = () => close(false);

		function close(result) {
			modal.classList.remove("active");
			resolve(result);
		}
	});
}