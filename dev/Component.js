import ObjectPath from "sap/base/util/ObjectPath";
import Component from "sap/ui/core/Component";
import ClientSwitcher from "./util/ui/ClientSwitcher";
import LanguageSwitcher from "./util/ui/LanguageSwitcher";

/**
 * @alias flp.plugins.logoninfo.Component
 * @extends sap.ui.core.Component
 */
export default class PluginComponent extends Component {
    metadata = {
        manifest: "json"
    };

    /**
     * Initializes the plugin
     */
    async init() {
        const oRendererPromise = this._getRenderer();
        this._oBundle = this.getModel("i18n").getResourceBundle();

        const oRenderer = await oRendererPromise;
        this._setHeaderTitle(oRenderer);
        this._oClientSwitcher = new ClientSwitcher(this._oBundle, this._oShellContainer);
        this._oLanguageSwitcher = new LanguageSwitcher(this._oBundle, this._oShellContainer);
        this._addHeaderItems(oRenderer);
    }

    _addHeaderItems(oRenderer) {
        // Add button to switch system client
        oRenderer.addHeaderEndItem(
            "sap.m.Button",
            {
                id: "clientSwitcher",
                tooltip: this._oBundle.getText("clientSwitchButton"),
                icon: "sap-icon://it-system",
                type: "Transparent",
                press: oEvent => this._oClientSwitcher.switchClient(oEvent)
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
                press: oEvent => this._oLanguageSwitcher.switchLanguage(oEvent)
            },
            true,
            false
        );
    }

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
        const sUser = this._oShellContainer.getUser().getId();

        if (sSystem && sSystem !== sLogonSystem) {
            sSystem = sLogonSystem + " / " + sSystem;
        } else {
            sSystem = sLogonSystem;
        }

        // finally set the combined header data
        oRenderer.setHeaderTitle(sSystem + ", " + sClient + ", " + sUser);
    }

    /**
     * Returns the shell renderer instance in a reliable way,
     * i.e. independent from the initialization time of the plug-in.
     * This means that the current renderer is returned immediately, if it
     * is already created (plug-in is loaded after renderer creation) or it
     * listens to the &quot;rendererCreated&quot; event (plug-in is loaded
     * before the renderer is created).
     *
     *  @returns {object}
     *      a $ promise, resolved with the renderer instance, or
     *      rejected with an error message.
     */
    _getRenderer() {
        this._oShellContainer = ObjectPath.get("sap.ushell.Container");
        return new Promise((resolve, reject) => {
            if (!this._oShellContainer) {
                reject(
                    "Illegal state: shell container not available; this component must be executed in a unified shell runtime context."
                );
            } else {
                let oRenderer = this._oShellContainer.getRenderer();
                if (oRenderer) {
                    resolve(oRenderer);
                } else {
                    // renderer not initialized yet, listen to rendererCreated event
                    this._oShellContainer.attachRendererCreatedEvent(oEvent => {
                        oRenderer = oEvent.getParameter("renderer");
                        if (oRenderer) {
                            resolve(oRenderer);
                        } else {
                            reject(
                                "Illegal state: shell renderer not available after recieving 'rendererLoaded' event."
                            );
                        }
                    });
                }
            }
        });
    }
}
