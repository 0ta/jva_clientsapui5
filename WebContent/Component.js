// define a root UI component that exposes the main view
jQuery.sap.declare("sap.ags.jvap.Component");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ui.core.routing.History");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

sap.ui.core.UIComponent.extend("sap.ags.jvap.Component", {
    metadata : {
        "name" : "JVAPrj",
        "version" : "1.1.0-SNAPSHOT",
        "library" : "sap.ags.jvap",
        "includes" : [ "css/fullScreenStyles.css", "css/jvaprjMainStyles.css" ],
        "dependencies" : {
            "libs" : [ "sap.m", "sap.me", "sap.ushell", "sap.ui.table" ],
            "components" : []
        },
		"config" : {
			resourceBundle : "i18n/messageBundle.properties",
			serviceConfig : {
				/**
				name: "xxx",
				serviceUrlHost: "https://xxx.wdf.sap.corp",
				**/
			}
		},
        routing : {
            // The default values for routes
            config : {
                "viewType" : "XML",
                "viewPath" : "sap.ags.jvap.view",
                "targetControl" : "fioriContent", // This is the control in which new views are placed
                "targetAggregation" : "pages", // This is the aggregation in which the new views will be placed
                "clearTarget" : false
            },
			routes : [
				{
					pattern : "",
					name : "blockpointanalysis",
					view : "BlockPointAnalysis"
					},
					{
			            pattern: ":all*:",
			            name: "notfound",
			            view: "NotFound"
			        }
			]
        }
    },

    /**
     * Initialize the application
     * 
     * @returns {sap.ui.core.Control} the content
     */
    createContent : function() {
        var oViewData = {
            component : this
        };

        return sap.ui.view("jvapMainViewID", {
            viewName : "sap.ags.jvap.view.Main",
            type : sap.ui.core.mvc.ViewType.XML,
            viewData : oViewData
        });
    },

    init : function() {
        // call super init (will call function "create content")
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

        // always use absolute paths relative to our own component
        // (relative paths will fail if running in the Fiori Launchpad)
        var sRootPath = jQuery.sap.getModulePath("sap.ags.jvap");

        /**
        // The service URL for the oData model
        var oServiceConfig = this.getMetadata().getConfig().serviceConfig;
        var sServiceUrl = oServiceConfig.serviceUrlHost + oServiceConfig.serviceUrlRoot;        
        **/
        
        // the metadata is read to get the location of the i18n language files later
        var mConfig = this.getMetadata().getConfig();
        this._routeMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter(), this._bRouterCloseDialogs);

        // set i18n model
        var i18nModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : [ sRootPath, mConfig.resourceBundle ].join("/")
        });
        this.setModel(i18nModel, "i18n");
        
        // Initialize router
        this.getRouter().initialize();    
    },

    exit : function() {
        this._routeMatchedHandler.destroy();
    },

    // This method lets the app can decide if a navigation closes all open dialogs
    setRouterSetCloseDialogs : function(bCloseDialogs) {
        this._bRouterCloseDialogs = bCloseDialogs;
        if (this._routeMatchedHandler) {
            this._routeMatchedHandler.setCloseDialogs(bCloseDialogs);
        }
    },

    // The following user context can be gotten from everywhere using this function.
    // e.g.) If you would like to get the data from controller, you should call this method like this.
    //       var oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
    //       var oUserContext = oComponent.getRPAUserContext();
    //       var oEmpID = oUserContext.empId;
    // firstName: {String} First name
    // lastName: {String} Last name
    // fullName: {String} Full name
    // empId: {String} I/D number
    getRPAUserContext: function() {
    	return sap.ui.getCore().getModel("praUserContext");
    },
    
    // Initialize the unified shell.
    // 1. Set user name into unified shell.
    // 2. Set appropriate URL for Home button.
    _initUnifiedShell: function() {
		var oShell = sap.ui.getCore().getElementById("rpaShell");
		oShell.setUser(new sap.ui.unified.ShellHeadUserItem({username: this.getRPAUserContext().fullName, image: "sap-icon://person-placeholder"}));
		var oShellHeadItem = new sap.ui.unified.ShellHeadItem({
            tooltip: "Home",
	        icon: "sap-icon://home",
	        press: function(){
	        	window.location.href = "./index.html";
	        }
        });
        oShell.addHeadItem(oShellHeadItem);
    }

});