import { CountingLoader } from "./counting.js";
import { BatchesLoader } from "./batches.js";
import { SpreadsheetLoader } from "./spreadsheet.js";
import { SummaryLoader } from "./summary.js";

export const TABS = [
	{ id: "counting", label: "Contagem", loader: new CountingLoader() },
	{ id: "batches", label: "Registro de Lotes", loader: new BatchesLoader() },
	{ id: "summary", label: "Resumo", loader: new SummaryLoader() },
	{ id: "spreadsheet", label: "Planilha", loader: new SpreadsheetLoader() },
];

const tabsContainer = document.querySelector(".tabs");
const content = document.getElementById("tab-content");

let activeTab = null;

async function renderTabs() {
	tabsContainer.innerHTML = "";

	for (const tab of TABS) {
		await tab.loader.load();

		const btn = document.createElement("button");
		btn.className = "tab";
		btn.textContent = tab.label;

		btn.onclick = async () => await openTab(tab.id);
		tabsContainer.appendChild(btn);
	}
}

export async function openTab(tabId) {
	if (activeTab === tabId) return;

	const tab = TABS.find(t => t.id === tabId);

	if (!tab) return;

	activeTab = tab.id;
	content.innerHTML = "";

	document.querySelectorAll(".tab").forEach(b =>
		b.classList.toggle("active", b.textContent === tab.label)
	);

	await tab.loader.initTab(content);
}

export async function initTabs() {
	await renderTabs();
	await openTab(TABS[0].id);
}