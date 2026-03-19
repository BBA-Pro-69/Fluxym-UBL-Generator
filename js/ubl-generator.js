/**
 * UBL-GENERATOR.JS - L'usine d'assemblage du fichier XML
 * Prend les choix de l'utilisateur, assemble les briques (UBLTemplates), et lance le téléchargement.
 */

const UBLGenerator = {

    generateFile: () => {
        // 1. Récupération des saisies utilisateur
        const trigramme = document.getElementById('trigramme').value.toUpperCase() || "UNK";
        const usecase = document.getElementById('usecase').value;
        const targetPlatform = document.getElementById('target-platform').value;
        
        // Paramètres avancés (Fournisseur, Acheteur, Factor)
        const supplierId = document.getElementById('adv-supplier').value;
        const buyerId = document.getElementById('adv-buyer').value;
        const factorId = document.getElementById('adv-factor') ? document.getElementById('adv-factor').value : null;

        // Récupération des objets complets depuis nos données (companies.json)
        const data = window.APP_DATA.companies;
        const supplier = data.suppliers.find(s => s.id === supplierId) || data.suppliers[0];
        const actualBuyer = data.buyers.find(b => b.id === buyerId) || data.buyers[0];
        const factor = factorId ? data.factors.find(f => f.id === factorId) : data.factors[0];
        
        // 2. Calcul des Dates et Numéro de facture
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
        
        const echeance = new Date(now);
        echeance.setDate(now.getDate() + 30); // +30 jours par défaut
        const dateEcheanceXML = `${echeance.getFullYear()}-${String(echeance.getMonth()+1).padStart(2,'0')}-${String(echeance.getDate()).padStart(2,'0')}`;

        // 3. Définition du Type de Facture
        let invoiceTypeCode = "380"; // Standard
        if (usecase === "3") invoiceTypeCode = "386"; // Acompte
        if (usecase === "8") invoiceTypeCode = "393"; // Affacturage

        // ==========================================
        // 4. ASSEMBLAGE DU FICHIER XML
        // ==========================================
        let xmlContent = "";

        // A. En-tête
        xmlContent += UBLTemplates.getHeader(numeroFacture, dateFactureXML, dateEcheanceXML, invoiceTypeCode);
        
        // B. Tiers (Expéditeur et Destinataire dynamiques !)
        xmlContent += UBLTemplates.getSupplierParty(supplier);
        xmlContent += UBLTemplates.getCustomerParty(actualBuyer);

        // C. Tiers Payeur (Si Cas 8 Affacturage)
        if (usecase === "8" && factor) {
            xmlContent += UBLTemplates.getPayeeParty(factor);
        }

        // D. Lignes et Totaux (La partie métier propre à chaque cas)
        if (usecase === "0" || usecase === "8") {
            // Cas 0 (Standard) ou Cas 8 (Affacturage) : 1 ligne simple, 1000€
            let itemName = usecase === "0" ? "Prestation standard sans commande" : "Prestation cedee au Factor";
            
            xmlContent += `
\t<cac:TaxTotal>
\t\t<cbc:TaxAmount currencyID="EUR">200.00</cbc:TaxAmount>
\t\t<cac:TaxSubtotal>
\t\t\t<cbc:TaxableAmount currencyID="EUR">1000.00</cbc:TaxableAmount>
\t\t\t<cbc:TaxAmount currencyID="EUR">200.00</cbc:TaxAmount>
\t\t\t<cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
\t\t</cac:TaxSubtotal>
\t</cac:TaxTotal>
\t<cac:LegalMonetaryTotal>
\t\t<cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount>
\t\t<cbc:TaxExclusiveAmount currencyID="EUR">1000.00</cbc:TaxExclusiveAmount>
\t\t<cbc:TaxInclusiveAmount currencyID="EUR">1200.00</cbc:TaxInclusiveAmount>
\t\t<cbc:PayableAmount currencyID="EUR">1200.00</cbc:PayableAmount>
\t</cac:LegalMonetaryTotal>
\t<cac:InvoiceLine>
\t\t<cbc:ID>1</cbc:ID>
\t\t<cbc:InvoicedQuantity unitCode="C62">1.00</cbc:InvoicedQuantity>
\t\t<cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount>
\t\t<cac:Item>
\t\t\t<cbc:Name>${itemName}</cbc:Name>
\t\t\t<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
\t\t</cac:Item>
\t\t<cac:Price><cbc:PriceAmount currencyID="EUR">1000.00</cbc:PriceAmount></cac:Price>
\t</cac:InvoiceLine>`;
        } 
        else if (usecase === "1") {
            // Cas 1 (Multi-commandes) : 2 lignes pointant vers PO-1001 et PO-1002
            xmlContent += `
\t<cac:TaxTotal>
\t\t<cbc:TaxAmount currencyID="EUR">650.00</cbc:TaxAmount>
\t\t<cac:TaxSubtotal>
\t\t\t<cbc:TaxableAmount currencyID="EUR">3250.00</cbc:TaxableAmount>
\t\t\t<cbc:TaxAmount currencyID="EUR">650.00</cbc:TaxAmount>
\t\t\t<cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
\t\t</cac:TaxSubtotal>
\t</cac:TaxTotal>
\t<cac:LegalMonetaryTotal>
\t\t<cbc:LineExtensionAmount currencyID="EUR">3250.00</cbc:LineExtensionAmount>
\t\t<cbc:TaxExclusiveAmount currencyID="EUR">3250.00</cbc:TaxExclusiveAmount>
\t\t<cbc:TaxInclusiveAmount currencyID="EUR">3900.00</cbc:TaxInclusiveAmount>
\t\t<cbc:PayableAmount currencyID="EUR">3900.00</cbc:PayableAmount>
\t</cac:LegalMonetaryTotal>
\t<cac:InvoiceLine>
\t\t<cbc:ID>1</cbc:ID>
\t\t<cbc:InvoicedQuantity unitCode="C62">10.00</cbc:InvoicedQuantity>
\t\t<cbc:LineExtensionAmount currencyID="EUR">1500.00</cbc:LineExtensionAmount>
\t\t<cac:OrderLineReference><cbc:LineID>10</cbc:LineID><cac:OrderReference><cbc:ID>PO-1001</cbc:ID></cac:OrderReference></cac:OrderLineReference>
\t\t<cac:Item>
\t\t\t<cbc:Name>Licences logicielles</cbc:Name>
\t\t\t<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
\t\t</cac:Item>
\t\t<cac:Price><cbc:PriceAmount currencyID="EUR">150.00</cbc:PriceAmount></cac:Price>
\t</cac:InvoiceLine>
\t<cac:InvoiceLine>
\t\t<cbc:ID>2</cbc:ID>
\t\t<cbc:InvoicedQuantity unitCode="C62">2.00</cbc:InvoicedQuantity>
\t\t<cbc:LineExtensionAmount currencyID="EUR">1750.00</cbc:LineExtensionAmount>
\t\t<cac:OrderLineReference><cbc:LineID>20</cbc:LineID><cac:OrderReference><cbc:ID>PO-1002</cbc:ID></cac:OrderReference></cac:OrderLineReference>
\t\t<cac:Item>
\t\t\t<cbc:Name>Jours de consulting Fluxym</cbc:Name>
\t\t\t<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
\t\t</cac:Item>
\t\t<cac:Price><cbc:PriceAmount currencyID="EUR">875.00</cbc:PriceAmount></cac:Price>
\t</cac:InvoiceLine>`;
        }

        // E. Fermeture du fichier
        xmlContent += UBLTemplates.getFooter();


        // ==========================================
        // 5. TÉLÉCHARGEMENT DU FICHIER SUR LE PC
        // ==========================================
        const blob = new Blob([xmlContent], { type: "application/xml" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        let nomExplicatif = "Standard";
        if (usecase === "1") nomExplicatif = "Multi-Commande";
        if (usecase === "8") nomExplicatif = "Affacturage";

        // Format de nom : BBA-260319162055_Cas d'usage 0 - Standard_Esker.xml
        const platformSuffix = targetPlatform === 'basware' ? '_Basware' : '_Esker';
        const fileName = `${numeroFacture}_Cas d'usage ${usecase} - ${nomExplicatif}${platformSuffix}.xml`;
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyage mémoire
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // 6. Succès ! (Demande à ui-manager d'afficher le bandeau vert)
        if(typeof UIManager !== 'undefined') {
            UIManager.showSuccess(fileName);
        }
    }
};