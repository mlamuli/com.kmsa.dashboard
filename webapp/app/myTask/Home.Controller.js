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

				this.WindowEventsRegistered =  false

				this.DeliveryListModel = new JSONModel({});
				this.MassMode = new JSONModel({
					"MassMode": false,
					"Number": 0,
					"currentDoc": 0,
					"docsArray": []
				});

				this.getView().setModel(this.MassMode, "MassMode");


				// this.getView().byId("searchBoxBy").setSelectedId("Delivery");
				const searchInput = this.byId("SearchInput");
				searchInput.setPlaceholder("Delivery Number");

				this.ItemData = new JSONModel({});
				this.CustomerInforData = new JSONModel({});
				this.pageStates = [];
				this._pdfurl = "";
				this._content = "";

			},

			OnSearchByChanged: function (oEvent) {
				//console.log(oEvent);
				const selectedItem = oEvent.getSource().getValue();
				const searchInput = this.byId("SearchInput");
				searchInput.setPlaceholder(selectedItem + " Number");

			},

			onSearch: function (oEvent) {




				const that = this;
				const searchFilter = [];

				const _key = this.getView().byId("SearchByCombo").getSelectedKey();


				let selectedItem = oEvent.getSource().getValue();
				let searchInput = this.byId("SearchInput");

				let searchValue = searchInput.getValue();
				if (!searchValue || !/^[a-zA-Z0-9]+$/.test(searchValue)) {
					MessageToast.show("Please enter valid alphanumeric search value");
					return;
				}
				this.DeliveryListModel.setData([]);
			    this.getView().setModel(this.DeliveryListModel, "DeliveriesList");
				let idProductsTable1 = this.getView().byId("idProductsTable1");
				idProductsTable1.removeSelections(true);

				let IfrmaPDFDATA = document.getElementById('pdfData');
				if (IfrmaPDFDATA != null) {
					IfrmaPDFDATA.contentWindow.location.reload();
				}
				//IfrmaPDFDATA.contentWindow.postMessage(blob, "*");

				sap.ui.core.BusyIndicator.show();

				let filterByKey = new sap.ui.model.Filter(_key, sap.ui.model.FilterOperator.EQ, searchValue);
				searchFilter.push(filterByKey);
				let searchDataModel = this.getView().getModel("Deliveries");
				searchDataModel.read('/EtDocsSet', {
					filters: searchFilter,
					success: function (data) {
						if( data.results.length === 0){
							MessageToast.show("No Documents avialable for the search criteria");
							sap.ui.core.BusyIndicator.hide();
							IfrmaPDFDATA.contentWindow.location.reload();
							let _item = that.getView().getModel("DeliveriesItem") ;
							if  (_item  === null || _item === undefined){

							}else{
								_item.setData([]);
								that.getView().setModel([], "DeliveriesItem");
							}


							return;
						}
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

			onScreenReset : function(oEvent){
				this.DeliveryListModel.setData([]);
			    this.getView().setModel(this.DeliveryListModel, "DeliveriesList");
				let idProductsTable1 = this.getView().byId("idProductsTable1");
				idProductsTable1.removeSelections(true);

				let IfrmaPDFDATA = document.getElementById('pdfData');
				if (IfrmaPDFDATA != null) {
					IfrmaPDFDATA.contentWindow.location.reload();
				}

				let ifram_rander = this.getView().byId("ifram-rander");
				ifram_rander.setVisible(false);
			},

			onSelectionChange: function (oEvent) {
				let ifram_rander = this.getView().byId("ifram-rander");
				ifram_rander.setVisible(true);
				sap.ui.core.BusyIndicator.show();


				const oItemPath = oEvent.getSource().getSelectedContextPaths();
				if (oItemPath.length === 0) {
					MessageToast.show("Please select a delivery note");
					sap.ui.core.BusyIndicator.hide();
					return;
				}else if (oItemPath.length > 1) {

					this.MassMode.setProperty("/MassMode", true);
					this.MassMode.setProperty("/Number", oItemPath.length);
					this.MassMode.setProperty("/docsArray", oItemPath);
					this.MassMode.setProperty("/currentDoc", 0);

					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());

					MessageToast.show("Mass Mode Enabled with " + oItemPath.length + " documents selected");
					sap.ui.core.BusyIndicator.hide();
					return;
				}else if (oItemPath.length === 1)	 {
					this.MassMode.setProperty("/MassMode", false);
					this.MassMode.setProperty("/Number", oItemPath.length);
					this.MassMode.setProperty("/docsArray", oItemPath);
					this.MassMode.setProperty("/currentDoc", 0);
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					MessageToast.show("Mass Mode Disabled");

				this.onDocLoad(oItemPath);
				}




			},

			onBtnMassEnable: function (oEvent) {
				document.getElementById('pdfData').contentWindow.location.reload(true);
				let oButton = oEvent.getSource();
				let isActive = oButton.getPressed();
				if (!isActive) {
					this.getView().byId("idProductsTable1").setMode(sap.m.ListMode.MultiSelect);
					this.getView().byId("idProductsTable1").removeSelections(true);
					this.MassMode.setProperty("/MassMode", true);
					this.MassMode.setProperty("/Number", 0);
					this.MassMode.setProperty("/currentDoc", 0);
					this.MassMode.setProperty("/docsArray", []);
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					MessageToast.show("Mass Mode Enabled");




				}else {
					this.getView().byId("idProductsTable1").setMode(sap.m.ListMode.SingleSelectMaster);
					this.MassMode.setProperty("/MassMode", false);
					this.MassMode.setProperty("/Number", 0);
					this.MassMode.setProperty("/currentDoc", 0);
					this.MassMode.setProperty("/docsArray", []);
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					MessageToast.show("Mass Mode Disabled");
				}
			},

			onParkDocument: function (oEvent) {


				//this.onProcessNext();
				//Promise.all([



			},

			_parkDocument: function(oEvent) {
				const that = this;

				const lclItem = this.getView().getModel("DeliveriesItem");
				if (lclItem === null || lclItem === undefined) {
					MessageToast.show('No data to save');
					return;
				}

				sap.ui.core.BusyIndicator.show();

				setTimeout(function () {
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage("savePdf");

					//that.onProcessNext();

				}, 1000,);



			},

			onProcessNext: function () {
				//Process Next Document
				// remove current item = removeItem

				let currentDocIndex = this.MassMode.getProperty("/currentDoc");
				const previousDocIndex = currentDocIndex;
				currentDocIndex++ ;
				let _itemPath = [this.MassMode.getProperty("/docsArray")[currentDocIndex]];

				if ( _itemPath[0] === undefined ) {
					_itemPath = [this.MassMode.getProperty("/docsArray")[previousDocIndex]];
					MessageToast.show("No more documents to load");
					return;
				}
				this.MassMode.setProperty("/currentDoc", currentDocIndex);

				this.onDocLoad(_itemPath);

				const currentItem = [this.MassMode.getProperty("/docsArray")[previousDocIndex]];
				const selectedItems = this.getView().byId("idProductsTable1").getSelectedItems();
				selectedItems.forEach(function (item) {
					if (item.getBindingContextPath() === currentItem[0]) {
				     this.getView().byId("idProductsTable1").removeItem(item);
					 this.MassMode.setProperty("/Number", this.MassMode.getProperty("/Number") - 1);
					 this.MassMode.setProperty("/docsArray", this.MassMode.getProperty("/docsArray").filter(i => i !== currentItem[0]));
					 this.MassMode.setProperty("/currentDoc", previousDocIndex);

					}
				}.bind(this));


			},
			onMassNext: function (oEvent) {


				 const selectedItems = this.getView().byId("idProductsTable1").getSelectedItems();
				if (selectedItems.length === 0) {
					MessageToast.show("Please select a delivery note");
					return;
				}
				this.getView().byId("idProductsTable1").removeAllItems();
				selectedItems.forEach(function (item) {
					this.getView().byId("idProductsTable1").addItem(item);
				}.bind(this));

			},


			onDocLoad: function (oItemPath ) {
				const that = this;
				let oController = this;
				const oLclModel = this.getView().getModel("DeliveriesList").getContext(oItemPath[0]);
				this.ItemData.setData(oLclModel.getObject());

				this.getView().setModel(this.ItemData, "DeliveriesItem");


				that.PdfDataModel = this.getView().getModel("Deliveries");

				sap.ui.core.BusyIndicator.show();

				that.PdfDataModel.read("/pdfSet('" + that.ItemData.getProperty("/Vbeln") + "')", {

					success: function (data, headers) {

						//oController._content = data.Value;
						let decodedPdfContent = atob(data.Value);
						let byteArray = new Uint8Array(decodedPdfContent.length);
						for (let i = 0; i < decodedPdfContent.length; i++) {
							byteArray[i] = decodedPdfContent.charCodeAt(i);
						}
						let blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
						let IfrmaPDFDATA = document.getElementById('pdfData');
						IfrmaPDFDATA.contentWindow.postMessage(blob);
						jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

                        if (!window._kmsaMessageListenerRegistered) {
						window.addEventListener('message', function (event) {

							if (typeof event.data === "string" && event.data.indexOf("data:application/pdf;base64,") === 0) {

								if ( that.MassMode.getProperty("/MassMode") ){

							    const pdfVal = event.data.substring(28);
								const outData = {};
								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								outData.Value = pdfVal;
								outData.Gbstk = 'B' ; //Parked


								//sap.ui.core.BusyIndicator.show();

								that.PdfDataModel.create("/pdfSet", outData, {

									success: function (results) {
										sap.ui.core.BusyIndicator.hide();
										//document.getElementById('pdfData').contentWindow.location.reload(true);
										that.onProcessNext();
										MessageToast.show('Document ' + that.ItemData.getProperty("/Vbeln") + ' saved as draft');


									}.bind(this),

									error: function (err) {
										sap.ui.core.BusyIndicator.hide();
										console.log(err);
									}

								});
								} else {

								let pdfVal = event.data.substring(28);
								let outData = {};
								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								outData.Value = pdfVal;
								outData.Gbstk = 'C' ; //Completed



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
										_IfrmaPDFDATA.contentWindow.postMessage(_blob);
										jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

										that.onEmailToCustomer();

									}.bind(this),

									error: function (err) {
										sap.ui.core.BusyIndicator.hide();
										console.log(err);
									}

								});

							}


							}




						});
                        window._kmsaMessageListenerRegistered = true;
					}
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
				var lclKunag = lclItem.getProperty("/Kunag");
				var lclVkorg = lclItem.getProperty("/Vkorg");
				var lclVbeln = lclItem.getProperty("/Vbeln");

				if(lclKunag === '' || lclVkorg === '' || lclVbeln === ''){
					MessageToast.show('No data to Save');
					return;
				}

				sap.ui.core.BusyIndicator.show();

				this.getView().getModel("Deliveries").read("/EtCustomerDetailsSet(KUNAG='" + lclKunag + "',VBELN='" + lclVbeln + "',VKORG='" + lclVkorg + "')", {

					success: function (data, headers) {

						that.CustomerInforData.setData(data);
						that.getView().setModel(that.CustomerInforData, "CustomerInfor");
						that.initPopOver();
						sap.ui.core.BusyIndicator.hide();
						that.getView().getModel("DeliveriesList").setData([]);


					},
					error: function (err) {
						sap.ui.core.BusyIndicator.hide();
						console.log(err);
					}

				});



			},

			getCustomerData: function() {
				var that = this;
				var lclItem = this.getView().getModel("DeliveriesItem");
				var lclVbeln = lclItem.getProperty("/Kunag");

				sap.ui.core.BusyIndicator.show();

				this.getView().getModel("Deliveries").read("/EtCustomerDetailsSet('" + lclVbeln + "')", {

					success: function (data, headers) {

						that.CustomerInforData.setData(data);
						that.getView().setModel(that.CustomerInforData, "CustomerInfor");
						let IfrmaPDFDATA = document.getElementById('pdfData');
						IfrmaPDFDATA.contentWindow.postMessage(data);
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
						that.oDialog.close();
						MessageToast.show('Email sent to customer');
						let _IfrmaPDFDATA = document.getElementById('pdfData');
						_IfrmaPDFDATA.contentWindow.location.reload();
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

				var lclItem = this.getView().getModel("DeliveriesItem");


				if (lclItem === null || lclItem === undefined) {
					MessageToast.show('No data to save');
					return;
				}

				sap.ui.core.BusyIndicator.show();

				setTimeout(function () {
					let IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage("savePdf");
				}, 1000,);

			},


		});
	});
