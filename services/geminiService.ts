import { GoogleGenAI, Type } from "@google/genai";
import { ProductDetails, GeneratedContent, Testimonial, UiTranslation, PageTone } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DISCLAIMER_BASE = "Il nostro sito web agisce esclusivamente come affiliato e si concentra sulla promozione dei prodotti tramite campagne pubblicitarie. Non ci assumiamo alcuna responsabilità per la spedizione, la qualità o qualsiasi altra questione riguardante i prodotti venduti tramite link di affiliazione. Ti preghiamo di notare che le immagini utilizzate a scopo illustrativo potrebbero non corrispondere alla reale immagine del prodotto acquistato. Ti invitiamo a contattare il servizio assistenza clienti dopo aver inserito i dati nel modulo per chiedere qualsiasi domanda o informazione sul prodotto prima di confermare l’ordine. Ti informiamo inoltre che i prodotti in omaggio proposti sul sito possono essere soggetti a disponibilità limitata, senza alcuna garanzia di disponibilità da parte del venditore che spedisce il prodotto. Ricorda che, qualora sorgessero problemi relativi alle spedizioni o alla qualità dei prodotti, la responsabilità ricade direttamente sull’azienda fornitrice.";

const COMMON_UI_DEFAULTS: Partial<UiTranslation> = {
    cardErrorTitle: "Attenzione",
    cardErrorMsg: "Al momento non possiamo accettare pagamenti con carta. Scegli come procedere:",
    switchToCod: "Paga comodamente alla consegna",
    mostPopular: "Più scelto",
    giveUpOffer: "Rinuncia all'offerta e allo sconto",
    confirmCod: "Conferma Contrassegno",
    card: "Carta di Credito",
    backToShop: "Torna allo Shop",
    socialProof: "e altre persone hanno acquistato",
    shippingInsurance: "Assicurazione Spedizione",
    gadgetLabel: "Aggiungi Gadget",
    shippingInsuranceDescription: "Pacco protetto contro furto e smarrimento.",
    gadgetDescription: "Aggiungilo al tuo ordine.",
    freeLabel: "Gratis",
    summaryProduct: "Prodotto:",
    summaryShipping: "Spedizione:",
    summaryInsurance: "Assicurazione:",
    summaryGadget: "Gadget:",
    summaryTotal: "Totale:",
};

export const getLanguageConfig = (lang: string) => {
    const configs: Record<string, any> = {
        'Italiano': { currency: '€', locale: 'it-IT' },
        'Inglese': { currency: '$', locale: 'en-US' },
    };
    return configs[lang] || configs['Italiano'];
};

export const generateLandingPage = async (product: ProductDetails, reviewCount: number): Promise<GeneratedContent> => {
    const langConfig = getLanguageConfig(product.language);
    
    const prompt = `Genera un JSON per una landing page ad alta conversione. 
    Prodotto: ${product.name}
    Nicchia: ${product.niche}
    Descrizione: ${product.description}
    Lingua: ${product.language}
    Tone: ${product.tone}
    Genera ${product.featureCount || 3} paragrafi di caratteristiche.
    Includi ${reviewCount} recensioni realistiche.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    subheadline: { type: Type.STRING },
                    ctaText: { type: Type.STRING },
                    ctaSubtext: { type: Type.STRING },
                    announcementBarText: { type: Type.STRING },
                    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    features: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                showCta: { type: Type.BOOLEAN }
                            },
                            required: ["title", "description"]
                        }
                    },
                    testimonials: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                title: { type: Type.STRING },
                                text: { type: Type.STRING },
                                rating: { type: Type.NUMBER },
                                date: { type: Type.STRING },
                                role: { type: Type.STRING }
                            }
                        }
                    },
                    price: { type: Type.STRING },
                    originalPrice: { type: Type.STRING },
                },
                required: ["headline", "subheadline", "ctaText", "benefits", "features"]
            }
        }
    });

    const baseContent = JSON.parse(response.text || '{}') as GeneratedContent;
    
    return {
        ...baseContent,
        language: product.language,
        currency: langConfig.currency,
        niche: product.niche,
        templateId: 'gadget-cod',
        backgroundColor: '#ffffff',
        buttonColor: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
        stockConfig: { enabled: true, quantity: 13 },
        socialProofConfig: { enabled: true, intervalSeconds: 10, maxShows: 4 },
        insuranceConfig: { enabled: true, label: "Assicurazione Spedizione", cost: "4.90", defaultChecked: true },
        gadgetConfig: { enabled: true, label: "Gadget Omaggio", cost: "0.00", defaultChecked: true },
        formConfiguration: [
            { id: 'name', label: 'Nome e Cognome', enabled: true, required: true, type: 'text' },
            { id: 'phone', label: 'Telefono', enabled: true, required: true, type: 'tel' },
            { id: 'address', label: 'Indirizzo e Civico', enabled: true, required: true, type: 'text' },
            { id: 'city', label: 'Città', enabled: true, required: true, type: 'text' },
            { id: 'cap', label: 'CAP', enabled: true, required: true, type: 'text' },
            { id: 'email', label: 'Email', enabled: true, required: true, type: 'email' },
            { id: 'notes', label: 'Note per il corriere', enabled: true, required: true, type: 'textarea' },
        ],
        uiTranslation: {
            ...COMMON_UI_DEFAULTS,
            reviews: "Recensioni",
            offer: "Offerta",
            onlyLeft: "Solo {x} rimasti",
            secure: "Sicuro",
            returns: "Resi",
            original: "Originale",
            express: "Espresso",
            warranty: "Garanzia",
            checkoutHeader: "Checkout",
            paymentMethod: "Metodo Pagamento",
            cod: "Pagamento alla Consegna",
            shippingInfo: "Info Spedizione",
            completeOrder: "Completa Ordine",
            orderReceived: "Ordine Ricevuto",
            orderReceivedMsg: "Il tuo ordine è stato ricevuto con successo.",
            techDesign: "Tecnologia & Design",
            discountLabel: "-50%",
            certified: "Acquisto Verificato",
            currencyPos: 'after',
            legalDisclaimer: DISCLAIMER_BASE,
            privacyPolicy: "Privacy Policy",
            termsConditions: "Termini e Condizioni",
            cookiePolicy: "Cookie Policy",
            rightsReserved: "Tutti i diritti riservati.",
            generatedPageNote: "Pagina generata con AI.",
            thankYouTitle: "Grazie {name}!",
            thankYouMsg: "Il tuo ordine è stato ricevuto. Un nostro operatore ti contatterà a breve al numero {phone} per confermare l'ordine."
        } as UiTranslation
    };
};

export const generateReviews = async (productName: string, lang: string, count: number): Promise<Testimonial[]> => { return []; };
export const translateLandingPage = async (content: GeneratedContent, targetLang: string): Promise<GeneratedContent> => { return content; };
export const generateActionImages = async (prompt: string): Promise<string[]> => { return []; };
