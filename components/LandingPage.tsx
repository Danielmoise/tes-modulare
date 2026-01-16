import React, { useState, useEffect, useRef } from 'react';
import { GeneratedContent, TemplateId, FormFieldConfig, TypographyConfig, Testimonial, AnnouncementItem } from '../types';
// Added Sparkles and Calendar to the lucide-react imports
import { CheckCircle, Star, ShoppingCart, ArrowRight, ShieldCheck, Clock, Menu, User, CheckSquare, Truck, MessageCircle, X, Phone, MapPin, FileText, Loader2, Mail, Home, Image as ImageIcon, CreditCard, Banknote, ChevronDown, Zap, RefreshCcw, Check, Lock, Package, Eye, ThumbsUp, Flame, AlertTriangle, ShoppingBag, Bell, Maximize2, Gift, Shield, Sparkles, Heart, Activity, Info, Microscope, Calendar } from 'lucide-react';

export interface OrderData {
    name?: string;
    phone?: string;
    price?: string;
}

interface LandingPageProps {
  content: GeneratedContent;
  thankYouSlug?: string; // Optional: if present, enables redirect logic
  onRedirect?: (data?: OrderData) => void; // Optional: handles redirect in preview mode without reload
  onPurchase?: (pageUrl: string) => void; // For live tracking
}

interface TemplateProps {
    content: GeneratedContent;
    onBuy: () => void;
    btnClass?: string;
    textClass?: string;
    styles: ReturnType<typeof getTypographyStyles>;
}

const TY_SUFFIXES: Record<string, string> = {
    'Italiano': '-grazie',
    'Inglese': '-thanks',
    'Francese': '-merci',
    'Tedesco': '-danke',
    'Austriaco': '-danke',
    'Spagnolo': '-gracias',
    'Portoghese': '-obrigado',
    'Olandese': '-bedankt',
    'Polacco': '-dziekuje',
    'Rumeno': '-multumesc',
    'Svedese': '-tack',
    'Bulgaro': '-blagodarya',
    'Greco': '-efcharisto',
    'Ungherese': '-koszonom',
    'Croato': '-hvala',
    'Serbo': '-hvala',
    'Slovacco': '-dakujem'
};

const getIconById = (id?: string, size: number = 14) => {
    const props = { className: "shrink-0", style: { width: `${size}px`, height: `${size}px` } };
    switch (id) {
        case 'truck': return <Truck {...props} />;
        case 'zap': return <Zap {...props} />;
        case 'star': return <Star {...props} />;
        case 'clock': return <Clock {...props} />;
        case 'gift': return <Gift {...props} />;
        case 'shield': return <Shield {...props} />;
        case 'flame': return <Flame {...props} />;
        case 'bell': return <Bell {...props} />;
        default: return <Truck {...props} />;
    }
};

const injectCustomScript = (html: string) => {
    if (!html) return;
    try {
        const range = document.createRange();
        const fragment = range.createContextualFragment(html);
        document.head.appendChild(fragment);
    } catch (e) {
        console.warn("Custom Script Injection Error:", e);
    }
};

const generateContentId = (text: string) => {
    return text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) : 'sku-default';
};

const trackEvent = (
    eventName: 'AddToCart' | 'Purchase' | 'Lead' | 'Contact' | 'ViewContent', 
    data?: { value?: number, currency?: string, content_id?: string }, 
    userInfo?: { email?: string, phone?: string }
) => {
};

const getTypographyStyles = (config?: TypographyConfig) => {
    const defaults = {
        fontFamily: 'sans',
        h1Size: 'lg',
        h2Size: 'md',
        bodySize: 'md'
    };
    
    const settings = { ...defaults, ...config };

    const fonts = {
        'sans': 'font-sans',
        'serif': 'font-serif',
        'mono': 'font-mono'
    };

    const h1Sizes = {
        'sm': 'text-xl md:text-3xl',
        'md': 'text-2xl md:text-4xl', 
        'lg': 'text-2xl md:text-5xl', 
        'xl': 'text-3xl md:text-6xl',
        '2xl': 'text-3xl md:text-7xl'
    };

    const h2Sizes = {
        'sm': 'text-lg md:text-xl',
        'md': 'text-lg md:text-2xl',
        'lg': 'text-xl md:text-3xl',
        'xl': 'text-2xl md:text-4xl'
    };

    const bodySizes = {
        'sm': 'text-xs md:text-sm',
        'md': 'text-sm md:text-base', 
        'lg': 'text-base md:text-lg'
    };

    return {
        font: fonts[settings.fontFamily as keyof typeof fonts],
        h1: h1Sizes[settings.h1Size as keyof typeof h1Sizes],
        h2: h2Sizes[settings.h2Size as keyof typeof h2Sizes],
        body: bodySizes[settings.bodySize as keyof typeof bodySizes]
    };
};

const getEffectiveImage = (content: GeneratedContent, specificImage?: string, index: number = 0) => {
    if (specificImage) return specificImage;
    if (content.generatedImages && content.generatedImages.length > 0) {
        return content.generatedImages[index % content.generatedImages.length];
    }
    if (content.heroImageBase64) return content.heroImageBase64;
    return null;
};

const CULTURAL_DATA: Record<string, { cities: string[], names: string[], action: string, from: string }> = {
    'Italiano': { 
        cities: ['Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania'], 
        names: ['Alice', 'Marco', 'Giulia', 'Luca', 'Sofia', 'Alessandro', 'Francesca', 'Matteo', 'Chiara', 'Lorenzo'],
        action: 'ha appena acquistato',
        from: 'da'
    },
    'Inglese': {
        cities: ['London', 'Manchester', 'Dublin', 'Liverpool', 'Bristol', 'Glasgow', 'Birmingham', 'Leeds'],
        names: ['Emily', 'James', 'Sarah', 'Michael', 'Jessica', 'David', 'Emma', 'Robert', 'Olivia', 'John'],
        action: 'just purchased',
        from: 'from'
    },
    'default': {
        cities: ['City'],
        names: ['Customer'],
        action: 'just purchased',
        from: 'from'
    }
};

const getCulturalData = (language: string) => {
    return CULTURAL_DATA[language] || CULTURAL_DATA['default'];
};

const SOCIAL_PROOF_NAMES: Record<string, string> = {
    'Italiano': 'Martina',
    'Inglese': 'Michelle',
};

const SocialProofBadge: React.FC<{ 
    language: string, 
    defaultText: string, 
    config?: { name?: string, text?: string, avatarUrls?: string[] } 
}> = ({ language, defaultText, config }) => {
    const name = config?.name || SOCIAL_PROOF_NAMES[language] || SOCIAL_PROOF_NAMES['Inglese'];
    const text = config?.text || defaultText;
    const avatars = config?.avatarUrls || [
        "https://randomuser.me/api/portraits/women/44.jpg",
        "https://randomuser.me/api/portraits/women/68.jpg",
        "https://randomuser.me/api/portraits/women/33.jpg"
    ];
    
    return (
        <div className="inline-flex items-center gap-3 bg-white py-1.5 px-2 pr-4 rounded-full shadow-sm border border-slate-100 w-fit animate-in fade-in slide-in-from-bottom-2 mt-2 mb-2">
            <div className="flex -space-x-2 items-center">
                {avatars.map((url, idx) => (
                    <img key={idx} src={url} alt={`User ${idx + 1}`} className="w-6 h-6 rounded-full border-2 border-white" />
                ))}
            </div>
            <div className="text-xs text-slate-700 leading-none flex items-center gap-1">
                <span className="font-bold text-slate-900">{name}</span>
                <div className="bg-blue-500 rounded-full p-[1px]"><Check className="w-2 h-2 text-white" strokeWidth={4} /></div>
                <span className="text-slate-500">{text}</span>
            </div>
        </div>
    );
};

const FeatureImage = ({ src, alt, className }: { src: string | null, alt: string, className?: string }) => {
    if (!src) {
        return (
            <div className={`bg-slate-100 flex items-center justify-center text-slate-300 ${className}`}>
                <ImageIcon className="w-12 h-12 opacity-50" />
            </div>
        );
    }
    return <img src={src} alt={alt} className={className} />;
};

