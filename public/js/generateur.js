// Supprimez cette ligne
// import html2canvas from 'html2canvas';

// Utilisez html2canvas comme variable globale (il sera disponible via le script CDN)
import { isAuthenticated } from './auth.js';
import { product_id, addCart } from './addCartBd.js';
import { escapeHTML } from '../utils/securityUtils.js';
import { showSuccess } from './toast.js';
export const labelDimensionSelect = document.getElementById('labelDimension');
export const backgroundColorSelect = document.getElementById('backgroundColorSelect');
export const warningBlockSelect = document.getElementById('warningBlock');

document.addEventListener('DOMContentLoaded', () => {
  const labelForm = document.getElementById('labelForm');
  const labelContent = document.getElementById('labelContent');
  const pharmacyLogoInput = document.getElementById('pharmacyLogo');
  const labelDimensionSelect = document.getElementById('labelDimension');
  const warningBlockSelect = document.getElementById('warningBlock');
  const backgroundColorSelect = document.getElementById('backgroundColorSelect');
  const champLibrePositionSelect = document.getElementById('champLibrePosition');
  const addToCartBtn = document.getElementById('addToCartBtn');

  const previewTriggerFields = [
    'pharmacyName', 'pharmacyAddress', 'pharmacyPostal',
    'pharmacyPhone', 'pharmacyFax', 'pharmacyLogo',
    'labelDimension', 'warningBlock', 'backgroundColorSelect',
    'champLibre', 'champLibrePosition' // Ajout du champ "champLibrePosition"
  ];

  const options = {
    '60x50': {
      colors: ['blanc', 'rouge', 'bleu'],
      warnings: ['NE PAS AVALER', 'NE PAS FAIRE AVALER']
    },
    '50x40': {
      colors: ['blanc', 'rouge', 'bleu'],
      warnings: ['NE PAS AVALER', 'NE PAS FAIRE AVALER']
    },
    '40x30': {
      colors: ['blanc', 'rouge', 'bleu'],
      warnings: ['NE PAS AVALER', 'NE PAS FAIRE AVALER']
    },
    '50x20': {
      colors: ['blanc', 'or'],
      warnings: []
    }
  };

  function updateOptions() {
    const selectedDimension = labelDimensionSelect.value;
    const availableOptions = options[selectedDimension];

    // Mettre à jour les options de couleur
    backgroundColorSelect.innerHTML = '';
    availableOptions.colors.forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color;
      backgroundColorSelect.appendChild(option);
    });

    // Mettre à jour les options de warning
    updateWarnings();
  }

  function updateWarnings() {
    const selectedDimension = labelDimensionSelect.value;
    const selectedColor = backgroundColorSelect.value;
    const availableOptions = options[selectedDimension];

    warningBlockSelect.innerHTML = '';
    const noWarningOption = document.createElement('option');
    noWarningOption.value = '';
    noWarningOption.textContent = 'Aucun';
    warningBlockSelect.appendChild(noWarningOption);

    if (selectedColor !== 'bleu') {
      availableOptions.warnings.forEach(warning => {
        const option = document.createElement('option');
        option.value = warning;
        option.textContent = warning;
        warningBlockSelect.appendChild(option);
      });
    }
  }

  // Ajouter des gestionnaires d'événements pour le changement de format et de couleur
  labelDimensionSelect.addEventListener('change', () => {
    updateOptions();
    updateWarnings();
  });

  backgroundColorSelect.addEventListener('change', updateWarnings);

  // Initialiser les options lors du chargement de la page
  updateOptions();

  function calculateFontSize(text, baseSize = 1, maxLength = 20, minSize = 0.5) {
    // Adjusted to reduce font size more aggressively for longer text
    const contentLength = text ? text.length : 0;
    const dynamicScaling = contentLength > 0
      ? Math.max(minSize, 1 - (Math.max(0, contentLength - maxLength) * 0.05))
      : 1;
    return Math.max(minSize, baseSize * dynamicScaling).toFixed(2);
  }

  function calculateLineHeight(fontSize, baseLineHeight = 1) {
    return Math.max(0.9, baseLineHeight * (1 - (1 - parseFloat(fontSize)))).toFixed(2);
  }

  function calculateLabelDimensions(dimension) {
    const [width, height] = dimension.split('x').map(Number);
    const maxPreviewWidth = 300;
    const maxPreviewHeight = 250;

    const aspectRatio = width / height;
    let renderWidth, renderHeight;

    // More precise scaling: proportional to actual physical dimensions
    renderWidth = (width / 60) * maxPreviewWidth;
    renderHeight = (height / 60) * maxPreviewWidth;

    // Ensure aspect ratio is maintained
    if (renderWidth > maxPreviewWidth || renderHeight > maxPreviewHeight) {
      const widthRatio = maxPreviewWidth / renderWidth;
      const heightRatio = maxPreviewHeight / renderHeight;
      const scaleFactor = Math.min(widthRatio, heightRatio);

      renderWidth *= scaleFactor;
      renderHeight *= scaleFactor;
    }

    return {
      width: Math.round(renderWidth),
      height: Math.round(renderHeight)
    };
  }

  function createLabelHTML(templateData) {
    const dimension = templateData.labelDimension || '60x50';
    const { width, height } = calculateLabelDimensions(dimension);

    // Always convert pharmacy name to uppercase and escape HTML
    const pharmacyName = escapeHTML((templateData.pharmacyName || '').toUpperCase());

    const inputValues = [
      pharmacyName,
      templateData.pharmacyAddress,
      templateData.pharmacyPostal,
      templateData.pharmacyPhone,
      templateData.pharmacyFax,
      templateData.champLibre // Ajout du champ "champLibre"
    ].filter(val => val);

    const filledInputsCount = inputValues.length;

    const scalingFactor = filledInputsCount > 3
      ? Math.max(0.95, 1 - (filledInputsCount - 3) * 0.03)
      : 1;

    const isLargeLabel = dimension === '60x50';
    const isMediumLabel = dimension === '50x40';
    const isSmallLabel = dimension === '40x30';
    const isNarrowLabel = dimension === '50x20';

    function baseSize() {
      if (isLargeLabel) {
        return 1.1;
      } else if (isMediumLabel) {
        return 0.9;
      } else if (isSmallLabel) {
        return 0.8;
      } else if (isNarrowLabel) {
        return 0.95;
      }
    }
    function logoSizeWidth() {
      if (isLargeLabel) {
        return 100;
      } else if (isMediumLabel) {
        return 80;
      } else if (isSmallLabel) {
        return 50;
      } else if (isNarrowLabel) {
        return 80;
      }
    }
    function logoSizeHeight() {
      if (isLargeLabel) {
        return 100;
      } else if (isMediumLabel) {
        return 80;
      } else if (isSmallLabel) {
        return 50;
      } else if (isNarrowLabel) {
        return 80;
      }
    }

    // Determine background color and warning block visibility
    let labelBackgroundColor = 'white';
    let textColor = 'black';
    let labelClass = 'printed-label';
    let warningBackgroundColor = '';

    if (templateData.backgroundColorSelect) {
      switch (templateData.backgroundColorSelect) {
        case 'bleu':
          if (['60x50', '50x40', '40x30'].includes(dimension)) {
            labelBackgroundColor = '#3498db';
            warningBackgroundColor = '#3498db';
            labelClass += ' blue-background';
            textColor = 'black';
          }
          break;
        case 'or':
          if (dimension === '50x20') {
            labelBackgroundColor = '#DAA520';
            warningBackgroundColor = '#DAA520';
            labelClass += ' gold-background';
            textColor = 'black';
          }
          break;
        case 'rouge':
          if (['60x50', '50x40', '40x30'].includes(dimension)) {
            labelBackgroundColor = '#d03f30';
            warningBackgroundColor = '#d03f30';
            labelClass += ' red-background';
            textColor = 'black';
          }
          break;
        case 'blanc':
          labelBackgroundColor = 'white';
          warningBackgroundColor = '#d03f30';
          labelClass += ' white-background';
          textColor = 'black';
          break;
      }
    }

    const isColorLabel = templateData.backgroundColorSelect !== '' && templateData.backgroundColorSelect !== 'blanc';

    // Determine warning block details and visibility
    const warningText = templateData.warningBlock || '';
    const hasWarningBlock = !!warningText &&
      (templateData.backgroundColorSelect === 'blanc' ||
        templateData.backgroundColorSelect === 'rouge') &&
      dimension !== '50x20';

    // Font size calculations
    const pharmacyNameFontSize = calculateFontSize(
      pharmacyName || '',
      (baseSize()) * scalingFactor,  // Adjust multiplicator based on isNarrowLabel  
      isNarrowLabel ? 25 : 20,
      0.7
    );
    const pharmacyNameLineHeight = calculateLineHeight(pharmacyNameFontSize);

    const champLibrePositionClass = `champ-libre-${templateData.champLibrePosition}`;

    const labelHTML = `
      <div class="${labelClass}" style="
        width: ${width}px;
        height: ${height}px;
        color: ${textColor};
        border: ${isNarrowLabel ? '1px solid #000;' : isColorLabel ? "none;" : '1px solid #000;'}; 
        border-radius: 15px;  
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        box-sizing: border-box;
        background-color: ${labelBackgroundColor};
        ${isNarrowLabel ? 'padding: 0px;' : 'padding: 8px;'}
      ">
        <div class="label-header" style="
          display: flex; 
          align-items: flex-start;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          gap: 5px;
          height: ${isNarrowLabel ? '100%' : '50%'}; 
          border-bottom: ${isNarrowLabel ? 'none' : isColorLabel ? 'none' : '1px solid #000'};
          background-color: ${labelBackgroundColor};
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
        ">
          ${templateData.logoDataUrl ?
        `<img 
              src="${templateData.logoDataUrl}" 
              alt="Pharmacy Logo" 
              style="
                max-width: ${logoSizeWidth()}px;
                max-height: ${logoSizeHeight()}px;
                object-fit: contain;
                ${isNarrowLabel ? 'margin-top: 0.5em;' : ''}
              "
            >` : ''
      }
          <div class="pharmacy-info" style="
            width: calc(100% - ${templateData.logoDataUrl ? '90px' : '0px'});
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            height: 100%;
            gap: ${isSmallLabel ? '1px' : '2px'};
            padding-left: 5px;
            text-align: center;  
          ">
            ${pharmacyName ?
        `<h3 style="
                margin: 0;
                margin-top: ${isSmallLabel ? '0px' : '5px'}; 
                margin-bottom: 1px;
                font-size: ${pharmacyNameFontSize}em;
                line-height: ${pharmacyNameLineHeight}; 
                max-width: 100%;
                text-align: center;
                color: ${textColor};
              ">${pharmacyName}</h3>` : ''
      }
            ${templateData.pharmacyAddress ?
        `<p style="
                margin: 0; 
                font-size: ${calculateFontSize(templateData.pharmacyAddress, baseSize() * scalingFactor, isNarrowLabel ? 30 : 25, 0.7)}em;
                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyAddress, 1.1 * scalingFactor, isNarrowLabel ? 30 : 25, 0.7))}; 
                max-width: 100%;
                text-align: center;
                color: ${textColor};
              ">${escapeHTML(templateData.pharmacyAddress)}</p>` : ''
      }
            ${templateData.pharmacyPostal ?
        `<p style="
                margin: 0; 
                font-size: ${calculateFontSize(templateData.pharmacyPostal, baseSize() * scalingFactor, isNarrowLabel ? 30 : 25, 0.7)}em;
                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyPostal, 1 * scalingFactor, isNarrowLabel ? 30 : 25, 0.7))}; 
                max-width: 100%;
                text-align: center;
                color: ${textColor};
              ">${escapeHTML(templateData.pharmacyPostal)}</p>` : ''
      }
            ${templateData.pharmacyPhone ?
        `<p style="
                margin: 0; 
                font-size: ${calculateFontSize(templateData.pharmacyPhone, baseSize() * scalingFactor, isNarrowLabel ? 30 : 25, 0.7)}em;
                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyPhone, 1 * scalingFactor, isNarrowLabel ? 30 : 25, 0.7))}; 
                max-width: 100%;
                text-align: center;
                color: ${textColor};
              ">Tél: ${escapeHTML(templateData.pharmacyPhone)}</p>` : ''
      }
            ${templateData.pharmacyFax ?
        `<p style="
                margin: 0; 
                font-size: ${calculateFontSize(templateData.pharmacyFax, baseSize() * scalingFactor, isNarrowLabel ? 30 : 25, 0.7)}em;
                line-height: ${calculateLineHeight(calculateFontSize(templateData.pharmacyFax, 1 * scalingFactor, isNarrowLabel ? 30 : 25, 0.7))}; 
                max-width: 100%;
                text-align: center;
                color: ${textColor};
              "> ${escapeHTML(templateData.pharmacyFax)}</p>` : ''
      }
          </div>
        </div>
        
        <div class="champ-libre-container ${champLibrePositionClass}" style="
          height: 50%;
          
          background-color: white;
          border-radius: 15px;
          ${dimension === '50x20' ? 'display: none;' : ''}
        ">
          ${templateData.champLibre ?
        `<p style="
                  margin: 0; 
                  font-size: ${calculateFontSize(templateData.champLibre, baseSize() * scalingFactor, isNarrowLabel ? 30 : 25, 0.7)}em;
                  line-height: ${calculateLineHeight(calculateFontSize(templateData.champLibre, 1 * scalingFactor, isNarrowLabel ? 30 : 25, 0.7))}; 
                  max-width: 100%;
                  text-align: center;
                  color: ${textColor};
                ">${escapeHTML(templateData.champLibre)}</p>` : ''
      }
        </div>
        ${hasWarningBlock ? `
          <div style="
            background-color: ${warningBackgroundColor || 'red'}; 
            color: black; 
            text-align: center; 
            padding: 0px; 
            font-weight: bold;
            font-size: ${isSmallLabel ? '0.65' : '0.7'}em;
            width: 100%;
            position: absolute;
            bottom: 0;
            left: 0;
          ">
            ${escapeHTML(warningText)}
          </div>
        ` : ''}
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
        if (fieldId === 'pharmacyLogo') {
          const logoFile = field.files[0];
          if (logoFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
              templateData.logoDataUrl = e.target.result;
              templateData.labelDimension = labelDimensionSelect.value;
              templateData.warningBlock = warningBlockSelect.value;
              templateData.backgroundColorSelect = backgroundColorSelect.value;
              templateData.champLibre = document.getElementById('champLibre').value; // Récupération du champ "champLibre"
              templateData.champLibrePosition = champLibrePositionSelect.value; // Récupération de la position du champ "champLibre"
              processLabelPreview(templateData);
            };
            reader.readAsDataURL(logoFile);
          } else {
            templateData.labelDimension = labelDimensionSelect.value;
            templateData.warningBlock = warningBlockSelect.value;
            templateData.backgroundColorSelect = backgroundColorSelect.value;
            templateData.champLibre = document.getElementById('champLibre').value; // Récupération du champ "champLibre"
            templateData.champLibrePosition = champLibrePositionSelect.value; // Récupération de la position du champ "champLibre"
            processLabelPreview(templateData);
          }
        } else {
          const value = field.value.trim();
          templateData[fieldId] = value;
        }
      }
    });
    processLabelPreview(templateData);
  }

  labelDimensionSelect.addEventListener('change', updatePreview);
  warningBlockSelect.addEventListener('change', updatePreview);
  backgroundColorSelect.addEventListener('change', updatePreview);
  champLibrePositionSelect.addEventListener('change', updatePreview);

  previewTriggerFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', updatePreview);
    }
  });

  // Initialiser les options lors du chargement de la page
  updateOptions();

  function processLabelPreview(templateData) {
    templateData.labelDimension = labelDimensionSelect.value;

    if (Object.keys(templateData).some(key =>
      key !== 'logoDataUrl' &&
      templateData[key] !== null &&
      templateData[key] !== undefined &&
      templateData[key] !== ''
    )) {
      createLabelHTML(templateData);
      return;
    }

    
  }

  labelDimensionSelect.addEventListener('change', updatePreview);
  warningBlockSelect.addEventListener('change', updatePreview);
  backgroundColorSelect.addEventListener('change', updatePreview);

  previewTriggerFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', updatePreview);
    }
  });

  function exportLabelToFile() {
    const templateData = {
      pharmacyName: document.getElementById('pharmacyName').value,
      pharmacyAddress: document.getElementById('pharmacyAddress').value,
      pharmacyPostal: document.getElementById('pharmacyPostal').value,
      pharmacyPhone: document.getElementById('pharmacyPhone').value,
      pharmacyFax: document.getElementById('pharmacyFax').value,
      labelDimension: document.getElementById('labelDimension').value,
      logoDataUrl: null
    };

    const logoInput = document.getElementById('pharmacyLogo');
    if (logoInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = function (e) {
        templateData.logoDataUrl = e.target.result;
        downloadLabelFile(templateData);
      };
      reader.readAsDataURL(logoInput.files[0]);
    } else {
      downloadLabelFile(templateData);
    }
  }


  updatePreview();

  if (addToCartBtn) {
    const positionTranslations = {
      top: 'haut',
      middle: 'milieu',
      bottom: 'bas'
    };
    addToCartBtn.addEventListener('click', async () => {
      if (isAuthenticated()) {
        // Capturer ET recadrer l'aperçu avant de l'envoyer
        const previewImage = await capturePreview();
        
        const label = {
          warning: document.getElementById('warningBlock').value,
          pharmacy_name: document.getElementById('pharmacyName').value,
          pharmacy_address: document.getElementById('pharmacyAddress').value,
          pharmacy_postal_code: document.getElementById('pharmacyPostal').value,
          pharmacy_phone: document.getElementById('pharmacyPhone').value,
          quantity: document.getElementById('quantity').value,
          detail_1: document.getElementById('pharmacyFax').value,
          champLibre: document.getElementById('champLibre').value,
          position: positionTranslations[document.getElementById('champLibrePosition').value],
          preview_image: previewImage 
        };
        
        addCart(label);
      } else {
        // Pour les utilisateurs non connectés
        const previewImage = await capturePreview(); // Image déjà recadrée
        
        // SUPPRIMEZ LA DEUXIÈME DÉCLARATION DE FONCTION ET GARDEZ UNIQUEMENT CELLE-CI
        const logoInput = document.getElementById('pharmacyLogo');
        
        // Fonction pour finaliser l'ajout au panier - UNIQUE DÉCLARATION
        function finalizeAddToCart(logoData = null) {
          const savedCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
          const label = {
            pharmacy_name: document.getElementById('pharmacyName').value,
            pharmacy_address: document.getElementById('pharmacyAddress').value,
            pharmacy_postal_code: document.getElementById('pharmacyPostal').value,
            quantity: document.getElementById('quantity').value,
            pharmacy_phone: document.getElementById('pharmacyPhone').value,
            detail_1: document.getElementById('pharmacyFax').value,
            warning: document.getElementById('warningBlock').value,
            format: document.getElementById('labelDimension').value,
            color: document.getElementById('backgroundColorSelect').value,
            libre: document.getElementById('champLibre').value,
            position: positionTranslations[document.getElementById('champLibrePosition').value],
            logo: logoData,
            preview: previewImage // Stocker la prévisualisation en base64
          };
          
          savedCart.push(label);
          localStorage.setItem('labelCart', JSON.stringify(savedCart));
          showSuccess('Étiquette ajoutée au panier!');
        }
        
        // Suite du code - traitement du logo
        if (logoInput && logoInput.files && logoInput.files[0]) {
          const reader = new FileReader();
          reader.onload = function(e) {
            finalizeAddToCart(e.target.result);
          };
          reader.readAsDataURL(logoInput.files[0]);
        } else {
          finalizeAddToCart();
        }
      }
    });
  }

});


