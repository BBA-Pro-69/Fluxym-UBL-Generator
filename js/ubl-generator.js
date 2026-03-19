/**
 * UBL-GENERATOR.JS - L'usine d'assemblage du fichier XML et CSV
 */

const UBLGenerator = {
    generateFile: () => {
        try {
            // 1. Récupération des saisies
            const trigramme = document.getElementById('trigramme').value.toUpperCase() || "UNK";
            const usecase = document.getElementById('usecase').value;
            const targetPlatform = document.getElementById('target-platform').value;
            
            const supplierId = document.getElementById('adv-supplier') ? document.getElementById('adv-supplier').value : null;
            const buyerId = document.getElementById('adv-buyer') ? document.getElementById('adv-buyer').value : null;
            const factorId = document.getElementById('adv-factor') ? document.getElementById('adv-factor').value : null;

            const data = window.APP_DATA.companies;
            const supplier = supplierId ? data.suppliers.find(s => s.id === supplierId) : data.suppliers[0];
            const buyer = buyerId ? data.buyers.find(b => b.id === buyerId) : data.buyers[0];
            const factor = factorId ? data.factors.find(f => f.id === factorId) : data.factors[0];

            if (!supplier || !buyer) {
                alert("Erreur: Données d'entreprise introuvables."); return;
            }

            // 2. Dates et Numéros
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const yyyy = now.getFullYear();
            const MM = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const HH = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            
            const dateStr = `${yy}${MM}${dd}${HH}${mm}${ss}`;
            const numeroFacture = `${trigramme}-${dateStr}`;
            const dateFactureXML = `${yyyy}-${MM}-${dd}`;
            
            const echeance = new Date(now);
            if (["2", "5", "7"].includes(usecase)) {
                echeance.setDate(now.getDate());
            } else {
                echeance.setDate(now.getDate() + 30);
            }
            const dateEcheanceXML = `${echeance.getFullYear()}-${String(echeance.getMonth()+1).padStart(2,'0')}-${String(echeance.getDate()).padStart(2,'0')}`;

            let nomExplicatif = "Export";
            if (window.APP_DATA.pedagogy && window.APP_DATA.pedagogy[usecase] && window.APP_DATA.pedagogy[usecase].title) {
                nomExplicatif = window.APP_DATA.pedagogy[usecase].title.replace(/[^a-zA-Z0-9]/g, '_');
            }
            const platformSuffix = targetPlatform === 'basware' ? '_Basware' : '';

            // 3. Configuration des métadonnées
            let invoiceTypeCode = "380";
            let profileId = "S1";
            if (usecase === "1" || usecase === "2" || usecase === "4" || usecase === "7" || usecase === "A" || usecase === "B") profileId = "B1"; 
            if (usecase === "3") { invoiceTypeCode = "386"; profileId = "A1"; }
            if (usecase === "5") profileId = "S2";
            if (usecase === "8") invoiceTypeCode = "393";

            const notes = [
                "#BAR#B2B",
                "#PMT#Indemnite forfaitaire pour frais de recouvrement : 40 euros.",
                "#PMD#En cas de retard de paiement, des penalites egales a 3 fois le taux d'interet legal seront appliquees.",
                "#AAB#Pas d'escompte pour paiement anticipe."
            ];

        // ==========================================
        // FONCTION INTERNE : Générateur XML Flexible
        // ==========================================
        const buildXML = (numFacture, typeCode, isCreditNote = false, refOriginale = null, poNumber = null) => {
            let xml = UBLTemplates.getHeader(numFacture, dateFactureXML, dateEcheanceXML, typeCode, profileId, notes, isCreditNote);
            
            if (isCreditNote && refOriginale) {
                xml += UBLTemplates.getBillingReference(refOriginale, dateFactureXML);
            }
            
            // L'ordre UBL strict : Supplier -> Customer -> Payee (si besoin) -> Tax -> LegalMonetary -> Lines
            xml += UBLTemplates.getSupplierParty(supplier);
            xml += UBLTemplates.getCustomerParty(buyer);

            // Cas spécifiques Tiers Payeurs etc
            if (usecase === "2") xml += UBLTemplates.getPayeeParty("99999999900001", "Stark Industries", "999999999");
            if (usecase === "5") xml += UBLTemplates.getPayeeParty("00000000000001", "DUPONT Jean (Employe)", "000000000");
            if (usecase === "7") xml += UBLTemplates.getPaymentMeans("48");
            if (usecase === "8" && factor) xml += UBLTemplates.getPayeeParty(`${factor.siren}00001`, factor.name, factor.siren);
            
            // --- LOGIQUE DES LIGNES ET TOTAUX ---
            if (isCreditNote) {
                // AVOIR : Annulation de la ligne 3 (6.32€)
                xml += UBLTemplates.getTaxTotal("6.32", "1.26");
                xml += UBLTemplates.getLegalMonetaryTotal("6.32", "6.32", "7.58", "0.00", "7.58");
                xml += UBLTemplates.getInvoiceLine("1", "-1.00", "6.32", "Annulation 1 unite CNT50922", "6.32", true, {line: "000003", id: poNumber});
            } 
            else if (usecase === "A" || usecase === "B") {
                // FACTURE INITIALE DES CAS A et B (Les 5 lignes de Master Data)
                xml += UBLTemplates.getTaxTotal("4934.70", "986.94");
                xml += UBLTemplates.getLegalMonetaryTotal("4934.70", "4934.70", "5921.64", "0.00", "5921.64");
                xml += UBLTemplates.getInvoiceLine("1", "1.00", "0.38", "CNT01160", "0.38", false, {line: "000001", id: poNumber});
                xml += UBLTemplates.getInvoiceLine("2", "100.00", "136.00", "CNT31421", "1.36", false, {line: "000002", id: poNumber});
                xml += UBLTemplates.getInvoiceLine("3", "186.00", "1175.52", "CNT50922", "6.32", false, {line: "000003", id: poNumber});
                xml += UBLTemplates.getInvoiceLine("4", "30.00", "2113.20", "CNTUSB20", "70.44", false, {line: "000010", id: poNumber});
                xml += UBLTemplates.getInvoiceLine("5", "1110.00", "1509.60", "CNT00443", "1.36", false, {line: "000020", id: poNumber});
            }
            else {
                // AUTRES CAS SIMPLES
                switch(usecase) {
                    case "0":
                    case "8":
                        let itemName = usecase === "0" ? "Prestation standard sans commande" : "Prestation cedee au Factor";
                        xml += UBLTemplates.getTaxTotal("1000.00", "200.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "0.00", "1200.00");
                        xml += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", itemName, "1000.00");
                        break;
                    case "1":
                        xml += UBLTemplates.getTaxTotal("3250.00", "650.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("3250.00", "3250.00", "3900.00", "0.00", "3900.00");
                        xml += UBLTemplates.getInvoiceLine("1", "10.00", "1500.00", "Licences logicielles", "150.00", false, {line: "10", id: "PO-1001"});
                        xml += UBLTemplates.getInvoiceLine("2", "2.00", "1750.00", "Jours de consulting Fluxym", "875.00", false, {line: "20", id: "PO-1002"});
                        break;
                    case "2":
                    case "5":
                    case "7":
                        let itemDesc = "Prestation";
                        if(usecase==="5") itemDesc = "Note de Frais (Billet Train)";
                        if(usecase==="7") itemDesc = "Achat Materiel (Carte Logee)";
                        xml += UBLTemplates.getTaxTotal("1000.00", "200.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "1200.00", "0.00");
                        xml += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", itemDesc, "1000.00");
                        break;
                    case "3":
                        xml += UBLTemplates.getTaxTotal("500.00", "100.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("500.00", "500.00", "600.00", "0.00", "600.00");
                        xml += UBLTemplates.getInvoiceLine("1", "1.00", "500.00", "Acompte 50% sur projet", "500.00");
                        break;
                    case "4":
                        xml += UBLTemplates.getTaxTotal("1000.00", "200.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "500.00", "700.00");
                        xml += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", "Materiel avec subvention 500e", "1000.00");
                        break;
                    default:
                        xml += UBLTemplates.getTaxTotal("1000.00", "200.00");
                        xml += UBLTemplates.getLegalMonetaryTotal("1000.00", "1000.00", "1200.00", "0.00", "1200.00");
                        xml += UBLTemplates.getInvoiceLine("1", "1.00", "1000.00", "Prestation generique", "1000.00");
                        break;
                }
            }
            
            xml += UBLTemplates.getFooter(isCreditNote);
            return xml;
        };
            // ==========================================
            // 4. ROUTAGE : ZIP vs FICHIER SIMPLE
            // ==========================================
            if (usecase === "A" || usecase === "B") {
                if (typeof JSZip === 'undefined') {
                    alert("Erreur: La librairie JSZip n'est pas chargée.");
                    return;
                }

                const zip = new JSZip();
                const originalInvoiceNum = `${numeroFacture}`; // Sans -INV
                const creditNoteNum = `${numeroFacture}-AV`;   // -AV
                const poNumber = `PO${yy}${MM}${dd}${HH}${mm}`;

                // CSV Master Data
                const orderDateCSV = `${yyyy}-${MM}-${dd}`;
                const supplierNameClean = supplier.name.replace(/[^a-zA-Z0-9]/g, '-');
                const csvBaseName = `${supplierNameClean}-${yyyy}-${MM}-${dd}-${HH}-${mm}`;

                let csvHeaders = UBLTemplates.getPOHeadersCSV();
                csvHeaders += UBLTemplates.getPOHeadersRow(poNumber, orderDateCSV);
                zip.file(`${csvBaseName}__PurchaseorderHeaders__.csv`, csvHeaders);

                let csvItems = UBLTemplates.getPOItemsCSV();
                csvItems += UBLTemplates.getPOItemsRow(poNumber);
                zip.file(`${csvBaseName}__PurchaseorderItems__.csv`, csvItems);

                // XMLs Facture et Avoir
                zip.file(`${originalInvoiceNum}_Cas ${usecase}_Facture_Litige${platformSuffix}.xml`, buildXML(originalInvoiceNum, "380", false, null, poNumber));
                zip.file(`${creditNoteNum}_Cas ${usecase}_Avoir${platformSuffix}.xml`, buildXML(creditNoteNum, "381", true, originalInvoiceNum, poNumber));

                zip.generateAsync({type:"blob"}).then(function(content) {
                    const url = window.URL.createObjectURL(content);
                    const a = document.createElement("a");
                    const zipName = `Pack_${trigramme}_Cas${usecase}_${nomExplicatif}_${yyyy}${MM}${dd}_${HH}${mm}${ss}.zip`;
                    a.href = url;
                    a.download = zipName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    if(typeof UIManager !== 'undefined') UIManager.showSuccess(zipName);
                });

            } else {
                // CAS SIMPLE
                const xmlContent = buildXML(numeroFacture, invoiceTypeCode, false, null, "PO-1001");
                const blob = new Blob([xmlContent], { type: "application/xml" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                const fileName = `${numeroFacture}_Cas_${usecase}_${nomExplicatif}${platformSuffix}.xml`;
                
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                if(typeof UIManager !== 'undefined') UIManager.showSuccess(fileName);
            }

        } catch (error) {
            console.error("Erreur critique :", error);
            alert("Erreur de génération ! " + error.message);
        }
    }
};