const Gallery = ({ content, className, layout = 'standard' }: { content: GeneratedContent, className?: string, layout?: 'standard' | 'overlay' }) => {
    const allImages = Array.from(new Set([
        content.heroImageBase64,
        ...(content.generatedImages || [])
    ].filter(Boolean))) as string[];

    const [activeImage, setActiveImage] = useState<string | undefined>(allImages[0]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setActiveImage(content.heroImageBase64 || (allImages.length > 0 ? allImages[0] : undefined));
    }, [content.heroImageBase64, content.generatedImages]);

    if (allImages.length === 0) {
         return (
             <div className={`bg-slate-100 flex items-center justify-center text-slate-300 relative overflow-hidden ${className}`}>
                <ImageIcon className="w-16 h-16 opacity-30" />
            </div>
        );
    }

    const MainImage = () => (
        <img 
            src={activeImage} 
            alt="Product Hero" 
            className={`w-full h-auto object-contain bg-white transition-opacity duration-300`} 
        />
    );

    const scrollToImage = (index: number) => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className={`w-full ${className} bg-transparent md:bg-white`}>
            <div className="md:hidden flex flex-col w-full gap-2">
                <div ref={scrollRef} className="flex w-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-none">
                    {allImages.map((img, idx) => (
                        <div key={idx} className="snap-center min-w-full w-full flex-shrink-0 bg-white relative flex items-center justify-center">
                            <img 
                                src={img} 
                                alt={`Slide ${idx}`} 
                                className="w-full h-auto object-contain" 
                            />
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm z-10">
                                {idx + 1} / {allImages.length}
                            </div>
                        </div>
                    ))}
                </div>

                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {allImages.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => scrollToImage(idx)}
                                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200"
                            >
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden md:flex flex-col gap-3 w-full">
                <div className="relative overflow-hidden bg-white border-b border-slate-100 md:border-0 md:rounded-2xl md:shadow-sm w-full">
                    <MainImage />
                </div>
                
                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-1 snap-x scrollbar-hide md:grid md:grid-cols-5 md:overflow-visible w-full flex-shrink-0">
                        {allImages.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`
                                    snap-start w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all 
                                    md:w-full md:h-auto md:aspect-square bg-white
                                    ${activeImage === img ? 'border-slate-900 ring-1 ring-slate-900 shadow-md opacity-100' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200'}
                                `}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DEFAULT_LABELS = {
    reviews: 'Reviews',
    offer: 'Offer',
    onlyLeft: 'Only {x} left',
    secure: 'Secure',
    returns: 'Returns',
    original: 'Original',
    express: 'Express',
    warranty: 'Warranty',
    checkoutHeader: 'Checkout',
    paymentMethod: 'Payment Method',
    cod: 'Cash On Delivery',
    card: 'Credit Card',
    shippingInfo: 'Shipping Info',
    completeOrder: 'Complete Order',
    orderReceived: 'OK!',
    orderReceivedMsg: 'Order Received.',
    techDesign: 'Technology & Design',
    discountLabel: '-50%',
    certified: 'Verified Purchase',
    currencyPos: 'before' as 'before' | 'after', 
    legalDisclaimer: 'Disclaimer...',
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    cookiePolicy: 'Cookie Policy',
    rightsReserved: 'All rights reserved.',
    generatedPageNote: 'Generated page.',
    cardErrorTitle: "Attention",
    cardErrorMsg: "Error",
    switchToCod: "Switch",
    mostPopular: "Popular",
    giveUpOffer: "Cancel",
    confirmCod: "Confirm",
    thankYouTitle: "Thank You {name}!",
    thankYouMsg: "Your order has been received. We will call you shortly at {phone} to confirm the order.",
    backToShop: "Back",
    socialProof: "and 758 people purchased",
    shippingInsurance: "Shipping Insurance",
    gadgetLabel: "Add Gadget",
    shippingInsuranceDescription: "Package protected against theft and loss.",
    gadgetDescription: "Add to your order.",
    freeLabel: "Free",
    summaryProduct: "Product:",
    summaryShipping: "Shipping:",
    summaryInsurance: "Insurance:",
    summaryGadget: "Gadget:",
    summaryTotal: "Total:",
};

