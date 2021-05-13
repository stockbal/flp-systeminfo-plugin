sap.ui.define(
    ["sap/base/Log", "sap/ui/base/Object", "sap/m/Button", "sap/m/ActionSheet", "../languageReader"],
    (Log, Object, Button, ActionSheet, languageReader) => {
        /**
         * @alias flp.plugins.logoninfo.util.ui.LanguageSwitcher
         */
        return Object.extend("flp.plugins.logoninfo.util.ui.LanguageSwitcher", {
            /**
             * Creates a new LanguageSwitcher
             * @param {sap.base.i18n.ResourceBundle} oResourceBundle i18n bundle of this plugin
             */
            constructor(oResourceBundle) {
                this._oBundle = oResourceBundle;
                this._bInitialized = false;
            },
            /**
             * On Press handler for custom language switch button
             *
             * @param {object} oEvent - event object
             * @private
             */
            async switchLanguage(oEvent) {
                const oButton = oEvent.getSource();
                await this._init();
                const oMenu = new ActionSheet({
                    showCancelButton: false,
                    buttons: this._getLanguageButtons()
                });
                oMenu.openBy(oButton);
            },
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
            },
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
        });
    }
);
