import { loadItems, saveItems } from "./storage.js";
import { ActionResponse, TableFactory } from "./tableFactory.js";
import { productBadgeClass, productBoxUnits, productUnitMl } from "./product_types.js";
import { batchExists, getBatchExpiration, getBatchProduct } from "./batches.js";
import { formatMonthYear, formatNumber } from "./utils.js";
import { showConfirmModal } from "./modal.js";
import { openTab } from "./tabs.js";

let items;
let countingTable;

export class CountingLoader {
	async load() {
		await onLoad();
	}

	async initTab(container) {
		await initCountingTab(container);
	}
}

export async function onLoad() {
	items = await loadItems();
}

export function getItems() {
	return items;
}

export function getItemsByBatch(batch) {
	const result = [];
	items.forEach((item, index) => {
		if (item.batch === batch) {
			result.push([index, item]);
		}
	});
	return result;
}

export function setItem(index, item) {
	items[index] = item;
	saveItems(items);
}

export function removeItem(index) {
	delete items[index];
	saveItems(items.filter(item => item !== undefined));
}

const UNIT_MEASURES = {
	"Unidade": {
		aliases: ["uni", "und", "un"],
		calculateMl: (type, units) => units * productUnitMl(type)
	},
	"Caixa": {
		aliases: ["box", "cx"],
		calculateMl: (type, units) => units * productBoxUnits(type) * productUnitMl(type)
	},
	"Mililitro": {
		aliases: ["ml"],
		calculateMl: (type, units) => units
	},
	"Litro": {
		aliases: ["l"],
		calculateMl: (type, units) => units * 1000
	}
};

function unitMeasures() {
	return Object.keys(UNIT_MEASURES);
}

function calculateMlByMeasure(type, units, measure) {
	return UNIT_MEASURES[measure]?.calculateMl(type, units) ?? 0;
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

	form.onsubmit = async e => {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(form).entries());

		if (!batchExists(data.batch)) {
			if (await showConfirmModal(`Lote <bold>${data.batch}</bold> não existe, deseja cria-lo?`, "Sim", "Nao")) {
				await openTab("batches");
			}
			return;
		}

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

function parseMeasureInput(text) {
	const match = text
		.trim()
		.match(/^(\d+(?:[.,]\d+)?)(?:\s*([a-zç]+))?$/i);

	if (!match) {
		throw new Error("Digite um número, com unidade opcional. Ex: 1, 1 unidade, 2 caixa.");
	}
	const value = Number(match[1].replace(",", "."));

	if (isNaN(value)) {
		throw new Error("Número inválido.");
	}

	if (!match[2]) {
		return { value, measure: null };
	}

	const inputUnit = match[2].toLowerCase();

	for (const [measure, { aliases }] of Object.entries(UNIT_MEASURES)) {
		const singular = measure.toLowerCase();
		const plural = singular + "s";

		if (inputUnit === singular || inputUnit === plural || aliases.includes(inputUnit)) {
			return { value, measure };
		}
	}
	throw new Error("Unidade medida '${inputUnit}' inválida.");
}

export async function initCountingTab(container) {
	container.innerHTML = "";

	const box = document.createElement("div");
	box.className = "box";

	const title = document.createElement("h2");
	title.textContent = "Contagem";

	countingTable = new TableFactory("counting-table", {
		columns: [
			{
				key: "batch",
				label: "Lote",
				width: "80px",
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
				key: "type",
				label: "Produto",
				render: (v, row) => {
					const product = getBatchProduct(row.batch);
					const badgeClass = product ? productBadgeClass(product) : "";
					return `<span class="${badgeClass}">${product || "Desconhecido"}</span>`;
				},
				// validate: (v, row) => !!getBatchProduct(row.batch)
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
					input.type = "text";
					input.value = row.quantity.value + " " + row.quantity.measure + (row.quantity.value > 1 ? "s" : "");
					input.required = true;


					input.oninput = e => {
						e.target.setCustomValidity("");
						e.target.classList.remove("invalid");
						let parsed;

						try {
							parsed = parseMeasureInput(e.target.value);
						} catch (error) {
							if (error.message) {
								e.target.setCustomValidity(error.message);
								e.target.classList.add("invalid");
							}
						}

						if(parsed) {
							onChange({
								value: parsed.value,
								measure: parsed.measure ?? row.quantity.measure
							});
						}
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
			if (!batchExists(updatedRow.batch)) {
				await showConfirmModal(`Não existe um lote com o número: ${updatedRow.batch}.`, "Ok", null);
				return ActionResponse.WAIT_FOR_NEXT_RESPONSE;
			}
			updatedRow.totalMl = calculateMlByMeasure(
				getBatchProduct(updatedRow.batch),
				updatedRow.quantity.value,
				updatedRow.quantity.measure
			);
			items[index] = updatedRow;
			saveItems(items);

			return ActionResponse.SUCCESS;
		},
		onDelete: async index => {
			const data = items[index];
			const message = `
				Você tem certeza que deseja remover esse registro?<br><br>
				<b>Lote:</b> ${data.batch}<br>
				<b>Quantidade:</b> ${data.quantity.value} ${data.quantity.measure + (data.quantity.value > 1 ? "s" : "")}<br>
			`;

			if (await showConfirmModal(message, "Remover", "Cancelar")) {
				items.splice(index, 1);
				saveItems(items);

				countingTable.update(items);
				countingTable.render();
			}
		}
	});

	const form = createForm(item => {
		items.push(item);
		saveItems(items);

		countingTable.update(items);
		countingTable.render();
	});

	const buttonContainer = document.createElement("div");
	buttonContainer.className = "button-container";

	const buttonClear = document.createElement("button");
	buttonClear.textContent = "Limpar contagem";
	buttonClear.className = "btn-danger";
	buttonClear.onclick = async () => {
		if (await showConfirmModal("Tem certeza que deseja limpar a contagem de aditivos?")) {
			items = [];
			saveItems(items);
			countingTable.update(items);
			countingTable.render();
		}
	};

	const buttonPrint = document.createElement("button");
	buttonPrint.textContent = "Imprimir Folha de Contagem";
	buttonPrint.className = "btn-print";
	buttonPrint.onclick = () => {
		const pdfPath = "docs/folha_contagem.pdf";
		const printWindow = window.open(pdfPath);

		printWindow.addEventListener("load", () => {
			printWindow.focus();
			printWindow.print();
		});
	};

	buttonContainer.append(buttonClear, buttonPrint);

	box.append(title, buttonContainer, form, countingTable.getElement());
	container.appendChild(box);
}