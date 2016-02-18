jQuery.sap.declare("sap.ags.jvap.formatter.PercentageDisplayFormatter");
sap.ags.jvap.formatter.PercentageDisplayFormatter = {
	getPercentage : function(value, undefined) {
		if (value === "-" || value === undefined) {
			return 0;
		}
		return parseFloat(value);
	},
	getColor : function(value, undefined) {
		if (value === "-" || value === undefined) {
			return "Neutral";
		} else if (value < 20) {
			return "Error";
		} else if (value < 40) {
			return "Critical";
		}
		return "Good";
	},
	getDisplayDate : function(value) {
		try {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "MMM d,YYYY"
			}, new sap.ui.core.Locale("en-US"));
			return oDateFormat.format(value);
		} catch (err) {
			return "#N/A";
		}
	}
};