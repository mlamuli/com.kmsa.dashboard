sap.ui.define([
	"./BaseController",
	 "sap/m/MessageBox",
	 "sap/base/Log",
	 "sap/ui/integration/Host"

	], function (BaseController, MessageBox, Log, Host) {
	"use strict";

	return BaseController.extend("com.kmsa.dashboard.controller.Main", {

		onInit: function () {
			var oHost = new Host({
				resolveDestination: function(sDestinationName, oCard) {
					switch (sDestinationName) {
						case "Northwind":
							return "https://services.odata.org/V3/Northwind/Northwind.svc";
							// or with a promise
							// return Promise.resolve("https://services.odata.org/V3/Northwind/Northwind.svc");
						case "NorthwindImages":
							// Simulate path to images. In real use case it will be the same as the path to 'Northwind'.
							return "../../images";
						default:
							Log.error("Unknown destination.");
						break;
					}
				}
			});

			this.getView().byId('card1').setHost(oHost);
		},
		sayHello: function () {
			MessageBox.show("Hello World!");
		}
	});
});
