/**
 * UI-MANAGER.JS - Gestion de l'Interface Utilisateur
 * Gère tout ce qui se passe à l'écran (Textes, Menus déroulants, Animations)
 */

const UIManager = {
    
    // Injecter le header avec le logo Fluxym (plus besoin de le coder en dur dans le HTML)
    initHeader: () => {
        const header = document.getElementById('app-header');
        header.innerHTML = `
            <img src="./assets/fluxym_logo_2018_sansdescriptif_blanc.png" alt="Fluxym Logo" style="max-width: 200px; margin-bottom: 2rem;">
            <h1>E-Invoicing Academy</h1>
            <p>Portail de génération de flux UBL pour validation et intégration plateformes (Esker, Basware...)</p>
        `;
    },

    // Remplir les menus déroulants (Cas d'usage + Paramètres avancés)
    populateSelects: () => {
        const data = window.APP_DATA;
        
        // 1. Menu Cas d'usage
        const usecaseSelect = document.getElementById('usecase');
        usecaseSelect.innerHTML = ''; // On vide au cas où
        
        // On boucle sur le fichier pedagogy.json pour créer les options
        for (const [key, value] of Object.entries(data.pedagogy)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value.label;
            usecaseSelect.appendChild(option);
        }

        // 2. Paramètres avancés (Fournisseur, Client, Factor)
        const settingsContainer = document.getElementById('companies-settings');
        
        // Créer les selects pour Fournisseur et Acheteur
        let html = `
            <div class="form-group">
                <label>Fournisseur (Supplier)</label>
                <select id="adv-supplier">
                    ${data.companies.suppliers.map(s => `<option value="${s.id}">${s.name} (${s.siren})</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Acheteur (Buyer)</label>
                <select id="adv-buyer">
                    ${data.companies.buyers.map(b => `<option value="${b.id}">${b.name} (${b.siren})</option>`).join('')}
                </select>
            </div>
            <div class="form-group hidden" id="group-factor">
                <label>Factor (Affacturage)</label>
                <select id="adv-factor">
                    ${data.companies.factors.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                </select>
            </div>
        `;
        
        settingsContainer.innerHTML = html;
    },

    // Animation de fondu pour le changement de texte
    updateInfoBoxWithFade: () => {
        const theoryContent = document.getElementById('theory-content');
        theoryContent.style.opacity = 0;
        
        setTimeout(() => {
            UIManager.updateInfoBox();
            theoryContent.style.opacity = 1;
        }, 150);
    },

    // Mettre à jour le texte pédagogique selon le cas sélectionné
    updateInfoBox: () => {
        const usecase = document.getElementById('usecase').value;
        const theory = window.APP_DATA.pedagogy[usecase];
        
        if(!theory) return;

        // Mise à jour Résumé Technique
        document.getElementById('info-text').innerHTML = theory.info;
        
        // Mise à jour de la Fiche Pédagogique
        document.getElementById('theory-content').innerHTML = `
            <span class="badge active">${theory.badge}</span>
            <h3 class="theory-title">${theory.title}</h3>
            <div class="theory-content">
                <p>${theory.desc1}</p>
                <p>${theory.desc2}</p>
            </div>
        `;
        
        // Afficher ou cacher le menu "Factor" dans les paramètres avancés si c'est le Cas 8
        const groupFactor = document.getElementById('group-factor');
        if(groupFactor) {
            if(usecase === "8") {
                groupFactor.classList.remove('hidden');
            } else {
                groupFactor.classList.add('hidden');
            }
        }
        
        // Cacher le message de succès de l'ancienne génération
        document.getElementById('success-msg').classList.add('hidden');
    },

    // Afficher le message de succès une fois le fichier téléchargé
    showSuccess: (fileName) => {
        const msg = document.getElementById('success-msg');
        document.getElementById('filename-display').innerText = fileName;
        msg.classList.remove('hidden');
    }
};