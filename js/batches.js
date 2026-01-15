import { loadBatches, saveBatches } from "./storage.js";
import { ActionResponse, TableFactory } from "./tableFactory.js";
import { productBadgeClass, productTypes } from "./product_types.js";
import { MonthYearPicker } from "./month_year_picker.js";
import { formatMonthYear } from "./utils.js";
import { showConfirmModal } from "./modal.js";
import { getItems, getItemsByBatch, removeItem, setItem } from "./counting.js";

let batches;

export class BatchesLoader {
	async load() {
		await onLoad();
	}

	async initTab(container) {
		await initBatchesTab(container);
	}
}

export async function onLoad() {
	batches = await loadBatches("docs/default_batches.json");
}

export function batchExists(batch) {
	return batch in batches;
}

export function getBatchExpiration(batch) {
	return batches[batch]?.expiration || null;
}

export function getBatchProduct(batch) {
	return batches[batch]?.product || null;
}

export function addBatch(batch, product, expiration) {
	batches[batch] = { "product": product, "expiration": expiration };
	saveBatches(batches);
}

export function removeBatch(batch) {
	const batchItems = getItemsByBatch(batch);
	batchItems.forEach(([index, item]) => removeItem(index));

	delete batches[batch];
	saveBatches(batches);
}

function createForm(onSubmit) {
	const form = document.createElement("form");
	form.className = "form-grid";

	form.innerHTML = `
		<div>
			<label for="batchInput">Lote:</label>
			<input type="number" id="batchInput" placeholder="Digite o número do lote"/ required>
		</div>

		<div>
		<label for="productInput">Produto:</label>
			<select id="productInput" required>
				${productTypes().map(type => `<option>${type}</option>`).join("")}
			</select>
		</div>

		<div>
			<label for="expirationInput">Validade:</label>
			<input type="text" id="expirationInput" required>
		</div>

		<div style="align-self:end;">
			<button type="submit" class="btn-primary">Adicionar</button>
		</div>
	`;

	const expirationPicker = new MonthYearPicker(form.querySelector("#expirationInput"));

	form.onsubmit = async e => {
		e.preventDefault();
		const batchNumber = form.querySelector("#batchInput").value;
		const product = form.querySelector("#productInput").value;

		if (batchExists(batchNumber)) {
			if (!await showConfirmModal(`Já existe um lote com o número <bold>${batchNumber}</bold>, Deseja substituir os dados?`, "Substituir", "Cancelar")) {
				return;
			}
		}
		onSubmit({
			batch: batchNumber,
			product: product,
			expiration: expirationPicker.getValue()
		});
	}

	return form;
}

