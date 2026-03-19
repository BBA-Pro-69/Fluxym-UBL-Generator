/**
 * UBL-TEMPLATES.JS - La bibliothèque de briques XML
 * Contient les fonctions qui renvoient des bouts de texte XML préformatés.
 * On utilise les `backticks` (`) pour pouvoir insérer des variables ${commeCeci}.
 */

const UBLTemplates = {

    // 1. En-tête de la facture (Identique pour presque tous les cas)
    getHeader: (numeroFacture, dateFacture, dateEcheance, invoiceTypeCode) => `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:udt="urn:oasis:names:specification:ubl:schema:xsd:UnqualifiedDataTypes-2">
\t<cbc:UBLVersionID>2.1</cbc:UBLVersionID>
\t<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>
\t<cbc:ProfileID>S1</cbc:ProfileID>
\t<cbc:ID>${numeroFacture}</cbc:ID>
\t<cbc:IssueDate>${dateFacture}</cbc:IssueDate>
\t<cbc:DueDate>${dateEcheance}</cbc:DueDate>
\t<cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
\t<cbc:Note>#BAR#B2B</cbc:Note>
\t<cbc:Note>#PMT#Indemnite forfaitaire pour frais de recouvrement : 40 euros.</cbc:Note>
\t<cbc:Note>#PMD#En cas de retard de paiement, des penalites egales a 3 fois le taux d'interet legal seront appliquees.</cbc:Note>
\t<cbc:Note>#AAB#Pas d'escompte pour paiement anticipe.</cbc:Note>
\t<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
\t<cbc:TaxCurrencyCode>EUR</cbc:TaxCurrencyCode>`,

    // 2. Bloc Fournisseur Dynamique (Récupère les infos du JSON companies.json)
    getSupplierParty: (supplier) => `
\t<cac:AccountingSupplierParty>
\t\t<cac:Party>
\t\t\t<cbc:EndpointID schemeID="0225">${supplier.siren}</cbc:EndpointID>
\t\t\t<cac:PartyIdentification><cbc:ID schemeID="0009">${supplier.siren}00001</cbc:ID></cac:PartyIdentification>
\t\t\t<cac:PartyName><cbc:Name>${supplier.name}</cbc:Name></cac:PartyName>
\t\t\t<cac:PostalAddress>
\t\t\t\t<cbc:StreetName>${supplier.address.street}</cbc:StreetName>
\t\t\t\t<cbc:CityName>${supplier.address.city}</cbc:CityName>
\t\t\t\t<cbc:PostalZone>${supplier.address.zip}</cbc:PostalZone>
\t\t\t\t<cac:Country><cbc:IdentificationCode>${supplier.address.country}</cbc:IdentificationCode></cac:Country>
\t\t\t</cac:PostalAddress>
\t\t\t<cac:PartyTaxScheme>
\t\t\t\t<cbc:CompanyID>${supplier.vatNumber}</cbc:CompanyID>
\t\t\t\t<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
\t\t\t</cac:PartyTaxScheme>
\t\t\t<cac:PartyLegalEntity>
\t\t\t\t<cbc:RegistrationName>${supplier.legalName}</cbc:RegistrationName>
\t\t\t\t<cbc:CompanyID schemeID="0002">${supplier.siren}</cbc:CompanyID>
\t\t\t</cac:PartyLegalEntity>
\t\t</cac:Party>
\t</cac:AccountingSupplierParty>`,

    // 3. Bloc Acheteur Dynamique
    getCustomerParty: (buyer) => `
\t<cac:AccountingCustomerParty>
\t\t<cac:Party>
\t\t\t<cbc:EndpointID schemeID="0225">${buyer.siren}</cbc:EndpointID>
\t\t\t<cac:PartyIdentification><cbc:ID schemeID="0009">${buyer.siren}${buyer.nic}</cbc:ID></cac:PartyIdentification>
\t\t\t<cac:PartyName><cbc:Name>${buyer.name}</cbc:Name></cac:PartyName>
\t\t\t<cac:PostalAddress>
\t\t\t\t<cbc:StreetName>${buyer.address.street}</cbc:StreetName>
\t\t\t\t<cbc:CityName>${buyer.address.city}</cbc:CityName>
\t\t\t\t<cbc:PostalZone>${buyer.address.zip}</cbc:PostalZone>
\t\t\t\t<cac:Country><cbc:IdentificationCode>${buyer.address.country}</cbc:IdentificationCode></cac:Country>
\t\t\t</cac:PostalAddress>
\t\t\t<cac:PartyTaxScheme>
\t\t\t\t<cbc:CompanyID>${buyer.vatNumber}</cbc:CompanyID>
\t\t\t\t<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
\t\t\t</cac:PartyTaxScheme>
\t\t\t<cac:PartyLegalEntity>
\t\t\t\t<cbc:RegistrationName>${buyer.legalName}</cbc:RegistrationName>
\t\t\t\t<cbc:CompanyID schemeID="0002">${buyer.siren}</cbc:CompanyID>
\t\t\t</cac:PartyLegalEntity>
\t\t</cac:Party>
\t</cac:AccountingCustomerParty>`,

    // 4. Bloc Factor (Affacturage - Cas 8)
    getPayeeParty: (factor) => `
\t<cac:PayeeParty>
\t\t<cac:PartyIdentification><cbc:ID schemeID="0009">${factor.siren}00001</cbc:ID></cac:PartyIdentification>
\t\t<cac:PartyName><cbc:Name>${factor.name}</cbc:Name></cac:PartyName>
\t\t<cac:PartyLegalEntity><cbc:CompanyID schemeID="0002">${factor.siren}</cbc:CompanyID></cac:PartyLegalEntity>
\t</cac:PayeeParty>`,

    // 5. Bloc de fermeture (Fin du fichier)
    getFooter: () => `\n</Invoice>`

};