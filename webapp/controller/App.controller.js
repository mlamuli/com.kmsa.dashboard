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

], function (UIComponent, MessageToast, BaseController,Device, Controller, JSONModel, Popover, Button, library) {
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
        var oPopover = new Popover({
            showHeader: false,
            placement: PlacementType.Bottom,
            content: [
                new Button({
                    text: 'Feedback',
                    type: ButtonType.Transparent
                }),
                new Button({
                    text: 'Help',
                    type: ButtonType.Transparent
                }),
                new Button({
                    text: 'Logout',
                    type: ButtonType.Transparent
                })
            ]
        }).addStyleClass('sapMOTAPopover sapTntToolHeaderPopover');

        oPopover.openBy(event.getSource());
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
