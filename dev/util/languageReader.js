sap.ui.define(["./ajax", "./cookieHandler", "./xmlUtil"], (ajax, cookieHandler, xmlUtil) => {
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
        const aColMetadata = oDocument.querySelectorAll("columns > metadata") || [];

        // iteration over the column metadata of the query result
        for (const oColMetadata of aColMetadata) {
            const sColName = oColMetadata.attributes["dataPreview:name"].value.toLowerCase();
            let iIndex = 0;
            // Retrieve the data entries of the columns
            for (const oData of oColMetadata.parentNode.querySelectorAll("data")) {
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
                    break;
                }
                oLanguageInfo[sColName] = xmlUtil.getNodeText(oData);
                iIndex++;
            }
        }

        return aLanguages;
    }

    return {
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
                const { data: oQueryResult } = await ajax.send(
                    `${ADT_DATA_PREVIEW_SERVICE}?rowNumber=100&dataAging=true`,
                    {
                        headers: {
                            "X-CSRF-Token": sToken,
                            Accept: "application/xml, application/vnd.sap.adt.datapreview.table.v1+xml"
                        },
                        method: "POST",
                        data:
                            `SELECT langu~laiso AS ${LANGUAGE_KEY}, \n` +
                            `       langu_text~sptxt AS ${LANGUAGE_DESCRIPTION} \n` +
                            `  FROM t002c AS installed_langu \n` +
                            `    INNER JOIN t002 AS langu \n` +
                            `      ON installed_langu~spras = langu~spras \n` +
                            `    LEFT OUTER JOIN t002t AS langu_text \n` +
                            `      ON  langu~spras = langu_text~sprsl \n` +
                            `      AND langu_text~spras = langu~spras \n` +
                            `  ORDER BY langu~laiso`
                    }
                );
                aLanguages = extractLanguagesFromDocument(oQueryResult);
                cookieHandler.setLanguages(aLanguages);
                return aLanguages;
            } catch ({ status, statusText }) {
                throw Error(
                    `ADT service call (${ADT_DATA_PREVIEW_SERVICE}) failed.\nHTTP Code: ${status} (${statusText})`
                );
            }
        }
    };
});
