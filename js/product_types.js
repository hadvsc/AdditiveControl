export const PRODUCT_TYPES = {
	"Diesel 500ml": { box_units: 20, unit_ml: 500, badge: "badge-product-diesel", cellColumn: "F" },
	"Gasolina 500ml": { box_units: 20, unit_ml: 500, badge: "badge-product-gasoline", cellColumn: "H" },
	"Gasolina 300ml": { box_units: 30, unit_ml: 300, badge: "badge-product-gasoline", cellColumn: "G" }
};

export function productTypes() {
	return Object.keys(PRODUCT_TYPES);
}

/**
 * Returns the unit volume in milliliters (mL) for a given product type.
 * If the product type is not found, returns 0.
 * @param {string} type - The product type.
 * @returns {number} - The unit volume in milliliters (mL) for the given product type.
 */
export function productUnitMl(type) {
	return PRODUCT_TYPES[type]?.unit_ml ?? 0;
}

/**
 * Returns the number of units in a box for a given product type.
 * If the product type is not found, returns 0.
 * @param {string} type - The product type.
 * @returns {number} - The number of units in a box for the given product type.
 */
export function productBoxUnits(type) {
	return PRODUCT_TYPES[type]?.box_units ?? 0;
}

/**
 * Returns the badge class name for a given product type.
 * If the product type is not found, returns an empty string.
 * @param {string} type - The product type.
 * @returns {string} - The badge class name for the given product type.
 */
export function productBadgeClass(type) {
	return PRODUCT_TYPES[type]?.badge ?? "";
}

/**
 * Returns the column letter in the spreadsheet where the product quantity should be recorded.
 * If the product type is not found, returns an empty string.
 * @param {string} type - The product type.
 * @returns {string} - The column letter in the spreadsheet where the product quantity should be recorded.
 */
export function productCellColumn(type) {
	return PRODUCT_TYPES[type]?.cellColumn ?? null;
}