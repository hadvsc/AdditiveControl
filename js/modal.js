const modal = document.getElementById("confirmModal");

export function showConfirmModal(message, confirmText = "Confirmar", cancelText = "Cancelar") {
	return new Promise(resolve => {
		modal.innerHTML = `
			<div class="modal-content">
				<p>${message}</p>

				<div class="modal-actions">
					<button id="ok" class="btn-danger">${confirmText}</button>
					<button id="cancel" class="btn-secondary">${cancelText}</button>
				</div>
			</div>
		`;

		modal.classList.add("active");

		modal.querySelector("#ok").onclick = () => close(true);
		modal.querySelector("#cancel").onclick = () => close(false);

		function close(result) {
			modal.classList.remove("active");
			resolve(result);
		}
	});
}