// Fonction pour capturer la prévisualisation
async function capturePreview() {
  try {
    const labelPreview = document.getElementById('labelContent');
    
    if (!labelPreview) {
      console.error("Élément de prévisualisation introuvable");
      return null;
    }
    
    // Capture initiale avec html2canvas
    const canvas = await html2canvas(labelPreview, {
      scale: 2,
      backgroundColor: null,
      logging: false
    });
    
    // Convertir en base64
    const fullImageData = canvas.toDataURL('image/png');
    console.log("Prévisualisation capturée avec succès");
    
    // Recadrer l'image (enlever 10% du haut et 10% du bas)
    // Vous pouvez ajuster ces pourcentages selon vos besoins
    const croppedImage = await cropImage(fullImageData, 30, 30);
    console.log("Prévisualisation recadrée avec succès");
    
    return croppedImage;
  } catch (error) {
    console.error("Erreur lors de la capture de prévisualisation:", error);
    return null;
  }
}

// Ajouter cette fonction pour recadrer une image base64
function cropImage(base64Image, cropPercentTop, cropPercentBottom) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculer les dimensions du recadrage
      const cropHeightTop = img.height * (cropPercentTop / 100);
      const cropHeightBottom = img.height * (cropPercentBottom / 100);
      const newHeight = img.height - cropHeightTop - cropHeightBottom;
      
      // Configurer le canvas aux dimensions recadrées
      canvas.width = img.width;
      canvas.height = newHeight;
      
      // Dessiner l'image recadrée
      ctx.drawImage(
        img,
        0, cropHeightTop, // Source X, Y
        img.width, newHeight, // Source Width, Height
        0, 0, // Destination X, Y
        img.width, newHeight // Destination Width, Height
      );
      
      // Convertir en base64
      const croppedImage = canvas.toDataURL('image/png');
      resolve(croppedImage);
    };
    
    img.onerror = function(e) {
      console.error("Erreur lors du chargement de l'image pour recadrage:", e);
      reject(e);
    };
    
    img.src = base64Image;
  });
}
