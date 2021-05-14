import Log from "sap/base/Log";
import Object from "sap/ui/base/Object";
import Button from "sap/m/Button";
import ActionSheet from "sap/m/ActionSheet";
import languageReader from "../languageReader";
/**
 * @alias flp.plugins.logoninfo.util.ui.LanguageSwitcher
 */
export default class LanguageSwitcher extends Object {
    /**
     * Creates a new LanguageSwitcher
     * @param {sap.base.i18n.ResourceBundle} oResourceBundle i18n bundle of this plugin
     */
    constructor(oResourceBundle) {
        this._oBundle = oResourceBundle;
        this._bInitialized = false;
    }

    /**
     * On Press handler for custom language switch button
     *
     * @param {object} oEvent - event object
     * @public
     */
    async switchLanguage(oEvent) {
        const oButton = oEvent.getSource();
        await this._init();
        const oMenu = new ActionSheet({
            showCancelButton: false,
            buttons: this._getLanguageButtons()
        });
        oMenu.openBy(oButton);
    }

    _getLanguageButtons() {
        if (this._aLanguages && this._aLanguages.length > 0) {
            return this._aLanguages.map(
                oLanguage =>
                    new Button({
                        text: `${oLanguage.key} - ${oLanguage.desc}`,
                        press: () => (window.location.search = `sap-language=${oLanguage.key}`)
                    })
            );
        } else {
            return [
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
            ];
        }
    }

    async _init() {
        if (this._bInitialized) {
            return;
        }
        // 2) try to retrieve installed languages
        try {
            this._aLanguages = await languageReader.getInstalledLanguages();
        } catch (sError) {
            this._aLanguages = [];
            Log.error(sError);
        }
        this._bInitialized = true;
    }
}
