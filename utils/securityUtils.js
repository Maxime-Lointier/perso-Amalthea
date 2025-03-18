/**
 * Utilitaires de sécurité pour l'application
 */

/**
 * Échappe les caractères spéciaux HTML pour prévenir les attaques XSS
 * @param {*} str - Valeur à échapper (chaîne, nombre, etc.)
 * @returns {string} - Chaîne échappée ou chaîne vide si la valeur n'est pas valide
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    
    // Convertir en chaîne si ce n'est pas déjà le cas
    const value = String(str);
    
    return value.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

/**
 * Crée un élément DOM avec du contenu échappé
 * @param {string} tag - Balise HTML
 * @param {object} attributes - Attributs de l'élément
 * @param {string|Node|Array} content - Contenu de l'élément
 * @returns {HTMLElement} - Élément DOM créé
 */
export function createSafeElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Ajouter les attributs
    Object.keys(attributes).forEach(attr => {
        if (attr === 'className') {
            element.className = attributes[attr];
        } else {
            element.setAttribute(attr, attributes[attr]);
        }
    });
    
    // Ajouter le contenu
    if (content !== null) {
        if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof Node) {
                    element.appendChild(item);
                } else {
                    element.appendChild(document.createTextNode(String(item)));
                }
            });
        } else if (content instanceof Node) {
            element.appendChild(content);
        } else {
            element.textContent = String(content);
        }
    }
    
    return element;
}