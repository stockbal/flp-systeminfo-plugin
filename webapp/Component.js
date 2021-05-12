sap.ui.define(
    [
        "jquery.sap.global",
        "sap/ui/core/Component",
        "sap/m/Dialog",
        "sap/m/Input",
        "sap/m/Button",
        "sap/m/ActionSheet",
        "sap/base/Log"
    ],
    (jQuery, Component, Dialog, Input, Button, ActionSheet, Log) => {
        const ADT_CLIENT_SERVICE_URL = "/sap/bc/adt/system/clients";
        /**
         * Extract ABAP System clients from xml document into
         * array
         * @param {XMLDocument} xmlDoc xml document with clients
         * @returns {Array} array of client info objects
         */
        const getClientsFromXmlReponse = xmlDoc => {
            if (!xmlDoc || !xmlDoc.querySelectorAll) {
                return null;
            }

            const oClientList = xmlDoc.querySelectorAll("entry");
            if (!oClientList) {
                return null;
            }
            const aClients = [];
            if (oClientList && oClientList.forEach) {
                oClientList.forEach(oClientEntry => {
                    const sClientId = oClientEntry.querySelector("id").innerHTML;
                    if (sClientId === "000") {
                        return;
                    }
                    aClients.push({
                        client: sClientId,
                        description: oClientEntry.querySelector("title").innerHTML
                    });
                });
            }
            return aClients;
        };

        return Component.extend("flp.plugins.logoninfo.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * Initializes the plugin
             */
            async init() {
                const oRendererPromise = this._getRenderer();
                this._oBundle = this.getModel("i18n").getResourceBundle();

                const oRenderer = await oRendererPromise;
                this._setHeaderTitle(oRenderer);

                let sToken = "";

                try {
                    const oClientGetResponse = await this._sendRequest(ADT_CLIENT_SERVICE_URL);
                    this._bSystemHasClientService = true;
                    this._aClients = getClientsFromXmlReponse(oClientGetResponse.data) || [];
                    this._addHeaderItems(oRenderer);
                } catch (oError) {
                    Log.error(`Service '${ADT_CLIENT_SERVICE_URL}' is not reachable`);
                    this._bSystemHasClientService = false;
                    this._addHeaderItems(oRenderer);
                }

                const oFetch = await this._sendRequest("/sap/bc/adt/discovery", {
                    headers: {
                        "X-CSRF-Token": "Fetch",
                        accept: "*/*"
                    }
                });
                sToken = oFetch.request.getResponseHeader("X-CSRF-Token");

                const oQueryResult = await this._sendRequest(
                    "/sap/bc/adt/datapreview/freestyle?rowNumber=100&dataAging=true",
                    {
                        headers: {
                            "X-CSRF-Token": sToken,
                            Accept: "application/xml, application/vnd.sap.adt.datapreview.table.v1+xml"
                        },
                        method: "POST",
                        data:
                            "SELECT langu~laiso, \n" +
                            "       langu_text~sptxt \n" +
                            "  FROM t002c AS installed_langu \n" +
                            "    INNER JOIN t002 AS langu \n" +
                            "      ON installed_langu~spras = langu~spras \n" +
                            "    LEFT OUTER JOIN t002t AS langu_text \n" +
                            "      ON  langu~spras = langu_text~sprsl \n" +
                            "      AND langu_text~spras = langu~spras \n" +
                            "  ORDER BY langu~laiso"
                    }
                );
                console.log(oQueryResult.data);
            },

            _addHeaderItems(oRenderer) {
                // Add button to switch system client
                oRenderer.addHeaderEndItem(
                    "sap.m.Button",
                    {
                        id: "clientSwitcher",
                        tooltip: this._oBundle.getText("clientSwitchButton"),
                        icon: "sap-icon://it-system",
                        type: "Transparent",
                        press: !this._bSystemHasClientService
                            ? this._switchClient.bind(this)
                            : this._switchClientByActionSheet.bind(this)
                    },
                    true,
                    false
                );
                //Add custom language button to the header
                oRenderer.addHeaderEndItem(
                    "sap.m.Button",
                    {
                        id: "headerEnd",
                        tooltip: this._oBundle.getText("languageSwitchButton"),
                        icon: "sap-icon://world",
                        type: "Transparent",
                        press: this._showLanguageMenu.bind(this)
                    },
                    true,
                    false
                );
            },

            /**
             * Sets the header title of the Shell with the current system/user information
             * @param {Renderer} oRenderer - the Shell Renderer
             * @private
             */
            _setHeaderTitle(oRenderer) {
                // retrieve the current logon system
                const sLogonSystem = this._oShellContainer.getLogonSystem().getName();
                // retrieve system parameter from plugin default value
                const oPluginConfiguration = this.getComponentData().config;
                let sSystem;
                if (oPluginConfiguration) {
                    sSystem = oPluginConfiguration.SYSTEM;
                }
                // retrieve client from cookie
                const sClient = this._oShellContainer.getLogonSystem().getClient();
                // retrieve user name from ushell services
                const sUser = sap.ushell.Container.getUser().getId();

                if (sSystem && sSystem !== sLogonSystem) {
                    sSystem = sLogonSystem + " / " + sSystem;
                } else {
                    sSystem = sLogonSystem;
                }

                // finally set the combined header data
                oRenderer.setHeaderTitle(sSystem + ", " + sClient + ", " + sUser);
            },

            _switchClientByActionSheet(oEvent) {
                const oButton = oEvent.getSource();
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
                oMenu.openBy(oButton);
            },
            /**
             * Opens a Dialog to switch the current Logon client of the Launchpad
             * @private
             */
            _switchClient() {
                let sClient = "";

                const oDialog = new Dialog({
                    title: this._oBundle.getText("clientSwitcherDialogTitle"),
                    type: "Message",
                    content: [
                        new Input("clientInput", {
                            liveChange: function (oEvent) {
                                const sText = oEvent.getParameter("value");
                                const parent = oEvent.getSource().getParent();

                                parent.getBeginButton().setEnabled(sText.length === 3);
                            },
                            type: "d{3}",
                            width: "100%",
                            placeholder: this._oBundle.getText("clientInputPlaceholder"),
                            submit: function (oEvent) {
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
                        press: function () {
                            sClient = sap.ui.getCore().byId("clientInput").getValue();
                            oDialog.close();
                        }
                    }),
                    endButton: new Button({
                        text: this._oBundle.getText("cancel"),
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oDialog.destroy();
                        if (sClient !== "") {
                            window.location.search = "sap-client=" + sClient;
                        }
                    }
                });

                oDialog.open();
            },

            /**
             * On Press handler for custom language switch button
             *
             * @param {object} oEvent - event object
             * @private
             */
            _showLanguageMenu(oEvent) {
                const oButton = oEvent.getSource();
                const oMenu = new ActionSheet({
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
            _getRenderer() {
                const oDeferred = new jQuery.Deferred();

                this._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
                if (!this._oShellContainer) {
                    oDeferred.reject(
                        "Illegal state: shell container not available; this component must be executed in a unified shell runtime context."
                    );
                } else {
                    let oRenderer = this._oShellContainer.getRenderer();
                    if (oRenderer) {
                        oDeferred.resolve(oRenderer);
                    } else {
                        // renderer not initialized yet, listen to rendererCreated event
                        this._oShellContainer.attachRendererCreatedEvent(oEvent => {
                            oRenderer = oEvent.getParameter("renderer");
                            if (oRenderer) {
                                oDeferred.resolve(oRenderer);
                            } else {
                                oDeferred.reject(
                                    "Illegal state: shell renderer not available after recieving 'rendererLoaded' event."
                                );
                            }
                        });
                    }
                }
                return oDeferred.promise();
            },

            /**
             * Returns promsie to jQuery AJAX request
             * @param {string} sUrl request url
             * @param {Map} mSettings map of settings
             * @param {Object} mSettings.headers optional http headers
             * @param {string} mSettings.method request method (e.g. GET/POST/PUT)
             * @returns {Promise<Object>} promise to ajax request
             */
            _sendRequest(sUrl, { headers = {}, method = "GET", data = undefined, username = "", password = "" } = {}) {
                return new Promise((fnResolve, fnReject) => {
                    jQuery.ajax({
                        url: sUrl,
                        headers: headers,
                        method: method,
                        username,
                        password,
                        data: data,
                        success: (oData, sStatus, oXhr) => {
                            fnResolve({ data: oData, status: sStatus, request: oXhr });
                        },
                        error: (oXhr, sStatus, sError) => {
                            fnReject({ status: sStatus, error: sError });
                        }
                    });
                });
            }
        });
    }
);
