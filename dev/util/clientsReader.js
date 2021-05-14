import ajax from "./ajax";
import cookieHandler from "./cookieHandler";
import nodeUtil from "./nodeUtil";

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
        Array.prototype.forEach.call(oClientList, oClientEntry => {
            const sClientId = nodeUtil.getChildNodeText(oClientEntry, "id");

            // the default 0 client is ignored
            if (sClientId === "000") {
                return;
            }
            aClients.push({
                client: sClientId,
                description: nodeUtil.getChildNodeText(oClientEntry, "title")
            });
        });
    }
    return aClients;
}

export default {
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
            throw Error(`ADT service call (${ADT_CLIENT_SERVICE_URL}) failed.\nHTTP Code: ${status} (${statusText})`);
        }
    }
};
