sap.ui.define(["jQuery.sap.global"], $ => {
    const CSRF_TOKEN_HEADER = "X-CSRF-Token";

    return {
        /**
         * Promisfied AJAX call
         * @param {string} sUrl request url
         * @param {Map} mSettings map of settings
         * @param {Object} mSettings.headers optional http headers
         * @param {string} mSettings.method request method (e.g. GET/POST/PUT)
         * @returns {Promise<Object>} promise to ajax request
         */
        send(sUrl, { headers = {}, method = "GET", data = undefined, username = "", password = "" } = {}) {
            return new Promise((fnResolve, fnReject) => {
                $.ajax({
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
                        fnReject({ status: oXhr.status, statusText: sError });
                    }
                });
            });
        },
        async fetchCSRF() {
            const oResult = await this.send("/sap/bc/adt/discovery", {
                headers: {
                    [CSRF_TOKEN_HEADER]: "Fetch",
                    accept: "*/*"
                }
            });
            return oResult?.request?.getResponseHeader(CSRF_TOKEN_HEADER);
        }
    };
});
