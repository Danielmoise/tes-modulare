import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, base64ToBlob, uploadImage } from './services/supabaseClient';
import { generateLandingPage, generateReviews, generateActionImages, translateLandingPage, rewriteLandingPage, getLanguageConfig } from './services/geminiService';
import LandingPage, { ThankYouPage } from './components/LandingPage';
import { ProductDetails, GeneratedContent, PageTone, UserSession, LandingPageRow, TemplateId, FormFieldConfig, TypographyConfig, UiTranslation, SiteConfig, Testimonial, OnlineUser, AIImageStyle, AnnouncementItem } from './types';
import { Loader2, Sparkles, Star, ChevronLeft, ChevronRight, Save, ShoppingBag, ArrowRight, Trash2, Pencil, Smartphone, Tablet, Monitor, Plus, Images, X, RefreshCcw, ArrowLeft, Settings, Link as LinkIcon, Type, Truck, Flame, Zap, Globe, Banknote, Palette, Users, Copy, Target, Code, Mail, Lock, Package, ShieldCheck, FileText as FileTextIcon, Gift, HardDrive, Terminal, CopyCheck, AlertCircle, Database, Shield, Paintbrush, ChevronDown, Eye, MessageSquare, Quote, Info, CheckCircle, User, Activity, Lightbulb, Languages, CopyPlus, Rocket, ZapIcon, Wand2, MonitorOff, Layout, ListOrdered, Hash, Type as TypeIcon, Bell, Clock } from 'lucide-react';

// Modules
import { LoginModal } from './components/auth/LoginModal';
import { HomeHero } from './components/home/HomeHero';
import { PublicPageGrid } from './components/home/PublicPageGrid';
import { AdminLayout } from './components/admin/AdminLayout';
import { EditorHeader } from './components/admin/Editor/EditorHeader';
import { LiveMapModal } from './components/admin/LiveMapModal';

const DEFAULT_TIKTOK_SCRIPT = `<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
  ttq.setAndDefer = function (t, e) {
    ttq[e] = function () {
      ttq.push([e].concat(Array.prototype.slice.call(arguments, 0)))
    }
  };
  for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
  ttq.instance = function (t) {
    for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
    return e
  };
  ttq.load = function (e, n) {
    var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {};
    var o = document.createElement("script");
    o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t;
    var a = document.getElementsByTagName("script")[0];
    a.parentNode.insertBefore(o, a)
  };

  ttq.load('CVKNTTBC77U5626LPBA0');
  ttq.page();
}(window, document, 'ttq');

ttq.track('Contact');
ttq.track('CompleteRegistration');
ttq.track('Lead');
ttq.track('CompletePayment', {
  content_id: "1",
  content_name: 'lead',
  value: 15.0,
  currency: 'EUR',
});
</script>`;

const TEMPLATES: { id: TemplateId; name: string; desc: string; color: string }[] = [
    { id: 'gadget-cod', name: 'Gadget COD', desc: 'Stile "Offerte-On". Perfetto per prodotti fisici e pagamento alla consegna.', color: 'bg-blue-600 text-white border-blue-800' },
    { id: 'modern-split', name: 'Modern Split', desc: 'Layout pulito e asimmetrico, ideale per brand premium e design minimalista.', color: 'bg-slate-900 text-white border-slate-700' },
    { id: 'health-clean', name: 'Clinical Info', desc: 'Design sterile e informativo, ideale per salute, integratori e prodotti tecnici.', color: 'bg-teal-600 text-white border-teal-800' },
];