const OrderPopup: React.FC<{ isOpen: boolean; onClose: () => void; content: GeneratedContent; thankYouSlug?: string; onRedirect?: (data?: OrderData) => void; onPurchase?: (pageUrl: string) => void; }> = ({ isOpen, onClose, content, thankYouSlug, onRedirect, onPurchase }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [showCardErrorModal, setShowCardErrorModal] = useState(false);
    const [clientIp, setClientIp] = useState<string>('');
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });
    const [isInsuranceChecked, setIsInsuranceChecked] = useState(content.insuranceConfig?.enabled && content.insuranceConfig.defaultChecked);
    const [isGadgetChecked, setIsGadgetChecked] = useState(content.gadgetConfig?.enabled && content.gadgetConfig.defaultChecked);
    const customFormRef = useRef<HTMLDivElement>(null);

    const labels = { ...DEFAULT_LABELS, ...(content.uiTranslation || {}) };

    useEffect(() => {
        if(isOpen) {
            setPaymentMethod('cod');
            setShowCardErrorModal(false);
            setCardData({ number: '', expiry: '', cvc: '' });
            setIsInsuranceChecked(content.insuranceConfig?.enabled && content.insuranceConfig.defaultChecked);
            setIsGadgetChecked(content.gadgetConfig?.enabled && content.gadgetConfig.defaultChecked);
            fetch('https://api.ipify.org?format=json')
                .then(res => res.json())
                .then(data => setClientIp(data.ip))
                .catch(err => console.warn("IP fetch failed", err));
        }
    }, [isOpen, content.insuranceConfig, content.gadgetConfig]);

    useEffect(() => {
        if (isOpen && content.formType === 'html' && customFormRef.current) {
            const form = customFormRef.current.querySelector('form');
            if (form) {
                const handleCustomSubmit = (e: Event) => {
                    e.preventDefault();
                    
                    const htmlFormData = new FormData(form);
                    const extractedData: Record<string, string> = {};
                    htmlFormData.forEach((value, key) => {
                        extractedData[key] = value.toString();
                    });

                    setFormData(prev => ({ ...prev, ...extractedData }));
                    finalizeOrder('cod', extractedData);
                };
                
                form.addEventListener('submit', handleCustomSubmit);
                return () => form.removeEventListener('submit', handleCustomSubmit);
            }
        }
    }, [isOpen, content.formType]);

    if (!isOpen) return null;

    const currency = content.currency || '€';
    const price = content.price || "49.00";
    const heroImage = content.heroImageBase64 || (content.generatedImages && content.generatedImages.length > 0 ? content.generatedImages[0] : null);
    const contentId = generateContentId(content.headline);
    const formFields = content.formConfiguration || [];
    const enabledFields = formFields.filter(f => f.enabled);

    const handleInputChange = (field: FormFieldConfig, value: string) => {
        let sanitizedValue = value;
        
        if (field.validationType === 'numeric') {
            sanitizedValue = value.replace(/[^0-9]/g, '');
        } else if (field.validationType === 'alpha') {
            sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
        } else if (field.validationType === 'alphanumeric') {
            sanitizedValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
        }

        setFormData(prev => ({ ...prev, [field.id]: sanitizedValue }));
    };

    const parsePrice = (val?: string | number) => {
        if (val === undefined || val === null) return 0;
        const str = String(val)
            .replace(/[^\d,.]/g, '') 
            .replace(',', '.');       
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    const calculateTotal = () => {
        let total = parsePrice(content.price);
        if (content.enableShippingCost && content.shippingCost) {
            total += parsePrice(content.shippingCost);
        }
        if (isInsuranceChecked && content.insuranceConfig?.enabled && content.insuranceConfig.cost) {
            total += parsePrice(content.insuranceConfig.cost);
        }
        if (isGadgetChecked && content.gadgetConfig?.enabled && content.gadgetConfig.cost) {
            total += parsePrice(content.gadgetConfig.cost);
        }
        return total.toFixed(2);
    };

    const finalizeOrder = async (method: 'cod' | 'card', manualData?: Record<string, string>) => {
        setIsLoading(true);

        if (onPurchase) {
            onPurchase(window.location.pathname + window.location.search);
        }
        
        const totalPrice = calculateTotal();
        const currentData = manualData || formData;
        
        const currentName = currentData.name || currentData.nome || currentData.full_name || '';
        const currentPhone = currentData.phone || currentData.telefono || currentData.tel || '';

        const payloadData: Record<string, any> = {
            event_type: 'new_order',
            product_name: content.headline || 'Unknown Product',
            price: `${price} ${currency}`,
            shipping_cost: content.enableShippingCost ? `${content.shippingCost} ${currency}` : `0 ${currency}`,
            total_price: `${totalPrice} ${currency}`,
            payment_method: method,
            customer_ip: clientIp,
            timestamp: new Date().toISOString(),
            shipping_insurance_selected: isInsuranceChecked ? 'yes' : 'no',
            shipping_insurance_cost: (isInsuranceChecked && content.insuranceConfig?.enabled) ? `${content.insuranceConfig.cost} ${currency}` : '0',
            gadget_selected: isGadgetChecked ? 'yes' : 'no',
            gadget_cost: (isGadgetChecked && content.gadgetConfig?.enabled) ? `${content.gadgetConfig.cost} ${currency}` : '0',
            ...currentData,
            name: currentName,
            phone: currentPhone
        };

        if (content.webhookUrl && content.webhookUrl.trim() !== '') {
            const webhookUrl = content.webhookUrl.trim();
            const bodyJSON = JSON.stringify(payloadData);
            
            if (navigator.sendBeacon) {
                try {
                    const blob = new Blob([bodyJSON], { type: 'application/json' });
                    navigator.sendBeacon(webhookUrl, blob);
                } catch (e) {
                    console.warn("Beacon delivery failed", e);
                }
            }

            fetch(webhookUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: bodyJSON,
                keepalive: true 
            }).catch(err => console.debug("Webhook Fetch JSON failed", err));

            const formParams = new URLSearchParams();
            Object.entries(payloadData).forEach(([k, v]) => formParams.append(k, String(v)));
            fetch(webhookUrl, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formParams.toString(),
                keepalive: true
            }).catch(() => {});
        }

        trackEvent('Lead', { content_id: contentId }, { email: currentData.email, phone: currentPhone });
        trackEvent('Contact', {}, { email: currentData.email, phone: currentPhone });
        
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            if (content.customThankYouUrl && content.customThankYouUrl.trim() !== '') {
                let baseUrl = content.customThankYouUrl.trim();
                baseUrl = baseUrl
                    .replace('{name}', encodeURIComponent(currentName))
                    .replace('{phone}', encodeURIComponent(currentPhone))
                    .replace('[name]', encodeURIComponent(currentName))
                    .replace('[phone]', encodeURIComponent(currentPhone));

                if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://') && !baseUrl.startsWith('/')) {
                    baseUrl = 'https://' + baseUrl;
                }
                
                try {
                    const targetUrl = new URL(baseUrl);
                    if (currentName) targetUrl.searchParams.set('name', currentName);
                    if (currentPhone) targetUrl.searchParams.set('phone', currentPhone);
                    window.location.href = targetUrl.toString();
                } catch (urlErr) {
                    const separator = baseUrl.includes('?') ? '&' : '?';
                    const params = `name=${encodeURIComponent(currentName)}&phone=${encodeURIComponent(currentPhone)}`;
                    window.location.href = `${baseUrl}${separator}${params}`;
                }
                return;
            }

            if (onRedirect) {
                onRedirect({ name: currentName, phone: currentPhone, price: totalPrice });
                onClose();
                return;
            }

            if (thankYouSlug) {
                const url = new URL(window.location.origin + window.location.pathname);
                url.searchParams.set('s', thankYouSlug.replace(/^\//, ''));
                if (currentName) url.searchParams.set('name', currentName);
                if (currentPhone) url.searchParams.set('phone', currentPhone);
                window.location.href = url.toString();
                return;
            }
            
            const url = new URL(window.location.href);
            url.searchParams.set('s', (thankYouSlug || '').replace(/^\//, ''));
            if (currentName) url.searchParams.set('name', currentName);
            if (currentPhone) url.searchParams.set('phone', currentPhone);
            window.location.href = url.toString();
            
        } catch (navError) {
            console.warn("Navigation/Redirect failed:", navError);
            setIsLoading(false);
            onClose();
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
        setCardData(prev => ({ ...prev, number: val.substring(0, 19) }));
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setCardData(prev => ({ ...prev, expiry: val.substring(0, 5) }));
    };

    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        setCardData(prev => ({ ...prev, cvc: val.substring(0, 4) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentMethod === 'card') {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsLoading(false);
            setShowCardErrorModal(true);
        } else {
            finalizeOrder('cod');
        }
    };

    const handleSwitchToCod = () => { setPaymentMethod('cod'); setShowCardErrorModal(false); finalizeOrder('cod'); };
    const handleGiveUp = () => { setShowCardErrorModal(false); onClose(); };

    const inputClass = "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none transition bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium";

    const hfConfig = content.htmlFormConfig || { showName: true, showProductLine: true, showTotalLine: true };
    const showHeader = content.formType !== 'html' || (hfConfig.showName || hfConfig.showProductLine || hfConfig.showTotalLine);

    const getColSpanClass = (width?: number) => {
        if (!width || width >= 12) return 'col-span-12';
        if (width <= 1) return 'col-span-1';
        return `col-span-${width}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col max-h-[90vh]">
                {showCardErrorModal && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                        <div className="bg-amber-100 p-4 rounded-full mb-4 animate-bounce"><AlertTriangle className="w-10 h-10 text-amber-600" /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">{labels.cardErrorTitle}</h3>
                        <p className="text-slate-600 mb-8 max-w-xs leading-relaxed">{labels.cardErrorMsg}</p>
                        <div className="w-full space-y-3">
                            <button onClick={handleSwitchToCod} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center relative border-2 border-emerald-400/50">
                                <div className="flex items-center gap-2 text-lg"><Truck className="w-5 h-5" /> {labels.switchToCod}</div>
                                <div className="absolute -top-3 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">{labels.mostPopular}</div>
                            </button>
                            <button onClick={handleGiveUp} className="w-full bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-wide">{labels.giveUpOffer}</button>
                        </div>
                    </div>
                )}
                <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center shadow-sm z-10 flex-shrink-0">
                    <div><h3 className="text-lg font-bold text-slate-900">{labels.checkoutHeader}</h3></div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X className="w-5 h-5 text-slate-600" /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {showHeader && (
                        <div className="flex items-start gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                            <div className="w-16 h-16 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0 border border-slate-200">
                                {heroImage && <img src={heroImage} alt="Product" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1">
                                {(content.formType !== 'html' || hfConfig.showName !== false) && (
                                    <h4 className="font-bold text-slate-900 line-clamp-1 text-sm mb-1">{content.headline}</h4>
                                )}
                                <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/60 text-xs">
                                    {(content.formType !== 'html' || hfConfig.showProductLine !== false) && (
                                        <div className="flex justify-between text-slate-500"><span>{labels.summaryProduct}</span><span>{labels.currencyPos === 'before' ? `${currency} ${content.price}` : `${content.price} ${currency}`}</span></div>
                                    )}
                                    {content.enableShippingCost && <div className="flex justify-between text-slate-500"><span>{labels.summaryShipping}</span><span>{labels.currencyPos === 'before' ? `${currency} ${content.shippingCost}` : `${content.shippingCost} ${currency}`}</span></div>}
                                    {isInsuranceChecked && content.insuranceConfig?.enabled && <div className="flex justify-between text-emerald-600"><span>{labels.summaryInsurance}</span><span>+ {labels.currencyPos === 'before' ? `${currency} ${content.insuranceConfig.cost}` : `${content.insuranceConfig.cost} ${currency}`}</span></div>}
                                    {isGadgetChecked && content.gadgetConfig?.enabled && <div className="flex justify-between text-purple-600"><span>{labels.summaryGadget}</span><span>+ {labels.currencyPos === 'before' ? `${currency} ${content.gadgetConfig.cost}` : `${content.gadgetConfig.cost}${currency}`}</span></div>}
                                    
                                    {(content.formType !== 'html' || hfConfig.showTotalLine !== false) && (
                                        <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200"><span>{labels.summaryTotal}</span><span>{labels.currencyPos === 'before' ? `${currency} ${calculateTotal()}` : `${calculateTotal()} ${currency}`}</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {content.formType === 'html' ? (
                        <div 
                            ref={customFormRef}
                            className="custom-form-container animate-in fade-in duration-500" 
                            dangerouslySetInnerHTML={{ __html: content.customFormHtml || '' }} 
                        />
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {content.insuranceConfig?.enabled && (
                                <div className="bg-emerald-50 border-2 border-emerald-200/50 p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-emerald-300">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!isInsuranceChecked}
                                                    onChange={(e) => setIsInsuranceChecked(e.target.checked)}
                                                    className="w-5 h-5 accent-emerald-600 rounded-md border-emerald-400 focus:ring-emerald-500"
                                                />
                                            </div>
                                        
                                            <div className="flex flex-col">
                                                <span className="font-bold text-emerald-900 text-sm leading-tight flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600"/>{content.insuranceConfig.label}</span>
                                                <span className="text-emerald-700 text-xs">{labels.shippingInsuranceDescription}</span>
                                            </div>
                                        </div>
                                        <span className="font-black text-emerald-800 text-sm">
                                            {parsePrice(content.insuranceConfig.cost) > 0 ? 
                                                `+${labels.currencyPos === 'before' ? `${currency}${content.insuranceConfig.cost}` : `${content.insuranceConfig.cost}${currency}`}`
                                                : (labels.freeLabel || 'Gratis')
                                            }
                                        </span>
                                    </label>
                                </div>
                            )}

                            {content.gadgetConfig?.enabled && (
                                <div className="bg-purple-50 border-2 border-purple-200/50 p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-purple-300">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={!!isGadgetChecked}
                                                    onChange={(e) => setIsGadgetChecked(e.target.checked)}
                                                    className="w-5 h-5 accent-purple-600 rounded-md border-purple-400 focus:ring-purple-500"
                                                />
                                            </div>
                                        
                                            <div className="flex flex-col">
                                                <span className="font-bold text-purple-900 text-sm leading-tight flex items-center gap-1.5"><Gift className="w-4 h-4 text-purple-600"/>{content.gadgetConfig.label}</span>
                                                <span className="text-purple-700 text-xs">{labels.gadgetDescription}</span>
                                            </div>
                                        </div>
                                        <span className="font-black text-purple-800 text-sm">
                                            {parsePrice(content.gadgetConfig.cost) > 0 ? 
                                                `+${labels.currencyPos === 'before' ? `${currency}${content.gadgetConfig.cost}` : `${content.gadgetConfig.cost}${currency}`}`
                                                : (labels.freeLabel || 'Gratis')
                                            }
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{labels.paymentMethod}</label>
                                <div className="space-y-2">
                                    <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-4 h-4 text-slate-900 accent-slate-900"/>
                                        <div className="ml-3 flex-1"><div className="flex items-center justify-between"><span className="font-bold text-slate-900 text-sm">{labels.cod}</span><Banknote className="w-5 h-5 text-slate-600" /></div></div>
                                    </label>
                                    <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-4 h-4 text-slate-900 accent-slate-900"/>
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">{labels.card}</span>
                                                <div className="flex items-center gap-1">
                                                    <img src="http://fadicon.com/wp-content/uploads/2025/12/20336392-visa-logo-vettore-visa-icona-gratuito-vettore-gratuito-vettoriale.jpg" alt="Visa" className="h-4" />
                                                    <img src="http://fadicon.com/wp-content/uploads/2025/12/images-1.png" alt="Maestro" className="h-4" />
                                                    <img src="http://fadicon.com/wp-content/uploads/2025/12/images.png" alt="American Express" className="h-4" />
                                                    <img src="http://fadicon.com/wp-content/uploads/2025/12/MasterCard_Logo.svg.png" alt="Mastercard" className="h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                                {paymentMethod === 'card' && (
                                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <input type="text" placeholder="0000 0000 0000 0000" className={inputClass} required value={cardData.number} onChange={handleCardNumberChange}/>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="text" placeholder="MM/YY" className={inputClass} required value={cardData.expiry} onChange={handleExpiryChange}/>
                                            <input type="text" placeholder="CVC" className={inputClass} required value={cardData.cvc} onChange={handleCvcChange}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{labels.shippingInfo}</label>
                                <div className="grid grid-cols-12 gap-3">
                                    {enabledFields.map((field) => (
                                        <div key={field.id} className={getColSpanClass(field.width)}>
                                            {field.type === 'textarea' ? (
                                                    <textarea 
                                                        required={field.required} 
                                                        placeholder={field.label} 
                                                        value={formData[field.id] || ''}
                                                        onChange={(e) => handleInputChange(field, e.target.value)} 
                                                        className={`${inputClass} h-20 resize-none`}
                                                    />
                                            ) : (
                                                <input 
                                                    type={field.type} 
                                                    required={field.required} 
                                                    placeholder={field.label} 
                                                    value={formData[field.id] || ''}
                                                    inputMode={field.validationType === 'numeric' ? 'numeric' : undefined}
                                                    maxLength={field.id === 'province' ? 2 : undefined}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        if (field.id === 'province') {
                                                            val = val.toUpperCase().replace(/[^A-Z]/g, '');
                                                        }
                                                        handleInputChange(field, val);
                                                    }} 
                                                    className={`${inputClass} ${field.id === 'province' ? 'uppercase' : ''}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (labels.completeOrder)}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ThankYouPage: React.FC<{ content: GeneratedContent; initialData?: OrderData }> = ({ content, initialData }) => {
    const [params] = useState(new URLSearchParams(window.location.search));
    const name = initialData?.name || params.get('name') || 'Cliente';
    const phone = initialData?.phone || params.get('phone') || '...';
    const labels = { ...DEFAULT_LABELS, ...(content.uiTranslation || {}) };

    const titleTemplate = content.headline || labels.thankYouTitle;
    const msgTemplate = content.subheadline || labels.thankYouMsg;

    const finalTitle = titleTemplate.replace('{name}', name).replace('{phone}', phone);
    const finalMsg = msgTemplate.replace('{name}', name).replace('{phone}', phone);
    
    const backgroundStyle = content.backgroundColor ? { background: content.backgroundColor } : {};
    const heroImage = content.heroImageBase64 || (content.generatedImages && content.generatedImages.length > 0 ? content.generatedImages[0] : null);

    useEffect(() => {
        if (content.customThankYouHtml) injectCustomScript(content.customThankYouHtml);
        if (content.metaThankYouHtml) injectCustomScript(content.metaThankYouHtml);
        if (content.tiktokThankYouHtml) injectCustomScript(content.tiktokThankYouHtml);
    }, [content.customThankYouHtml, content.metaThankYouHtml, content.tiktokThankYouHtml]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 relative" style={backgroundStyle}>
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center relative z-10">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 shadow-sm ring-4 ring-green-50">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 leading-tight">{finalTitle}</h3>
                 {heroImage && (
                    <div className="my-6 rounded-xl overflow-hidden shadow-md border border-slate-100">
                        <img src={heroImage} alt="Thank You" className="w-full h-auto object-cover" />
                    </div>
                )}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 relative">
                        <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-1.5 rounded-full shadow-md"><Phone className="w-4 h-4" /></div>
                        <p className="text-slate-600 leading-relaxed font-medium text-lg">{finalMsg}</p>
                </div>
            </div>
            {content.extraThankYouHtml && (<div className="w-full max-w-4xl mx-auto mt-8 relative z-0" dangerouslySetInnerHTML={{ __html: content.extraThankYouHtml }} />)}
            <p className="mt-8 text-slate-400 text-xs">© {new Date().getFullYear()}</p>
        </div>
    );
};

const LegalModal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; contentText: string; disclaimer: string; }> = ({ isOpen, onClose, title, contentText, disclaimer }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-900">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar text-sm text-slate-600 leading-relaxed">
                   <div className="space-y-4 text-justify"><p><strong>{title}</strong></p><p>{disclaimer}</p><p>{contentText}</p></div>
                </div>
            </div>
        </div>
    );
};

/**
 * Calcola la data stimata di consegna basata su 48 ore lavorative (2 giorni lavorativi).
 * Sabato e Domenica non sono considerati giorni lavorativi.
 */
const getDeliveryDate = () => {
    const date = new Date();
    let workingDaysToAdd = 2; // 48 ore lavorative
    while (workingDaysToAdd > 0) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) { // Escludi Domenica (0) e Sabato (6)
            workingDaysToAdd--;
        }
    }
    return date;
};

const ItalianDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const ItalianMonths = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

/**
 * Componente visuale per il percorso di spedizione express
 */
const DeliveryTimeline: React.FC = () => {
    const today = new Date();
    const deliveryDate = getDeliveryDate();
    
    const formatDate = (d: Date) => {
        return `${ItalianDays[d.getDay()]} ${d.getDate()} ${ItalianMonths[d.getMonth()]}`;
    };

    return (
        <div className="mt-8 bg-slate-50/80 backdrop-blur border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
                <Truck className="w-5 h-5 text-blue-600" />
                <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Percorso Spedizione Express</h4>
            </div>
            
            <div className="relative flex flex-col gap-8">
                {/* Linea verticale di collegamento */}
                <div className="absolute left-[15px] top-[15px] bottom-[15px] w-0.5 bg-gradient-to-b from-blue-500 via-blue-300 to-emerald-400"></div>
                
                {/* Step 1: Ordine */}
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Oggi - {formatDate(today)}</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight">Ordine Ricevuto ed Elaborato</p>
                        <p className="text-xs text-slate-500 mt-1">Il tuo pacco viene preparato per la spedizione prioritaria.</p>
                    </div>
                </div>

                {/* Step 2: Transito */}
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center shadow-lg shadow-blue-100 ring-4 ring-white">
                        <Package className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Transito Rapido</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight">Spedizione con Corriere Espresso h24</p>
                        <p className="text-xs text-slate-500 mt-1">Controllo qualità e imballaggio ultra-resistente.</p>
                    </div>
                </div>

                {/* Step 3: Consegna */}
                <div className="flex items-start gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100 ring-4 ring-white animate-pulse">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Consegna Stimata - {formatDate(deliveryDate)}</p>
                        <p className="text-sm font-bold text-slate-900 leading-tight">Arrivo a Casa Tua (48h lavorative)</p>
                        <p className="text-xs text-slate-500 mt-1 italic font-medium">Paga comodamente in contanti al corriere!</p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Sabato e Domenica non lavorativi</span>
            </div>
        </div>
    );
};

