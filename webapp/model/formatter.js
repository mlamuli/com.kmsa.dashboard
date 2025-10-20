sap.ui.define(function () {
	"use strict";

	return {
		formatValue: function (value) {
			return value && value.toUpperCase();
		},

		classStatus: function (sValue) {
			switch (sValue) {
			case "A":
				return "Open";
			case "B":
				return "Packed";
			case "C":
				return "Checked";
			case "X":
				return "Completed";
			default:
				return sValue;
			}
		}
	};
});
