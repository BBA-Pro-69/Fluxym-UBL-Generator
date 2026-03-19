/**
 * UBL-TEMPLATES.JS - La bibliothèque de briques XML
 */

const UBLTemplates = {

    // 1. En-tête dynamique selon le cas (ProfileID, InvoiceTypeCode, Notes)
    getHeader: (numeroFacture, dateFacture, dateEcheance, invoiceTypeCode, profileId, notes) => `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2" xmlns:udt="urn:oasis:names:specification:ubl:schema:xsd:UnqualifiedDataTypes-2">
\t<cbc:UBLVersionID>2.1</cbc:UBLVersionID>
\t<cbc:CustomizationID>urn:cen.eu:en16931:2017</cbc:CustomizationID>
\t<cbc:ProfileID>${profileId}</cbc:ProfileID>
\t<cbc:ID>${numeroFacture}</cbc:ID>
\t<cbc:IssueDate>${dateFacture}</cbc:IssueDate>
\t<cbc:DueDate>${dateEcheance}</cbc:DueDate>
\t<cbc:InvoiceTypeCode>${invoiceTypeCode}</cbc:InvoiceTypeCode>
${notes.map(n => `\t<cbc:Note>${n}</cbc:Note>`).join('\n')}
\t<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
\t<cbc:TaxCurrencyCode>EUR</cbc:TaxCurrencyCode>`,

    // 2. Bloc Fournisseur
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

    // 3. Bloc Acheteur
    getCustomerParty: (buyer) => `
\t<cac:AccountingCustomerParty>
\t\t<cac:Party>
\t\t\t<cbc:EndpointID schemeID="0225">${buyer.siren}</cbc:EndpointID>
\t\t\t<cac:PartyIdentification><cbc:ID schemeID="0009">${buyer.siren}${buyer.nic || "00001"}</cbc:ID></cac:PartyIdentification>
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

    // 4. Bloc PayeeParty (Tiers Payeur, Factor, Employé pour Notes de Frais)
    getPayeeParty: (id, name, siren) => `
\t<cac:PayeeParty>
\t\t<cac:PartyIdentification><cbc:ID schemeID="0009">${id}</cbc:ID></cac:PartyIdentification>
\t\t<cac:PartyName><cbc:Name>${name}</cbc:Name></cac:PartyName>
\t\t<cac:PartyLegalEntity><cbc:CompanyID schemeID="0002">${siren}</cbc:CompanyID></cac:PartyLegalEntity>
\t</cac:PayeeParty>`,

    // 5. Bloc de paiement (PaymentMeans) pour les cas de cartes logées (Cas 7)
    getPaymentMeans: (code) => `
\t<cac:PaymentMeans>
\t\t<cbc:PaymentMeansCode>${code}</cbc:PaymentMeansCode>
\t</cac:PaymentMeans>`,

    // 6. Bloc TaxTotal
    getTaxTotal: (taxableAmount, taxAmount, taxPercent = "20.00") => `
\t<cac:TaxTotal>
\t\t<cbc:TaxAmount currencyID="EUR">${taxAmount}</cbc:TaxAmount>
\t\t<cac:TaxSubtotal>
\t\t\t<cbc:TaxableAmount currencyID="EUR">${taxableAmount}</cbc:TaxableAmount>
\t\t\t<cbc:TaxAmount currencyID="EUR">${taxAmount}</cbc:TaxAmount>
\t\t\t<cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>${taxPercent}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
\t\t</cac:TaxSubtotal>
\t</cac:TaxTotal>`,

    // 7. Bloc Totaux Monétaires (LegalMonetaryTotal) avec gestion des acomptes/prépayés
    getLegalMonetaryTotal: (lineExtAmt, taxExclusiveAmt, taxInclusiveAmt, prepaidAmt, payableAmt) => `
\t<cac:LegalMonetaryTotal>
\t\t<cbc:LineExtensionAmount currencyID="EUR">${lineExtAmt}</cbc:LineExtensionAmount>
\t\t<cbc:TaxExclusiveAmount currencyID="EUR">${taxExclusiveAmt}</cbc:TaxExclusiveAmount>
\t\t<cbc:TaxInclusiveAmount currencyID="EUR">${taxInclusiveAmt}</cbc:TaxInclusiveAmount>
${prepaidAmt !== "0.00" ? `\t\t<cbc:PrepaidAmount currencyID="EUR">${prepaidAmt}</cbc:PrepaidAmount>\n` : ""}\t\t<cbc:PayableAmount currencyID="EUR">${payableAmt}</cbc:PayableAmount>
\t</cac:LegalMonetaryTotal>`,

    // 8. Ligne de Facture (InvoiceLine)
    getInvoiceLine: (id, qty, amount, itemName, price, orderRef = null) => `
\t<cac:InvoiceLine>
\t\t<cbc:ID>${id}</cbc:ID>
\t\t<cbc:InvoicedQuantity unitCode="C62">${qty}</cbc:InvoicedQuantity>
\t\t<cbc:LineExtensionAmount currencyID="EUR">${amount}</cbc:LineExtensionAmount>
${orderRef ? `\t\t<cac:OrderLineReference><cbc:LineID>${orderRef.line}</cbc:LineID><cac:OrderReference><cbc:ID>${orderRef.id}</cbc:ID></cac:OrderReference></cac:OrderLineReference>\n` : ""}\t\t<cac:Item>
\t\t\t<cbc:Name>${itemName}</cbc:Name>
\t\t\t<cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>20.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>
\t\t</cac:Item>
\t\t<cac:Price><cbc:PriceAmount currencyID="EUR">${price}</cbc:PriceAmount></cac:Price>
\t</cac:InvoiceLine>`,

    getFooter: () => `\n</Invoice>`
};