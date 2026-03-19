/**
 * APP.JS - Le Chef d'Orchestre
 * Initialise l'application une fois que le HTML est chargé.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Fluxym UBL Generator - Initialisation...");

    // 1. Initialiser le Header (Logo + Titre)
    UIManager.initHeader();

    // 2. Charger les données (Théorie & Entreprises) depuis les JSON
    Promise.all([
        fetch('./data/pedagogy.json').then(res => res.json()),
        fetch('./data/companies.json').then(res => res.json())
    ])
    .then(([pedagogyData, companiesData]) => {
        // Stocker les données globalement pour y accéder partout
        window.APP_DATA = {
            pedagogy: pedagogyData,
            companies: companiesData
        };

        console.log("Données chargées avec succès !");

        // 3. Initialiser l'interface avec les données chargées
        UIManager.populateSelects();
        UIManager.updateInfoBox(); // Afficher le premier cas par défaut

        // 4. Écouter les événements (clics, changements)
        document.getElementById('usecase').addEventListener('change', () => {
            UIManager.updateInfoBoxWithFade();
        });

        document.getElementById('btn-generate').addEventListener('click', () => {
            UBLGenerator.generateFile();
        });
        
    })
    .catch(error => {
        console.error("Erreur lors du chargement des données :", error);
        document.getElementById('theory-content').innerHTML = `
            <div style="color: red; padding: 1rem; background: #fee2e2; border-radius: 8px;">
                <strong>Erreur critique :</strong> Impossible de charger les fichiers de données JSON. 
                Vérifiez l'arborescence du projet ou que vous l'avez bien lancé via un serveur local (Live Server).
            </div>
        `;
    });
});