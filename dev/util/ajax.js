const CSRF_TOKEN_HEADER = "X-CSRF-Token";

export default {
    /**
     * Promisfied AJAX call
     * @param {string} sUrl request url
     * @param {Map} mSettings map of settings
     * @param {Object} mSettings.headers optional http headers
     * @param {string} mSettings.method request method (e.g. GET/POST/PUT)
     * @returns {Promise<Object>} promise to ajax request
     */
    async send(sUrl, { headers = {}, method = "GET", data = undefined, username = "", password = "" } = {}) {
        try {
            const fetchOptions = {
                method: method,
                headers: headers
            };

            // Add authentication if provided
            if (username || password) {
                fetchOptions.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
            }

            // Add body for non-GET requests
            if (data !== undefined && method !== "GET") {
                fetchOptions.body = data;
            }

            const response = await fetch(sUrl, fetchOptions);
            
            // Get response data based on content type
            let responseData;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
            } else if (contentType && (contentType.includes("text/xml") || contentType.includes("application/xml"))) {
                responseData = await response.text();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                throw { status: response.status, statusText: response.statusText };
            }

            return {
                data: responseData,
                status: response.status,
                request: {
                    getResponseHeader: (headerName) => response.headers.get(headerName)
                }
            };
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw { status: 0, statusText: error.message };
        }
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
