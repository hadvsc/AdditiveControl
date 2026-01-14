import { loadItems, saveItems } from "./storage.js";
import { TableFactory } from "./tableFactory.js";
import { productBadgeClass, productBoxUnits, productUnitMl } from "./product_types.js";
import { getBatchExpiration, getBatchProduct } from "./batches.js";
import { formatMonthYear, formatNumber } from "./utils.js";
import { showConfirmModal } from "./modal.js";

let items = [];
let countingTable;

const UNIT_MEASURES = {
	"Unidade": (type, units) => units * productUnitMl(type),
	"Caixa": (type, units) => units * productBoxUnits(type) * productUnitMl(type),
	"Mililitro": (type, units) => units,
	"Litro": (type, units) => units * 1000
};

function unitMeasures() {
	return Object.keys(UNIT_MEASURES);
}

function calculateMlByMeasure(type, units, measure) {
	return UNIT_MEASURES[measure](type, units);
}

function createForm(onSubmit) {
	const form = document.createElement("form");
	form.className = "form-grid";

	form.innerHTML = `
		<div>
			<label for="batch">Lote:</label>
			<input type="number" name="batch" placeholder="Lote" required>
		</div>

		<div>
			<label for="measure">Unidade de Medida:</label>
			<select name="measure" required>
				${unitMeasures().map(measure => `<option>${measure}</option>`).join("")}
			</select>
		</div>

		<div>
			<label for="quantity">Quantidade:</label>
			<input type="number" name="quantity" placeholder="Quantidade" required>
		</div>

		<div style="align-self:end;">
			<button type="submit" class="btn-primary">Adicionar</button>
		</div>
	`;

	form.onsubmit = e => {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(form).entries());

		onSubmit({
			batch: data.batch,
			quantity: {
				value: Number(data.quantity),
				measure: data.measure
			},
			totalMl: calculateMlByMeasure(getBatchProduct(data.batch), Number(data.quantity), data.measure)
		});

		form.reset();
	};

	return form;
}

export function initCountingTab(container) {
	container.innerHTML = "";
	items = loadItems();

	const box = document.createElement("div");
	box.className = "box";

	const title = document.createElement("h2");
	title.textContent = "Contagem";

	const form = createForm(item => {
		items.push(item);
		saveItems(items);
		countingTable.update(items);
	});

	countingTable = new TableFactory({
		columns: [
			{
				key: "batch",
				label: "Lote",
				width: "80px"
			},
			{
				key: "type",
				label: "Produto",
				render: (v, row) => {
					const product = getBatchProduct(row.batch);
					const badgeClass = product ? productBadgeClass(product) : "";

					return `<span class="${badgeClass}">${product || "Desconhecido"}</span>`;
				}
			},
			{
				key: "expiration",
				label: "Validade",
				render: (v, row) => {
					const expiration = getBatchExpiration(row.batch);
					return expiration ? formatMonthYear(expiration) : "Desconhecida";
				}
			},
			{
				key: "quantity",
				label: "Quantidade",
				render: v => v.value + " " + v.measure + (v.value > 1 ? "s" : ""),
				createEditElement: (row, onChange) => {
					const input = document.createElement("input");
					input.type = "number";
					input.value = row.quantity.value;
					input.min = 1;
					input.required = true;

					input.oninput = e => {
						const data = { ...row.quantity };
						data.value = e.target.value;

						onChange(data);
					};

					return input;
				}
			},
			{
				key: "totalMl",
				label: "Total (ml)",
				render: v => `<span class="badge">${formatNumber(v)} ml</span>`
			}
		],
		data: items,
		onEdit: async (updatedRow, index) => {
			const data = items[index];

			data.quantity.value = updatedRow.quantity.value;
			data.totalMl = calculateMlByMeasure(
				getBatchProduct(data.batch),
				data.quantity.value,
				data.quantity.measure
			);
			saveItems(items);
		},
		onDelete: async index => {
			const data = items[index];
			const message = `
				Você tem certeza que deseja remover esse registro?<br><br>
				<b>Lote:</b> ${data.batch}<br>
				<b>Quantidade:</b> ${data.quantity.value} ${data.quantity.measure + (data.quantity.value > 1 ? "s" : "")}<br>
			`;

			if(await showConfirmModal(message, "Remover", "Cancelar")) {
				items.splice(index, 1);
				saveItems(items);

				countingTable.update(items);
			}
		}
	});

	box.append(title, form, countingTable.getElement());
	container.appendChild(box);
}