export async function initBatchesTab(container) {
	container.innerHTML = "";

	const data = Object.entries(batches).map(([batch, info]) => ({
		batch: batch,
		product: info.product,
		expiration: info.expiration
	}));

	const box = document.createElement("div");
	box.className = "box";

	const title = document.createElement("h2");
	title.textContent = "Lotes";

	const buttonContainer = document.createElement("div");
	buttonContainer.className = "button-container";

	const btnImport = document.createElement("button");
	btnImport.textContent = "Importar Lotes";
	btnImport.className = "btn-secondary";

	btnImport.onclick = () => {
		const file = document.createElement("input");
		file.type = "file";
		file.accept = ".json";
		file.onchange = () => {
			const reader = new FileReader();
			reader.onload = () => {
				const json = JSON.parse(reader.result);
				for (const [batch, info] of Object.entries(json)) {
					if (!info.expiration || !info.product) {
						continue;
					}
					batches[batch] = info;
				}
				saveBatches(batches);
				initBatchesTab(container);
			};
			reader.readAsText(file.files[0]);
		};
		file.click();
	}

	const btnExport = document.createElement("button");
	btnExport.textContent = "Exportar Lotes";
	btnExport.className = "btn-secondary";

	btnExport.onclick = () => {
		const blob = new Blob([JSON.stringify(batches)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "batches.json";
		a.click();
		URL.revokeObjectURL(url);
	}

	const form = createForm(batchData => {
		addBatch(batchData.batch, batchData.product, batchData.expiration);
		initBatchesTab(container);
	});

	const table = new TableFactory("batches-table", {
		columns: [
			{
				key: "batch",
				label: "Lote",
				width: "100px",
				createEditElement: (row, onChange) => {
					const input = document.createElement("input");
					input.type = "number";
					input.value = row.batch;
					input.required = true;

					input.oninput = e => onChange(e.target.value);
					return input;
				}
			},
			{
				key: "product",
				label: "Produto",
				render: v => {
					const badgeClass = productBadgeClass(v);

					return `<span class="${badgeClass || ""}">${v || "Desconhecido"}</span>`
				},
				createEditElement: (row, onChange) => {
					const input = document.createElement("select");
					productTypes().forEach(type => {
						const option = new Option(type, type);
						input.add(option);
					});
					input.value = row.product;
					input.required = true;

					input.onchange = e => onChange(e.target.value);
					return input;
				}
			},
			{
				key: "expiration",
				label: "Validade",
				render: (v, row) => formatMonthYear(getBatchExpiration(row.batch)),
				createEditElement: (row, onChange) => {
					const input = document.createElement("input");
					input.type = "text";
					input.required = true;

					requestAnimationFrame(() => {
						const picker = new MonthYearPicker(input);
						picker.setValue(row.expiration);
					});

					input.onchange = e => onChange(e.target.value);
					return input;
				}
			}
		],
		data,
		onEdit: async (updatedRow, index, row) => {
			const currentBatch = row.batch;

			if (currentBatch !== updatedRow.batch) {
				if (batchExists(updatedRow.batch)) {
					const message = `
						Já existe um lote com o número <bold>${updatedRow.batch}</bold>, Deseja substituir?
					`;
					if (!await showConfirmModal(message, "Substituir", "Cancelar")) {
						return ActionResponse.WAIT_FOR_NEXT_RESPONSE;
					}
				}
				const batchItems = getItemsByBatch(currentBatch);

				if(batchItems.length > 0) {
					const message = `
						O antigo lote <bold>${currentBatch}</bold> possui <bold>${batchItems.length}</bold> registros de contagem.<br>
						Deseja mover os registros para o novo lote ou excluir os registros?
					`;
					const move = await showConfirmModal(message, "Mover", "Excluir");

					batchItems.forEach(([index, item]) => {
						if(move) {
							item.batch = updatedRow.batch;
							setItem(index, item);
						} else {
							removeItem(index);
						}
					});
				}
				removeBatch(currentBatch);
			}
			addBatch(updatedRow.batch, updatedRow.product, updatedRow.expiration);

			if (currentBatch !== updatedRow.batch) {
				// If the batch number was changed, we need to remove the old row and add the new one to the table
				table.update(Object.entries(batches).map(([batch, info]) => ({
					batch: batch,
					product: info.product,
					expiration: info.expiration
				})));

				return ActionResponse.SUCCESS_NO_CHANGE;
			}

			return ActionResponse.SUCCESS;
		},
		onDelete: async index => {
			const batch = data[index].batch;
			const message = `
				Você tem certeza que deseja remover esse registro?<br><br>
				<b>Lote:</b> ${batch}<br><br>
				<span style="color: red;">ATENÇÃO: Todos os registros de contagem deste lote também serão removidos!</span><br>
			`;
			if (await showConfirmModal(message, "Remover", "Cancelar")) {
				removeBatch(batch);
				data.splice(index, 1);

				table.update(data);
				table.render();
			}
		}
	});

	const buttonClear = document.createElement("button");
	buttonClear.textContent = "Limpar Lotes";
	buttonClear.className = "btn-danger";

	buttonClear.onclick = async () => {
		if (await showConfirmModal("Tem certeza que deseja limpar os lotes?")) {
			batches = {};
			saveBatches(batches);
			table.update([]);
			table.render();
		}
	}

	buttonContainer.append(btnImport, btnExport, buttonClear);

	box.append(title, buttonContainer, form, table.getElement());
	container.appendChild(box);
}