/**
 * @import ExcelJS from "exceljs";
 * @import dateFns from "date-fns";
 * @import HyperFormula from "hyperformula";
 */

import { loadScript, loadStyle } from "./loader_utils.js";

loadScript("https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js");
loadScript("https://cdn.jsdelivr.net/npm/date-fns@4.1.0/cdn.min.js");
loadScript("https://cdn.jsdelivr.net/npm/date-fns@4.1.0/locale/pt-BR/cdn.min.js");
loadScript("https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js");

loadStyle("css/excel-viewer.css");

/* ==========================================================
   PUBLIC API
========================================================== */

/**
 * Renderiza uma planilha Excel em um elemento HTML.
 * 
 * @param {HTMLElement} container - Elemento HTML que irá conter a planilha.
 * @param {File} file - Arquivo Excel que irá ser renderizado.
 * @param {string} [range] - Intervalo de células que irá ser renderizado. Ex.: "A1:C2"
 * @returns {Promise<ExcelJS.Worksheet>} - Promise que resolve com a planilha renderizada.
 */
export async function renderSheetByExcelFile(container, file, range = null) {
	return await __renderSheetByExcelFile(container, file, range);
};

/**
 * Renderiza uma planilha Excel em um elemento HTML.
 * 
 * @param {HTMLElement} container - Elemento HTML que irá conter a planilha.
 * @param {ExcelJS.Worksheet} sheet - Planilha Excel que irá ser renderizada.
 * @param {string} [range] - Intervalo de células que irá ser renderizado. Ex.: "A1:C2"
 * @returns {Promise<ExcelJS.Worksheet>} - Promise que resolve com a planilha renderizada.
 */
export async function renderSheet(container, sheet, range = null) {
	return await __renderSheet(container, sheet, range);
}

/**
 * Edita um arquivo Excel.
 * 
 * @param {File} file - Arquivo Excel que irá ser editado.
 * @param {function(ExcelJS.Workbook)} callback - Função que irá ser chamada com a planilha Excel editada.
 * 
 * @returns {Promise<void>} - Promise que resolve quando a edição for concluída.
 */

export async function editExcelFile(file, callback) {
	return await __editExcelFile(file, callback);
}

/**
 * Salva e faz o download de um arquivo Excel.
 * 
 * @param {ExcelJS.Workbook} workbook - Planilha Excel a ser salva.
 * @param {string} [fileName="planilha"] - Nome do arquivo que será salvo.
 * 
 * @returns {Promise<void>} - Promise que resolve quando o arquivo for salvo.
 */
export async function downloadExcelFile(workbook, fileName = "planilha") {
	return await __downloadWorkbook(workbook, fileName);
}

/**
 * Recalcula a planilha Excel.
 *
 * @param {ExcelJS.Worksheet} sheet - Planilha Excel que irá ser recalculada.
 * 
 * @returns {Promise<void>} - Promise que resolve quando a planilha for recalculada.
 */
export async function recalculateSheet(sheet) {
	await __recalcSheet(sheet);
}

/**
 * Converte uma data para um número serial Excel.
 *
 * @param {Date} date - Data a ser convertida.
 *
 * @returns {number} - Número serial Excel.
 */

export function dateToExcelSerial(date) {
	return __dateToExcelSerial(date);
}

/**
 * Converte um número serial Excel para uma data.
 *
 * @param {number} serial - Número serial Excel.
 *
 * @returns {Date} - Data correspondente ao número serial.
 *
 * @example
 * const date = excelSerialToDate(44256);
 * console.log(date); // Output: 2020-12-31T00:00:00.000Z
 */
export function excelSerialToDate(serial) {
	return __excelSerialToDate(serial);
}

/* ==========================================================
   CORE
========================================================== */

async function __editExcelFile(file, callback) {
	const workbook = await __loadWorkbook(file);
	callback(workbook);

	return workbook;
}

/**
 * @param {ExcelJS.Workbook} workbook
 * @param {string} [fileName="planilha"]
 * 
 * @returns {Promise<void>}
 */
async function __downloadWorkbook(workbook, fileName) {
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
	const url = URL.createObjectURL(blob);

	const downloadLink = document.createElement("a");
	downloadLink.href = url;
	downloadLink.setAttribute("download", `${fileName}.xlsx`);
	downloadLink.click();
	
	URL.revokeObjectURL(url);
}

