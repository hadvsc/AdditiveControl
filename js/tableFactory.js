import { loadStyle } from "./loader_utils.js";

loadStyle("./css/custom-table.css");

export class TableFactory {

	editingIndexes = {};
	editBuffer = {};

	constructor({ columns, data, onEdit, onDelete, enableActions = true }) {
		this.columns = columns;
		this.data = data;
		this.onEdit = onEdit;
		this.onDelete = onDelete;
		this.enableActions = enableActions;

		this.table = document.createElement("table");
		this.table.className = "custom-table";

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

			this.columns.forEach(col => {
				const td = document.createElement("td");

				let value = row[col.key] ?? "";
				value = col.render ? col.render(value, row) : value

				if (isEditing && col.createEditElement) {
					const element = col.createEditElement(row, v => {
						console.log("edit", this.editBuffer, index, col.key, v);

						if (!this.editBuffer[index]) {
							this.editBuffer[index] = {};
						}
						this.editBuffer[index][col.key] = v;
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
					editBtn.textContent = "Salvar";
					editBtn.className = "btn-save";

					delBtn.textContent = "Cancelar";
					delBtn.className = "btn-cancel";

					editBtn.onclick = async () => {
						console.log("save", this.editBuffer, index);
						const inputs = tr.querySelectorAll(".edit-input");

						for (const input of inputs) {
							if (!input.checkValidity()) {
								input.reportValidity();
								return; // bloqueia o save
							}
						}
						const updatedRow = {
							...this.editBuffer[index],
						};
						delete this.editingIndexes[index];
						delete this.editBuffer[index];

						await this.onEdit(updatedRow, index);
						this.render();
					};

					delBtn.onclick = () => {
						delete this.editingIndexes[index];
						delete this.editBuffer[index];

						this.render();
					};
				} else {
					editBtn.textContent = "Editar";
					editBtn.className = "btn-edit";

					editBtn.onclick = () => {
						this.editingIndexes[index] = index;
						this.editBuffer[index] = structuredClone(row);
						this.render();
					};

					delBtn.innerHTML = `<i class="bi bi-trash"></i>`;
					delBtn.className = "btn-danger";

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
		this.editingIndexes = {};
		this.editBuffer = {};
		this.render();
	}

	getElement() {
		return this.table;
	}
}