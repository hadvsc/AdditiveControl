import { loadBatches, saveBatches } from "./storage.js";
import { TableFactory } from "./tableFactory.js";
import { productBadgeClass, productTypes } from "./product_types.js";
import { MonthYearPicker } from "./month_year_picker.js";
import { formatMonthYear } from "./utils.js";
import { showConfirmModal } from "./modal.js";

const batches = loadBatches();

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

	form.onsubmit = e => {
		e.preventDefault();
		const batchNumber = form.querySelector("#batchInput").value;
		const product = form.querySelector("#productInput").value;

		if (batchExists(batchNumber)) {
			alert("Lote já existe!");
			return;
		}
		onSubmit({
			batch: batchNumber,
			product: product,
			expiration: expirationPicker.getValue()
		});
	}

	return form;
}

export function initBatchesTab(container) {
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

	const form = createForm(batchData => {
		addBatch(batchData.batch, batchData.product, batchData.expiration);
		initBatchesTab(container);
	});

	const table = new TableFactory({
		columns: [
			{
				key: "batch",
				label: "Lote",
				width: "100px"
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
		onEdit: async (updatedRow, index) => {
			const key = data[index].batch;
			batches[key] = { ...updatedRow };

			saveBatches(batches);
			table.update(batches);
		},
		onDelete: async index => {
			const batch = data[index].batch;

			const message = `
				Você tem certeza que deseja remover esse registro?<br><br>
				<b>Lote:</b> ${batch}<br>
			`;
			if(await showConfirmModal(message, "Remover", "Cancelar")) {
				removeBatch(batch);
				delete data[index];
				
				table.update(data);
			}
		}
	});

	box.append(title, form, table.getElement());
	container.appendChild(box);
}