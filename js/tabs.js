import { initCountingTab } from "./counting.js";
import { initBatchesTab } from "./batches.js";
import { initSpreadsheetTab } from "./spreadsheet.js";

export const TABS = [
	{ id: "counting", label: "Contagem", loader: initCountingTab },
	{ id: "batches", label: "Registro de Lotes", loader: initBatchesTab },
	{ id: "spreadsheet", label: "Planilha", loader: initSpreadsheetTab }
];

const tabsContainer = document.querySelector(".tabs");
const content = document.getElementById("tab-content");

let activeTab = null;

function renderTabs() {
	tabsContainer.innerHTML = "";

	TABS.forEach(tab => {
		const btn = document.createElement("button");
		btn.className = "tab";
		btn.textContent = tab.label;

		btn.onclick = async () => await openTab(tab);
		tabsContainer.appendChild(btn);
	});
}

async function openTab(tab) {
	if (activeTab === tab.id) return;

	activeTab = tab.id;
	content.innerHTML = "";

	document.querySelectorAll(".tab").forEach(b =>
		b.classList.toggle("active", b.textContent === tab.label)
	);

	await tab.loader(content);
}

export function initTabs() {
	renderTabs();
	openTab(TABS[0]);
}