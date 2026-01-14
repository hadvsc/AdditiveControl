import { getBatchExpiration, getBatchProduct } from "./batches.js";
import { downloadExcelFile, editExcelFile, renderSheet } from "./excel-utils.js";
import { productCellColumn } from "./product_types.js";
import { loadItems } from "./storage.js";
import { loadLocalFile } from "./utils.js";

export async function initSpreadsheetTab(container) {
	const items = loadItems();
	const box = document.createElement("div");
	box.className = "box";

	const sheetTitle = document.createElement("h3");
	sheetTitle.textContent = "Planilha";

	const sheetContainer = document.createElement("div");
	sheetContainer.style.margin = "10px auto";
	sheetContainer.style.display = "flex";
	sheetContainer.style.justifyContent = "center";

	const sheetContent = document.createElement("div");
	sheetContainer.appendChild(sheetContent);

	const file = await loadLocalFile(new URL("./sheet/model.xlsx", document.baseURI));
	const workbook = await editExcelFile(file, async (workbook) => {
		const sheet = workbook.worksheets[0];
		const batches = {};

		items.forEach((row, index) => {
			const batch = row.batch;

			if (!batches[batch]) {
				batches[batch] = {
					expiration: getBatchExpiration(batch),
					product: getBatchProduct(batch),
					totalML: 0
				};
			}
			batches[batch].totalML += row.totalMl;
		});

		const orderedMap = new Map(
			Object.entries(batches)
				.sort(([a], [b]) => Number(b) - Number(a))
		);
		const parseUtcDate = (date) => {
			const [month, year] = date.split("-");
			return new Date(year, month);
		}
		let row = 6;

		for (const [batch, data] of orderedMap) {
			console.log(parseUtcDate(data.expiration));

			sheet.getCell("C" + row).value = Number(batch);
			sheet.getCell("D" + row).value = parseUtcDate(data.expiration);

			const productColumn = productCellColumn(data.product);

			if (!productColumn) {
				console.error(`Célula do produto ${data.product} não encontrado`);
				continue;
			}
			sheet.getCell(productColumn + row).value = (data.totalML / 1000);

			if (++row >= 18) {
				break;
			}
		}
		await renderSheet(sheetContent, sheet, "A1:I26");
	});

	const btn = document.createElement("button");
	btn.textContent = "Baixar planilha";
	btn.className = "btn-primary";

	btn.onclick = async () => {
		await downloadExcelFile(workbook, "Controle de Aditivo - " + new Date().toLocaleString("pt-BR").replace(/\//g, "-").replace(/,/g, "").replace(/:/g, ""));
	};

	box.append(sheetTitle, btn, sheetContainer);
	container.appendChild(box);
}