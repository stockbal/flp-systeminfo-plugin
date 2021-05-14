const LANGUAGE_COOKIE = "flp.plugins.logoninfo.languages";
const CLIENT_COOKIE = "flp.plugins.logoninfo.clients";
/**
 * Sets a new cookie
 * @param {string} sName The id of the cookie to set
 * @param {string} sValue the value of the cookie to set
 */
function setCookie(sName, sValue) {
    document.cookie = `${sName}=${sValue};path=/`;
}

/**
 * Retrieves the value of the given cookie name
 * @param {string} sCookieName the name of a cookie
 * @returns {string} the value of the cookie if it exists
 */
function getCookie(sCookieName) {
    const sName = `${sCookieName}=`;

    var aAllCookies = document.cookie.split(";");
    for (var i = 0; i < aAllCookies.length; i++) {
        var sCookie = aAllCookies[i];
        while (sCookie.charAt(0) == " ") {
            sCookie = sCookie.substring(1);
        }
        if (sCookie.indexOf(sName) == 0) {
            return sCookie.substring(sName.length, sCookie.length);
        }
    }
    return "";
}
/**
 * Handles all things cookie ;)
 */
export default {
    /**
     * Returns the stored languages array from the cookies
     * @returns {Array} an array of stored languages
     */
    getLanguages() {
        const sLanguageCookie = getCookie(LANGUAGE_COOKIE);
        if (sLanguageCookie) {
            return JSON.parse(sLanguageCookie);
        }
        return null;
    },
    /**
     * Stores the array of languages as cookie
     * @param {Array} aLanguages array of languages
     */
    setLanguages(aLanguages) {
        setCookie(LANGUAGE_COOKIE, aLanguages && aLanguages.length > 0 ? JSON.stringify(aLanguages) : "");
    },
    /**
     * Retrieves a list of system clients from the cookie
     * @returns {Array} array of clients
     */
    getClients() {
        const sClientCookie = getCookie(CLIENT_COOKIE);
        if (sClientCookie) {
            return JSON.parse(sClientCookie);
        }
        return null;
    },
    /**
     * Stores the array of clients as cookie
     * @param {Array} aClients array of clients
     */
    setClients(aClients) {
        setCookie(CLIENT_COOKIE, aClients && aClients.length > 0 ? JSON.stringify(aClients) : "");
    }
};