/**
 * @param {File} file
 * @returns {Promise<ExcelJS.Workbook>}
 */
async function __loadWorkbook(file) {
	const buffer = await file.arrayBuffer();
	const workbook = new ExcelJS.Workbook();

	await workbook.xlsx.load(buffer);

	return workbook;
}


/**
 * @param {HTMLElement} container
 * @param {File} file
 * @param {string} [range]
 * @returns {Promise<ExcelJS.Worksheet>}
 */
async function __renderSheetByExcelFile(container, file, range) {
	container.classList.add("excel-viewer");
	container.innerHTML = "";

	const workbook = await __loadWorkbook(file);
	const sheet = workbook.worksheets[0];

	await __recalcSheetCore(container, sheet, range);

	return sheet;
}

async function __renderSheet(container, sheet, range) {
	container.classList.add("excel-viewer");
	container.innerHTML = "";

	await __renderSheetCore(container, sheet, range);

	return sheet;
}

async function __renderSheetCore(container, sheet, range) {
	await __recalcSheet(sheet);

	const bounds = __parseRange(range, sheet);
	const table = document.createElement("table");

	table.appendChild(__buildColGroup(sheet, bounds));
	table.appendChild(__buildHeader(bounds));
	table.appendChild(__buildBody(sheet, bounds));

	const viewport = document.createElement("div");
	viewport.className = "viewport";

	viewport.appendChild(table);
	container.appendChild(viewport);
}

/**
 * @param {ExcelJS.Cell} cell
 * @return {string} value
 */
function __getCellValueForHyperFormula(cell) {
	if (cell.formula) {
		return `=${cell.formula}`;
	}
	let value = cell.value;

	if (value && typeof value === 'object') {
		if (value.result !== undefined) {
			value = value.result;
		}
		if (value.formula !== undefined) {
			return `=${value.formula}`;
		}
	}
	return value ?? 0;
}

function __dateToExcelSerial(date) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));

  const diffMs = date.getTime() - excelEpoch.getTime();
  const diffDays = diffMs / 86400000;

  return diffDays;
}

function __excelSerialToDate(serial) {
	const utcDays = Math.ceil(serial - 25569);
	const utcValue = utcDays * 86400;
	const dateInfo = new Date(utcValue * 1000);

	const fractionalDay = serial - Math.floor(serial) + 0.0000001;
	const totalSeconds = Math.floor(86400 * fractionalDay);

	const seconds = totalSeconds % 60;
	const hours = Math.floor(totalSeconds / (60 * 60));
	const minutes = Math.floor(totalSeconds / 60) % 60;

	return new Date(
		dateInfo.getFullYear(),
		dateInfo.getMonth(),
		dateInfo.getDate(),
		hours,
		minutes,
		seconds
	);
}

/**
 * @param {ExcelJS.Worksheet} sheet
 */
async function __recalcSheet(sheet) {
	const sheetData = [];

	for (let rowNum = 0; rowNum <= sheet.dimensions.bottom; rowNum++) {
		const rowData = [];

		for (let colNum = 0; colNum <= sheet.dimensions.right; colNum++) {
			let cell = sheet.getCell(rowNum + 1, colNum + 1); // ExcelJS usa 1-based index
			let cellData = __getCellValueForHyperFormula(cell);

			rowData[colNum] = cellData;
		}
		sheetData[rowNum] = rowData;
	}
	const hf = HyperFormula.buildFromArray(sheetData, { licenseKey: 'gpl-v3' });

	for (let rowNum = 0; rowNum <= sheet.dimensions.bottom; rowNum++) {
		const row = sheet.getRow(rowNum + 1); // ExcelJS usa 1-based index

		for (let colNum = 0; colNum <= sheet.dimensions.right; colNum++) {
			let cell = row.getCell(colNum + 1); // ExcelJS usa 1-based index
			let hfVal = hf.getCellValue({ sheet: 0, row: rowNum, col: colNum });

			if (cell.value && typeof cell.value === "object") {
				if (cell !== cell.master) continue;

				if (__isDateLike(cell.value.result)) {
					hfVal = __excelSerialToDate(hfVal);
				}
				let result = { formula: cell.value.formula, result: hfVal };

				if (cell.value instanceof Date) {
					result = __excelSerialToDate(hfVal);
				}
				cell.value = result;
			}
		}
	}
}

