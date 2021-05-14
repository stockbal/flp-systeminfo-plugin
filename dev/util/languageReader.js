import ajax from "./ajax";
import cookieHandler from "./cookieHandler";
import nodeUtil from "./nodeUtil";

const ADT_DATA_PREVIEW_SERVICE = "/sap/bc/adt/datapreview/freestyle";
const LANGUAGE_KEY = "KEY";
const LANGUAGE_DESCRIPTION = "DESC";

function extractLanguagesFromDocument(oDocument) {
    // if the supplied object is not a DOM document it has to be created
    // via the dom parser
    if (!oDocument.querySelector) {
        oDocument = new DOMParser().parseFromString(oDocument, "text/xml");
    }
    const aLanguages = [];
    const oColumnsMetadata = oDocument.querySelectorAll("columns > metadata") || [];
    // iteration over the column metadata of the query result
    Array.prototype.forEach.call(oColumnsMetadata, oColMetadata => {
        const sColName = oColMetadata.attributes["dataPreview:name"].value.toLowerCase();
        let iIndex = 0;
        // Retrieve the data entries of the columns
        Array.prototype.forEach.call(oColMetadata.parentNode.querySelectorAll("data"), oData => {
            let oLanguageInfo;
            if (aLanguages.length < iIndex + 1) {
                oLanguageInfo = {};
                oLanguageInfo[LANGUAGE_KEY.toLowerCase()] = "";
                oLanguageInfo[LANGUAGE_DESCRIPTION.toLowerCase()] = "";
                aLanguages.push(oLanguageInfo);
            } else {
                oLanguageInfo = aLanguages[iIndex];
            }
            if (!oLanguageInfo.hasOwnProperty(sColName)) {
                return;
            }
            oLanguageInfo[sColName] = nodeUtil.getNodeText(oData);
            iIndex++;
        });
    });

    return aLanguages;
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
        try {
            const { data: oQueryResult } = await ajax.send(`${ADT_DATA_PREVIEW_SERVICE}?rowNumber=100&dataAging=true`, {
                headers: {
                    "X-CSRF-Token": sToken,
                    Accept: "application/xml, application/vnd.sap.adt.datapreview.table.v1+xml"
                },
                method: "POST",
                data:
                    // CRLF is necessary because freestyle query handler split the string via CRLF
                    `SELECT langu~laiso AS ${LANGUAGE_KEY}, \r\n` +
                    `       langu_text~sptxt AS ${LANGUAGE_DESCRIPTION} \r\n` +
                    `  FROM t002c AS installed_langu \r\n` +
                    `    INNER JOIN t002 AS langu \r\n` +
                    `      ON installed_langu~spras = langu~spras \r\n` +
                    `    LEFT OUTER JOIN t002t AS langu_text \r\n` +
                    `      ON  langu~spras = langu_text~sprsl \r\n` +
                    `      AND langu_text~spras = langu~spras \r\n` +
                    `  ORDER BY langu~laiso`
            });
            aLanguages = extractLanguagesFromDocument(oQueryResult);
            cookieHandler.setLanguages(aLanguages);
            return aLanguages;
        } catch ({ status, statusText }) {
            throw Error(`ADT service call (${ADT_DATA_PREVIEW_SERVICE}) failed.\nHTTP Code: ${status} (${statusText})`);
        }
    }
};
