sap.ui.define([
	"sap/ui/core/Component",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/Button",
	"sap/m/ActionSheet"
], function (Component, Dialog, Label, Input, Button, ActionSheet) {

	return Component.extend("flp.plugins.logoninfo.Component", {

		metadata: {
			"manifest": "json"
		},

		/**
		 * Initializes the plugin
		 */
		init: function () {
			var rendererPromise = this._getRenderer();
			this._oBundle = this.getModel("i18n").getResourceBundle();

			rendererPromise.then(function (oRenderer) {
				this._setHeaderTitle(oRenderer);

				// Add button to switch system client
				oRenderer.addHeaderEndItem("sap.m.Button", {
					id: "clientSwitcher",
					tooltip: this._oBundle.getText("clientSwitchButton"),
					icon: "sap-icon://it-system",
					type: "Transparent",
					press: this._switchClient.bind(this)
				}, true, false);
				//Add custom language button to the header
				oRenderer.addHeaderEndItem("sap.m.Button", {
					id: "headerEnd",
					tooltip: this._oBundle.getText("languageSwitchButton"),
					icon: "sap-icon://world",
					type: "Transparent",
					press: this._showLanguageMenu.bind(this)
				}, true, false);

				// // set header title to <System, Client, Username>
				// $.get({
				// 	url: "/sap/opu/odata4/sap/ztest/default/sap/zlogoninfo_srv/0001/Logoninfo",
				// 	success: function (oData) {
				// 		if (oData && oData.value) {
				// 			var aLogonInfo = oData.value;
				// 			var oLogonInfo = aLogonInfo[0];
				// 			oRenderer.setHeaderTitle(oLogonInfo.System + ", " + oLogonInfo.Client + ", " + oLogonInfo.Username);
				// 		}
				// 	},
				// 	error: function (aError) {
				// 		// do nothing
				// 	}
				// });
			}.bind(this));
		},

		/**
		 * Sets the header title of the Shell with the current system/user information
		 * @param {Renderer} oRenderer - the Shell Renderer
		 * @private
		 */
		_setHeaderTitle: function (oRenderer) {
			// retrieve the current logon system
			var sLogonSystem = this._oShellContainer.getLogonSystem().getName();
			// retrieve system parameter from plugin default value
			var oPluginConfiguration = this.getComponentData().config;
			var sSystem;
			if (oPluginConfiguration) {
				sSystem = oPluginConfiguration.SYSTEM;
			}
			// retrieve client from cookie
			var sClient = this._oShellContainer.getLogonSystem().getClient();
			// retrieve user name from ushell services
			var sUser = sap.ushell.Container.getUser().getId();

			if (sSystem && sSystem !== sLogonSystem) {
				sSystem = sLogonSystem + " / " + sSystem;
			} else {
				sSystem = sLogonSystem;
			}

			// finally set the combined header data
			oRenderer.setHeaderTitle(sSystem + ", " + sClient + ", " + sUser);
		},

		/**
		 * Opens a Dialog to switch the current Logon client of the Launchpad
		 * @private
		 */
		_switchClient: function () {
			var sClient = "";
			var dialog = new Dialog({
				title: this._oBundle.getText("clientSwitcherDialogTitle"),
				type: "Message",
				content: [
					// new Label({
					// 	text: "Client?",
					// 	labelFor: "clientInput"
					// }),
					new Input("clientInput", {
						liveChange: function (oEvent) {
							var sText = oEvent.getParameter("value");
							var parent = oEvent.getSource().getParent();

							parent.getBeginButton().setEnabled(sText.length === 3);
						},
						type: "\d{3}",
						width: "100%",
						placeholder: this._oBundle.getText("clientInputPlaceholder"),
						submit: function (oEvent) {
							if (/\d{3}/.test(oEvent.getParameter("value"))) {
								sClient = sap.ui.getCore().byId("clientInput").getValue();
								dialog.close();
							}
						}
					})
				],
				beginButton: new Button({
					text: this._oBundle.getText("submit"),
					enabled: false,
					type: "Emphasized",
					press: function () {
						sClient = sap.ui.getCore().byId("clientInput").getValue();
						dialog.close();
					}
				}),
				endButton: new Button({
					text: this._oBundle.getText("cancel"),
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
					if (sClient !== "") {
						window.location.search = "sap-client=" + sClient;
					}
				}
			});

			dialog.open();
		},

		/**
		 * On Press handler for custom language switch button
		 *
		 * @param {object} oEvent - event object
		 * @private
		 */
		_showLanguageMenu: function (oEvent) {
			var oButton = oEvent.getSource();
			var oMenu = new ActionSheet({
				showCancelButton: false,
				buttons: [
					new Button({
						text: this._oBundle.getText("english"),
						press: function () {
							window.location.search = "sap-language=EN";
						}
					}),
					new Button({
						text: this._oBundle.getText("german"),
						press: function () {
							window.location.search = "sap-language=DE";
						}
					})
				]
			});
			oMenu.openBy(oButton);
		},

		/**
		 * Returns the shell renderer instance in a reliable way,
		 * i.e. independent from the initialization time of the plug-in.
		 * This means that the current renderer is returned immediately, if it
		 * is already created (plug-in is loaded after renderer creation) or it
		 * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
		 * before the renderer is created).
		 *
		 *  @returns {object}
		 *      a jQuery promise, resolved with the renderer instance, or
		 *      rejected with an error message.
		 */
		_getRenderer: function () {
			var that = this,
				oDeferred = new jQuery.Deferred(),
				oRenderer;

			that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
			if (!that._oShellContainer) {
				oDeferred.reject(
					"Illegal state: shell container not available; this component must be executed in a unified shell runtime context.");
			} else {
				oRenderer = that._oShellContainer.getRenderer();
				if (oRenderer) {
					oDeferred.resolve(oRenderer);
				} else {
					// renderer not initialized yet, listen to rendererCreated event
					that._onRendererCreated = function (oEvent) {
						oRenderer = oEvent.getParameter("renderer");
						if (oRenderer) {
							oDeferred.resolve(oRenderer);
						} else {
							oDeferred.reject("Illegal state: shell renderer not available after recieving 'rendererLoaded' event.");
						}
					};
					that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
				}
			}
			return oDeferred.promise();
		}
	});
});