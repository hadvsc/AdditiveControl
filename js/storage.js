const ITEMS_KEY = "items";
const BATCHES_KEY = "batches";

/**
 * Carrega os itens da contagem do localStorage.
 * Se o localStorage estiver vazio, retorna um array vazio.
 * @returns {Object} Os itens da contagem.
 */
export function loadItems() {
  return JSON.parse(localStorage.getItem(ITEMS_KEY)) || [];
}

export function saveItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

/**
 * Carrega as informa es de lote do localStorage.
 * Se o localStorage estiver vazio, retorna um objeto vazio.
 * @returns {Object} As informa es de lote.
 */
export function loadBatches() {
  return JSON.parse(localStorage.getItem(BATCHES_KEY)) || {};
}

export function saveBatches(batches) {
  localStorage.setItem(BATCHES_KEY, JSON.stringify(batches));
}