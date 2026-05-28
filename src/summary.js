import { getBatchExpiration, getBatchProduct } from "./batches.js";
import { getItems } from "./counting.js";
import { getProductsWithTypes, productBadgeClass, productTypes } from "./product_types.js";
import { TableFactory } from "./tableFactory.js";
import { formatMonthYear, formatNumber } from "./utils.js";

export class SummaryLoader {
	async load() {
		// TODO
	}

	async initTab(container) {
		await init(container);
	}
}

async function init(container) {
	const data = Object.values(getItems().reduce((acc, { batch, quantity, totalMl }) => {
		if (!acc[batch]) {
			acc[batch] = {
				batch: batch,
				expiration: getBatchExpiration(batch),
				product: getBatchProduct(batch),
				totalMl: 0,
				quantities: []
			};
		}

		acc[batch].totalMl += totalMl;
		acc[batch].quantities.push(quantity);
		return acc;
	}, {}));

	const gridContainer = document.createElement("div");
	gridContainer.className = "grid-items";

	const productContainer = document.createElement("div");

	for (const product of productTypes()) {
		await initProductTable(productContainer, data, product);
	}
	gridContainer.appendChild(productContainer);

	const totalContainer = document.createElement("div");
	await initSummaryTable(totalContainer, data);
	gridContainer.appendChild(totalContainer);

	container.appendChild(gridContainer);
}

const UNIT_LABELS = {
	Caixa: ["caixa", "caixas"],
	Unidade: ["frasco", "frascos"],
	Litro: ["l", "ls"],
	Mililitro: ["ml", "mls"]
};

function formatUnitTotalsForDisplay(data) {
	const totals = data.reduce((acc, { value, measure }) => {
		acc[measure] = (acc[measure] || 0) + value;
		return acc;
	}, {});

	return Object.keys(UNIT_LABELS)
		.filter(measure => totals[measure] != null)
		.map(measure => {
			const total = totals[measure];
			const [singular, plural] = UNIT_LABELS[measure];
			return `${total} ${total === 1 ? singular : plural}`;
		})
		.join(", ");
}


async function initSummaryTable(container, data) {
	const box = document.createElement("div");
	box.className = "box";
	box.style.maxWidth = "500px";
	box.style.minWidth = "210px";

	const addTitle = (text) => {
		const title = document.createElement("h2");
		title.textContent = text;
		title.style.textAlign = "center";
		title.style.textDecoration = "underline";

		box.appendChild(title);
	};

	addTitle("Resumo");

	const totalData = [];
	let total = 0;

	for (const { product, types } of getProductsWithTypes()) {
		const productData = data.filter(d => types.includes(d.product));
		const value = productData.reduce((acc, { totalMl }) => acc + totalMl, 0);

		totalData.push({
			product: `<span class="${productBadgeClass(types[0])}" style="display: block; width: 100%; height: 100%; box-sizing: border-box;">${product}</span>`,
			total: formatNumber(value / 1000) + " Litros"
		});
		total += value;
	}
	const table = new TableFactory("total-table", {
		columns: [
			{ key: "product", label: "Produto" },
			{ key: "total", label: "Quantidade" }
		],
		data: totalData,
		enableActions: false
	});
	const tableElement = table.getElement()

	const tbody = document.createElement("tbody");
	tbody.innerHTML = `<tr><td><b>Total:</b><td><span class="badge">${formatNumber(total / 1000)} Litros</span></td></tr>`

	tableElement.appendChild(tbody);
	box.appendChild(table.getElement());

	addTitle("Contagem");
	const countingData = [];

	for (const product of productTypes()) {
		const productData = data.filter(d => d.product === product);
		const unitTotals = formatUnitTotalsForDisplay(productData.map(d => d.quantities).reduce((acc, v) => acc.concat(v), []));

		countingData.push({
			product: `<span class="${productBadgeClass(product)}" style="display: block; width: 100%; height: 100%; box-sizing: border-box;">${product}</span>`,
			value: unitTotals === "" ? "<span style='color: gray'>Não contabilizado</span>" : unitTotals
		})
	}

	const countingTable = new TableFactory("counting-table", {
		columns: [
			{ key: "product", label: "Produto" },
			{ key: "value", label: "Contagem", textAlign: "left" }
		],
		data: countingData,
		enableActions: false
	});
	box.appendChild(countingTable.getElement());

	container.appendChild(box);
}

async function initProductTable(container, data, product) {
	const box = document.createElement("div");
	box.className = "box";
	box.style.maxWidth = "700px";
	box.style.minWidth = "280px";

	const title = document.createElement("h3");
	title.textContent = product;
	title.classList.add(productBadgeClass(product));
	title.style.textAlign = "center";
	title.style.textDecoration = "underline";

	box.appendChild(title);

	const productData = data.filter(d => d.product === product);

	if (productData.length > 0) {
		const table = new TableFactory("product-table", {
			columns: [
				{
					key: "batch",
					label: "Lote",
					width: "80px"
				},
				{
					key: "expiration",
					label: "Validade",
					render: v => v ? formatMonthYear(v) : "Desconhecida"
				},
				{
					key: "totalMl",
					label: "Quantidade",
					render: v => `${formatNumber(v / 1000)} Litros`
				}
			],
			data: productData,
			enableActions: false
		});
		const tableElement = table.getElement()
		const total = productData.reduce((acc, { totalMl }) => acc + totalMl, 0);

		const tbody = document.createElement("tbody");
		tbody.innerHTML = `<tr><td><b>Total:</b><td colspan=${table.columns.length - 1}><span class="badge">${formatNumber(total / 1000)} Litros</span></td></tr>`

		tableElement.appendChild(tbody);

		box.appendChild(tableElement);
	} else {
		const info = document.createElement("h3");
		info.style.textAlign = "center";
		info.style.color = "gray";

		info.textContent = "Não há registros de contagem para esse produto.";
		box.appendChild(info);
	}

	container.appendChild(box);
}