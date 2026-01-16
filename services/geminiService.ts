
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductDetails, GeneratedContent, FormFieldConfig, Testimonial, UiTranslation, PageTone, AIImageStyle } from "../types";

const DISCLAIMER_BASE = "Il nostro sito web agisce esclusivamente come affiliato e si concentra sulla promozione dei prodotti tramite campagne pubblicitarie. Non ci assumiamo alcuna responsabilità per la spedizione, la qualità o qualsiasi altra questione riguardante i prodotti venduti tramite link di affiliazione. Ti preghiamo di notare che le immagini utilizzate a scopo illustrativo potrebbero non corrispondere alla reale immagine del prodotto acquistato. Ti invitiamo a contattare il servizio assistenza clienti dopo aver inserito i dati nel modulo per chiedere qualsiasi domanda o informazione sul prodotto prima di confermare l’ordine. Ti informiamo inoltre che i prodotti in omaggio proposti sul sito possono essere soggetti a disponibilità limitata, senza alcuna garanzia di disponibilità da parte del venditore che spedisce il prodotto. Ricorda che, qualora sorgessero problemi relativi alle spedizioni o alla qualità dei prodotti, la responsabilità ricade direttamente sull’azienda fornitrice.";

const getLegalTranslation = (lang: string): string => {
    const translations: Record<string, string> = {
        'Italiano': DISCLAIMER_BASE,
        'Inglese': "Our website acts exclusively as an affiliate and focuses on promoting products through advertising campaigns. We assume no responsibility for shipping, quality, or any other issue regarding products sold through affiliate links. Please note that the images used for illustrative purposes may not correspond to the real image of the purchased product. We invite you to contact customer service after entering the data in the form to ask any questions or information about the product before confirming the order.",
    };
    return translations[lang] || translations['Italiano'];
};

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
        'Italiano': { currency: '€', locale: 'it-IT', country: 'Italia' },
        'Inglese': { currency: '$', locale: 'en-US', country: 'USA' },
        'Francese': { currency: '€', locale: 'fr-FR', country: 'Francia' },
        'Tedesco': { currency: '€', locale: 'de-DE', country: 'Germania' },
        'Spagnolo': { currency: '€', locale: 'es-ES', country: 'Spagna' },
        'Rumeno': { currency: 'lei', locale: 'ro-RO', country: 'Romania' },
        'Polacco': { currency: 'zł', locale: 'pl-PL', country: 'Polonia' },
        'Svedese': { currency: 'kr', locale: 'sv-SE', country: 'Svezia' },
        'Bulgaro': { currency: 'лв', locale: 'bg-BG', country: 'Bulgaria' },
        'Ungherese': { currency: 'Ft', locale: 'hu-HU', country: 'Ungheria' },
        'Greco': { currency: '€', locale: 'el-GR', country: 'Grecia' },
        'Croato': { currency: '€', locale: 'hr-HR', country: 'Croazia' },
    };
    return configs[lang] || { currency: '€', locale: 'en-US', country: 'International' };
};