/* ==========================================================
   RANGE
========================================================== */

function __parseRange(range, sheet) {
	if (!range) {
		return { sr: 1, er: sheet.rowCount, sc: 1, ec: sheet.columnCount };
	}
	const [a, b] = range.split(":");
	const s = __decodeCell(a);
	const e = __decodeCell(b);
	return { sr: s.row, er: e.row, sc: s.col, ec: e.col };
}

/* ==========================================================
   TABLE STRUCTURE
========================================================== */

function __buildColGroup(sheet, { sc, ec }) {
	const cg = document.createElement("colgroup");

	const rh = document.createElement("col");
	rh.style.width = "38px";
	cg.appendChild(rh);

	for (let c = sc; c <= ec; c++) {
		const col = document.createElement("col");
		const w = sheet.getColumn(c).width || 8.43;
		col.style.width = __excelWidthToPixels(w) + "px";
		cg.appendChild(col);
	}
	return cg;
}

function __buildHeader({ sc, ec }) {
	const thead = document.createElement("thead");
	const tr = document.createElement("tr");

	tr.appendChild(document.createElement("th"));

	for (let c = sc; c <= ec; c++) {
		const th = document.createElement("th");
		th.textContent = __columnLetter(c);
		tr.appendChild(th);
	}

	thead.appendChild(tr);
	return thead;
}

