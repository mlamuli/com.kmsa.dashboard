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
	"sap/m/library",
	"sap/ui/model//Filter"

],
	function (Controller, JSONModel, Fragment, MessageToast, Label, Input, Text, VBox, Dialog, Button, mobileLibrary, Filter) {
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

				this.DocumentAttributes = new JSONModel({
					"ID": null,
					"Status": null
				});

				this.getView().setModel(this.MassMode, "MassMode");
				this.getView().setModel(this.DocumentAttributes, "DocumentAttributes");


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


				const selectedItem = oEvent.getSource().getValue();
				const searchInput = this.byId("SearchInput");

				const searchValue = searchInput.getValue();
				if (!searchValue || !/^[a-zA-Z0-9]+$/.test(searchValue)) {
					MessageToast.show("Please enter valid alphanumeric search value");
					return;
				}
				this.DeliveryListModel.setData([]);
			    this.getView().setModel(this.DeliveryListModel, "DeliveriesList");
				const idProductsTable1 = this.getView().byId("idProductsTable1");
				idProductsTable1.removeSelections(true);


				const IfrmaPDFDATA = document.getElementById('pdfData');
				if (IfrmaPDFDATA != null) {
					IfrmaPDFDATA.contentWindow.location.reload();
				}
				//IfrmaPDFDATA.contentWindow.postMessage(blob, "*");

				sap.ui.core.BusyIndicator.show();

				const filterByKey = new sap.ui.model.Filter(_key, sap.ui.model.FilterOperator.EQ, searchValue);
				searchFilter.push(filterByKey);
				const searchDataModel = this.getView().getModel("Deliveries");
				searchDataModel.read('/EtDocsSet', {
					filters: searchFilter,
					success: function (data) {
						if ( data.results.length === 0){
							MessageToast.show("No Documents avialable for the search criteria");
							sap.ui.core.BusyIndicator.hide();
							IfrmaPDFDATA.contentWindow.location.reload();
							const _item = that.getView().getModel("DeliveriesItem") ;
							if  (_item  === null || _item === undefined){

							} else {
								_item.setData([]);
								that.getView().setModel([], "DeliveriesItem");
							}


							return;
						}
						//that.getView().setModel(new JSONModel({}), "DeliveriesList");
                        //this.getView().byId("idProductsTable1").destroyItems();
						that.DeliveryListModel.setData(data.results);



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
				const idProductsTable1 = this.getView().byId("idProductsTable1");
				idProductsTable1.removeSelections(true);

				const IfrmaPDFDATA = document.getElementById('pdfData');
				if (IfrmaPDFDATA != null) {
					IfrmaPDFDATA.contentWindow.location.reload();
				}

				const ifram_rander = this.getView().byId("ifram-rander");
				ifram_rander.setVisible(false);
			},

			onSelectionChange: function (oEvent) {
				const ifram_rander = this.getView().byId("ifram-rander");
				ifram_rander.setVisible(true);
				sap.ui.core.BusyIndicator.show();




				const oItemPath = oEvent.getSource().getSelectedContextPaths();
				if (oItemPath.length === 0) {

					//ensure filter is removed
					//const idProductsTable1 = this.getView().byId("idProductsTable1");
					const oBinding = this.getView().byId("idProductsTable1").getBinding("items");
					oBinding.filter([]);

					MessageToast.show("Please select a delivery note");
					sap.ui.core.BusyIndicator.hide();
					return;
				} else if (oItemPath.length > 1) {

					// const oFirstItemSatatus = this.getView().getModel("DeliveriesList").getContext(oItemPath[0]).getProperty("Gbstk");
					// //filter items by current selected status
					// const  _statusFilter = new Filter("Gbstk", sap.ui.model.FilterOperator.EQ, oFirstItemSatatus);
					// const oBinding = this.getView().byId("idProductsTable1").getBinding("items");
					// oBinding.filter([_statusFilter]);


					// //const oSecondItemSatatus = '';
					// for (let i = 1; i < oItemPath.length; i++) {
					// 	if (oFirstItemSatatus !== this.getView().getModel("DeliveriesList").getContext(oItemPath[i]).getProperty("Gbstk")) {
					// 		MessageToast.show("Please select documents with same status");
					// 		//

					// 		oEvent.getSource().removeSelectedItem(oEvent.getSource().getSelectedItem());
					// 		//remove current  selected items
					// 		//oEvent.getSource().setSelectedItem(oEvent.getSource().getSelectedItem(), false);
					// 		//oEvent.getSource().getSelectedItem().setSelected(false);
					// 		//oEvent.getSource().getSelectedItem().setSelected(false);


					// 		sap.ui.core.BusyIndicator.hide();
					// 		return;
					// 	}
					// }


					this.MassMode.setProperty("/MassMode", true);
					this.MassMode.setProperty("/Number", oItemPath.length);
					this.MassMode.setProperty("/docsArray", oItemPath);
					this.MassMode.setProperty("/currentDoc", 0);

					const IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());

					MessageToast.show("Mass Mode Enabled with " + oItemPath.length + " documents selected");
					sap.ui.core.BusyIndicator.hide();
					return;
				} else if (oItemPath.length === 1)	 {
					this.MassMode.setProperty("/MassMode", false);
					this.MassMode.setProperty("/Number", oItemPath.length);
					this.MassMode.setProperty("/docsArray", oItemPath);
					this.MassMode.setProperty("/currentDoc", 0);
					const IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					//MessageToast.show("Mass Mode Disabled");

					const oFirstItemSatatus = this.getView().getModel("DeliveriesList").getContext(oItemPath[0]).getProperty("Gbstk");
					//filter items by current selected status
					const  _statusFilter = new Filter("Gbstk", sap.ui.model.FilterOperator.EQ, oFirstItemSatatus);
					const oBinding = this.getView().byId("idProductsTable1").getBinding("items");
					oBinding.filter([_statusFilter]);

				this.onDocLoad(oItemPath);
				}




			},

			onBtnMassEnable: function (oEvent) {
				document.getElementById('pdfData').contentWindow.location.reload(true);
				const oButton = oEvent.getSource();
				const isActive = oButton.getPressed();
				if (!isActive) {
					this.getView().byId("idProductsTable1").setMode(sap.m.ListMode.MultiSelect);
					this.getView().byId("idProductsTable1").removeSelections(true);
					this.MassMode.setProperty("/MassMode", true);
					this.MassMode.setProperty("/Number", 0);
					this.MassMode.setProperty("/currentDoc", 0);
					this.MassMode.setProperty("/docsArray", []);
					const IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					MessageToast.show("Mass Mode Enabled");




				} else {
					this.getView().byId("idProductsTable1").setMode(sap.m.ListMode.SingleSelectMaster);
					this.MassMode.setProperty("/MassMode", false);
					this.MassMode.setProperty("/Number", 0);
					this.MassMode.setProperty("/currentDoc", 0);
					this.MassMode.setProperty("/docsArray", []);
					const IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage(this.MassMode.getData());
					//MessageToast.show("Mass Mode Disabled");
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
					const IfrmaPDFDATA = document.getElementById('pdfData');
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

			const oModel = this.getView().getModel("DeliveriesList");
			const aTableData = oModel.getData();

			// Get the indices of selected items
			const selectedIndices = selectedItems.map(item => {
				const sPath = item.getBindingContextPath();
				return parseInt(sPath.substring(sPath.lastIndexOf('/') + 1));
			});

			// Filter the data to keep only selected items
			const filteredData = aTableData.filter((item, idx) => selectedIndices.includes(idx));

			oModel.setData(filteredData); // Update the model with only selected items

			//this.getView().byId("idProductsTable1").removeAllItems();

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

						//set document attributes
						that.DocumentAttributes.setProperty("/ID", data.Vbeln);
						if ( data.Gbstk === '' ){
							data.Gbstk = 'A' ; //Open
						}
						that.DocumentAttributes.setProperty("/Status", data.Gbstk);

						const IfrmaPDFAttributes = document.getElementById('pdfData');
						IfrmaPDFAttributes.contentWindow.postMessage(that.DocumentAttributes.getData());

						//oController._content = data.Value;
						const decodedPdfContent = atob(data.Value);
						const byteArray = new Uint8Array(decodedPdfContent.length);
						for (let i = 0; i < decodedPdfContent.length; i++) {
							byteArray[i] = decodedPdfContent.charCodeAt(i);
						}
						const blob = new Blob([byteArray.buffer], { type: 'application/pdf' });
						const IfrmaPDFDATA = document.getElementById('pdfData');
						IfrmaPDFDATA.contentWindow.postMessage(blob);
						jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

                        if (!window._kmsaMessageListenerRegistered) {
						window.addEventListener('message', function (event) {

							if (typeof event.data === "string" && event.data.indexOf("data:application/pdf;base64,") === 0) {

								const outData = {};
								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								const _stat = that.ItemData.getProperty("/Gbstk");
								switch (_stat) {
									case "A":
										outData.Gbstk = 'B' ; //Parked
										break;
									case "B":
										outData.Gbstk = 'C' ; //Checked
										break;
									case "C":
										outData.Gbstk = 'X' ; //rechived
										break;
									default:
										outData.Gbstk = 'A' ; //Open
								}

							  that.DocumentAttributes.setProperty("/Status", outData.Gbstk);




								if ( that.MassMode.getProperty("/MassMode") ){

							    const pdfVal = event.data.substring(28);

								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								outData.Value = pdfVal;



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

								const pdfVal = event.data.substring(28);

								outData.Vbeln = that.ItemData.getProperty("/Vbeln");
								outData.Value = pdfVal;




								//sap.ui.core.BusyIndicator.show();

								that.PdfDataModel.create("/pdfSet", outData, {

									success: function (results) {
										sap.ui.core.BusyIndicator.hide();

										that.itemData = that.getView().getModel("DeliveriesItem");

										that.itemData.setProperty("/Gbstk", results.Gbstk);

										that.getView().getModel("DeliveriesItem").refresh();
										that.getView().getModel("DeliveriesList").refresh();

										const _decodedPdfContent = atob(results.Value);
										const _byteArray = new Uint8Array(_decodedPdfContent.length);
										for (let i = 0; i < _decodedPdfContent.length; i++) {
											_byteArray[i] = _decodedPdfContent.charCodeAt(i);
										}

										const _blob = new Blob([_byteArray.buffer], { type: 'application/pdf' });
										const _IfrmaPDFDATA = document.getElementById('pdfData');
										_IfrmaPDFDATA.contentWindow.postMessage(_blob);
										jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist

										that.DocumentAttributes.setProperty("/Status", results.Gbstk);

					   					const IfrmaPDFAttributes = document.getElementById('pdfData');
										IfrmaPDFAttributes.contentWindow.postMessage(that.DocumentAttributes.getData());
										if ( that.ItemData.getProperty("/Gbstk") === 'C' ){
										that.onEmailToCustomer();
										}

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

				const that = this;
				const lclItem = this.getView().getModel("DeliveriesItem");
				const lclKunag = lclItem.getProperty("/Kunag");
				const lclVkorg = lclItem.getProperty("/Vkorg");
				const lclVbeln = lclItem.getProperty("/Vbeln");

				if (lclKunag === '' || lclVkorg === '' || lclVbeln === ''){
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
				const that = this;
				const lclItem = this.getView().getModel("DeliveriesItem");
				const lclVbeln = lclItem.getProperty("/Kunag");

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
				const that = this ;
				sap.ui.core.BusyIndicator.show();

				const outData = {};
				outData.KUNAG = that.CustomerInforData.getProperty("/KUNAG");
				outData.NameOrg1 = that.CustomerInforData.getProperty("/NameOrg1");
				outData.Email = that.CustomerInforData.getProperty("/Email") ;
				outData.VBELN =  that.ItemData.getProperty("/Vbeln") ;

				// if (outData.Email != ''){

				// }
				this.getView().getModel("Deliveries").create("/EtCustomerDetailsSet", outData, {

					success: function (data, headers) {
						that.oDialog.close();
						MessageToast.show('Email sent to customer');
						const _IfrmaPDFDATA = document.getElementById('pdfData');
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

				const lclItem = this.getView().getModel("DeliveriesItem");


				if (lclItem === null || lclItem === undefined) {
					MessageToast.show('No data to save');
					return;
				}

				sap.ui.core.BusyIndicator.show();

				setTimeout(function () {
					const IfrmaPDFDATA = document.getElementById('pdfData');
					IfrmaPDFDATA.contentWindow.postMessage("savePdf");
				}, 1000,);

			},


		});
	});