const cleanJson = (text: any) => {
    if (typeof text !== 'string') return '{}';
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateLandingPage = async (product: ProductDetails, reviewCount: number): Promise<GeneratedContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langConfig = getLanguageConfig(product.language);
    
    const prompt = `Generate a high-converting landing page JSON for a product with the following details:
    Name: ${product.name}
    Niche: ${product.niche}
    Target: ${product.targetAudience}
    Description: ${product.description}
    Tone: ${product.tone}
    Language: ${product.language}
    Features Count: ${product.featureCount || 3}
    Currency Symbol: ${langConfig.currency}

    CRITICAL INSTRUCTION: All generated text MUST be in ${product.language}. 
    Translate EVERYTHING into ${product.language}, including internal labels and UI elements. 
    Ensure no Italian words remain.
    The JSON must follow the GeneratedContent interface structure.
    
    SPECIAL REQUEST: Generate exactly 2 short and punchy marketing announcements for the top bar. 
    One should be about an offer/shipping (e.g. "Free Shipping" or "50% Discount") 
    and one about product quality or a unique benefit.
    For each, suggest an icon from this list: truck, zap, star, clock, gift, shield, flame, bell.
    
    Also provide a fully translated 'uiTranslation' object based on common e-commerce terms in ${product.language}.`;

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
                    announcements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                icon: { type: Type.STRING }
                            },
                            required: ["text", "icon"]
                        }
                    },
                    featuresSectionTitle: { type: Type.STRING },
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
                    uiTranslation: { 
                        type: Type.OBJECT,
                        properties: {
                            shippingInsurance: { type: Type.STRING },
                            gadgetLabel: { type: Type.STRING },
                            nameLabel: { type: Type.STRING },
                            phoneLabel: { type: Type.STRING },
                            addressLabel: { type: Type.STRING },
                            cityLabel: { type: Type.STRING },
                            capLabel: { type: Type.STRING },
                            provinceLabel: { type: Type.STRING },
                            addressNumberLabel: { type: Type.STRING },
                            legalDisclaimer: { type: Type.STRING },
                            thankYouTitle: { type: Type.STRING },
                            thankYouMsg: { type: Type.STRING }
                        }
                    },
                    price: { type: Type.STRING },
                    originalPrice: { type: Type.STRING },
                },
                required: ["headline", "subheadline", "ctaText", "benefits", "features", "uiTranslation", "announcements"]
            }
        }
    });

    const responseText = response.text || '{}';
    const baseContent = JSON.parse(cleanJson(responseText)) as any;
    
    return {
        ...baseContent,
        language: product.language,
        currency: langConfig.currency,
        niche: product.niche,
        templateId: 'gadget-cod',
        colorScheme: 'blue',
        backgroundColor: '#ffffff',
        buttonColor: 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
        stockConfig: { enabled: true, quantity: 13 },
        socialProofConfig: { enabled: true, intervalSeconds: 10, maxShows: 4 },
        insuranceConfig: { enabled: true, label: baseContent.uiTranslation?.shippingInsurance || "Assicurazione Spedizione", cost: "4.90", defaultChecked: true },
        gadgetConfig: { enabled: true, label: baseContent.uiTranslation?.gadgetLabel || "Gadget Omaggio", cost: "0.00", defaultChecked: true },
        formConfiguration: [
            { id: 'name', label: baseContent.uiTranslation?.nameLabel || 'Nome e Cognome', enabled: true, required: true, type: 'text', width: 12, validationType: 'none' },
            { id: 'phone', label: baseContent.uiTranslation?.phoneLabel || 'Telefono', enabled: true, required: true, type: 'tel', width: 12, validationType: 'numeric' },
            { id: 'address', label: baseContent.uiTranslation?.addressLabel || 'Indirizzo', enabled: true, required: true, type: 'text', width: 9, validationType: 'none' },
            { id: 'address_number', label: baseContent.uiTranslation?.addressNumberLabel || 'N° Civico', enabled: true, required: true, type: 'text', width: 3, validationType: 'numeric' },
            { id: 'city', label: baseContent.uiTranslation?.cityLabel || 'Città', enabled: true, required: true, type: 'text', width: 8, validationType: 'none' },
            { id: 'province', label: baseContent.uiTranslation?.provinceLabel || 'Provincia (Sigla)', enabled: true, required: true, type: 'text', width: 4, validationType: 'alpha' },
            { id: 'cap', label: baseContent.uiTranslation?.capLabel || 'CAP', enabled: true, required: true, type: 'text', width: 12, validationType: 'numeric' },
        ],
        uiTranslation: {
            ...COMMON_UI_DEFAULTS,
            ...baseContent.uiTranslation,
            currencyPos: langConfig.currency === 'lei' || langConfig.currency === 'zł' || langConfig.currency === 'Ft' ? 'after' : 'before',
            legalDisclaimer: baseContent.uiTranslation?.legalDisclaimer || getLegalDisclaimerForLanguage(product.language),
        } as UiTranslation
    };
};

const getLegalDisclaimerForLanguage = (lang: string): string => {
    const disclaimers: Record<string, string> = {
        'Italiano': DISCLAIMER_BASE,
        'Inglese': "Our website acts exclusively as an affiliate and focuses on promoting products through advertising campaigns. We assume no responsibility for shipping, quality, or any other issue regarding products sold through affiliate links. Please note that the images used for illustrative purposes may not correspond to the real image of the purchased product. We invite you to contact customer service after entering the data in the form to ask any questions or information about the product before confirming the order.",
    };
    return disclaimers[lang] || disclaimers['Italiano'];
};

