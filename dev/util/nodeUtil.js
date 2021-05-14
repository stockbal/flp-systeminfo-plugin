/**
 * Object with utilities for xml documents
 */
export default {
    /**
     * Retrieves the text content of a child node of a given XML node
     * @param {Node} oNode a node in a xml file
     * @param {string} sSelectorId selector id of child node
     * @returns {string} the text content of the child node
     */
    getChildNodeText(oNode, sSelectorId) {
        const oChildNode = oNode.querySelector(sSelectorId);
        if (!oChildNode) {
            return null;
        }
        return this.getNodeText(oChildNode);
    },
    /**
     * The text content of the node
     * @param {Node} oNode xml node object
     * @returns {string} the text/html content of the xml node
     */
    getNodeText(oNode) {
        if (!oNode) {
            return "";
        }
        if (oNode.nodeType === Node.ELEMENT_NODE && oNode.childNodes && oNode.childNodes.length === 1) {
            return oNode.firstChild.nodeType === Node.TEXT_NODE ? oNode.firstChild.nodeValue : "";
        }
        return "";
    }
};