function __buildBody(sheet, bounds) {
	const tbody = document.createElement("tbody");
	const merges = __extractMerges(sheet, bounds);

	for (let r = bounds.sr; r <= bounds.er; r++) {
		const tr = document.createElement("tr");
		const row = sheet.getRow(r);

		if (row.height) tr.style.height = row.height + "px";

		const th = document.createElement("th");
		th.textContent = r;
		tr.appendChild(th);

		for (let c = bounds.sc; c <= bounds.ec; c++) {
			const merge = __findMerge(merges, r, c);
			if (merge && !__isMergeStart(merge, r, c)) continue;

			const td = document.createElement("td");
			const cell = row.getCell(c);
			td.textContent = __formatValue(cell);

			if (merge) {
				// console.log(cell.address, cell.value);

				td.rowSpan = merge.er - merge.sr + 1;
				td.colSpan = merge.ec - merge.sc + 1;
				for (let mr = merge.sr; mr <= merge.er; mr++)
					for (let mc = merge.sc; mc <= merge.ec; mc++)
						__applyStyle(td, sheet.getRow(mr).getCell(mc));
			} else {
				__applyStyle(td, cell);
			}
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}
	return tbody;
}

/* ==========================================================
   MERGES
========================================================== */

function __extractMerges(sheet, b) {
	return (sheet.model.merges || []).map(m => {
		const [a, c] = m.split(":");
		const s = __decodeCell(a);
		const e = __decodeCell(c);
		return { sr: s.row, er: e.row, sc: s.col, ec: e.col };
	}).filter(m =>
		m.er >= b.sr && m.sr <= b.er &&
		m.ec >= b.sc && m.sc <= b.ec
	);
}

const __findMerge = (m, r, c) =>
	m.find(x => r >= x.sr && r <= x.er && c >= x.sc && c <= x.ec);

const __isMergeStart = (m, r, c) => m.sr === r && m.sc === c;

/* ==========================================================
   VALUE FORMAT
========================================================== */

function __sanitizeExcelNumFmt(fmt) {
	return fmt ? fmt.split(";")[0] : null;
}

function __excelFmtToDateFns(fmt) {
	fmt = __sanitizeExcelNumFmt(fmt)
		.replace(/(h+[^a-zA-Z]*)(m{1,2})/gi, (_, h, m) => h + `__MIN${m.length}__`)
		.replace(/(:)(m{1,2})/gi, (_, c, m) => c + `__MIN${m.length}__`);

	fmt = fmt
		.replace(/yyyy/gi, "yyyy")
		.replace(/yy/gi, "yy")
		.replace(/mmmm/gi, "MMMM")
		.replace(/mmm/gi, "MMM")
		.replace(/mm/gi, "MM")
		.replace(/m/gi, "M")
		.replace(/dd/gi, "dd")
		.replace(/d/gi, "d")
		.replace(/hh/gi, "HH")
		.replace(/h/gi, "H")
		.replace(/ss/gi, "ss")
		.replace(/s/gi, "s");

	fmt = fmt
		.replace(/__MIN2__/g, "mm")
		.replace(/__MIN1__/g, "m");

	return fmt;
}


function __isDateLike(v) {
	return v instanceof Date || (typeof v === "string" && !isNaN(Date.parse(v)));
}

function __formatValue(cell) {
	if (!cell.value) return "";
	const fmt = cell.style?.numFmt;

	if (cell.value instanceof Date) {
		return fmt
			? dateFns.format(cell.value, __excelFmtToDateFns(fmt), { locale: dateFns.locale.ptBR })
			: cell.value.toLocaleString("pt-BR");
	}

	if (typeof cell.value === "object") {
		const r = cell.value.result;
		if (!r) return "";
		if (fmt && __isDateLike(r)) {
			return dateFns.format(
				new Date(r),
				__excelFmtToDateFns(fmt),
				{ locale: window.dateFnsLocalePtBR }
			);
		}
		return String(r);
	}

	return String(cell.value);
}

/* ==========================================================
   STYLES
========================================================== */

const EXCEL_THEME_COLORS = [
	"#FFFFFF", "#000000", "#E7E6E6", "#44546A",
	"#5B9BD5", "#ED7D31", "#A5A5A5", "#FFC000",
	"#4472C4", "#70AD47", "#0563C1", "#954F72"
];

function __applyExcelTint(c, t) {
	return Math.round(t < 0 ? c * (1 + t) : c * (1 - t) + 255 * t);
}

function __applyTint(hex, t = 0) {
	const r = __applyExcelTint(parseInt(hex.slice(1, 3), 16), t);
	const g = __applyExcelTint(parseInt(hex.slice(3, 5), 16), t);
	const b = __applyExcelTint(parseInt(hex.slice(5, 7), 16), t);
	return `rgb(${r},${g},${b})`;
}

function __applyStyle(td, cell) {
	const s = cell.style || {};
	if (s.font?.size) td.style.fontSize = s.font.size + "pt";
	if (s.font?.name) td.style.fontFamily = s.font.name;
	if (s.font?.bold) td.style.fontWeight = "bold";
	if (s.font?.italic) td.style.fontStyle = "italic";

	if (s.font?.color?.argb)
		td.style.color = "#" + s.font.color.argb.slice(2);
	else if (s.font?.color?.theme !== undefined)
		td.style.color = __applyTint(EXCEL_THEME_COLORS[s.font.color.theme], s.font.color.tint);

	if (s.fill?.fgColor?.argb)
		td.style.backgroundColor = "#" + s.fill.fgColor.argb.slice(2);
	else if (s.fill?.fgColor?.theme !== undefined)
		td.style.backgroundColor = __applyTint(EXCEL_THEME_COLORS[s.fill.fgColor.theme], s.fill.fgColor.tint);

	if (s.alignment?.horizontal) td.style.textAlign = s.alignment.horizontal;
	if (s.alignment?.vertical) td.style.verticalAlign = s.alignment.vertical;
	if (s.border) __applyBorders(td, s.border);
}

function __applyBorders(td, b) {
	const map = { thin: "1px", medium: "2px", thick: "3px" };
	for (const k of ["top", "right", "bottom", "left"]) {
		if (!b[k]) continue;
		td.style["border" + k[0].toUpperCase() + k.slice(1)] =
			`${map[b[k].style] || "1px"} solid #${b[k].color?.argb?.slice(2) || "000"}`;
	}
}

/* ==========================================================
   UTILS
========================================================== */

function __excelWidthToPixels(w) {
	return Math.trunc(w * 7 + 5);
}

function __decodeCell(ref) {
	const m = ref.match(/([A-Z]+)(\d+)/);
	return { col: __columnNumber(m[1]), row: +m[2] };
}

function __columnNumber(l) {
	return [...l].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
}

function __columnLetter(n) {
	let s = "";
	while (n) {
		const m = (n - 1) % 26;
		s = String.fromCharCode(65 + m) + s;
		n = (n - m - 1) / 26;
	}
	return s;
}