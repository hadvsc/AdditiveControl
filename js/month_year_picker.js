export class MonthYearPicker {
	/**
	 * Constructor for MonthYearPicker.
	 * @param {HTMLInputElement} input - The input element that will be used to display the month and year picker.
	 * @param {Object} [options] - Optional configuration options.
	 * @param {Date} [options.defaultDate] - The default date to display in the picker.
	 * @param {function(Date, Date[]):void} [options.onChange] - Callback to be called when the selected date changes.
	 */
	constructor(input, options = {}) {
		this.input = input;

		this.options = {
			defaultDate: options.defaultDate ?? null,
			onChange: options.onChange ?? null
		};
		this.init();
	}

	init() {
		this.fp = flatpickr(this.input, {
			locale: "pt",
			allowInput: false,
			disableMobile: true,

			plugins: [
				new monthSelectPlugin({
					shorthand: true,           // Jan, Fev, Mar
					dateFormat: "m-Y",         // valor real
					altFormat: "M/Y"           // <<< mmm/YYYY
				})
			],
			altInput: true,
			altFormat: "M/Y",
			dateFormat: "m-Y",

			onChange: (selectedDates, dateStr) => {
				if (this.options.onChange) {
					this.options.onChange(dateStr, selectedDates);
				}
			}
		});

		if (this.options.defaultDate) {
			this.fp.setDate(this.options.defaultDate);
		}
	}

	/**
	 * Returns the current value of the month and year picker.
	 * The value is in the format "YYYY-MM".
	 * @returns {string} The current value of the month and year picker.
	 */
	getValue() {
		return this.fp.input.value; // YYYY-MM
	}

	setValue(value) {
		this.fp.setDate(value, true);
	}

	clear() {
		this.fp.clear();
	}

	destroy() {
		this.fp.destroy();
	}
}