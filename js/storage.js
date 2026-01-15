const ITEMS_KEY = "items";
const BATCHES_KEY = "batches";

/**
 * Carrega os itens do localStorage ou do arquivo especificado por defaultResourceUrl.
 * Se o localStorage estiver vazio, carrega os itens do arquivo especificado por defaultResourceUrl, ou retorna um objeto vazio se defaultResourceUrl for nulo.
 * 
 * @param {string} [defaultResourceUrl] - URL do arquivo de itens
 * @returns {Promise<Object>} Os itens do localStorage ou do arquivo
 */
export async function loadItems(defaultResourceUrl = null) {
	const storedItems = localStorage.getItem(ITEMS_KEY);

	if (storedItems) {
		return JSON.parse(storedItems);
	}
	if (defaultResourceUrl) {
		return await loadDefault(ITEMS_KEY, defaultResourceUrl);
	}
	return [];
	
}

export function saveItems(items) {
	localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

/**
 * Carrega os lotes do localStorage ou do arquivo especificado por defaultResourceUrl.
 * Se o localStorage estiver vazio, carrega os lotes do arquivo especificado por defaultResourceUrl, ou retorna um objeto vazio se defaultResourceUrl for nulo.
 * 
 * @param {string} [defaultResourceUrl] - URL do arquivo de lotes
 * @returns {Promise<Object>} Os lotes do registro de lotes.
 */
export async function loadBatches(defaultResourceUrl = null) {
	const storedBatches = localStorage.getItem(BATCHES_KEY);

	if (storedBatches) {
		return JSON.parse(storedBatches);
	}
	if (defaultResourceUrl) {
		return await loadDefault(BATCHES_KEY, defaultResourceUrl);
	}
	return {};
}

export function saveBatches(batches) {
	localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
}

async function loadDefault(key, defaultResource) {
	const resource = await fetch(defaultResource);
	const json = await resource.json();

	localStorage.setItem(key, JSON.stringify(json));

	return json;
}