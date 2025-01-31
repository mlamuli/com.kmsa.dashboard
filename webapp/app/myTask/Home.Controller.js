sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Fragment',
	"sap/m/MessageToast",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/Text",
	"sap/m/VBox",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library"

],
	function (Controller, JSONModel, Fragment, MessageToast, Label, Input, Text, VBox, Dialog, Button, mobileLibrary) {
		"use strict";


		return Controller.extend("com.kmsa.dashboard.app.myTask.Home", {
			onInit: function () {

				this._formFragments = {};

				this.DeliveryListModel = new JSONModel({});

				// this.getView().byId("searchBoxBy").setSelectedId("Delivery");
				const searchInput = this.byId("SearchInput");
				searchInput.setPlaceholder("Delivery Number");

				this.ItemData = new JSONModel({});
				this.CustomerInforData = new JSONModel({});
				this.pageStates = [];
				this._pdfurl = "";
				this._content = "";

				this.DragToast = Swal.mixin({
					toast: true,
					position: "top-end",
					showConfirmButton: true,
					confirmButtonText: "Save",
					showCancelButton: true,
					cancelButtonText: "Delete",
					didOpen: (toast) => {
						toast.onmouseenter = Swal.stopTimer;
						toast.onmouseleave = Swal.resumeTimer;
					}
				});


			},

			OnSearchByChanged: function (oEvent) {
				//console.log(oEvent);
				const selectedItem = oEvent.getSource().getValue();
				const searchInput = this.byId("SearchInput");
				searchInput.setPlaceholder(selectedItem + " Number");
			},

			onSearch: function (oEvent) {
				sap.ui.core.BusyIndicator.show();
				const that = this;
				const searchFilter = [];

				const _key = this.getView().byId("SearchByCombo").getSelectedKey();

				let selectedItem = oEvent.getSource().getValue();
				let searchInput = this.byId("SearchInput");

				let searchValue = searchInput.getValue();
				let filterByKey = new sap.ui.model.Filter(_key, sap.ui.model.FilterOperator.EQ, searchValue);
				searchFilter.push(filterByKey);
				let searchDataModel = this.getView().getModel("Deliveries");
				searchDataModel.read('/EtDocsSet', {
					filters: searchFilter,
					success: function (data) {
						that.DeliveryListModel.setData(data.results);
						that.getView().setModel(that.DeliveryListModel, "DeliveriesList");

						sap.ui.core.BusyIndicator.hide();

					}.bind(this),
					error: function (err) {
						sap.ui.core.BusyIndicator.hide();
						console.log(err);
					}
				})
			},

			onSelectionChange: function (oEvent) {
				sap.ui.core.BusyIndicator.show();
				let oController = this;
				const that = this;



				const oItemPath = oEvent.getSource().getSelectedContextPaths();
				const oLclModel = this.getView().getModel("DeliveriesList").getContext(oItemPath[0]);
				this.ItemData.setData(oLclModel.getObject());

				this.getView().setModel(this.ItemData, "DeliveriesItem");


				that.PdfDataModel = this.getView().getModel("Deliveries");

				that.PdfDataModel.read("/pdfSet('" + that.ItemData.getProperty("/Vbeln") + "')", {

					success: function (data, headers) {

						oController._content = data.Value;
						let decodedPdfContent = atob(data.Value);
						let byteArray = new Uint8Array(decodedPdfContent.length);
						for (let i = 0; i < decodedPdfContent.length; i++) {
							byteArray[i] = decodedPdfContent.charCodeAt(i);
						}
						let blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
						let IfrmaPDFDATA = document.getElementById('pdfData');
						IfrmaPDFDATA.contentWindow.postMessage(blob, "*");
						jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

						window.addEventListener('message', function (event) {

							if (typeof event.data === "string" && event.data.indexOf("data:application/pdf;base64,") === 0) {

								let pdfVal = event.data.substring(28);
								let outData = {};
								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								outData.Value = pdfVal;


								//sap.ui.core.BusyIndicator.show();

								that.PdfDataModel.create("/pdfSet", outData, {

									success: function (results) {
										sap.ui.core.BusyIndicator.hide();


										let _decodedPdfContent = atob(results.Value);
										let _byteArray = new Uint8Array(_decodedPdfContent.length);
										for (let i = 0; i < _decodedPdfContent.length; i++) {
											_byteArray[i] = _decodedPdfContent.charCodeAt(i);
										}

										let _blob = new Blob([_byteArray.buffer], { type: 'application/pdf' });
										let _IfrmaPDFDATA = document.getElementById('pdfData');
										_IfrmaPDFDATA.contentWindow.postMessage(_blob, "*");
										jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
									}.bind(this),

									error: function (err) {
										sap.ui.core.BusyIndicator.hide();
										console.log(err);
									}

								});


							}




						});




						sap.ui.core.BusyIndicator.hide();


					}.bind(this),
					error: function (err) {
						sap.ui.core.BusyIndicator.hide();
						console.log(err);
					}
				})


			},


			onEmailToCustomer: function () {
				//this.getView().byId("emailToCustomer").open();

				var that = this;
				var lclItem = this.getView().getModel("DeliveriesItem");
				var lclVbeln = lclItem.getProperty("/Kunag");

				sap.ui.core.BusyIndicator.show();

				this.getView().getModel("Deliveries").read("/EtCustomerDetailsSet('" + lclVbeln + "')", {

					success: function (data, headers) {

						that.CustomerInforData.setData(data);
						that.getView().setModel(that.CustomerInforData, "CustomerInfor");
						that.initPopOver();
						sap.ui.core.BusyIndicator.hide();
					},
					error: function (err) {
						sap.ui.core.BusyIndicator.hide();
						console.log(err);
					}

				});



			},

			async initPopOver() {
				// create dialog lazily
				this.oDialog ??= await this.loadFragment({
					name: "com.kmsa.dashboard.app.myTask.fragments.customerinfoChange"
				});

				this.oDialog.open();
			},

			onCancelCustomerInfo: function (e) {
				this.oDialog.close();
			},

			onSendEmailCustomerInfo: function (e) {
				var that = this ;
				sap.ui.core.BusyIndicator.show();

				let outData = {};
				outData.KUNAG = that.CustomerInforData.getProperty("/KUNAG");
				outData.NameOrg1 = that.CustomerInforData.getProperty("/NameOrg1");
				outData.Email = that.CustomerInforData.getProperty("/Email") ;
				outData.VBELN =  that.ItemData.getProperty("/Vbeln") ;

				if(outData.Email != ''){}
				this.getView().getModel("Deliveries").create("/EtCustomerDetailsSet", outData, {

					success: function (data, headers) {
						this.oDialog.close();
						MessageToast.show('Email sent to customer');
						sap.ui.core.BusyIndicator.hide();
					},
					error: function (err) {
						sap.ui.core.BusyIndicator.hide();
						MessageToast.show('Error while sending email to customer');
						console.log(err);
					}

				});





			},

			onDocumentSaved: function (oEvent) {

				sap.ui.core.BusyIndicator.show();

				setTimeout(function () {
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage("savePdf", "*");
				}, 1000);

			},

		});
	});
