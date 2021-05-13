sap.ui.define(
    [
        "sap/base/Log",
        "sap/ui/base/Object",
        "sap/m/Dialog",
        "sap/m/Input",
        "sap/m/Button",
        "sap/m/ActionSheet",
        "../clientsReader"
    ],
    (Log, Object, Dialog, Input, Button, ActionSheet, clientsReader) => {
        /**
         * @alias flp.plugins.logoninfo.util.ui.ClientSwitcher
         */
        return Object.extend("flp.plugins.logoninfo.util.ui.ClientSwitcher", {
            /**
             * Creates a new ClientSwitcher
             * @param {sap.base.i18n.ResourceBundle} oResourceBundle i18n bundle of this plugin
             * @param {sap.ushell.Container} oShellContainer the shell container
             */
            constructor(oResourceBundle, oShellContainer) {
                this._oBundle = oResourceBundle;
                this._oShellContainer = oShellContainer;
                this._bInitialized = false;
            },
            /**
             * Triggers client switch
             * @param {Object} oEvent the event
             * @public
             */
            async switchClient(oEvent) {
                const oButton = oEvent.getSource();
                await this._init();
                if (this._aClients && this._aClients.length > 0) {
                    this._switchClientByActionSheet(oButton);
                } else {
                    this._switchClientByDialog();
                }
            },
            async _init() {
                if (this._bInitialized) {
                    return;
                }
                // 1) try to retrieve client data
                try {
                    this._aClients = await clientsReader.getSystemClients();
                } catch (sError) {
                    this._aClients = [];
                    Log.error(sError);
                }
                this._bInitialized = true;
            },
            /**
             * Opens a Dialog to switch the current Logon client of the Launchpad
             * @private
             */
            _switchClientByDialog() {
                let sClient = "";

                const oDialog = new Dialog({
                    title: this._oBundle.getText("clientSwitcherDialogTitle"),
                    type: "Message",
                    content: [
                        new Input("clientInput", {
                            liveChange: oEvent => {
                                const sText = oEvent.getParameter("value");
                                const parent = oEvent.getSource().getParent();

                                parent.getBeginButton().setEnabled(sText.length === 3);
                            },
                            type: "d{3}",
                            width: "100%",
                            placeholder: this._oBundle.getText("clientInputPlaceholder"),
                            submit: oEvent => {
                                if (/\d{3}/.test(oEvent.getParameter("value"))) {
                                    sClient = sap.ui.getCore().byId("clientInput").getValue();
                                    oDialog.close();
                                }
                            }
                        })
                    ],
                    beginButton: new Button({
                        text: this._oBundle.getText("submit"),
                        enabled: false,
                        type: sap.m.ButtonType.Emphasized,
                        press: () => {
                            sClient = sap.ui.getCore().byId("clientInput").getValue();
                            oDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: this._oBundle.getText("cancel"),
                        press: () => {
                            oDialog.close();
                        }
                    }),
                    afterClose: () => {
                        oDialog.destroy();
                        if (sClient !== "") {
                            window.location.search = "sap-client=" + sClient;
                        }
                    }
                });

                oDialog.open();
            },
            /**
             * Show action sheet with all available clients from the system
             * @param {sap.m.Button} oTriggeringButton the triggering button
             */
            _switchClientByActionSheet(oTriggeringButton) {
                const aButtons = [];

                this._aClients.forEach(oClient => {
                    const sClient = this._oShellContainer.getLogonSystem().getClient();
                    aButtons.push(
                        new Button({
                            text: oClient.client + (oClient.description ? ` - ${oClient.description}` : ""),
                            press: () => {
                                window.location.search = "sap-client=" + oClient.client;
                            },
                            enabled: this._aClients.length > 1,
                            tooltip: oClient.client === sClient ? this._oBundle.getText("clientAlreadySelected") : ""
                        })
                    );
                });
                const oMenu = new ActionSheet({
                    showCancelButton: false,
                    buttons: aButtons
                });
                oMenu.openBy(oTriggeringButton);
            }
        });
    }
);
