/**
 * UBL-GENERATOR.JS - L'usine d'assemblage du fichier XML
 * Gère tous les cas d'usage de la FNFE.
 */

const UBLGenerator = {

    generateFile: () => {
        // 1. Récupération des saisies
        const trigramme = document.getElementById('trigramme').value.toUpperCase() || "UNK";
        const usecase = document.getElementById('usecase').value;
        const targetPlatform = document.getElementById('target-platform').value;
        
        // Paramètres avancés (Sécurisés avec fallback)
        const supplierId = document.getElementById('adv-supplier') ? document.getElementById('adv-supplier').value : null;
        const buyerId = document.getElementById('adv-buyer') ? document.getElementById('adv-buyer').value : null;
        const factorId = document.getElementById('adv-factor') ? document.getElementById('adv-factor').value : null;

        const data = window.APP_DATA.companies;
        const supplier = supplierId ? data.suppliers.find(s => s.id === supplierId) : data.suppliers[0];
        const buyer = buyerId ? data.buyers.find(b => b.id === buyerId) : data.buyers[0];
        const factor = factorId ? data.factors.find(f => f.id === factorId) : data.factors[0];

        if (!supplier || !buyer) {
            alert("Erreur de chargement des données d'entreprise."); return;
        }

        // 2. Calcul des Dates et Numéro
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        
        const dateStr = `${yy}${MM}${dd}${HH}${mm}${ss}`;
        const numeroFacture = `${trigramme}-${dateStr}`;
        const dateFactureXML = `${now.getFullYear()}-${MM}-${dd}`;
        
        // Date échéance (Cas 2, 5, 7 = Date facture car déjà payé)
        const echeance = new Date(now);
        if (["2", "5", "7"].includes(usecase)) {
            echeance.setDate(now.getDate());
        } else {
            echeance.setDate(now.getDate() + 30);
        }
        const dateEcheanceXML = `${echeance.getFullYear()}-${String(echeance.getMonth()+1).padStart(2,'0')}-${String(echeance.getDate()).padStart(2,'0')}`;

        // 3. Définition des métadonnées selon le cas
        let invoiceTypeCode = "380";
        let profileId = "S1"; // Standard
        
        if (usecase === "1" || usecase === "2" || usecase === "4" || usecase === "7") profileId = "B2"; // Cadres Business
        if (usecase === "3") { invoiceTypeCode = "386"; profileId = "A1"; } // Acompte
        if (usecase === "5") profileId = "S2"; // Note de frais
        if (usecase === "8") invoiceTypeCode = "393"; // Affacturage

        // Notes de base
        const notes = [
            "#BAR#B2B",
            "#PMT#Indemnite forfaitaire pour frais de recouvrement : 40 euros.",
            "#PMD#En cas de retard de paiement, des penalites egales a 3 fois le taux d'interet legal seront appliquees.",
            "#AAB#Pas d'escompte pour paiement anticipe."
        ];

        // ==========================================
        // 4. ASSEMBLAGE DU FICHIER XML
        // ==========================================
        let xmlContent = "";

        // A. En-tête
        xmlContent += UBLTemplates.getHeader(numeroFacture, dateFactureXML, dateEcheanceXML, invoiceTypeCode, profileId, notes);
        
        // B. Tiers (Fournisseur / Client)
        xmlContent += UBLTemplates.getSupplierParty(supplier);
        xmlContent += UBLTemplates.getCustomerParty(buyer);

        // C. Tiers Spécifiques (PayeeParty, PaymentMeans)
        if (usecase === "2") {
            // Tiers payeur (Stark Industries)
            xmlContent += UBLTemplates.getPayeeParty("99999999900001", "Stark Industries", "999999999");
        } else if (usecase === "5") {
            // Employé (Note de frais)
            xmlContent += UBLTemplates.getPayeeParty("00000000000001", "DUPONT Jean (Employe)", "000000000");
        } else if (usecase === "7") {
            // Carte logée
            xmlContent += UBLTemplates.getPaymentMeans("48");
        } else if (usecase === "8" && factor) {
            // Factor
            xmlContent += UBLTemplates.getPayeeParty(`${factor.siren}00001`, factor.name, factor.siren);
        }

        // D. Lignes et Totaux spécifiques par Cas
        switch(usecase) {
            case "0": // Standard
            case "8": // Affacturage (Mêmes montants, juste PayeeParty différent)
                let itemName = usecase === "0" ? "Prestation standard sans commande" : "Prestation cedee au Factor";
                xmlContent += UBLTemplates.getTaxTotal("1000.00", "200.00");
                xmlContent += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "0.00", "1200.00");
                xmlContent += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", itemName, "1000.00");
                break;

            case "1": // Multi-commandes (3-Way Match)
                xmlContent += UBLTemplates.getTaxTotal("3250.00", "650.00");
                xmlContent += UBLTemplates.getLegalMonetaryTotal("3250.00", "3250.00", "3900.00", "0.00", "3900.00");
                xmlContent += UBLTemplates.getInvoiceLine("1", "10.00", "1500.00", "Licences logicielles", "150.00", {line: "10", id: "PO-1001"});
                xmlContent += UBLTemplates.getInvoiceLine("2", "2.00", "1750.00", "Jours de consulting Fluxym", "875.00", {line: "20", id: "PO-1002"});
                break;

            case "2": // Tiers Payeur (Tout est prépayé, reste à payer = 0)
            case "5": // Note de frais (Tout est prépayé par l'employé)
            case "7": // Carte logée (Tout est prépayé par carte)
                let itemDesc = "Prestation";
                if(usecase==="5") itemDesc = "Note de Frais (Billet Train)";
                if(usecase==="7") itemDesc = "Achat Materiel (Carte Logee)";
                
                xmlContent += UBLTemplates.getTaxTotal("1000.00", "200.00");
                // Prepaid = 1200.00, Payable = 0.00
                xmlContent += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "1200.00", "0.00");
                xmlContent += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", itemDesc, "1000.00");
                break;

            case "3": // Acompte (Facturation partielle)
                xmlContent += UBLTemplates.getTaxTotal("500.00", "100.00");
                xmlContent += UBLTemplates.getLegalMonetaryTotal("500.00", "500.00", "600.00", "0.00", "600.00");
                xmlContent += UBLTemplates.getInvoiceLine("1", "1.00", "500.00", "Acompte 50% sur projet", "500.00");
                break;

            case "4": // Prise en charge partielle (Reste à payer < TTC)
                xmlContent += UBLTemplates.getTaxTotal("1000.00", "200.00");
                // Prepaid = 500.00 (Prise en charge), Payable = 700.00 (Reste à payer)
                xmlContent += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "500.00", "700.00");
                xmlContent += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", "Materiel avec subvention 500e", "1000.00");
                break;
        }

        // E. Fermeture du fichier
        xmlContent += UBLTemplates.getFooter();


        // ==========================================
        // 5. TÉLÉCHARGEMENT DU FICHIER SUR LE PC
        // ==========================================
        const blob = new Blob([xmlContent], { type: "application/xml" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        let nomExplicatif = window.APP_DATA.pedagogy[usecase].title.replace(/[^a-zA-Z0-9]/g, '_');
        const platformSuffix = targetPlatform === 'basware' ? '_Basware' : '_Esker';
        
        const fileName = `${numeroFacture}_Cas_${usecase}_${nomExplicatif}${platformSuffix}.xml`;
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if(typeof UIManager !== 'undefined') {
            UIManager.showSuccess(fileName);
        }
    }
};