import { loadStyle } from "./loader_utils.js";

loadStyle("./css/custom-table.css");

export const ActionResponse = Object.freeze({
	SUCCESS: 0,
	SUCCESS_NO_CHANGE: 1,
	FAILED: 2,
	WAIT_FOR_NEXT_RESPONSE: 3
});

export class TableFactory {

	editingIndexes = {};
	editBuffer = {};

	constructor(className, { columns, data, onEdit, onDelete, enableActions = true }) {
		this.columns = columns;
		this.data = data;
		this.onEdit = onEdit;
		this.onDelete = onDelete;
		this.enableActions = enableActions;

		this.table = document.createElement("table");
		this.table.classList.add("custom-table");
		this.table.classList.add(className);

		this.render();
	}

	render() {
		this.table.innerHTML = "";
		this.renderHeader();
		this.renderBody();
	}

	renderHeader() {
		const thead = document.createElement("thead");
		const tr = document.createElement("tr");

		this.columns.forEach(c => {
			const th = document.createElement("th");
			th.textContent = c.label;
			th.classList.add("col-" + c.key);
			tr.appendChild(th);

			if (c.width) {
				th.style.width = c.width;
			}
		});
		if (this.enableActions) {
			const th = document.createElement("th");
			th.textContent = "Ações";
			tr.appendChild(th);
		}
		thead.appendChild(tr);
		this.table.appendChild(thead);
	}

	renderBody() {
		const tbody = document.createElement("tbody");

		this.data.forEach((row, index) => {
			const tr = document.createElement("tr");
			const isEditing = this.editingIndexes[index] === index;

			let canBeRendered = true;

			this.columns.forEach(col => {
				if (col.validate && !col.validate(row[col.key], row)) {
					canBeRendered = false; // All columns must be valid to be rendered
				}
			});

			if (!canBeRendered) return;

			const processEdit = async () => {
				/** @type {NodeListOf<HTMLInputElement>} */
				const inputs = tr.querySelectorAll(".edit-input");

				for (const input of inputs) {
					if (!input.checkValidity()) {
						input.reportValidity();
						return;
					}
				}
				const updatedRow = structuredClone(this.editBuffer[index]);
				const result = await this.onEdit(updatedRow, index, row);

				switch (result) {
					case ActionResponse.WAIT_FOR_NEXT_RESPONSE:
						// Wait for the next response
						break;
					case ActionResponse.SUCCESS:
						this.data[index] = updatedRow;
					case ActionResponse.SUCCESS_NO_CHANGE:
					case ActionResponse.FAILED:
						delete this.editingIndexes[index];
						delete this.editBuffer[index];
					break;
				}
				this.render();
			};

			this.columns.forEach(col => {
				const td = document.createElement("td");

				if(col.textAlign) {
					td.style.textAlign = col.textAlign;
				}
				let value = row[col.key] ?? "";

				if(col.render) {
					value = col.render(value, row);
				}
				if (isEditing && col.createEditElement) {
					/** @type {HTMLInputElement|HTMLSelectElement} */
					const element = col.createEditElement(row, v => {
						if (!this.editBuffer[index]) {
							this.editBuffer[index] = structuredClone(row);
						}
						this.editBuffer[index][col.key] = v;
					});

					element.addEventListener("keydown", async (/** @type {KeyboardEvent} */ e) => {
						if (e.key !== "Enter") {
							return;
						}
						e.preventDefault();

						/** @type {(HTMLInputElement|HTMLSelectElement)[]} */
						const inputs = Array.from(tr.querySelectorAll(".edit-input"));
						const nextInput = inputs[inputs.indexOf(element) + 1];

						if (!nextInput) {
							await processEdit();
							return;
						}
						nextInput.focus();
							
						if (nextInput instanceof HTMLInputElement) {
							nextInput.select();
						}
					});

					element.classList.add("edit-input");
					td.appendChild(element);
				} else {
					td.innerHTML = value;
				}

				tr.appendChild(td);
			});

			if (this.enableActions) {
				const actions = document.createElement("td");
				actions.className = "actions";

				const editBtn = document.createElement("button");
				const delBtn = document.createElement("button");

				if (isEditing) {
					editBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i><span> Salvar</span>`;
					editBtn.className = "btn-save";

					delBtn.innerHTML = `<i class="fa-solid fa-rotate-left"></i>`;
					delBtn.className = "btn-cancel";

					editBtn.onclick = async () => await processEdit();

					delBtn.onclick = () => {
						delete this.editingIndexes[index];
						delete this.editBuffer[index];

						this.render();
					};
				} else {
					editBtn.className = "btn-edit";
					editBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i><span> Editar</span>`;

					editBtn.onclick = () => {
						this.editingIndexes[index] = index;
						this.editBuffer[index] = structuredClone(row);
						this.render();
					};

					delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
					delBtn.className = "btn-delete";

					delBtn.onclick = async () => await this.onDelete(index);
				}

				const padding = document.createElement("span");
				padding.style.marginRight = "5px";

				actions.append(editBtn, padding, delBtn);
				tr.appendChild(actions);
			}

			tbody.appendChild(tr);
		});

		this.table.appendChild(tbody);
	}

	update(data) {
		this.data = data;
	}

	getElement() {
		return this.table;
	}
}