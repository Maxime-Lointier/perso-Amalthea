document.addEventListener('DOMContentLoaded', () => {
    // Create a debug panel to show logs
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debugPanel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 10px;
        max-width: 300px;
        max-height: 300px;
        overflow: auto;
        z-index: 1000;
        font-family: monospace;
    `;
    document.body.appendChild(debugPanel);

    function debugLog(message) {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        debugPanel.appendChild(logEntry);
        console.log(message);  // Also log to console
    }

    const labelForm = document.getElementById('labelForm');
    const labelContent = document.getElementById('labelContent');
    const pharmacyLogoInput = document.getElementById('pharmacyLogo');
    const pharmacyPostalInput = document.getElementById('pharmacyPostal');

    const previewTriggerFields = [
        'pharmacyName', 'pharmacyAddress', 'pharmacyPostal', 
        'pharmacyPhone', 'pharmacyFax', 'pharmacyLogo'
    ];

    function calculateFontSize(text, baseSize = 0.5, maxLength = 20, minSize = 0.2) {
        debugLog(`Calculating font size for: ${text}`);
        const lengthFactor = Math.max(minSize, 1 - (Math.max(0, text.length - maxLength) / maxLength));
        return Math.max(minSize, baseSize * lengthFactor).toFixed(2);
    }

    function calculateLineHeight(fontSize) {
        return Math.max(0.8, 1.2 - (1 - parseFloat(fontSize))).toFixed(2);
    }

    function createLabelHTML(templateData) {
        debugLog('Creating label HTML with data:');
        Object.keys(templateData).forEach(key => {
            debugLog(`${key}: ${templateData[key]}`);
        });

        const width = 250;
        const height = 250;

        const labelHTML = `
            <div class="printed-label" style="
                width: ${width}px;
                height: ${height}px;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 15px;  
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
                box-sizing: border-box;
                justify-content: space-between;
            ">
                <div class="label-header" style="
                    padding: 3px; 
                    display: flex; 
                    align-items: center;
                    width: 100%;
                    box-sizing: border-box;
                    height: 50%;
                    overflow: hidden;
               ">
                    ${templateData.logoDataUrl ? 
                        `<img 
                            src="${templateData.logoDataUrl}" 
                            alt="Pharmacy Logo" 
                            style="
                                max-width: 30px; 
                                max-height: 30px; 
                                margin-right: 5px;
                            "
                        >` : ''
                    }
                    <div class="pharmacy-info" style="width: calc(100% - 35px);">
                        ${templateData.pharmacyName ? 
                            `<h3 style="
                                margin: 0; 
                                font-size: ${calculateFontSize(templateData.pharmacyName)}em;
                                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyName))}; 
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${templateData.pharmacyName}</h3>` : ''
                        }
                        ${templateData.pharmacyAddress ? 
                            `<p style="
                                margin: 0; 
                                font-size: ${calculateFontSize(templateData.pharmacyAddress)}em;
                                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyAddress))}; 
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${templateData.pharmacyAddress}</p>` : ''
                        }
                        ${templateData.pharmacyPostal ? 
                            `<p style="
                                margin: 0; 
                                font-size: ${calculateFontSize(templateData.pharmacyPostal, 0.4)}em;
                                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyPostal, 0.4))}; 
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${templateData.pharmacyPostal}</p>` : ''
                        }
                        ${templateData.pharmacyPhone ? 
                            `<p style="
                                margin: 0; 
                                font-size: ${calculateFontSize(templateData.pharmacyPhone, 0.4)}em;
                                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyPhone, 0.4))}; 
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">Tél: ${templateData.pharmacyPhone}</p>` : ''
                        }
                        ${templateData.pharmacyFax ? 
                            `<p style="
                                margin: 0; 
                                font-size: ${calculateFontSize(templateData.pharmacyFax, 0.4)}em;
                                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyFax, 0.4))}; 
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            "> ${templateData.pharmacyFax}</p>` : ''
                        }
                    </div>
                </div>
            </div>
        `;

        if (labelContent) {
            labelContent.innerHTML = labelHTML;
        }
    }

    function updatePreview() {
        const templateData = {};
        
        previewTriggerFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                debugLog(`Processing field: ${fieldId}`);
                if (fieldId === 'pharmacyLogo') {
                    const logoFile = field.files[0];
                    if (logoFile) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            templateData.logoDataUrl = e.target.result;
                            processLabelPreview(templateData);
                        };
                        reader.readAsDataURL(logoFile);
                    } else {
                        processLabelPreview(templateData);
                    }
                } else {
                    const value = field.value.trim();
                    debugLog(`Field ${fieldId} value: ${value}`);
                    templateData[fieldId] = value;
                }
            }
        });

        processLabelPreview(templateData);
    }

    function processLabelPreview(templateData) {
        debugLog('Processing label preview with data:');
        Object.keys(templateData).forEach(key => {
            debugLog(`${key}: ${templateData[key]}`);
        });

        // Explicitly log postal code details
        if (pharmacyPostalInput) {
            debugLog('Postal Input Value:' + pharmacyPostalInput.value);
            debugLog('Postal Data: ' + templateData.pharmacyPostal);
        }

        if (Object.keys(templateData).some(key => 
            key !== 'logoDataUrl' && 
            templateData[key] !== null && 
            templateData[key] !== undefined && 
            templateData[key] !== ''
        )) {
            createLabelHTML(templateData);
            return;
        }

        if (labelContent) {
            labelContent.innerHTML = `
                <div style="
                    color: #888; 
                    text-align: center; 
                    padding: 20px; 
                    border: 2px dashed #ddd;
                    border-radius: 15px;
                ">
                    Commencez à personnaliser votre étiquette
                </div>
            `;
        }
    }

    previewTriggerFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updatePreview);
        }
    });

    updatePreview();
});