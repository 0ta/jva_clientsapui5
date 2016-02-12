jQuery.sap.require("sap.ui.core.mvc.Controller");

sap.ui.core.mvc.Controller.extend("sap.ags.jvap.view.NotFound", {
	_oNotFoundPage: null,
	
	onInit: function() {		
		this._oView = this.getView();
		this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
		this._oRouter = this._oComponent.getRouter();
		this._oNotFoundPage = this.byId("notFoundPage");
	}

});