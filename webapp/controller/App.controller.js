sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/m/MessageToast",
	"./BaseController",
	"sap/ui/Device",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Popover",
	"sap/m/Button",
	"sap/m/library"

], function (UIComponent, MessageToast, BaseController, Device, Controller, JSONModel, Popover, Button, library) {
	"use strict";
	var ButtonType = library.ButtonType,
		PlacementType = library.PlacementType;
	return BaseController.extend("com.kmsa.dashboard.controller.App", {
		onInit: function () {
			this.router = UIComponent.getRouterFor(this);
			this.toolPage = this.byId('toolPage');
			this.toolPage.setSideExpanded(false);
			//this._setToggleButtonTooltip(!Device.system.desktop);
		},

		handleUserNamePress: function (event) {
			$.ajax({
				type: "GET",
				url: "/sap/public/bc/icf/logoff",  //Clear SSO cookies: SAP Provided service to do that
			}).done(function (data) { //Now clear the authentication header stored in the browser
				if (!document.execCommand("ClearAuthenticationCache")) {
					//"ClearAuthenticationCache" will work only for IE. Below code for other browsers
					$.ajax({
						type: "GET",
						url: "/sap/public/bc/icf/logoff", //any URL to a Gateway service
						username: '', //dummy credentials: when request fails, will clear the authentication header
						password: '',
						statusCode: {
							401: function () {
								//This empty handler function will prevent authentication pop-up in chrome/firefox
							}
						},
						error: function () {
							//alert('reached error of wrong username password')
						}
					});
				}
			});
			var myVar = setInterval(function (oEvent) {
				//window.location.replace("https://prfioci00d.mobs.int:8001/sap/bc/ui5_ui5/sap/zdelv_note_sign/index.html?sap-client=110&sap-language=EN");
				let url = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/sap/bc/ui5_ui5/sap/zdelv_note_sign/index.html?sap-client=110&sap-language=EN";
				window.location.replace(url);
			}, 100);
		},


		onMenuButtonPress: function () {
			//let toolPage = this.byId('toolPage');
			this.toolPage.setSideExpanded(!this.toolPage.getSideExpanded());
		},
		onItemSelect: function (ev) {
			let item = ev.getParameter('item').getKey();
			this.router.navTo(item);
			// MessageToast.show(`${item} Page`);
		}
	});
});
