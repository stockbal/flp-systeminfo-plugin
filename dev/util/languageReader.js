import ajax from "./ajax";
import cookieHandler from "./cookieHandler";
import nodeUtil from "./nodeUtil";

const ADT_DATA_PREVIEW_SERVICE = "/sap/bc/adt/datapreview/freestyle";
const COL_LANGUAGE_KEY = "KEY";
const COL_LANGUAGE_DESCR = "DESC";
const COL_LOGON_LANG_VALUES = "VALUE";
const TECH_LANGUAGE_VALUE = "늑";
const TECH_LANGUAGE_KEY = "1Q";

function extractResultFromDataPreview(oDocument, aColumNames) {
    // if the supplied object is not a DOM document it has to be created
    // via the dom parser
    if (!oDocument.querySelector) {
        oDocument = new DOMParser().parseFromString(oDocument, "text/xml");
    }
    const aResult = [];
    const oColumnsMetadata = oDocument.querySelectorAll("columns > metadata") || [];
    // iteration over the column metadata of the query result
    Array.prototype.forEach.call(oColumnsMetadata, oColMetadata => {
        const sColName = oColMetadata.attributes["dataPreview:name"].value.toLowerCase();
        let iIndex = 0;
        // Retrieve the data entries of the columns
        Array.prototype.forEach.call(oColMetadata.parentNode.querySelectorAll("data"), oData => {
            let oResultLine;
            if (aResult.length < iIndex + 1) {
                oResultLine = {};
                for (const sResulProperty of aColumNames) {
                    oResultLine[sResulProperty.toLowerCase()] = "";
                }
                aResult.push(oResultLine);
            } else {
                oResultLine = aResult[iIndex];
            }
            if (!oResultLine.hasOwnProperty(sColName)) {
                return;
            }
            oResultLine[sColName] = nodeUtil.getNodeText(oData);
            iIndex++;
        });
    });

    return aResult;
}

export default {
    /**
     * Returns Promise with list of installed languages on current ABAP system
     * @returns {Promise<Array>} promise with installed languages
     */
    async getInstalledLanguages() {
        let aLanguages = cookieHandler.getLanguages();
        if (aLanguages) {
            return aLanguages;
        }
        const sToken = await ajax.fetchCSRF();
        if (!sToken) {
            throw Error("CSRF token could not be determined!");
        }
        const aLogonLanguageKeys = await this._getActiveLogonLanguages(sToken);
        if (!aLogonLanguageKeys || aLogonLanguageKeys.length === 0) {
            throw Error("No logon languages found!");
        }
        aLanguages = await this._getLanguageIsoTexts(aLogonLanguageKeys, sToken);
        cookieHandler.setLanguages(aLanguages);
        return aLanguages;
    },

    async _getActiveLogonLanguages(sCSRFToken) {
        const aLogonLanguages = await this._callDataPreviewService(
            `SELECT value \r\n` +
                `  FROM tcp0i \r\n` +
                `  WHERE name = 'logon_languages' \r\n` +
                `    AND active = @abap_true \r\n` +
                `  ORDER BY timestmp DESCENDING`,
            sCSRFToken,
            [COL_LOGON_LANG_VALUES],
            1
        );
        if (aLogonLanguages && aLogonLanguages.length === 1) {
            return aLogonLanguages[0].value.split("");
        }
        return [];
    },

    async _getLanguageIsoTexts(aLanguageKeys, sCSRFToken) {
        const sKeys = aLanguageKeys.map(sKey => `'${sKey}'`).join(", ");
        return this._callDataPreviewService(
            `SELECT lang~laiso AS key, \r\n` +
                `       lang_text~sptxt AS desc \r\n` +
                `  FROM t002 AS lang \r\n` +
                `    LEFT OUTER JOIN t002t AS lang_text \r\n` +
                `      ON  lang~spras = lang_text~sprsl \r\n` +
                `      AND lang_text~spras = lang~spras \r\n` +
                `  WHERE lang~spras IN ( ${sKeys} ) \r\n` +
                `  ORDER BY lang~laiso`,
            sCSRFToken,
            [COL_LANGUAGE_KEY, COL_LANGUAGE_DESCR],
            100
        );
    },

    async _callDataPreviewService(sQuery, sCSRFToken, aColumnNames, iMaxRows) {
        try {
            const { data: oQueryResult } = await ajax.send(`${ADT_DATA_PREVIEW_SERVICE}?rowNumber=${iMaxRows}`, {
                headers: {
                    "X-CSRF-Token": sCSRFToken,
                    Accept: "application/xml, application/vnd.sap.adt.datapreview.table.v1+xml"
                },
                method: "POST",
                data: sQuery
            });
            return extractResultFromDataPreview(oQueryResult, aColumnNames);
        } catch (vError) {
            if (vError.hasOwnProperty("status") && vError.hasOwnProperty("statusText")) {
                throw Error(
                    `ADT service call (${ADT_DATA_PREVIEW_SERVICE}) failed.\nHTTP Code: ${vError.status} (${vError.statusText})`
                );
            } else {
                throw Error(`ADT service call (${ADT_DATA_PREVIEW_SERVICE}) failed.\nError: ${vError})`);
            }
        }
    }
};
