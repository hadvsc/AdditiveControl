const formatter = new Intl.NumberFormat('pt-BR', {
	style: 'decimal',
	minimumFractionDigits: 0, // Ensures at least two decimal places
	maximumFractionDigits: 0  // Ensures at most two decimal places
});

export function formatNumber(value) {
	return formatter.format(value);
}

export function formatMonthYear(value) {
	const [month, year] = value.split("-");
	const date = new Date(year, month - 1);

	const monthFormatted = new Intl.DateTimeFormat("pt-BR", {
		month: "short"
	})
		.format(date)
		.toLowerCase()
		.replace(".", "");

	return `${monthFormatted}/${year}`;
}

/**
 * Loads a file from the local file system.
 * 
 * @param {string} path - Path to the file to be loaded.
 * 
 * @returns {Promise<File>} - Promise that resolves with the loaded file.
 */
export async function loadLocalFile(path) {
	const response = await fetch(path);
	const blob = await response.blob();

	return new File([blob], path.split("/").pop(), { type: blob.type });
}

/**
 * Checks if two objects are deeply equal.
 *
 * @param {Object} a - The first object to compare.
 * @param {Object} b - The second object to compare.
 * @returns {boolean} True if the objects are deeply equal, false otherwise.
 * @example
 * deepEqual({a: 1, b: 2}, {a: 1, b: 2}) // true
 * deepEqual({a: 1, b: 2}, {a: 1, c: 2}) // false
 */
export function deepEqual(a, b) {
	if (a === b) return true;

	if (typeof a !== "object" || typeof b !== "object" || !a || !b)
		return false;

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);

	if (keysA.length !== keysB.length) return false;

	return keysA.every(key =>
		deepEqual(a[key], b[key])
	);
}