const GadgetTemplate: React.FC<TemplateProps> = ({ content, onBuy, styles }) => {
    const reviews = content.testimonials && content.testimonials.length > 0 
        ? content.testimonials 
        : (content.testimonial ? [content.testimonial] : []);
    
    const [currentStock, setCurrentStock] = useState(content.stockConfig?.quantity || 13);
    const [socialNotification, setSocialNotification] = useState<{visible: boolean, name: string, city: string} | null>(null);
    const spConfig = content.socialProofConfig || { enabled: true, intervalSeconds: 10, maxShows: 4 };
    
    const [visibleReviewsCount, setVisibleReviewsCount] = useState(50);
    const reviewsToShow = reviews.slice(0, visibleReviewsCount);
    const [activeReviewImage, setActiveReviewImage] = useState<string | null>(null);

    const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
    const announcements = content.announcements && content.announcements.length > 0 
        ? content.announcements 
        : [{ text: content.announcementBarText || '', icon: 'truck', iconSize: 14 }];

    useEffect(() => {
        if (announcements.length <= 1) return;
        const intervalTime = (content.announcementInterval || 5) * 1000;
        const timer = setInterval(() => {
            setCurrentAnnIndex((prev) => (prev + 1) % announcements.length);
        }, intervalTime);
        return () => clearInterval(timer);
    }, [announcements.length, content.announcementInterval]);

    useEffect(() => {
        if (!spConfig.enabled) return;
        let iterations = 0;
        const maxIterations = spConfig.maxShows;
        const intervalTime = Math.max(2, spConfig.intervalSeconds) * 1000;
        const lang = content.language || 'Italiano';
        const culture = getCulturalData(lang);
        const getRandomItem = (arr: string[]) => arr[Math.floor(arr.length * Math.random())];
        const interval = setInterval(() => {
            if (iterations >= maxIterations) { clearInterval(interval); return; }
            const name = getRandomItem(culture.names);
            const city = getRandomItem(culture.cities);
            setSocialNotification({ visible: true, name, city });
            if (content.stockConfig?.enabled) { setCurrentStock(prev => Math.max(2, prev - 1)); }
            setTimeout(() => { setSocialNotification(prev => prev ? { ...prev, visible: false } : null); }, 4000);
            iterations++;
        }, intervalTime);
        return () => clearInterval(interval);
    }, [spConfig, content.stockConfig?.enabled, content.language]);

    const priceColor = content.priceStyles?.color || "text-blue-600";
    const isCustomColor = content.priceStyles?.color?.startsWith('#');
    const defaultCtaClass = "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200";
    const ctaButtonClass = content.buttonColor ? content.buttonColor : defaultCtaClass;
    const offerBoxClass = "bg-sky-50 border-2 border-sky-100 rounded-xl p-4 mb-6 shadow-sm relative overflow-hidden";
    const currency = content.currency || '€';
    const labels = { ...DEFAULT_LABELS, ...(content.uiTranslation || {}) };
    const [activeLegalModal, setActiveLegalModal] = useState<string | null>(null);

    const h1Style = content.customTypography?.h1 ? { fontSize: `${content.customTypography.h1}px` } : {};
    const h2Style = content.customTypography?.h2 ? { fontSize: `${content.customTypography.h2}px` } : {};
    const h3Style = content.customTypography?.h3 ? { fontSize: `${content.customTypography.h3}px` } : {};
    const bodyStyle = content.customTypography?.body ? { fontSize: `${content.customTypography.body}px` } : {};
    const smallStyle = content.customTypography?.small ? { fontSize: `${content.customTypography.small}px` } : {};
    const ctaStyle = content.customTypography?.cta ? { fontSize: `${content.customTypography.cta}px` } : {};
    
    const backgroundStyle = content.backgroundColor ? { background: content.backgroundColor } : {};
    
    const priceStyle = {
        ...(content.priceStyles?.fontSize ? { fontSize: `${content.priceStyles.fontSize}px` } : {}),
        ...(isCustomColor ? { color: content.priceStyles?.color } : {})
    };

    const PriceDisplay = ({ p, op, big = false }: { p: string, op?: string, big?: boolean }) => {
        const customPriceClass = content.priceStyles?.className || (big ? priceColor : 'text-slate-900');
        
        return (
            <div className={`flex items-center ${big ? 'justify-center gap-4' : 'justify-start gap-1'}`}>
                 <span className={`${big ? 'text-5xl' : 'text-2xl'} font-black tracking-tight ${customPriceClass}`} style={big ? priceStyle : {}}>
                    {labels.currencyPos === 'before' ? `${currency} ${p}` : `${p} ${currency}`}
                 </span>
                 {op && (
                     <div className="flex flex-col items-start justify-center pt-1">
                        <span className={`text-sm text-slate-400 line-through font-medium mb-0.5`}>{labels.currencyPos === 'before' ? `${currency} ${op}` : `${op} ${currency}`}</span>
                        {content.showDiscount !== false && big && (<span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-blue-200">{labels.discountLabel}</span>)}
                     </div>
                 )}
            </div>
        );
    };

    const ReviewsSection = () => (
        <div className="bg-white rounded-none md:rounded-3xl p-6 md:p-12 md:shadow-xl md:border border-slate-100 mb-20 relative overflow-hidden border-t border-slate-100 md:border-t-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 md:h-2"></div>
            <h3 className="text-center text-2xl md:text-3xl font-bold mb-8 text-slate-900" style={h2Style}>{labels.reviews}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {reviewsToShow.map((review, i) => (
                    <div key={i} className="flex flex-col h-full bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex text-green-500">
                                {[...Array(review.rating || 5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-current" />)}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{review.date}</span>
                        </div>
                        
                        {(review.images && review.images.length > 0) ? (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
                                {review.images.filter(img => img && img.trim() !== '').map((img, imgIdx) => (
                                    <div 
                                        key={imgIdx}
                                        className="flex-shrink-0 rounded-lg overflow-hidden h-40 w-32 bg-slate-100 cursor-pointer relative group"
                                        onClick={() => setActiveReviewImage(img)}
                                    >
                                        <img src={img} alt={`Review ${imgIdx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Maximize2 className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            review.image && (
                                 <div 
                                    className="mb-3 rounded-lg overflow-hidden h-56 w-full bg-slate-100 cursor-pointer relative group"
                                    onClick={() => setActiveReviewImage(review.image || null)}
                                 >
                                     <img src={review.image} alt="User Review" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg">
                                            <Maximize2 className="w-5 h-5 text-slate-900" />
                                        </div>
                                     </div>
                                 </div>
                            )
                        )}

                        <h4 className="font-bold text-slate-900 text-base mb-2" style={h3Style}>{review.title || "Review"}</h4>
                        <p className="text-slate-600 italic mb-6 flex-grow leading-relaxed text-sm" style={bodyStyle}>"{review.text}"</p>
                        <div className="flex items-center gap-3 mt-auto border-t border-slate-200 pt-4">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shadow-sm">{review.name.charAt(0)}</div>
                            <div>
                                <p className="text-xs font-bold text-slate-900">{review.name}</p>
                                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {labels.certified}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {reviews.length > visibleReviewsCount && (
                <div className="mt-12 text-center">
                    <button 
                        onClick={() => setVisibleReviewsCount(prev => prev + 50)}
                        className="bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 px-8 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 mx-auto"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Mostra altre recensioni (+50)
                    </button>
                </div>
            )}
        </div>
    );

    const BoxContentSection = () => {
        if (!content.boxContent || !content.boxContent.enabled) return null;
        
        return (
             <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8 mb-16 relative overflow-hidden max-w-2xl mx-auto">
                <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6 text-emerald-500" />
                    {content.boxContent.title}
                </h3>
                
                <div className={`flex flex-col md:flex-row gap-8 items-center ${content.boxContent.image ? 'justify-between' : 'justify-center'}`}>
                    <div className="flex-1 w-full">
                        <ul className="space-y-3">
                            {content.boxContent.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="bg-emerald-100 text-emerald-600 rounded-full p-1">
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </div>
                                    <span className="font-medium text-slate-800 text-sm md:text-base">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {content.boxContent.image && (
                        <div className="w-full md:w-48 h-48 flex-shrink-0 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            <img src={content.boxContent.image} alt="Box Content" className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const FeatureBlock = React.memo(({ f, i }: { f: any, i: number }) => (
        <div className={`flex flex-col gap-6 md:gap-16 items-center ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white md:bg-transparent p-0 md:p-0 rounded-2xl shadow-none md:shadow-none`}>
            <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-md md:shadow-xl bg-white w-full">
                    <FeatureImage 
                        src={getEffectiveImage(content, f.image, i)} 
                        alt="Feature" 
                        className="w-full h-auto" 
                    />
                </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-3">
                {content.showFeatureIcons && (
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-full mb-1">
                        <Zap className="w-5 h-5" />
                    </div>
                )}
                <h3 className="text-xl md:text-3xl font-bold text-slate-900 break-words" style={h3Style}>{f.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium" style={bodyStyle}>{f.description}</p>
                {f.showCta && (
                    <div className="mt-2">
                        <button 
                            onClick={onBuy} 
                            className={`${ctaButtonClass} py-3 px-6 rounded-lg shadow-md text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform`}
                            style={ctaStyle}
                        >
                            {content.ctaText || "ORDER NOW"} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    ));

    const reviewsPos = content.reviewsPosition === undefined ? content.features.length : content.reviewsPosition;
    const featuresBefore = content.features.slice(0, reviewsPos);
    const featuresAfter = content.features.slice(reviewsPos);

    const currentAnnouncement = announcements[currentAnnIndex];

    return (
        <div className={`min-h-screen ${!content.backgroundColor ? 'bg-slate-50' : ''} text-slate-800 pb-32 md:pb-0 selection:bg-blue-100 selection:text-blue-900 ${styles.font}`} style={{...bodyStyle, ...backgroundStyle}}>
            <div className="bg-slate-900 text-white text-center py-2.5 text-[10px] md:text-xs font-bold tracking-wide flex justify-center items-center h-9 sticky top-0 z-30 shadow-md transition-all duration-500">
                <div key={currentAnnIndex} className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                    {getIconById(currentAnnouncement.icon, currentAnnouncement.iconSize)}
                    <span style={{ ...smallStyle, fontSize: `${content.announcementFontSize || 15}px` }}>{currentAnnouncement.text}</span>
                </div>
            </div>
            <div className="container mx-auto px-0 md:px-4 py-0 md:py-12 max-w-5xl">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12 items-start mb-12 md:mb-16 bg-white md:bg-transparent shadow-sm md:shadow-none pb-8 md:pb-0">
                    <div className="w-full order-1 flex-shrink-0">
                        <Gallery content={content} className="md:rounded-2xl shadow-none md:shadow-sm bg-white rounded-none border-none w-full block" />
                    </div>
                    <div className="w-full order-2 px-5 md:px-0 flex flex-col gap-5">
                        <div className="w-full">
                            <h1 className={`font-extrabold leading-[1.1] mb-3 text-slate-900 ${styles.h1} tracking-tight break-words w-full`} style={h1Style}>{content.headline}</h1>
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                                <span className="text-sm text-slate-500 font-medium underline decoration-slate-300 decoration-dotted underline-offset-2" style={smallStyle}>4.9/5 - {reviews.length} {labels.reviews}</span>
                            </div>
                            {content.showSocialProofBadge !== false && (
                                <SocialProofBadge 
                                    language={content.language || 'Italiano'} 
                                    defaultText={labels.socialProof} 
                                    config={content.socialProofBadgeConfig}
                                />
                            )}
                        </div>
                        <div className={`${offerBoxClass} w-full mt-2`}>
                             <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase z-10">{labels.offer}</div>
                             {content.stockConfig?.enabled && (
                                 <div className="flex items-center justify-center gap-1.5 mb-3 bg-red-50 border border-red-100 rounded-md py-2 px-3 mx-auto w-full animate-pulse">
                                     <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                                     <span className="text-xs font-bold text-red-600 uppercase tracking-wide">{content.stockConfig.textOverride ? content.stockConfig.textOverride.replace('{x}', currentStock.toString()) : labels.onlyLeft.replace('{x}', currentStock.toString())}</span>
                                 </div>
                             )}
                             <div className="flex wrap items-center justify-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm mt-2 relative z-0 w-full">
                                <PriceDisplay p={content.price || "39"} op={content.originalPrice || "79"} big={true} />
                             </div>
                             <div className="bg-blue-100/50 text-blue-900 text-center text-sm font-bold py-2.5 rounded border border-blue-200/50 mb-4 flex items-center justify-center gap-2 w-full">
                                <CheckCircle className="w-4 h-4 text-blue-600" /><span style={smallStyle}>{content.ctaSubtext}</span>
                             </div>
                             <div className="space-y-2 mb-5 px-1 w-full">
                                {content.benefits.slice(0, 4).map((b, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <div className="mt-0.5 text-blue-500 flex-shrink-0 bg-white rounded-full p-0.5 shadow-sm"><Check className="w-3 h-3" /></div>
                                        <span className="text-sm font-medium text-slate-700 leading-tight" style={bodyStyle}>{b}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={onBuy} className={`w-full ${ctaButtonClass} font-bold text-lg py-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide group`} style={ctaStyle}>
                                <span>{content.ctaText || "ORDER NOW"}</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            
                            {/* AGGIUNTA MAPPA PERCORSO SPEDIZIONE */}
                            <DeliveryTimeline />

                            <div className="flex justify-center gap-3 mt-3 text-[10px] text-slate-400 font-bold w-full" style={smallStyle}>
                                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {labels.secure}</span>
                                <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> {labels.returns}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-b border-slate-100 py-4 mb-2 w-full">
                             <div className="flex flex-col items-center text-center gap-1.5"><ShieldCheck className="w-6 h-6 text-blue-600"/><span className="text-[10px] font-bold text-slate-600 leading-tight" style={smallStyle}>{labels.original}</span></div>
                             <div className="flex flex-col items-center text-center gap-1.5"><Truck className="w-6 h-6 text-blue-600"/><span className="text-[10px] font-bold text-slate-600 leading-tight" style={smallStyle}>{labels.express}</span></div>
                             <div className="flex flex-col items-center text-center gap-1.5"><CheckSquare className="w-6 h-6 text-blue-600"/><span className="text-[10px] font-bold text-slate-600 leading-tight" style={smallStyle}>{labels.warranty}</span></div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-blue-500 text-slate-700 italic text-sm leading-relaxed mb-4 w-full">
                           <p style={h2Style}>"{content.subheadline}"</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-16 md:space-y-24 mb-16 px-5 md:px-0">
                    <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
                         <h2 className={`font-bold text-slate-900 mb-2 ${styles.h2}`} style={h2Style}>{labels.techDesign}</h2>
                    </div>
                    {featuresBefore.map((f, i) => (
                        <FeatureBlock key={i} f={f} i={i} />
                    ))}
                    <BoxContentSection />
                    {reviews.length > 0 && <ReviewsSection />}
                    {featuresAfter.map((f, i) => (
                        <FeatureBlock key={i + featuresBefore.length} f={f} i={i + featuresBefore.length} />
                    ))}
                </div>

                {content.extraLandingHtml && (<div className="w-full mt-12 mb-12" dangerouslySetInnerHTML={{ __html: content.extraLandingHtml }} />)}

                <footer className="bg-slate-50 pt-10 pb-24 md:pb-12 border-t border-slate-200 mt-auto">
                    <div className="container mx-auto px-6 max-w-4xl text-center">
                        <div className="text-[10px] text-slate-400 text-justify leading-relaxed mb-6 space-y-2" style={smallStyle}>
                            <p>{labels.legalDisclaimer}</p>
                        </div>
                        <div className="flex wrap justify-center gap-6 mb-8">
                            <button onClick={() => setActiveLegalModal('Privacy Policy')} className="text-xs text-slate-500 hover:text-slate-900 font-bold hover:underline" style={smallStyle}>{labels.privacyPolicy}</button>
                            <button onClick={() => setActiveLegalModal('Termini')} className="text-xs text-slate-500 hover:text-slate-900 font-bold hover:underline" style={smallStyle}>{labels.termsConditions}</button>
                            <button onClick={() => setActiveLegalModal('Cookie Policy')} className="text-xs text-slate-500 hover:text-slate-900 font-bold hover:underline" style={smallStyle}>{labels.cookiePolicy}</button>
                        </div>
                        <p className="text-[10px] text-slate-300">© {new Date().getFullYear()} {labels.rightsReserved}</p>
                        <p className="text-[9px] text-slate-200 mt-1">{labels.generatedPageNote}</p>
                    </div>
                </footer>
            </div>
            
            {socialNotification && socialNotification.visible && (
                <div className="fixed bottom-24 md:bottom-6 left-1/2 md:left-6 -translate-x-1/2 md:translate-x-0 z-[60] animate-in slide-in-from-bottom-5 fade-in duration-500 w-[90%] md:w-auto">
                    <div className="bg-white/95 backdrop-blur shadow-2xl rounded-xl p-3 border border-slate-200 flex items-center gap-3 pr-6">
                         <div className="relative">
                            <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <img src={`https://ui-avatars.com/api/?name=${socialNotification.name}&background=random&color=fff`} alt={socialNotification.name} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white"><Check className="w-2 h-2 text-white" strokeWidth={4} /></div>
                         </div>
                         <div>
                             <div className="flex items-center gap-2 mb-0.5">
                                 <span className="text-xs text-slate-800 font-bold">{socialNotification.name}</span>
                                 <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wide leading-none"><ShieldCheck className="w-2.5 h-2.5" />{labels.certified}</span>
                             </div>
                             <div className="text-[10px] text-slate-500 font-medium leading-tight">
                                {getCulturalData(content.language || 'Italiano').action} {getCulturalData(content.language || 'Italiano').from} <span className="font-semibold">{socialNotification.city}</span>
                             </div>
                         </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 px-4 md:hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] safe-area-bottom pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider leading-none mb-0.5 animate-pulse">{labels.offer}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-black text-2xl text-slate-900 leading-none">{labels.currencyPos === 'before' ? `${currency} ${content.price || "39"}` : `${content.price || "39"}`}</span>
                            {labels.currencyPos === 'after' && <span className="text-xs font-bold text-slate-900">{currency}</span>}
                        </div>
                    </div>
                    <button onClick={onBuy} className={`flex-1 ${ctaButtonClass} font-bold text-base py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform uppercase tracking-wide`} style={ctaStyle}>
                        {content.ctaText || "ORDER NOW"} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <LegalModal isOpen={!!activeLegalModal} onClose={() => setActiveLegalModal(null)} title={activeLegalModal === 'Privacy Policy' ? labels.privacyPolicy : (activeLegalModal === 'Termini' ? labels.termsConditions : labels.cookiePolicy)} contentText="Lorem ipsum dolor sit amet..." disclaimer={labels.legalDisclaimer}/>
            
            {activeReviewImage && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveReviewImage(null)}>
                    <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
                        <X className="w-8 h-8" />
                    </button>
                    <div className="max-w-4xl max-h-[90vh] p-4 relative" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={activeReviewImage} 
                            alt="Review Fullsize" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const ModernTemplate: React.FC<TemplateProps> = ({ content, onBuy, styles }) => {
    const reviews = content.testimonials && content.testimonials.length > 0 
        ? content.testimonials 
        : (content.testimonial ? [content.testimonial] : []);
    
    const [currentStock, setCurrentStock] = useState(content.stockConfig?.quantity || 13);
    const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
    const announcements = content.announcements && content.announcements.length > 0 
        ? content.announcements 
        : [{ text: content.announcementBarText || '', icon: 'truck', iconSize: 14 }];

    useEffect(() => {
        if (announcements.length <= 1) return;
        const intervalTime = (content.announcementInterval || 5) * 1000;
        const timer = setInterval(() => {
            setCurrentAnnIndex((prev) => (prev + 1) % announcements.length);
        }, intervalTime);
        return () => clearInterval(timer);
    }, [announcements.length, content.announcementInterval]);

    const labels = { ...DEFAULT_LABELS, ...(content.uiTranslation || {}) };
    const currency = content.currency || '€';
    const ctaButtonClass = content.buttonColor || "bg-slate-900 text-white hover:bg-slate-800";
    const [activeLegalModal, setActiveLegalModal] = useState<string | null>(null);

    const h1Style = content.customTypography?.h1 ? { fontSize: `${content.customTypography.h1}px` } : {};
    const h2Style = content.customTypography?.h2 ? { fontSize: `${content.customTypography.h2}px` } : {};
    const bodyStyle = content.customTypography?.body ? { fontSize: `${content.customTypography.body}px` } : {};
    const smallStyle = content.customTypography?.small ? { fontSize: `${content.customTypography.small}px` } : {};
    const ctaStyle = content.customTypography?.cta ? { fontSize: `${content.customTypography.cta}px` } : {};
    const backgroundStyle = content.backgroundColor ? { background: content.backgroundColor } : {};

    const currentAnnouncement = announcements[currentAnnIndex];

    return (
        <div className={`min-h-screen ${!content.backgroundColor ? 'bg-white' : ''} text-slate-900 pb-32 md:pb-0 ${styles.font}`} style={{...bodyStyle, ...backgroundStyle}}>
            {/* Minimal Announcement Bar */}
            <div className="bg-slate-50 text-slate-900 text-center py-2 text-[10px] md:text-xs font-bold tracking-tight flex justify-center items-center h-8 sticky top-0 z-30 shadow-sm border-b border-slate-100">
                <div key={currentAnnIndex} className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
                    {getIconById(currentAnnouncement.icon, currentAnnouncement.iconSize)}
                    <span style={{ fontSize: `${content.announcementFontSize || 15}px` }}>{currentAnnouncement.text}</span>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 py-8 md:py-20 max-w-6xl">
                {/* Modern Hero Split */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center mb-24">
                    <div className="w-full lg:w-[55%] order-2 lg:order-1">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <Sparkles className="w-3 h-3" /> {content.niche}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-slate-900" style={h1Style}>{content.headline}</h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl" style={h2Style}>"{content.subheadline}"</p>
                            
                            <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
                                <button onClick={onBuy} className={`${ctaButtonClass} py-5 px-10 rounded-2xl shadow-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3 w-full sm:w-auto justify-center`} style={ctaStyle}>
                                    {content.ctaText || "ORDER NOW"} <ArrowRight className="w-5 h-5" />
                                </button>
                                <div className="flex flex-col items-start">
                                     <div className="flex items-center gap-1">
                                        <span className={`text-4xl font-black ${content.priceStyles?.className || 'text-slate-900'}`}>
                                            {labels.currencyPos === 'before' ? `${currency}${content.price}` : `${content.price}${currency}`}
                                        </span>
                                        {content.originalPrice && <span className="text-sm text-slate-300 line-through font-bold">{labels.currencyPos === 'before' ? `${currency}${content.originalPrice}` : `${content.originalPrice}${currency}`}</span>}
                                     </div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{content.ctaSubtext}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                                {content.benefits.slice(0, 4).map((b, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center"><Check className="w-3.5 h-3.5 text-slate-600" /></div>
                                        <p className="text-[10px] font-black uppercase leading-tight text-slate-500">{b}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-[45%] order-1 lg:order-2">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-slate-100 rounded-[3rem] -z-10 group-hover:-inset-6 transition-all duration-500"></div>
                            <Gallery content={content} className="rounded-[2.5rem] shadow-2xl overflow-hidden border border-white" />
                        </div>
                    </div>
                </div>

                {/* Modern Features */}
                <div className="space-y-32 mb-32">
                    {content.features.map((f, i) => (
                        <div key={i} className={`flex flex-col lg:flex-row gap-12 lg:gap-24 items-center ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            <div className="w-full lg:w-1/2">
                                <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-slate-100 aspect-square">
                                    <FeatureImage src={getEffectiveImage(content, f.image, i)} alt={f.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 space-y-6">
                                <div className="text-5xl font-black text-slate-100 leading-none">0{i+1}</div>
                                <h3 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-none" style={h2Style}>{f.title}</h3>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed" style={bodyStyle}>{f.description}</p>
                                {f.showCta && (
                                    <button onClick={onBuy} className={`${ctaButtonClass} py-3 px-8 rounded-xl font-bold text-sm shadow-lg`} style={ctaStyle}>{content.ctaText}</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Clean Reviews */}
                <div className="mb-32">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter" style={h2Style}>{labels.reviews}</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <span className="font-bold text-slate-900">4.9/5</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.slice(0, 6).map((r, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                                <p className="text-slate-600 font-medium italic leading-relaxed">"{r.text}"</p>
                                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                                    <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm">{r.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900 uppercase tracking-tight">{r.name}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{labels.certified}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-6 left-6 right-6 lg:hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
                <button onClick={onBuy} className={`${ctaButtonClass} w-full py-5 rounded-2xl shadow-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3`} style={ctaStyle}>
                    {content.ctaText || "ORDER NOW"} <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            <footer className="bg-slate-50 py-20 border-t border-slate-100">
                <div className="container mx-auto px-8 max-w-4xl text-center space-y-8">
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl mx-auto" style={smallStyle}>{labels.legalDisclaimer}</p>
                    <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <button onClick={() => setActiveLegalModal('Privacy')}>{labels.privacyPolicy}</button>
                        <button onClick={() => setActiveLegalModal('Terms')}>{labels.termsConditions}</button>
                        <button onClick={() => setActiveLegalModal('Cookie')}>{labels.cookiePolicy}</button>
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">© {new Date().getFullYear()} {content.headline}</p>
                </div>
            </footer>
            <LegalModal isOpen={!!activeLegalModal} onClose={() => setActiveLegalModal(null)} title={activeLegalModal === 'Privacy' ? labels.privacyPolicy : labels.termsConditions} contentText="..." disclaimer={labels.legalDisclaimer} />
        </div>
    );
}

const HealthTemplate: React.FC<TemplateProps> = ({ content, onBuy, styles }) => {
    const reviews = content.testimonials || [];
    const labels = { ...DEFAULT_LABELS, ...(content.uiTranslation || {}) };
    const currency = content.currency || '€';
    const primaryColor = "teal";
    const ctaButtonClass = content.buttonColor || "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200";
    
    const h1Style = content.customTypography?.h1 ? { fontSize: `${content.customTypography.h1}px` } : {};
    const h2Style = content.customTypography?.h2 ? { fontSize: `${content.customTypography.h2}px` } : {};
    const bodyStyle = content.customTypography?.body ? { fontSize: `${content.customTypography.body}px` } : {};
    // FIX: Defined missing smallStyle to resolve the reference error in the footer.
    const smallStyle = content.customTypography?.small ? { fontSize: `${content.customTypography.small}px` } : {};
    const ctaStyle = content.customTypography?.cta ? { fontSize: `${content.customTypography.cta}px` } : {};
    const backgroundStyle = content.backgroundColor ? { background: content.backgroundColor } : {};

    return (
        <div className={`min-h-screen ${!content.backgroundColor ? 'bg-slate-50' : ''} text-slate-900 pb-32 md:pb-0 ${styles.font}`} style={{...bodyStyle, ...backgroundStyle}}>
            {/* Clinical Header Bar */}
            <div className="bg-white border-b border-slate-200 py-3 px-4 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto flex justify-between items-center max-w-6xl">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 rounded-lg"><Microscope className="w-5 h-5 text-teal-600" /></div>
                        <span className="font-black text-slate-900 tracking-tighter uppercase text-sm">{content.niche || 'Medical Grade'}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-teal-500" /> Certificato</span>
                        <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-teal-500" /> Testato</span>
                    </div>
                    <button onClick={onBuy} className={`${ctaButtonClass} py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-md`}>
                        {labels.offer}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Clinical Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
                    <div className="lg:col-span-7 space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg">
                            <Info className="w-4 h-4 text-teal-600" />
                            <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Informazioni sul Prodotto</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight" style={h1Style}>{content.headline}</h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl border-l-4 border-teal-500 pl-6" style={h2Style}>{content.subheadline}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            {content.benefits.map((b, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="bg-teal-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{b}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 flex flex-col sm:flex-row items-center gap-8">
                            <button onClick={onBuy} className={`${ctaButtonClass} py-5 px-10 rounded-2xl shadow-xl font-black text-lg active:scale-95 transition-all flex items-center gap-3 w-full sm:w-auto justify-center`} style={ctaStyle}>
                                {content.ctaText || "PROCEDI ALL'ORDINE"} <ArrowRight className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900">{labels.currencyPos === 'before' ? `${currency}${content.price}` : `${content.price}${currency}`}</span>
                                    {content.originalPrice && <span className="text-sm text-slate-400 line-through font-bold">{labels.currencyPos === 'before' ? `${currency}${content.originalPrice}` : `${content.originalPrice}${currency}`}</span>}
                                </div>
                                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-[0.2em]">{content.ctaSubtext}</span>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-5">
                        <div className="relative">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-100/50 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
                            <Gallery content={content} className="rounded-[2rem] shadow-2xl border border-white" />
                        </div>
                    </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-16 mb-24">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900" style={h2Style}>Specifiche e Benefici</h2>
                        <div className="h-1.5 w-20 bg-teal-500 mx-auto rounded-full"></div>
                        <p className="text-slate-500 font-medium">Scopri perché migliaia di persone scelgono la nostra tecnologia certificata per la propria salute.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
                        {content.features.map((f, i) => (
                            <div key={i} className="flex gap-6 group">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-teal-500 group-hover:border-teal-500 transition-all duration-300">
                                        <Heart className="w-6 h-6 text-teal-600 group-hover:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{f.title}</h3>
                                    <p className="text-slate-500 leading-relaxed font-medium" style={bodyStyle}>{f.description}</p>
                                    {f.image && (
                                        <div className="pt-4">
                                            <img src={f.image} className="rounded-xl shadow-sm border border-slate-100 w-full h-40 object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Box Content (Professional Checklist) */}
                {content.boxContent?.enabled && (
                    <div className="max-w-4xl mx-auto mb-24 bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Microscope className="w-40 h-40" /></div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-3xl font-black mb-6">{content.boxContent.title}</h3>
                                <div className="space-y-4">
                                    {content.boxContent.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="bg-teal-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>
                                            <span className="font-bold text-sm text-slate-300 uppercase tracking-wide">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {content.boxContent.image && (
                                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                                    <img src={content.boxContent.image} className="w-full h-auto rounded-xl" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Clean Reviews */}
                <div className="mb-24">
                    <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-tighter" style={h2Style}>{labels.reviews}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {reviews.slice(0, 3).map((r, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex text-teal-500 gap-0.5">
                                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-slate-600 italic font-medium leading-relaxed">"{r.text}"</p>
                                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black">{r.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900">{r.name}</p>
                                        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">{labels.certified}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Health Footer */}
            <footer className="bg-white py-20 border-t border-slate-200">
                <div className="container mx-auto px-4 max-w-4xl text-center space-y-10">
                    <div className="flex justify-center gap-4">
                         <ShieldCheck className="w-8 h-8 text-teal-600" />
                         <Lock className="w-8 h-8 text-teal-600" />
                         <Truck className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-medium" style={{...smallStyle, textAlign: 'justify'}}>
                        {labels.legalDisclaimer}
                    </p>
                    <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <button className="hover:text-teal-600 transition-colors">{labels.privacyPolicy}</button>
                        <button className="hover:text-teal-600 transition-colors">{labels.termsConditions}</button>
                        <button className="hover:text-teal-600 transition-colors">{labels.cookiePolicy}</button>
                    </div>
                    <div className="pt-10 border-t border-slate-100">
                        <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">© {new Date().getFullYear()} {content.headline} - Scientific Solutions</p>
                    </div>
                </div>
            </footer>

            {/* Mobile Fixed CTA */}
            <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
                <button onClick={onBuy} className={`${ctaButtonClass} w-full py-5 rounded-2xl shadow-2xl font-black text-lg active:scale-95 transition-all flex items-center justify-center gap-3`}>
                    ORDINA ORA <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

const LandingPage: React.FC<LandingPageProps> = ({ content, thankYouSlug, onRedirect, onPurchase }) => {
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const styles = getTypographyStyles(content.typography);

    useEffect(() => {
        if (content.customHeadHtml) injectCustomScript(content.customHeadHtml);
        if (content.customHeadHtml2) injectCustomScript(content.customHeadHtml2);
        if (content.metaLandingHtml) injectCustomScript(content.metaLandingHtml);
        if (content.tiktokLandingHtml) injectCustomScript(content.tiktokLandingHtml);
    }, [content.customHeadHtml, content.customHeadHtml2, content.metaLandingHtml, content.tiktokLandingHtml]);

    const handleOpenOrder = () => {
        const price = parseFloat(content.price?.replace(',', '.') || '0');
        trackEvent('AddToCart', { content_id: generateContentId(content.headline), value: isNaN(price) ? 0 : price, currency: content.currency || 'EUR' });
        setIsOrderOpen(true);
    }

    const renderTemplate = () => {
        switch (content.templateId) {
            case 'modern-split':
                return <ModernTemplate content={content} onBuy={handleOpenOrder} styles={styles} />;
            case 'health-clean':
                return <HealthTemplate content={content} onBuy={handleOpenOrder} styles={styles} />;
            case 'gadget-cod':
            default:
                return <GadgetTemplate content={content} onBuy={handleOpenOrder} styles={styles} />;
        }
    };

    return (
        <>
            {renderTemplate()}
            <OrderPopup isOpen={isOrderOpen} onClose={() => setIsOrderOpen(false)} content={content} thankYouSlug={thankYouSlug} onRedirect={onRedirect} onPurchase={onPurchase} />
        </>
    );
};

export default LandingPage;