const BUTTON_GRADIENTS = [
    { label: 'Orange Sunset', class: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400' },
    { label: 'Emerald Green', class: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-400' },
    { label: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-blue-400' },
    { label: 'Royal Purple', class: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-purple-400' },
    { label: 'Solid Black', class: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' },
    { label: 'Solid Red', class: 'bg-red-600 hover:bg-red-700 text-white border-red-500' },
];

const PRICE_GRADIENTS = [
    { label: 'Classic Blue', class: 'text-blue-600' },
    { label: 'Orange Flare', class: 'bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600' },
    { label: 'Emerald Glow', class: 'bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600' },
    { label: 'Ocean Wave', class: 'bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600' },
    { label: 'Royal Gold', class: 'bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-600' },
    { label: 'Solid Crimson', class: 'text-red-600' },
    { label: 'Slate Night', class: 'text-slate-900' },
];

const SUPPORTED_CURRENCIES = [
    { symbol: '€', label: 'Euro (€)' }, { symbol: '$', label: 'Dollaro ($)' }, { symbol: '£', label: 'Sterlina (£)' },
    { symbol: 'lei', label: 'Leu Rumeno (lei)' }, { symbol: 'zł', label: 'Złoty Polacco (zł)' },
    { symbol: 'kr', label: 'Corona Svedese (kr)' }, { symbol: 'лв', label: 'Lev Bulgaro (лв)' },
    { symbol: 'Ft', label: 'Fiorino Ungherese (Ft)' }, { symbol: 'din', label: 'Dinaro Serbo (din)' }
];

const SUPPORTED_LANGUAGES = [
    { code: 'Italiano', label: '🇮🇹 Italiano' },
    { code: 'Inglese', label: '🇬🇧 Inglese' },
    { code: 'Francese', label: '🇫🇷 Francese' },
    { code: 'Tedesco', label: '🇩🇪 Tedesco' },
    { code: 'Spagnolo', label: '🇪🇸 Spagnolo' },
    { code: 'Rumeno', label: '🇷🇴 Rumeno' },
    { code: 'Polacco', label: '🇵🇱 Polacco' },
    { code: 'Svedese', label: '🇸🇪 Svedese' },
    { code: 'Bulgaro', label: '🇧🇬 Bulgaro' },
    { code: 'Ungherese', label: '🇭🇺 Ungherese' },
    { code: 'Greco', label: '🇬🇷 Greco' },
    { code: 'Croato', label: '🇭🇷 Croato' },
];

const TY_SUFFIXES: Record<string, string> = {
    'Italiano': '-grazie', 'Inglese': '-thanks', 'Francese': '-merci', 'Tedesco': '-danke', 'Austriaco': '-danke',
    'Spagnolo': '-gracias', 'Portoghese': '-obrigado', 'Olandese': '-bedankt', 'Polacco': '-dziekuje',
    'Rumeno': '-multumesc', 'Svedese': '-tack', 'Bulgaro': '-blagodarya', 'Greco': '-efcharisto',
    'Ungherese': '-koszonom', 'Croato': '-hvala', 'Serbo': '-hvala', 'Slovacco': '-dakujem'
};

const ANNOUNCEMENT_ICONS = [
    { id: 'truck', icon: <Truck className="w-4 h-4"/>, label: 'Spedizione' },
    { id: 'zap', icon: <Zap className="w-4 h-4"/>, label: 'Energia' },
    { id: 'star', icon: <Star className="w-4 h-4"/>, label: 'Stella' },
    { id: 'clock', icon: <Clock className="w-4 h-4"/>, label: 'Tempo' },
    { id: 'gift', icon: <Gift className="w-4 h-4"/>, label: 'Regalo' },
    { id: 'shield', icon: <Shield className="w-4 h-4"/>, label: 'Scudo' },
    { id: 'flame', icon: <Flame className="w-4 h-4"/>, label: 'Fuoco' },
    { id: 'bell', icon: <Bell className="w-4 h-4"/>, label: 'Campana' },
];

const getThankYouSuffix = (lang: string) => TY_SUFFIXES[lang] || '-thanks';

const DuplicateModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    page: LandingPageRow; 
    onSuccess: (newPage: any) => void;
}> = ({ isOpen, onClose, page, onSuccess }) => {
    const [strategy, setStrategy] = useState<'clone' | 'translate' | 'reword'>('clone');
    const [targetLang, setTargetLang] = useState(page.content.language || 'Italiano');
    const [targetTone, setTargetTone] = useState(PageTone.PROFESSIONAL);
    const [newName, setNewName] = useState(`${page.product_name} (Copia)`);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const formatSlugLocal = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

    const handleDuplicateAction = async () => {
        if (!isSupabaseConfigured() || !supabase) return;
        setIsLoading(true);
        setProgress('Preparazione dati...');

        try {
            let finalContent = { ...page.content };
            let finalThankYou = { ...page.thank_you_content };

            if (strategy === 'translate') {
                setProgress(`Traduzione in ${targetLang} con AI...`);
                finalContent = await translateLandingPage(page.content, targetLang);
                if (page.thank_you_content) {
                  setProgress(`Traduzione Thank You Page in ${targetLang}...`);
                  finalThankYou = await translateLandingPage(page.thank_you_content, targetLang);
                } else {
                  finalThankYou = createDefaultThankYouContent(finalContent);
                }
            } else if (strategy === 'reword') {
                setProgress(`Rielaborazione testi tono ${targetTone} con AI...`);
                finalContent = await rewriteLandingPage(page.content, targetTone);
                if (page.thank_you_content) {
                  finalThankYou = await rewriteLandingPage(page.thank_you_content, targetTone);
                } else {
                  finalThankYou = createDefaultThankYouContent(finalContent);
                }
            }

            setProgress('Salvataggio nel database...');
            const langConfig = getLanguageConfig(targetLang);
            const suffix = getThankYouSuffix(targetLang);
            const randomId = Math.floor(Math.random() * 10000);
            const baseSlug = formatSlugLocal(newName) + '-' + randomId;

            const newPagePayload = {
                product_name: newName,
                niche: page.niche,
                slug: baseSlug,
                thank_you_slug: baseSlug + suffix,
                content: { ...finalContent, language: targetLang, currency: langConfig.currency },
                thank_you_content: finalThankYou || createDefaultThankYouContent(finalContent),
                is_published: false
            };

            const { data, error } = await supabase.from('landing_pages').insert(newPagePayload).select().single();
            if (error) throw error;

            onSuccess(data);
            onClose();
        } catch (e: any) {
            console.error("Duplication failed", e);
            alert("Errore durante la generazione: " + (e.message || "Risposta AI non valida o timeout."));
        } finally {
            setIsLoading(false);
            setProgress('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                {isLoading && (
                    <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
                        <div className="relative mb-8">
                            <div className="w-20 h-20 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Generazione in corso</h3>
                        <p className="text-slate-500 font-medium">{progress}</p>
                        <p className="text-slate-400 text-[10px] mt-4 uppercase font-bold tracking-widest">Non chiudere questa finestra</p>
                    </div>
                )}
                
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"><X className="w-5 h-5"/></button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-xl"><Copy className="w-6 h-6 text-emerald-400" /></div>
                        <h3 className="text-2xl font-black tracking-tight">Duplicazione Intelligente</h3>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Clona, traduci o reinventa la tua pagina in un click.</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Scegli Strategia</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'clone', icon: <Copy className="w-4 h-4" />, label: 'Clone', desc: 'Copia Identica' },
                                { id: 'translate', icon: <Languages className="w-4 h-4" />, label: 'Translate', desc: 'AI Localization' },
                                { id: 'reword', icon: <Wand2 className="w-4 h-4" />, label: 'Variation', desc: 'AI Copy Rewrite' }
                            ].map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => setStrategy(item.id as any)} 
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${strategy === item.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'border-slate-100 hover:border-slate-200 bg-slate-50 text-slate-400'}`}
                                >
                                    {item.icon}
                                    <span className="text-xs font-black uppercase tracking-tight">{item.label}</span>
                                    <span className="text-[8px] font-bold opacity-60">{item.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Lingua Target</label>
                            <select 
                                disabled={strategy === 'clone'}
                                value={targetLang} 
                                onChange={e => setTargetLang(e.target.value)} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-30"
                            >
                                {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tono di Voce</label>
                            <select 
                                disabled={strategy !== 'reword'}
                                value={targetTone} 
                                onChange={e => setTargetTone(e.target.value as PageTone)} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all disabled:opacity-30"
                            >
                                {Object.values(PageTone).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuovo Nome Prodotto</label>
                        <input 
                            type="text" 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="Nome per la nuova copia..."
                        />
                    </div>

                    <button 
                        onClick={handleDuplicateAction}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg"
                    >
                        {strategy === 'clone' ? <><Copy className="w-5 h-5"/> Esegui Clone Rapido</> : <><Rocket className="w-5 h-5"/> Genera con AI</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PageCard = React.memo(({ page, onView, onEdit, onDuplicate, onDelete }: { 
    page: LandingPageRow, onView: (p: LandingPageRow) => void, onEdit?: (p: LandingPageRow) => void, 
    onDuplicate?: (p: LandingPageRow) => void, onDelete?: (id: string) => void
}) => (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 relative" onClick={() => onView(page)}>
         <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-900/80 rounded-bl-xl backdrop-blur z-20" onClick={(e) => e.stopPropagation()}>
            {onDuplicate && <button onClick={(e) => { e.stopPropagation(); onDuplicate(page); }} className="p-2 hover:bg-emerald-600 rounded-lg text-white transition-colors" title="Duplica / Traduci"><CopyPlus className="w-4 h-4"/></button>}
            {onEdit && <button onClick={(e) => { e.stopPropagation(); onEdit(page); }} className="p-2 hover:bg-blue-600 rounded-lg text-white transition-colors" title="Modifica"><Pencil className="w-4 h-4"/></button>}
            {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} className="p-2 hover:bg-red-600 rounded-lg text-white transition-colors" title="Elimina"><Trash2 className="w-4 h-4"/></button>}
        </div>
        <div className="aspect-video bg-slate-200 relative overflow-hidden">
            <img src={page.content.heroImageBase64 || (page.content.generatedImages?.[0] || `https://picsum.photos/seed/${page.product_name.replace(/\s/g,'')}/800/600`)} alt={page.product_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 z-10">{page.niche}</div>
        </div>
        <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors truncate">{page.product_name}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-4">{page.content.subheadline}</p>
            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{page.slug ? `/${page.slug}` : 'Offerta Limitata'}</span>
                  {!page.is_published && <span className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Bozza / Nascosto</span>}
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /></div>
            </div>
        </div>
    </div>
));

const createDefaultThankYouContent = (landingContent: GeneratedContent): GeneratedContent => ({
    ...landingContent,
    headline: landingContent.uiTranslation?.thankYouTitle || 'Grazie {name}!',
    subheadline: landingContent.uiTranslation?.thankYouMsg || 'Il tuo ordine è stato ricevuto. Ti contatteremo al numero {phone} per confermare.',
    heroImagePrompt: '', 
    benefits: [], 
    features: [], 
    testimonials: [], 
    ctaText: '', 
    ctaSubtext: '',
    backgroundColor: '#f8fafc',
    tiktokThankYouHtml: DEFAULT_TIKTOK_SCRIPT
});

const EditorSection: React.FC<{ title: string; num: string | number; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, num, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-white">
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-slate-900 text-white text-[10px] font-black rounded-full shadow-sm">{num}</span>
                    <div className="flex items-center gap-2 text-slate-900">
                        {icon}
                        <h3 className="font-bold text-sm tracking-tight">{title}</h3>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-5 space-y-5 bg-white">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'product_view' | 'thank_you_view' | 'admin' | 'preview'>('home');
  const [adminSection, setAdminSection] = useState<'pages' | 'settings'>('pages');
  const [publicPages, setPublicPages] = useState<LandingPageRow[]>([]);
  const [adminPages, setAdminPages] = useState<LandingPageRow[]>([]);
  const [selectedPublicPage, setSelectedPublicPage] = useState<LandingPageRow | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('gadget-cod');
  const [orderData, setOrderData] = useState<{name?: string, phone?: string, price?: string} | undefined>(undefined);
  const [slug, setSlug] = useState<string>('');
  const [tySlug, setTySlug] = useState<string>(''); 
  const [isPublished, setIsPublished] = useState<boolean>(true); 
  const [product, setProduct] = useState<ProductDetails>({
    name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', images: [], featureCount: 3, selectedImageStyles: ['lifestyle']
  });
  const [imageUrl, setImageUrl] = useState('');
  const [editorGalleryUrl, setEditorGalleryUrl] = useState(''); 
  const [reviewCount, setReviewCount] = useState<number>(10);
  const [aiImageCount, setAiImageCount] = useState<number>(3);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedThankYouContent, setGeneratedThankYouContent] = useState<GeneratedContent | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null); 
  const [editingMode, setEditingMode] = useState<'landing' | 'thankyou'>('landing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAIImage, setIsGeneratingAIImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [duplicateModalConfig, setDuplicateModalConfig] = useState<{ isOpen: boolean, page: LandingPageRow | null }>({ isOpen: false, page: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tyFileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState<'landing' | 'thankyou'>('landing'); 
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ siteName: 'BESTOFFERS', footerText: `© ${new Date().getFullYear()} Tutti i diritti riservati.`, storageBucketName: 'landing-images' });
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const formatSlug = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const fetchPublicPages = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingPages(true);
    const { data, error } = await supabase.from('landing_pages').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(20); 
    if (!error && data) setPublicPages(data as LandingPageRow[]);
    setIsLoadingPages(false);
  }, []);

  const fetchAllAdminPages = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !session) return;
    setIsLoadingPages(true);
    const { data, error } = await supabase.from('landing_pages').select('*').order('created_at', { ascending: false });
    if (!error) setAdminPages(data as LandingPageRow[]);
    setIsLoadingPages(false);
  }, [session]);

  const handlePurchase = useCallback((pageUrl: string) => {
    // Analytics tracking...
  }, []);

  useEffect(() => {
    if (view === 'home' && isSupabaseConfigured()) fetchPublicPages();
    if (view === 'admin' && session) fetchAllAdminPages();
  }, [view, session, fetchPublicPages, fetchAllAdminPages]);

  useEffect(() => {
    const init = async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
                setSession({ id: currentSession.user.id, email: currentSession.user.email || '' });
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                if (session) setSession({ id: session.user.id, email: session.user.email || '' });
                else setSession(null);
            });

            const { data: settingsData } = await supabase.from('site_settings').select('config').eq('id', 1).maybeSingle();
            if (settingsData?.config) setSiteConfig(prev => ({ ...prev, ...settingsData.config }));

            const urlParams = new URLSearchParams(window.location.search);
            const slugParam = urlParams.get('s');
            const idParam = urlParams.get('p');

            if (slugParam || idParam) {
                let query = supabase.from('landing_pages').select('*');
                if (slugParam) {
                    query = query.or(`slug.eq.${slugParam},thank_you_slug.eq.${slugParam}`);
                } else {
                    query = query.eq('id', idParam);
                }

                const { data: pageData, error } = await query.maybeSingle();
                if (pageData && !error) {
                    setSelectedPublicPage(pageData as LandingPageRow);
                    if (slugParam && pageData.thank_you_slug === slugParam) setView('thank_you_view');
                    else setView('product_view');
                }
            }
            return () => subscription.unsubscribe();
        }
    };
    init();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setAuthError('');
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = isRegistering ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      else if (data.session) { setSession({ id: data.session.user.id, email: data.session.user.email || '' }); setIsLoginOpen(false); setView('admin'); }
    }
    setLoading(false);
  };

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); setSession(null); setView('home'); };

  const handleOpenDuplicateModal = (page: LandingPageRow) => {
      setDuplicateModalConfig({ isOpen: true, page });
  };

  const handleSaveToDb = async (asNew = false) => {
    if (!generatedContent || !generatedThankYouContent || !session || !supabase) return;
    
    let targetName = product.name;
    if (asNew) {
        const customName = prompt("Salva come nuova pagina. Inserisci il nome:", `${product.name} (Copia)`);
        if (!customName) return;
        targetName = customName;
    }

    setIsSaving(true);
    
    try {
        const bucket = siteConfig.storageBucketName || 'landing-images';
        const filePrefix = formatSlug(targetName);

        const finalLandingContent = { ...generatedContent };
        
        if (finalLandingContent.heroImageBase64?.startsWith('data:image')) {
            const url = await uploadImage(finalLandingContent.heroImageBase64, bucket, `${filePrefix}-hero`);
            if (url) finalLandingContent.heroImageBase64 = url;
        }

        if (finalLandingContent.generatedImages && finalLandingContent.generatedImages.length > 0) {
            const uploadedGallery = await Promise.all(
                finalLandingContent.generatedImages.map(async (img, idx) => {
                    if (img.startsWith('data:image')) {
                        const url = await uploadImage(img, bucket, `${filePrefix}-gallery-${idx}`);
                        return url || img;
                    }
                    return img;
                })
            );
            finalLandingContent.generatedImages = uploadedGallery;
        }

        if (finalLandingContent.features) {
            const updatedFeatures = await Promise.all(
                finalLandingContent.features.map(async (f, idx) => {
                    if (f.image?.startsWith('data:image')) {
                        const url = await uploadImage(f.image, bucket, `${filePrefix}-feature-${idx}`);
                        return { ...f, image: url || f.image };
                    }
                    return f;
                })
            );
            finalLandingContent.features = updatedFeatures;
        }

        const finalTyContent = { ...generatedThankYouContent };
        if (finalTyContent.heroImageBase64?.startsWith('data:image')) {
            const url = await uploadImage(finalTyContent.heroImageBase64, bucket, `${filePrefix}-ty-hero`);
            if (url) finalTyContent.heroImageBase64 = url;
        }

        const newSlug = asNew ? (formatSlug(targetName) + '-' + Math.floor(Math.random() * 1000)) : slug;
        const newTySlug = asNew ? (newSlug + getThankYouSuffix(finalLandingContent.language || 'Italiano')) : tySlug;

        const dbPayload = {
            product_name: targetName, slug: newSlug, thank_you_slug: newTySlug, niche: product.niche,
            content: { ...finalLandingContent, templateId: selectedTemplate },
            thank_you_content: finalTyContent, is_published: asNew ? false : isPublished
        };

        const { error } = (editingPageId && !asNew) ? 
            await supabase.from('landing_pages').update(dbPayload).eq('id', editingPageId) : 
            await supabase.from('landing_pages').insert(dbPayload);
        
        if (!error) { 
            await fetchAllAdminPages(); 
            handleCloseEditor(); 
        } else {
            alert("Errore nel salvataggio: " + error.message);
        }
    } catch (e) {
        console.error("Save failed", e);
        alert("Errore durante l'upload delle immagini o il salvataggio.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCloseEditor = () => { 
    setGeneratedContent(null); 
    setGeneratedThankYouContent(null); 
    setEditingPageId(null); 
    setSlug(''); 
    setIsPublished(true);
    setProduct({ name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', images: [], featureCount: 3, selectedImageStyles: ['lifestyle'] }); 
  };

  const handleGenerate = async () => {
    if (!product.name) { alert("Inserisci il nome del prodotto"); return; }
    setIsGenerating(true);
    try {
      let finalImages = [...(product.images || [])];
      if (imageUrl && imageUrl.trim() !== '') finalImages.push(imageUrl.trim());
      
      if (product.selectedImageStyles && product.selectedImageStyles.length > 0 && aiImageCount > 0) {
          try {
              const aiImgs = await generateActionImages(product, product.selectedImageStyles, aiImageCount);
              finalImages = [...finalImages, ...aiImgs];
          } catch (e) {
              console.warn("AI Image generation failed during landing page creation", e);
          }
      }

      const updatedProduct = { ...product, images: finalImages };
      const result = await generateLandingPage(updatedProduct, reviewCount);
      
      if (reviewCount > 0) {
          try {
              const aiReviews = await generateReviews(product.name, product.language, reviewCount);
              result.testimonials = aiReviews;
          } catch (e) {
              console.warn("AI Review generation failed", e);
          }
      }

      const ty = createDefaultThankYouContent(result);
      const [hero, ...gallery] = finalImages;
      
      // Ensure the generated announcements are properly formatted for our internal structure
      const initialAnnouncements = result.announcements && result.announcements.length >= 2 
        ? result.announcements.map(ann => ({ ...ann, iconSize: 14 }))
        : [
            { text: result.announcementBarText || 'Spedizione Gratuita in 24/48h', icon: 'truck', iconSize: 14 },
            { text: 'Soddisfatti o Rimborsati', icon: 'shield', iconSize: 14 }
          ];

      setGeneratedContent({ 
          ...result, 
          testimonials: result.testimonials || [], 
          templateId: selectedTemplate, 
          heroImageBase64: hero, 
          generatedImages: gallery,
          announcements: initialAnnouncements,
          announcementInterval: 5,
          announcementFontSize: 15,
          priceStyles: { className: 'text-blue-600' }
      });
      setGeneratedThankYouContent(ty);
      setSlug(formatSlug(product.name)); 
      setTySlug(formatSlug(product.name) + getThankYouSuffix(result.language || 'Italiano'));
      setIsPublished(true);
    } finally { setIsGenerating(false); }
  };

  const handleAddImageUrl = () => {
    if (imageUrl && imageUrl.trim() !== '') {
        setProduct(prev => ({ ...prev, images: [...(prev.images || []), imageUrl.trim()] }));
        setImageUrl('');
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setProduct(prev => ({
        ...prev,
        images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddGalleryUrlToEditor = () => {
      if (editorGalleryUrl && editorGalleryUrl.trim() !== '' && generatedContent) {
          updateContent({ generatedImages: [...(generatedContent.generatedImages || []), editorGalleryUrl.trim()] });
          setEditorGalleryUrl('');
      }
  };

  const handleGenerateAIImage = async () => {
    if (!product.name || !product.description) {
        alert("Inserisci Nome e Descrizione del prodotto per generare l'immagine AI.");
        return;
    }
    if (!product.selectedImageStyles || product.selectedImageStyles.length === 0) {
        alert("Seleziona almeno uno stile immagine AI.");
        return;
    }
    setIsGeneratingAIImage(true);
    try {
        const aiImgs = await generateActionImages(product, product.selectedImageStyles, 1);
        setProduct(prev => ({ ...prev, images: [...(prev.images || []), ...aiImgs] }));
    } catch (e) {
        alert("Errore nella generazione immagine AI.");
    } finally {
        setIsGeneratingAIImage(false);
    }
  };

  const handleViewPage = (page: LandingPageRow) => {
    setSelectedPublicPage(page);
    setView('product_view');
    window.history.pushState({}, '', `?${page.slug ? 's=' + page.slug : 'p=' + page.id}`);
  };

  const handleEdit = (page: LandingPageRow) => {
    setEditingPageId(page.id);
    setProduct({
        name: page.product_name, niche: page.niche || '', description: page.content.subheadline || '', 
        targetAudience: '', tone: PageTone.PROFESSIONAL, language: page.content.language || 'Italiano',
        images: page.content.generatedImages || [], featureCount: page.content.features?.length || 3, selectedImageStyles: ['lifestyle']
    });
    setGeneratedContent(page.content);
    setGeneratedThankYouContent(page.thank_you_content || createDefaultThankYouContent(page.content));
    setSlug(page.slug || '');
    setTySlug(page.thank_you_slug || '');
    setIsPublished(page.is_published ?? true);
    setSelectedTemplate(page.content.templateId || 'gadget-cod');
    setAdminSection('pages');
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Sei sicuro di voler eliminare questa pagina?")) return;
      if (!supabase) return;
      const { error } = await supabase.from('landing_pages').delete().eq('id', id);
      if (!error) fetchAllAdminPages();
  };

  const updateContent = (updates: Partial<GeneratedContent>) => {
    if (!generatedContent) return;
    setGeneratedContent({ ...generatedContent, ...updates });
  };

  const updateTYContent = (updates: Partial<GeneratedContent>) => {
    if (!generatedThankYouContent) return;
    setGeneratedThankYouContent({ ...generatedThankYouContent, ...updates });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isThankYou = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (!generatedContent) {
            setProduct(prev => ({ ...prev, images: [...(prev.images || []), base64] }));
        } else {
            if (isThankYou) updateTYContent({ heroImageBase64: base64 });
            else updateContent({ generatedImages: [...(generatedContent.generatedImages || []), base64] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleImageStyle = (style: AIImageStyle) => {
      setProduct(prev => {
          const current = prev.selectedImageStyles || [];
          if (current.includes(style)) return { ...prev, selectedImageStyles: current.filter(s => s !== style) };
          return { ...prev, selectedImageStyles: [...current, style] };
      });
  };

  const handleMoveGalleryImage = (index: number, direction: 'left' | 'right') => {
      if (!generatedContent || !generatedContent.generatedImages) return;
      const gallery = [...generatedContent.generatedImages];
      const newIndex = direction === 'left' ? index - 1 : index + 1;
      
      if (newIndex < 0) {
          const oldHero = generatedContent.heroImageBase64;
          const thisImg = gallery[index];
          gallery[index] = oldHero || '';
          updateContent({ heroImageBase64: thisImg, generatedImages: gallery.filter(Boolean) });
      } else if (newIndex < gallery.length) {
          [gallery[index], gallery[newIndex]] = [gallery[newIndex], gallery[index]];
          updateContent({ generatedImages: gallery });
      }
  };

  const handleSetAsHero = (index: number) => {
      if (!generatedContent || !generatedContent.generatedImages) return;
      const gallery = [...generatedContent.generatedImages];
      const oldHero = generatedContent.heroImageBase64;
      const newHero = gallery[index];
      
      gallery[index] = oldHero || '';
      updateContent({ heroImageBase64: newHero, generatedImages: gallery.filter(Boolean) });
  };

  const handleAddAnnouncement = () => {
      const current = generatedContent?.announcements || [];
      updateContent({ announcements: [...current, { text: 'Nuovo Annuncio', icon: 'truck', iconSize: 14 }] });
  };

  const updateAnnouncement = (index: number, updates: Partial<AnnouncementItem>) => {
      const current = [...(generatedContent?.announcements || [])];
      current[index] = { ...current[index], ...updates };
      updateContent({ announcements: current });
  };

  const removeAnnouncement = (index: number) => {
      const current = (generatedContent?.announcements || []).filter((_, i) => i !== index);
      updateContent({ announcements: current });
  };

  if (view === 'product_view' && selectedPublicPage) {
      return <LandingPage content={selectedPublicPage.content} thankYouSlug={selectedPublicPage.thank_you_slug} onPurchase={handlePurchase} onRedirect={(data) => { setOrderData(data); setView('thank_you_view'); }} />;
  }

  if (view === 'thank_you_view' && selectedPublicPage) {
      return <ThankYouPage content={selectedPublicPage.thank_you_content || createDefaultThankYouContent(selectedPublicPage.content)} initialData={orderData} />;
  }

  if (view === 'admin' && session) {
    return (
      <AdminLayout session={session} adminSection={adminSection} setAdminSection={setAdminSection} onlineUsersCount={onlineUsers.length} isMapOpen={isMapOpen} setIsMapOpen={setIsMapOpen} handleLogout={handleLogout} onGoHome={() => setView('home')}>
        <LiveMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} users={onlineUsers} />
        {duplicateModalConfig.isOpen && duplicateModalConfig.page && (
            <DuplicateModal 
                isOpen={duplicateModalConfig.isOpen} 
                onClose={() => setDuplicateModalConfig({ isOpen: false, page: null })} 
                page={duplicateModalConfig.page}
                onSuccess={() => fetchAllAdminPages()}
            />
        )}
        {adminSection === 'settings' ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-in fade-in duration-500 max-w-2xl">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Settings className="w-5 h-5 text-emerald-600" /> Impostazioni Sito</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome del Portale</label>
                        <input type="text" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Testo Footer</label>
                        <input type="text" value={siteConfig.footerText} onChange={e => setSiteConfig({...siteConfig, footerText: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"/>
                    </div>
                    <button onClick={async () => {
                        if (supabase) {
                            const { error } = await supabase.from('site_settings').upsert({ id: 1, config: siteConfig });
                            if (!error) alert("Impostazioni salvate correttamente!");
                        }
                    }} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Salva Impostazioni</button>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    {!generatedContent ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6 animate-in slide-in-from-left-4 duration-500">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500" /> Nuova Pagina</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Step 1: Design</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {TEMPLATES.map(t => (
                                            <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}>
                                                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Step 2: Dettagli</label>
                                    
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lingua Generazione</label>
                                      <select 
                                          value={product.language} 
                                          onChange={e => setProduct({...product, language: e.target.value})} 
                                          className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white font-bold"
                                      >
                                          {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                      </select>
                                    </div>

                                    <input type="text" placeholder="Nome Prodotto" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                    <input type="text" placeholder="Nicchia" value={product.niche} onChange={e => setProduct({...product, niche: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                    <input type="text" placeholder="Target" value={product.targetAudience} onChange={e => setProduct({...product, targetAudience: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                    <textarea placeholder="Descrizione del Prodotto" value={product.description} onChange={e => setProduct({...product, description: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none" />
                                </div>

                                <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ListOrdered className="w-3 h-3 text-emerald-500" /> Configurazione AI</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider text-center">N° Paragrafi</label>
                                            <input type="number" min="1" max="10" value={product.featureCount} onChange={e => setProduct({...product, featureCount: parseInt(e.target.value) || 1})} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider text-center">N° Recensioni</label>
                                            <input type="number" min="0" max="50" value={reviewCount} onChange={e => setReviewCount(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wider text-center">N° Immagini AI</label>
                                            <input type="number" min="0" max="6" value={aiImageCount} onChange={e => setAiImageCount(parseInt(e.target.value) || 0)} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-emerald-500" /> Stili Immagini AI</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <button 
                                            onClick={() => toggleImageStyle('lifestyle')} 
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${product.selectedImageStyles?.includes('lifestyle') ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <User className="w-4 h-4" />
                                            <span className="text-[8px] font-bold uppercase">Umano</span>
                                        </button>
                                        <button 
                                            onClick={() => toggleImageStyle('technical')} 
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${product.selectedImageStyles?.includes('technical') ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <Activity className="w-4 h-4" />
                                            <span className="text-[8px] font-bold uppercase">Tecnica</span>
                                        </button>
                                        <button 
                                            onClick={() => toggleImageStyle('informative')} 
                                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${product.selectedImageStyles?.includes('informative') ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <Lightbulb className="w-4 h-4" />
                                            <span className="text-[8px] font-bold uppercase">Info</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Foto (Carica o Incolla URL)</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-100 hover:bg-slate-200 p-3 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200">
                                            <Images className="w-4 h-4" /> Carica Foto
                                        </button>
                                        <button 
                                            onClick={handleGenerateAIImage} 
                                            disabled={isGeneratingAIImage}
                                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 p-3 rounded-xl text-emerald-600 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 disabled:opacity-50"
                                        >
                                            {isGeneratingAIImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Genera AI</>}
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e)} className="hidden" accept="image/*" />
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Incolla URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="flex-1 border border-slate-200 rounded-xl p-3 text-sm outline-none" />
                                        <button onClick={handleAddImageUrl} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-all"><Plus className="w-4 h-4"/></button>
                                    </div>
                                    
                                    {/* NUOVA SEZIONE ANTEPRIMA IMMAGINI SELEZIONATE */}
                                    {product.images && product.images.length > 0 && (
                                        <div className="pt-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Immagini Selezionate ({product.images.length})</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {product.images.map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={() => handleRemoveProductImage(idx)}
                                                            className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Genera Anteprima</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                            <EditorHeader productName={product.name} editingMode={editingMode} setEditingMode={setEditingMode} setPreviewMode={setPreviewMode} onDiscard={handleCloseEditor} />
                            
                            {editingMode === 'landing' ? (
                                <>
                                    <EditorSection title="Barra degli Annunci" num="0" icon={<Bell className="w-4 h-4"/>} defaultOpen={true}>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequenza Messaggi</label>
                                                <button onClick={handleAddAnnouncement} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"><Plus className="w-3 h-3"/></button>
                                            </div>
                                            <div className="space-y-3">
                                                {(generatedContent.announcements || []).map((ann, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group">
                                                        <button onClick={() => removeAnnouncement(idx)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition"><X className="w-3.5 h-3.5"/></button>
                                                        <div className="flex flex-col gap-1.5">
                                                            <input 
                                                                type="text" 
                                                                value={ann.text} 
                                                                onChange={e => updateAnnouncement(idx, { text: e.target.value })} 
                                                                placeholder="Testo annuncio..." 
                                                                className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold"
                                                            />
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1">
                                                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Icona</label>
                                                                    <div className="grid grid-cols-4 gap-1">
                                                                        {ANNOUNCEMENT_ICONS.map(iconItem => (
                                                                            <button 
                                                                                key={iconItem.id} 
                                                                                onClick={() => updateAnnouncement(idx, { icon: iconItem.id })}
                                                                                className={`p-1.5 border rounded-md flex items-center justify-center transition-all ${ann.icon === iconItem.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                                                                title={iconItem.label}
                                                                            >
                                                                                {iconItem.icon}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="w-20">
                                                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Dim. Icona</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={ann.iconSize || 14} 
                                                                        onChange={e => updateAnnouncement(idx, { iconSize: parseInt(e.target.value) || 14 })} 
                                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs text-center"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400"/>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Intervallo (secondi)</label>
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        value={generatedContent.announcementInterval || 5} 
                                                        onChange={e => updateContent({ announcementInterval: parseInt(e.target.value) || 5 })} 
                                                        className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <TypeIcon className="w-3.5 h-3.5 text-slate-400"/>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Grandezza Testo (px)</label>
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        min="8" 
                                                        max="30"
                                                        value={generatedContent.announcementFontSize || 15} 
                                                        onChange={e => updateContent({ announcementFontSize: parseInt(e.target.value) || 15 })} 
                                                        className="w-16 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="URL & Link" num="1" icon={<LinkIcon className="w-4 h-4"/>} defaultOpen={false}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Landing Page Slug</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-mono text-xs">/s/</span>
                                                    <input type="text" value={slug} onChange={e => setSlug(formatSlug(e.target.value))} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thank You Page Slug</label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-mono text-xs">/s/</span>
                                                    <input type="text" value={tySlug} onChange={e => setTySlug(formatSlug(e.target.value))} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thank You Page Slug esterno (Redirect URL)</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={generatedContent.customThankYouUrl || ''} 
                                                        onChange={e => updateContent({ customThankYouUrl: e.target.value })} 
                                                        placeholder="https://..." 
                                                        className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-slate-100">
                                                <label className="flex items-center gap-2 cursor-pointer mb-1">
                                                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                                                    <span className="text-xs font-bold text-slate-700 uppercase">Mostra nella Home Page</span>
                                                </label>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Design" num="2" icon={<Layout className="w-4 h-4"/>}>
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Template Layout</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {TEMPLATES.map(t => (
                                                    <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}>
                                                        <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </EditorSection>
                                    
                                    <EditorSection title="Prezzo & Offerta" num="3" icon={<Banknote className="w-4 h-4"/>}>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Prezzo</label>
                                                <input type="text" value={generatedContent.price} onChange={e => updateContent({ price: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Prezzo Originale</label>
                                                <input type="text" value={generatedContent.originalPrice} onChange={e => updateContent({ originalPrice: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Stile Colore Prezzo</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {PRICE_GRADIENTS.map((g, i) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => updateContent({ priceStyles: { ...generatedContent.priceStyles, className: g.class } })} 
                                                        className={`p-2 rounded-lg border-2 text-[9px] font-bold transition-all ${generatedContent.priceStyles?.className === g.class ? 'border-blue-500 scale-105' : 'border-slate-100 hover:border-slate-300'}`}
                                                    >
                                                        <div className={`h-4 w-full rounded mb-1 bg-white flex items-center justify-center overflow-hidden`}>
                                                            <span className={`font-black ${g.class}`}>PREZZO</span>
                                                        </div>
                                                        {g.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Moneta</label>
                                            <select 
                                                value={generatedContent.currency || '€'} 
                                                onChange={e => updateContent({ currency: e.target.value })}
                                                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                                            >
                                                {SUPPORTED_CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                                            </select>
                                        </div>

                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spedizione</label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={generatedContent.enableShippingCost} onChange={e => updateContent({ enableShippingCost: e.target.checked })} className="w-3.5 h-3.5 accent-emerald-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Visibile</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-xs">{generatedContent.currency}</span>
                                                <input type="text" value={generatedContent.shippingCost || '0.00'} onChange={e => updateContent({ shippingCost: e.target.value })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" placeholder="0.00" />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 mt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scarsità & Stock</label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={generatedContent.stockConfig?.enabled} onChange={e => updateContent({ stockConfig: { ...generatedContent.stockConfig!, enabled: e.target.checked } })} className="w-3.5 h-3.5 accent-red-500" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Attivo</span>
                                                </label>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[10px] text-slate-400 w-16">Quantità:</label>
                                                    <input type="number" value={generatedContent.stockConfig?.quantity} onChange={e => updateContent({ stockConfig: { ...generatedContent.stockConfig!, quantity: parseInt(e.target.value) || 0 } })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[10px] text-slate-400">Testo Scarsità (Usa {'{x}'} per il numero):</label>
                                                    <input type="text" value={generatedContent.stockConfig?.textOverride || ''} onChange={e => updateContent({ stockConfig: { ...generatedContent.stockConfig!, textOverride: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="Solo {x} pezzi rimasti" />
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Upsell & Notifiche" num="4" icon={<Bell className="w-4 h-4"/>}>
                                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-xs font-bold text-emerald-900 uppercase">Assicurazione Spedizione</span>
                                                </div>
                                                <input type="checkbox" checked={generatedContent.insuranceConfig?.enabled} onChange={e => updateContent({ insuranceConfig: { ...generatedContent.insuranceConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-emerald-600" />
                                            </div>
                                            {generatedContent.insuranceConfig?.enabled && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" value={generatedContent.insuranceConfig.label} onChange={e => updateContent({ insuranceConfig: { ...generatedContent.insuranceConfig!, label: e.target.value } })} className="col-span-2 border border-emerald-200 rounded-lg p-2 text-xs" placeholder="Etichetta" />
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-emerald-600">Costo:</span>
                                                        <input type="text" value={generatedContent.insuranceConfig.cost} onChange={e => updateContent({ insuranceConfig: { ...generatedContent.insuranceConfig!, cost: e.target.value } })} className="flex-1 border border-emerald-200 rounded-lg p-2 text-xs" />
                                                    </div>
                                                    <label className="flex items-center justify-end gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={generatedContent.insuranceConfig.defaultChecked} onChange={e => updateContent({ insuranceConfig: { ...generatedContent.insuranceConfig!, defaultChecked: e.target.checked } })} className="w-3.5 h-3.5 accent-emerald-600" />
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Pre-selezionato</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 mb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Gift className="w-4 h-4 text-purple-600" />
                                                    <span className="text-xs font-bold text-purple-900 uppercase">Gadget Omaggio</span>
                                                </div>
                                                <input type="checkbox" checked={generatedContent.gadgetConfig?.enabled} onChange={e => updateContent({ gadgetConfig: { ...generatedContent.gadgetConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-purple-600" />
                                            </div>
                                            {generatedContent.gadgetConfig?.enabled && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" value={generatedContent.gadgetConfig.label} onChange={e => updateContent({ gadgetConfig: { ...generatedContent.gadgetConfig!, label: e.target.value } })} className="col-span-2 border border-purple-200 rounded-lg p-2 text-xs" placeholder="Etichetta" />
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-purple-600">Costo:</span>
                                                        <input type="text" value={generatedContent.gadgetConfig.cost} onChange={e => updateContent({ gadgetConfig: { ...generatedContent.gadgetConfig!, cost: e.target.value } })} className="flex-1 border border-emerald-200 rounded-lg p-2 text-xs" />
                                                    </div>
                                                    <label className="flex items-center justify-end gap-2 cursor-pointer">
                                                        <input type="checkbox" checked={generatedContent.gadgetConfig.defaultChecked} onChange={e => updateContent({ gadgetConfig: { ...generatedContent.gadgetConfig!, defaultChecked: e.target.checked } })} className="w-3.5 h-3.5 accent-purple-600" />
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase">Pre-selezionato</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-bold text-blue-900 uppercase">Notifiche Social Proof</span>
                                                </div>
                                                <input type="checkbox" checked={generatedContent.socialProofConfig?.enabled} onChange={e => updateContent({ socialProofConfig: { ...generatedContent.socialProofConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-blue-600" />
                                            </div>
                                            {generatedContent.socialProofConfig?.enabled && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-4 h-4 text-blue-400" />
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-blue-700 font-bold uppercase mb-1">Ogni quanti secondi?</label>
                                                            <input type="number" min="2" value={generatedContent.socialProofConfig.intervalSeconds} onChange={e => updateContent({ socialProofConfig: { ...generatedContent.socialProofConfig!, intervalSeconds: parseInt(e.target.value) || 10 } })} className="w-full border border-blue-200 rounded-lg p-2 text-xs" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Eye className="w-4 h-4 text-blue-400" />
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-blue-700 font-bold uppercase mb-1">Quante volte?</label>
                                                            <input type="number" min="1" max="10" value={generatedContent.socialProofConfig.maxShows} onChange={e => updateContent({ socialProofConfig: { ...generatedContent.socialProofConfig!, maxShows: parseInt(e.target.value) || 4 } })} className="w-full border border-blue-200 rounded-lg p-2 text-xs" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Testo & Contenuto" num="5" icon={<FileTextIcon className="w-4 h-4"/>}>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Headline H1</label>
                                            <textarea value={generatedContent.headline} onChange={e => updateContent({ headline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-xs h-20 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Subheadline H2</label>
                                            <textarea value={generatedContent.subheadline} onChange={e => updateContent({ subheadline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-xs h-20 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Testo CTA Principale</label>
                                            <input type="text" value={generatedContent.ctaText} onChange={e => updateContent({ ctaText: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Sottotitolo CTA</label>
                                            <input type="text" value={generatedContent.ctaSubtext} onChange={e => updateContent({ ctaSubtext: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Galleria Immagini" num="6" icon={<Images className="w-4 h-4"/>}>
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {/* Immagine Principale (Hero) integrata nella griglia per ordinamento */}
                                            {generatedContent.heroImageBase64 && (
                                                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500 group bg-white shadow-md">
                                                    <img src={generatedContent.heroImageBase64} className="w-full h-full object-cover" />
                                                    <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm">PRINCIPALE</div>
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleMoveGalleryImage(0, 'right')}
                                                            disabled={!generatedContent.generatedImages || generatedContent.generatedImages.length === 0}
                                                            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-30" 
                                                            title="Sposta a destra"
                                                        >
                                                            <ArrowRight className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {generatedContent.generatedImages?.map((img, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-white">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 px-2">
                                                        <div className="flex gap-1.5">
                                                            <button 
                                                                onClick={() => handleMoveGalleryImage(i, 'left')} 
                                                                className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600" 
                                                                title="Sposta a sinistra"
                                                            >
                                                                <ArrowLeft className="w-3.5 h-3.5"/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSetAsHero(i)} 
                                                                className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600" 
                                                                title="Imposta come principale"
                                                            >
                                                                <Star className="w-3.5 h-3.5 fill-current"/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleMoveGalleryImage(i, 'right')} 
                                                                disabled={i === (generatedContent.generatedImages?.length || 0) - 1}
                                                                className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-30" 
                                                                title="Sposta a destra"
                                                            >
                                                                <ArrowRight className="w-3.5 h-3.5"/>
                                                            </button>
                                                        </div>
                                                        <button onClick={() => updateContent({ generatedImages: generatedContent.generatedImages?.filter((_, idx) => idx !== i) })} className="p-1 bg-red-500 text-white rounded-md w-full flex items-center justify-center gap-1 mt-0.5 hover:bg-red-600">
                                                            <Trash2 className="w-3 h-3"/> <span className="text-[8px] font-black uppercase">Elimina</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 bg-slate-50 transition-all">
                                                <Plus className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] font-bold uppercase">Carica</span>
                                            </button>
                                        </div>
                                        <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggiungi tramite URL</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Incolla URL immagine..." 
                                                    value={editorGalleryUrl} 
                                                    onChange={e => setEditorGalleryUrl(e.target.value)} 
                                                    className="flex-1 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500" 
                                                />
                                                <button 
                                                    onClick={handleAddGalleryUrlToEditor}
                                                    className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Benefici" num="7" icon={<CheckCircle className="w-4 h-4"/>}>
                                        <div className="space-y-2">
                                            {generatedContent.benefits.map((b, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input type="text" value={b} onChange={e => {
                                                        const newBenefits = [...generatedContent.benefits];
                                                        newBenefits[i] = e.target.value;
                                                        updateContent({ benefits: newBenefits });
                                                    }} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                    <button onClick={() => updateContent({ benefits: generatedContent.benefits.filter((_, idx) => idx !== i) })} className="text-red-500 p-1"><X className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                            <button onClick={() => updateContent({ benefits: [...generatedContent.benefits, "Nuovo beneficio"] })} className="text-emerald-600 text-[10px] font-bold uppercase flex items-center gap-1"><Plus className="w-3 h-3"/> Aggiungi Beneficio</button>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Paragrafi Features" num="8" icon={<Package className="w-4 h-4"/>}>
                                        <div className="space-y-6">
                                            {generatedContent.features.map((f, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-[10px] font-black text-slate-400">FEATURE #{i+1}</span>
                                                        <button onClick={() => updateContent({ features: generatedContent.features.filter((_, idx) => idx !== i) })} className="text-red-500"><X className="w-4 h-4"/></button>
                                                    </div>
                                                    <input type="text" placeholder="Titolo" value={f.title} onChange={e => {
                                                        const newFeatures = [...generatedContent.features];
                                                        newFeatures[i] = { ...f, title: e.target.value };
                                                        updateContent({ features: newFeatures });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                                    <textarea placeholder="Descrizione" value={f.description} onChange={e => {
                                                        const newFeatures = [...generatedContent.features];
                                                        newFeatures[i] = { ...f, description: e.target.value };
                                                        updateContent({ features: newFeatures });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-20" />
                                                    
                                                    <div className="pt-2 space-y-3">
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Immagine Feature</label>
                                                        <div className="flex flex-col gap-3">
                                                            {f.image && (
                                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                                                                    <img src={f.image} className="w-full h-full object-cover" />
                                                                    <button onClick={() => {
                                                                        const newFeatures = [...generatedContent.features];
                                                                        newFeatures[i] = { ...f, image: undefined };
                                                                        updateContent({ features: newFeatures });
                                                                    }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-md shadow-lg"><X className="w-3 h-3"/></button>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Scegli dalla galleria</span>
                                                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                                    {[generatedContent.heroImageBase64, ...(generatedContent.generatedImages || [])].filter(Boolean).map((img, idx) => (
                                                                        <button 
                                                                            key={idx} 
                                                                            onClick={() => {
                                                                                const newFeatures = [...generatedContent.features];
                                                                                newFeatures[i] = { ...f, image: img as string };
                                                                                updateContent({ features: newFeatures });
                                                                            }}
                                                                            className={`flex-shrink-0 w-12 h-12 rounded-md border-2 overflow-hidden transition-all ${f.image === img ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-transparent hover:border-slate-200 opacity-60 hover:opacity-100'}`}
                                                                        >
                                                                            <img src={img as string} className="w-full h-full object-cover" />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="pt-2 border-t border-slate-100">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase mb-2 block">Oppure incolla URL</span>
                                                                    <input 
                                                                        type="text" 
                                                                        placeholder="https://..." 
                                                                        value={f.image && !([generatedContent.heroImageBase64, ...(generatedContent.generatedImages || [])].includes(f.image)) ? f.image : ''}
                                                                        onChange={e => {
                                                                            const newFeatures = [...generatedContent.features];
                                                                            newFeatures[i] = { ...f, image: e.target.value };
                                                                            updateContent({ features: newFeatures });
                                                                        }}
                                                                        className="w-full border border-slate-200 rounded-lg p-2 text-[10px] outline-none focus:ring-2 focus:ring-blue-500" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" checked={f.showCta} onChange={e => {
                                                                const newFeatures = [...generatedContent.features];
                                                                newFeatures[i] = { ...f, showCta: e.target.checked };
                                                                updateContent({ features: newFeatures });
                                                            }} className="w-4 h-4 accent-blue-500" />
                                                            <span className="text-[10px] font-bold uppercase text-slate-600">Mostra Pulsante</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => updateContent({ features: [...generatedContent.features, { title: 'Nuova Feature', description: 'Descrizione...' }] })} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><Plus className="w-4 h-4"/> Aggiungi Paragrafo</button>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Recensioni" num="9" icon={<MessageSquare className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            {(generatedContent.testimonials || []).map((t, i) => (
                                                <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                                        <input type="text" value={t.name} onChange={e => {
                                                            const newTests = [...(generatedContent.testimonials || [])];
                                                            newTests[i] = { ...t, name: e.target.value };
                                                            updateContent({ testimonials: newTests });
                                                        }} className="font-bold text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-900" placeholder="Nome Cliente" />
                                                        <button onClick={() => updateContent({ testimonials: (generatedContent.testimonials || []).filter((_, idx) => idx !== i) })} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><X className="w-4 h-4"/></button>
                                                    </div>
                                                    <textarea value={t.text} onChange={e => {
                                                        const newTests = [...(generatedContent.testimonials || [])];
                                                        newTests[i] = { ...t, text: e.target.value };
                                                        updateContent({ testimonials: newTests });
                                                    }} className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 h-16 outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Testo della recensione..." />
                                                    
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Immagini Recensione (URL)</label>
                                                        <div className="space-y-2">
                                                            {(t.images || []).map((imgUrl, imgIdx) => (
                                                                <div key={imgIdx} className="flex gap-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={imgUrl} 
                                                                        onChange={e => {
                                                                            const newTests = [...(generatedContent.testimonials || [])];
                                                                            const newImgs = [...(t.images || [])];
                                                                            newImgs[imgIdx] = e.target.value;
                                                                            newTests[i] = { ...t, images: newImgs };
                                                                            updateContent({ testimonials: newTests });
                                                                        }} 
                                                                        className="flex-1 text-[10px] p-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                                                        placeholder="https://..."
                                                                    />
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newTests = [...(generatedContent.testimonials || [])];
                                                                            const newImgs = (t.images || []).filter((_, idx) => idx !== imgIdx);
                                                                            newTests[i] = { ...t, images: newImgs };
                                                                            updateContent({ testimonials: newTests });
                                                                        }}
                                                                        className="p-2 text-slate-400 hover:text-red-500"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button 
                                                                onClick={() => {
                                                                    const newTests = [...(generatedContent.testimonials || [])];
                                                                    const newImgs = [...(t.images || []), ""];
                                                                    newTests[i] = { ...t, images: newImgs };
                                                                    updateContent({ testimonials: newTests });
                                                                }}
                                                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-white transition-all flex items-center justify-center gap-1"
                                                            >
                                                                <Plus className="w-3 h-3" /> Aggiungi Immagine URL
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => updateContent({ testimonials: [...(generatedContent.testimonials || []), { name: 'Utente', text: 'Ottimo prodotto!', rating: 5, role: 'Cliente', images: [] }] })} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><Plus className="w-4 h-4"/> Aggiungi Recensione</button>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Form Contatti" num="10" icon={<Mail className="w-4 h-4"/>}>
                                        <div className="space-y-3">
                                            {generatedContent.formConfiguration?.map((field, i) => (
                                                <div key={field.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400">{field.id.toUpperCase()}</span>
                                                        <input type="text" value={field.label} onChange={e => {
                                                            const newForm = [...(generatedContent.formConfiguration || [])];
                                                            newForm[i] = { ...field, label: e.target.value };
                                                            updateContent({ formConfiguration: newForm });
                                                        }} className="text-xs font-bold bg-transparent border-none p-0 focus:ring-0" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center bg-white border border-slate-200 rounded-md px-1.5 py-1">
                                                            <select 
                                                                value={field.validationType || 'none'}
                                                                onChange={e => {
                                                                    const newForm = [...(generatedContent.formConfiguration || [])];
                                                                    newForm[i] = { ...field, validationType: e.target.value as any };
                                                                    updateContent({ formConfiguration: newForm });
                                                                }}
                                                                className={`text-[9px] font-black bg-transparent border-none p-0 focus:ring-0 cursor-pointer uppercase ${field.validationType && field.validationType !== 'none' ? 'text-emerald-600' : 'text-slate-400'}`}
                                                                title="Tipo di validazione caratteri"
                                                            >
                                                                <option value="none">Libero</option>
                                                                <option value="numeric">Solo Numeri</option>
                                                                <option value="alpha">Solo Lettere</option>
                                                                <option value="alphanumeric">Alfanumerico</option>
                                                            </select>
                                                        </div>

                                                        <label className="flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                            <input type="checkbox" checked={field.enabled} onChange={e => {
                                                                const newForm = [...(generatedContent.formConfiguration || [])];
                                                                newForm[i] = { ...field, enabled: e.target.checked };
                                                                updateContent({ formConfiguration: newForm });
                                                            }} className="w-3 h-3 accent-emerald-500" />
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">ON</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                            <input type="checkbox" checked={field.required} onChange={e => {
                                                                const newForm = [...(generatedContent.formConfiguration || [])];
                                                                newForm[i] = { ...field, required: e.target.checked };
                                                                updateContent({ formConfiguration: newForm });
                                                            }} className="w-3 h-3 accent-red-500" />
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">REQ</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Stile & Colori" num="11" icon={<Palette className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Colore Sfondo Pagina</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="color" value={generatedContent.backgroundColor || '#ffffff'} onChange={e => updateContent({ backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg overflow-hidden border-none cursor-pointer" />
                                                    <input type="text" value={generatedContent.backgroundColor || '#ffffff'} onChange={e => updateContent({ backgroundColor: e.target.value })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Stile Pulsante CTA</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {BUTTON_GRADIENTS.map((g, i) => (
                                                        <button key={i} onClick={() => updateContent({ buttonColor: g.class })} className={`p-2 rounded-lg border-2 text-[9px] font-bold transition-all ${generatedContent.buttonColor === g.class ? 'border-emerald-500 scale-105' : 'border-slate-100 hover:border-slate-300'}`}>
                                                            <div className={`h-4 w-full rounded mb-1 ${g.class}`}></div>
                                                            {g.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Tipografia" num="12" icon={<Type className="w-4 h-4"/>}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Dimensione H1 (PX)</label>
                                                <input type="number" value={generatedContent.customTypography?.h1 || 48} onChange={e => updateContent({ customTypography: { ...generatedContent.customTypography, h1: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Dimensione H2 (PX)</label>
                                                <input type="number" value={generatedContent.customTypography?.h2 || 32} onChange={e => updateContent({ customTypography: { ...generatedContent.customTypography, h2: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Corpo Testo (PX)</label>
                                                <input type="number" value={generatedContent.customTypography?.body || 16} onChange={e => updateContent({ customTypography: { ...generatedContent.customTypography, body: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Testo CTA (PX)</label>
                                                <input type="number" value={generatedContent.customTypography?.cta || 18} onChange={e => updateContent({ customTypography: { ...generatedContent.customTypography, cta: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Avanzato" num="13" icon={<Code className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Webhook URL (Make.com)</label>
                                                <input type="text" value={generatedContent.webhookUrl || ''} onChange={e => updateContent({ webhookUrl: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono" placeholder="https://hook.make.com/..." />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Custom Head HTML (Meta/TikTok Landing)</label>
                                                <textarea value={generatedContent.customHeadHtml || ''} onChange={e => updateContent({ customHeadHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono h-32" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Extra Head HTML (Script Aggiuntivi)</label>
                                                <textarea value={generatedContent.customHeadHtml2 || ''} onChange={e => updateContent({ customHeadHtml2: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono h-32" />
                                            </div>
                                        </div>
                                    </EditorSection>
                                </>
                            ) : (
                                <>
                                    <EditorSection title="Testo Thank You Page" num="1" icon={<FileTextIcon className="w-4 h-4"/>} defaultOpen={true}>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Titolo</label>
                                            <input type="text" value={generatedThankYouContent?.headline} onChange={e => updateTYContent({ headline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Messaggio</label>
                                            <textarea value={generatedThankYouContent?.subheadline} onChange={e => updateTYContent({ subheadline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-24 outline-none resize-none" />
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Design Thank You Page" num="2" icon={<Layout className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Immagine Hero TY</label>
                                                {generatedThankYouContent?.heroImageBase64 ? (
                                                    <div className="relative rounded-lg overflow-hidden aspect-video border border-slate-200 group mb-2 shadow-sm">
                                                        <img src={generatedThankYouContent.heroImageBase64} className="w-full h-full object-cover" />
                                                        <button onClick={() => updateTYContent({ heroImageBase64: undefined })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => tyFileInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs flex flex-col items-center gap-2 hover:bg-slate-50 transition-all"><Images className="w-6 h-6"/> Carica Immagine</button>
                                                )}
                                                <input type="file" ref={tyFileInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept="image/*" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Sfondo TY</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={generatedThankYouContent?.backgroundColor || '#f8fafc'} onChange={e => updateTYContent({ backgroundColor: e.target.value })} className="w-10 h-10 rounded border-none cursor-pointer" />
                                                    <input type="text" value={generatedThankYouContent?.backgroundColor || '#f8fafc'} onChange={e => updateTYContent({ backgroundColor: e.target.value })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    <EditorSection title="Script Thank You Page" num="3" icon={<Code className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">TikTok Pixel Script (TY Page)</label>
                                                <textarea value={generatedContent.tiktokThankYouHtml || ''} onChange={e => updateContent({ tiktokThankYouHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono h-40" placeholder="Incolla script TikTok qui..." />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Meta Pixel Script (TY Page)</label>
                                                <textarea value={generatedContent.metaThankYouHtml || ''} onChange={e => updateContent({ metaThankYouHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono h-40" placeholder="Incolla script Meta qui..." />
                                            </div>
                                        </div>
                                    </EditorSection>
                                </>
                            )}

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <button onClick={() => handleSaveToDb(false)} disabled={isSaving} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salva e Pubblica</>}
                                </button>
                                {editingPageId && (
                                    <button onClick={() => handleSaveToDb(true)} disabled={isSaving} className="w-full bg-white border border-emerald-600 text-emerald-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all disabled:opacity-50">
                                        <CopyPlus className="w-4 h-4" /> Salva come Nuova Pagina
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-8">
                    {!generatedContent ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-1"><ShoppingBag className="w-5 h-5 text-emerald-600" /> Pagine Create ({adminPages.length})</h2>
                            {isLoadingPages ? (
                                <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-emerald-500 opacity-20"/></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
                                    {adminPages.map(page => <PageCard key={page.id} page={page} onView={handleViewPage} onEdit={handleEdit} onDuplicate={handleOpenDuplicateModal} onDelete={handleDelete} />)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 sticky top-24">
                             <div className="p-3 bg-slate-900 flex justify-between items-center text-white border-b border-white/5">
                                <div className="flex gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-full"></div><div className="w-3 h-3 bg-yellow-500 rounded-full"></div><div className="w-3 h-3 bg-green-500 rounded-full"></div></div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{previewMode} Mode</div>
                                <div className="flex gap-2">
                                    <Smartphone className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
                                    <Monitor className="w-4 h-4 opacity-100 transition-opacity cursor-pointer" />
                                </div>
                             </div>
                             <div className="bg-white h-[80vh] overflow-y-auto custom-scrollbar-preview">
                                {previewMode === 'landing' ? <LandingPage content={generatedContent} /> : <ThankYouPage content={generatedThankYouContent!} />}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl cursor-pointer tracking-tighter" onClick={() => setView('home')}>
              <Sparkles className="w-7 h-7 text-emerald-500" /> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{siteConfig.siteName}</span>
          </div>
          <button onClick={() => session ? setView('admin') : setIsLoginOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 active:scale-95 transition-all">Pannello Controllo</button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-16">
        <HomeHero />
        <PublicPageGrid isLoading={isLoadingPages} pages={publicPages} onViewPage={handleViewPage} />
      </main>
      <div className="hidden"><input type="file" ref={tyFileInputRef} onChange={(e) => handleFileUpload(e, true)} accept="image/*" /></div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} loading={loading} authError={authError} authSuccess={authSuccess} handleAuth={handleAuth} />
    </div>
  );
};

export default App;