export const generateReviews = async (productName: string, lang: string, count: number): Promise<Testimonial[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Calcoliamo la data odierna per il prompt
    const today = new Date();
    const todayFormatted = today.toLocaleDateString(lang);

    const prompt = `Generate EXACTLY ${count} short, realistic customer reviews for a product named "${productName}" in ${lang}. 
    
    REFERENCE DATE: Today is ${todayFormatted}.
    
    CRITICAL DATE RULES:
    1. At least 3 reviews MUST be very recent, dated within the LAST 7 DAYS from today (${todayFormatted}).
    2. The VERY FIRST review in the returned list MUST be the most recent one (max 1-3 days ago).
    3. All other reviews should have dates ranging from 1 week ago up to 3 months ago.
    4. Format the dates naturally for the ${lang} locale (e.g., "2 giorni fa", "Ieri", or standard DD/MM/YYYY).
    
    Return as a JSON array of objects with name, title, text, rating (1-5), date, and role.
    Ensure the list is ALREADY SORTED from the most recent to the oldest to give immediate "freshness" to the customer.
    Ensure names are culturally appropriate for ${lang} speakers.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
            }
        }
    });

    const responseText = response.text || '[]';
    const reviews = JSON.parse(cleanJson(responseText));
    return reviews.slice(0, count);
};

export const translateLandingPage = async (content: GeneratedContent, targetLang: string): Promise<GeneratedContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langConfig = getLanguageConfig(targetLang);

    const featuresToMap = content.features || [];
    const testimonialsToMap = content.testimonials || [];
    const benefitsToMap = content.benefits || [];

    const textFieldsToTranslate = {
        headline: content.headline || '',
        subheadline: content.subheadline || '',
        ctaText: content.ctaText || '',
        ctaSubtext: content.ctaSubtext || '',
        announcements: content.announcements || [],
        benefits: benefitsToMap,
        features: featuresToMap.map(f => ({ title: f.title, description: f.description })),
        testimonials: testimonialsToMap.map(t => ({ name: t.name, title: t.title, text: t.text, role: t.role })),
        uiTranslation: content.uiTranslation || {},
        boxContent: content.boxContent ? { title: content.boxContent.title, items: content.boxContent.items } : undefined,
        formLabels: content.formConfiguration?.map(f => ({ id: f.id, label: f.label })),
        insuranceLabel: content.insuranceConfig?.label,
        gadgetLabel: content.gadgetConfig?.label
    };

    const prompt = `Translate the following landing page content into native, high-converting ${targetLang}. 
    CRITICAL: 
    1. Translate EVERY string value. No Italian allowed.
    2. The 'legalDisclaimer' must be a formal legal translation in ${targetLang}.
    3. Currency for this language is ${langConfig.currency}.
    4. Maintain the professional/persuasive marketing tone.
    
    Content: ${JSON.stringify(textFieldsToTranslate)}`;

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
                    announcements: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                icon: { type: Type.STRING }
                            }
                        }
                    },
                    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    features: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
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
                                role: { type: Type.STRING }
                            }
                        }
                    },
                    uiTranslation: { 
                        type: Type.OBJECT,
                        properties: {
                            legalDisclaimer: { type: Type.STRING },
                            thankYouTitle: { type: Type.STRING },
                            thankYouMsg: { type: Type.STRING },
                            shippingInsurance: { type: Type.STRING },
                            gadgetLabel: { type: Type.STRING },
                            reviews: { type: Type.STRING },
                            offer: { type: Type.STRING },
                            completeOrder: { type: Type.STRING }
                        }
                    },
                    formLabels: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                label: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    const responseText = response.text || '{}';
    const translatedFields = JSON.parse(cleanJson(responseText));
    
    return {
        ...content,
        ...translatedFields,
        language: targetLang,
        currency: langConfig.currency,
        features: featuresToMap.map((f, idx) => ({
            ...f,
            title: translatedFields.features?.[idx]?.title || f.title,
            description: translatedFields.features?.[idx]?.description || f.description
        })),
        testimonials: testimonialsToMap.map((t, idx) => ({
            ...t,
            name: translatedFields.testimonials?.[idx]?.name || t.name,
            title: translatedFields.testimonials?.[idx]?.title || t.title,
            text: translatedFields.testimonials?.[idx]?.text || t.text,
            role: translatedFields.testimonials?.[idx]?.role || t.role
        })),
        formConfiguration: content.formConfiguration?.map((field) => {
            const translatedLabel = translatedFields.formLabels?.find((fl: any) => fl.id === field.id)?.label;
            return { ...field, label: translatedLabel || field.label };
        }),
        insuranceConfig: content.insuranceConfig ? {
            ...content.insuranceConfig,
            label: translatedFields.uiTranslation?.shippingInsurance || content.insuranceConfig.label
        } : undefined,
        gadgetConfig: content.gadgetConfig ? {
            ...content.gadgetConfig,
            label: translatedFields.uiTranslation?.gadgetLabel || content.gadgetConfig.label
        } : undefined,
        uiTranslation: {
            ...COMMON_UI_DEFAULTS,
            ...(content.uiTranslation || {}),
            ...translatedFields.uiTranslation,
            currencyPos: langConfig.currency === '€' || langConfig.currency === '$' ? 'before' : 'after'
        }
    };
};

export const rewriteLandingPage = async (content: GeneratedContent, targetTone: PageTone): Promise<GeneratedContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const textFieldsToRewrite = {
        headline: content.headline || '',
        subheadline: content.subheadline || '',
        ctaText: content.ctaText || '',
        ctaSubtext: content.ctaSubtext || '',
        benefits: content.benefits || [],
        features: content.features?.map(f => ({ title: f.title, description: f.description })) || [],
    };

    const prompt = `Rewrite the following landing page content using a ${targetTone} tone. 
    Maintain the current language (${content.language}). 
    The goal is to increase conversions by adapting the persuasive style to the requested tone.
    Do not change the technical features of the product, only the creative copywriting.
    
    Content: ${JSON.stringify(textFieldsToRewrite)}`;

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
                    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    features: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    const responseText = response.text || '{}';
    const rewrittenFields = JSON.parse(cleanJson(responseText));
    
    return {
        ...content,
        ...rewrittenFields,
        features: content.features?.map((f, idx) => ({
            ...f,
            title: rewrittenFields.features?.[idx]?.title || f.title,
            description: rewrittenFields.features?.[idx]?.description || f.description
        }))
    };
};

export const generateActionImages = async (product: ProductDetails, styles: AIImageStyle[] = ['lifestyle'], count: number = 1): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const generateSingleImage = async (style: AIImageStyle, index: number): Promise<string> => {
        let stylePrompt = "";
        switch (style) {
            case 'lifestyle':
                stylePrompt = "Includi un essere umano che interagisce con il prodotto in un contesto d'uso naturale e realistico.";
                break;
            case 'technical':
                stylePrompt = "Uno schema tecnico professionale, un'immagine macro dettagliata delle componenti o un'esploso del prodotto in stile ingegneristico.";
                break;
            case 'informative':
                stylePrompt = "Un'immagine informativa stile infografica che evidenzia i vantaggi principali del prodotto, con un look pulito ed educativo.";
                break;
        }

        const parts: any[] = [
            { text: `Genera un'immagine pubblicitaria professionale per il prodotto: ${product.name}. 
            Descrizione: ${product.description}. 
            STILE RICHIESTO: ${stylePrompt}
            L'immagine deve essere in alta risoluzione, stile e-commerce premium, pronta per una landing page di vendita.` }
        ];

        if (product.images && product.images.length > 0) {
            const refImg = product.images[0];
            if (refImg.startsWith('data:')) {
                const [mimeInfo, base64Data] = refImg.split(';base64,');
                const mimeType = mimeInfo.replace('data:', '');
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
                parts[0].text += " Usa l'immagine fornita come riferimento visivo per l'aspetto del prodotto.";
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Impossibile generare l'immagine AI.");
    };

    const finalStyles = styles.length > 0 ? styles : ['lifestyle' as AIImageStyle];
    const tasks = Array.from({ length: count }).map((_, idx) => generateSingleImage(finalStyles[idx % finalStyles.length], idx));
    return Promise.all(tasks);
};
