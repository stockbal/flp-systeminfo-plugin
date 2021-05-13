sap.ui.define(["./ajax", "./cookieHandler", "./xmlUtil"], (ajax, cookieHandler, xmlUtil) => {
    const ADT_CLIENT_SERVICE_URL = "/sap/bc/adt/system/clients";

    function extractClients(oDocument) {
        // if the supplied object is not a DOM document it has to be created
        // via the dom parser
        if (!oDocument.querySelector) {
            oDocument = new DOMParser().parseFromString(oDocument, "text/xml");
        }
        const oClientList = oDocument.querySelectorAll("entry");
        if (!oClientList) {
            return null;
        }
        const aClients = [];
        if (oClientList) {
            for (const oClientEntry of oClientList) {
                const sClientId = xmlUtil.getChildNodeText(oClientEntry, "id");

                // the default 0 client is ignored
                if (sClientId === "000") {
                    continue;
                }
                aClients.push({
                    client: sClientId,
                    description: xmlUtil.getChildNodeText(oClientEntry, "title")
                });
            }
        }
        return aClients;
    }

    return {
        /**
         * Retrieves a list of clients from the current system
         * @returns {Array} array of client objects
         */
        async getSystemClients() {
            let aClients = cookieHandler.getClients();
            if (aClients) {
                return aClients;
            }
            try {
                const { data: oClientData } = await ajax.send(ADT_CLIENT_SERVICE_URL);
                aClients = extractClients(oClientData);
                cookieHandler.setClients(aClients);
                return aClients;
            } catch ({ status, statusText }) {
                throw Error(
                    `ADT service call (${ADT_CLIENT_SERVICE_URL}) failed.\nHTTP Code: ${status} (${statusText})`
                );
            }
        }
    };
});
