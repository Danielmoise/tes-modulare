import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, base64ToBlob } from './services/supabaseClient';
import { generateLandingPage, generateReviews, generateActionImages, translateLandingPage, getLanguageConfig } from './services/geminiService';
import LandingPage, { ThankYouPage } from './components/LandingPage';
import { ProductDetails, GeneratedContent, PageTone, UserSession, LandingPageRow, TemplateId, FormFieldConfig, TypographyConfig, UiTranslation, SiteConfig, Testimonial, OnlineUser } from './types';
import { Loader2, Sparkles, Star, ChevronLeft, ChevronRight, Save, ShoppingBag, ArrowRight, Trash2, Pencil, Smartphone, Tablet, Monitor, Plus, Images, X, RefreshCcw, ArrowLeft, Settings, Link as LinkIcon, Type, Truck, Flame, Zap, Globe, Banknote, Palette, Users, Copy, Target, Code, Mail, Lock, Package, ShieldCheck, FileText as FileTextIcon, Gift, HardDrive, Terminal, CopyCheck, AlertCircle, Database, Shield, Paintbrush, ChevronDown, Eye, MessageSquare, Quote, Info, CheckCircle } from 'lucide-react';

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
    t[e] = function () {
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
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
];

const BUTTON_GRADIENTS = [
    { label: 'Orange Sunset', class: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400' },
    { label: 'Emerald Green', class: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-400' },
    { label: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-blue-400' },
    { label: 'Royal Purple', class: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-purple-400' },
    { label: 'Solid Black', class: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' },
    { label: 'Solid Red', class: 'bg-red-600 hover:bg-red-700 text-white border-red-500' },
];

const COLOR_PRESETS = [
    '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0f172a', '#eab308', '#ec4899', '#14b8a6', '#ffffff'
];

const BACKGROUND_PRESETS = [
    { name: 'White', value: '#ffffff' },
    { name: 'Snow', value: '#f8fafc' },
    { name: 'Cream', value: '#fffbeb' },
    { name: 'Sky Soft', value: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)' },
    { name: 'Rose Petal', value: 'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)' },
    { name: 'Emerald Soft', value: 'linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)' },
    { name: 'Night Grad', value: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' },
];

const SUPPORTED_LANGUAGES = [
    { code: 'Italiano', label: 'Italiano' },
    { code: 'Inglese', label: 'Inglese' },
    { code: 'Francese', label: 'Francese' },
    { code: 'Tedesco', label: 'Tedesco' },
    { code: 'Austriaco', label: 'Tedesco (Austria)' },
    { code: 'Spagnolo', label: 'Spagnolo' },
    { code: 'Portoghese', label: 'Portoghese' },
    { code: 'Olandese', label: 'Olandese' },
    { code: 'Polacco', label: 'Polacco' },
    { code: 'Rumeno', label: 'Rumeno' },
    { code: 'Svedese', label: 'Svedese' },
    { code: 'Bulgaro', label: 'Bulgaro' },
    { code: 'Greco', label: 'Greco' },
    { code: 'Ungherese', label: 'Ungherese' },
    { code: 'Croato', label: 'Croato' },
    { code: 'Serbo', label: 'Serbo' },
    { code: 'Slovacco', label: 'Slovacco' }
];

const SUPPORTED_CURRENCIES = [
    { symbol: '€', label: 'Euro (€)' }, { symbol: '$', label: 'Dollaro ($)' }, { symbol: '£', label: 'Sterlina (£)' },
    { symbol: 'lei', label: 'Leu Rumeno (lei)' }, { symbol: 'zł', label: 'Złoty Polacco (zł)' },
    { symbol: 'kr', label: 'Corona Svedese (kr)' }, { symbol: 'лв', label: 'Lev Bulgaro (лв)' },
    { symbol: 'Ft', label: 'Fiorino Ungherese (Ft)' }, { symbol: 'din', label: 'Dinaro Serbo (din)' }
];

const TY_SUFFIXES: Record<string, string> = {
    'Italiano': '-grazie', 'Inglese': '-thanks', 'Francese': '-merci', 'Tedesco': '-danke', 'Austriaco': '-danke',
    'Spagnolo': '-gracias', 'Portoghese': '-obrigado', 'Olandese': '-bedankt', 'Polacco': '-dziekuje',
    'Rumeno': '-multumesc', 'Svedese': '-tack', 'Bulgaro': '-blagodarya', 'Greco': '-efcharisto',
    'Ungherese': '-koszonom', 'Croato': '-hvala', 'Serbo': '-hvala', 'Slovacco': '-dakujem'
};

const getThankYouSuffix = (lang: string) => TY_SUFFIXES[lang] || '-thanks';

const PageCard = React.memo(({ page, onView, onEdit, onDuplicate, onDelete }: { 
    page: LandingPageRow, onView: (p: LandingPageRow) => void, onEdit?: (p: LandingPageRow) => void, 
    onDuplicate?: (p: LandingPageRow) => void, onDelete?: (id: string) => void
}) => (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 relative" onClick={() => onView(page)}>
         <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-900/80 rounded-bl-xl backdrop-blur z-20" onClick={(e) => e.stopPropagation()}>
            {onDuplicate && <button onClick={() => onDuplicate(page)} className="p-1.5 hover:bg-purple-600 rounded text-white" title="Duplica & Traduci"><Copy className="w-4 h-4"/></button>}
            {onEdit && <button onClick={() => onEdit(page)} className="p-1.5 hover:bg-blue-600 rounded text-white" title="Modifica"><Pencil className="w-4 h-4"/></button>}
            {onDelete && <button onClick={() => onDelete(page.id)} className="p-1.5 hover:bg-red-600 rounded text-white" title="Elimina"><Trash2 className="w-4 h-4"/></button>}
        </div>
        <div className="aspect-video bg-slate-200 relative overflow-hidden">
            <img src={page.content.heroImageBase64 || (page.content.generatedImages?.[0] || `https://picsum.photos/seed/${page.product_name.replace(/\s/g,'')}/800/600`)} alt={page.product_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 z-10">{page.niche}</div>
        </div>
        <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors truncate">{page.product_name}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-4">{page.content.subheadline}</p>
            <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{page.slug ? `/${page.slug}` : 'Offerta Limitata'}</span>
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
  const [product, setProduct] = useState<ProductDetails>({
    name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', images: [], featureCount: 3
  });
  const [imageUrl, setImageUrl] = useState('');
  const [reviewCount, setReviewCount] = useState<number>(10);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generatedThankYouContent, setGeneratedThankYouContent] = useState<GeneratedContent | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null); 
  const [editingMode, setEditingMode] = useState<'landing' | 'thankyou'>('landing');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tyFileInputRef = useRef<HTMLInputElement>(null);
  const [previewMode, setPreviewMode] = useState<'landing' | 'thankyou'>('landing'); 
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ siteName: 'BESTOFFERS', footerText: `© ${new Date().getFullYear()} Tutti i diritti riservati.`, storageBucketName: 'landing-images' });
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const presenceChannelRef = useRef<any>(null);
  const userGeoRef = useRef<Partial<OnlineUser>>({});

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
    if (presenceChannelRef.current && presenceChannelRef.current.state === 'joined') {
        presenceChannelRef.current.track({ ...userGeoRef.current, pageUrl, action: 'purchased' });
    }
  }, []);

  useEffect(() => {
    if (view === 'home' && isSupabaseConfigured()) fetchPublicPages();
    if (view === 'admin' && session) fetchAllAdminPages();
  }, [view, session, fetchPublicPages, fetchAllAdminPages]);

  useEffect(() => {
    const init = async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase.from('site_settings').select('config').eq('id', 1).maybeSingle();
            if (data?.config) setSiteConfig({ ...siteConfig, ...data.config });
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

  const handleSaveToDb = async () => {
    if (!generatedContent || !generatedThankYouContent || !session) return;
    setIsSaving(true);
    const dbPayload = {
        product_name: product.name, slug, thank_you_slug: tySlug, niche: product.niche,
        content: { ...generatedContent, templateId: selectedTemplate },
        thank_you_content: generatedThankYouContent, is_published: true
    };
    const { error } = editingPageId ? await supabase!.from('landing_pages').update(dbPayload).eq('id', editingPageId) : await supabase!.from('landing_pages').insert(dbPayload);
    if (!error) { await fetchAllAdminPages(); handleCloseEditor(); }
    setIsSaving(false);
  };

  const handleCloseEditor = () => { setGeneratedContent(null); setGeneratedThankYouContent(null); setEditingPageId(null); setSlug(''); setProduct({ name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', images: [], featureCount: 3 }); };

  const handleGenerate = async () => {
    if (!product.name) { alert("Inserisci il nome del prodotto"); return; }
    setIsGenerating(true);
    try {
      const finalImages = [...(product.images || [])];
      if (imageUrl && imageUrl.trim() !== '') finalImages.push(imageUrl.trim());
      const updatedProduct = { ...product, images: finalImages };
      
      const result = await generateLandingPage(updatedProduct, reviewCount);
      const ty = createDefaultThankYouContent(result);
      setGeneratedContent({ ...result, testimonials: result.testimonials || [], templateId: selectedTemplate, generatedImages: finalImages });
      setGeneratedThankYouContent(ty);
      setSlug(formatSlug(product.name)); setTySlug(formatSlug(product.name) + getThankYouSuffix(result.language || 'Italiano'));
    } finally { setIsGenerating(false); }
  };

  const handleViewPage = (page: LandingPageRow) => {
    setSelectedPublicPage(page);
    setView('product_view');
    window.history.pushState({}, '', `?${page.slug ? 's=' + page.slug : 'p=' + page.id}`);
  };

  const handleEdit = (page: LandingPageRow) => {
    setEditingPageId(page.id);
    setProduct({
        name: page.product_name,
        niche: page.niche || '',
        description: page.content.subheadline || '', 
        targetAudience: '',
        tone: PageTone.PROFESSIONAL,
        language: page.content.language || 'Italiano',
        images: page.content.generatedImages || [],
        featureCount: page.content.features?.length || 3
    });
    setGeneratedContent(page.content);
    setGeneratedThankYouContent(page.thank_you_content || createDefaultThankYouContent(page.content));
    setSlug(page.slug || '');
    setTySlug(page.thank_you_slug || '');
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
            if (isThankYou) {
                updateTYContent({ heroImageBase64: base64 });
            } else {
                updateContent({ generatedImages: [...(generatedContent.generatedImages || []), base64] });
            }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Rendering logic
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
                                            <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}>
                                                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Step 2: Dettagli</label>
                                    <input type="text" placeholder="Nome Prodotto" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                    <input type="text" placeholder="Nicchia" value={product.niche} onChange={e => setProduct({...product, niche: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                    <input type="text" placeholder="Target" value={product.targetAudience} onChange={e => setProduct({...product, targetAudience: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Foto (Carica o Incolla URL)</label>
                                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-100 hover:bg-slate-200 p-3 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200">
                                        <Images className="w-4 h-4" /> Carica Foto Prodotto
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e)} className="hidden" accept="image/*" />
                                    <input type="text" placeholder="Incolla URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none" />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contenuto</label>
                                    <textarea placeholder="Descrizione..." value={product.description} onChange={e => setProduct({...product, description: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-sm h-24 outline-none resize-none" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={product.tone} onChange={e => setProduct({...product, tone: e.target.value as PageTone})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white">
                                            {Object.values(PageTone).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <select value={product.language} onChange={e => setProduct({...product, language: e.target.value})} className="border border-slate-200 rounded-xl p-2.5 text-xs bg-white">
                                            {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">N° Paragrafi</label>
                                            <input type="number" min="1" max="10" value={product.featureCount} onChange={e => setProduct({...product, featureCount: parseInt(e.target.value) || 3})} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">N° Recensioni</label>
                                            <input type="number" min="1" max="20" value={reviewCount} onChange={e => setReviewCount(parseInt(e.target.value) || 10)} className="w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
                                        </div>
                                    </div>
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
                                    {/* 0. URL & LINK */}
                                    <EditorSection title="URL & Link" num="0" icon={<LinkIcon className="w-4 h-4"/>} defaultOpen={true}>
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
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Redirect URL Esterno</label>
                                            <input type="text" value={generatedContent.customThankYouUrl || ''} onChange={e => updateContent({ customThankYouUrl: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="https://..." />
                                            <p className="text-[10px] text-slate-400 mt-1 italic">Nome e Telefono verranno appesi all'URL automaticamente.</p>
                                        </div>
                                    </EditorSection>

                                    {/* 1. DESIGN */}
                                    <EditorSection title="Design" num="1" icon={<Palette className="w-4 h-4"/>}>
                                        <div className="grid grid-cols-1 gap-2">
                                            {TEMPLATES.map(t => (
                                                <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-3 rounded-lg border text-left transition-all ${selectedTemplate === t.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                                    <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </EditorSection>

                                    {/* 2. PREZZO & OFFERTA */}
                                    <EditorSection title="Prezzo & Offerta" num="2" icon={<Banknote className="w-4 h-4"/>}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Prezzo</label>
                                                <input type="text" value={generatedContent.price} onChange={e => updateContent({ price: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Prezzo Originale</label>
                                                <input type="text" value={generatedContent.originalPrice} onChange={e => updateContent({ originalPrice: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Valuta</label>
                                                <select value={generatedContent.currency} onChange={e => updateContent({ currency: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white">
                                                    {SUPPORTED_CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Costo Spedizione</label>
                                                <input type="text" value={generatedContent.shippingCost} onChange={e => updateContent({ shippingCost: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                            </div>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={generatedContent.enableShippingCost} onChange={e => updateContent({ enableShippingCost: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
                                            <span className="text-xs font-medium text-slate-600">Mostra Costo Spedizione nel carrello</span>
                                        </label>
                                        <div className="pt-4 border-t border-slate-100">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Scarsità & Stock</label>
                                            <div className="flex items-center gap-4">
                                                <input type="number" value={generatedContent.stockConfig?.quantity} onChange={e => updateContent({ stockConfig: { ...generatedContent.stockConfig!, quantity: parseInt(e.target.value) || 0 } })} className="w-20 border border-slate-200 rounded-lg p-2 text-xs" />
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={generatedContent.stockConfig?.enabled} onChange={e => updateContent({ stockConfig: { ...generatedContent.stockConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-red-500" />
                                                    <span className="text-xs font-medium text-slate-600">Mostra Scarsità</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 space-y-3">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Notifiche Social Proof</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 mb-1">Intervallo (sec)</label>
                                                    <input type="number" value={generatedContent.socialProofConfig?.intervalSeconds} onChange={e => updateContent({ socialProofConfig: { ...generatedContent.socialProofConfig!, intervalSeconds: parseInt(e.target.value) || 10 } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-400 mb-1">Max Mostre</label>
                                                    <input type="number" value={generatedContent.socialProofConfig?.maxShows} onChange={e => updateContent({ socialProofConfig: { ...generatedContent.socialProofConfig!, maxShows: parseInt(e.target.value) || 4 } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={generatedContent.insuranceConfig?.enabled} onChange={e => updateContent({ insuranceConfig: { ...generatedContent.insuranceConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-emerald-500" />
                                                <span className="text-xs font-bold text-emerald-600">Assicurazione Spedizione</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={generatedContent.gadgetConfig?.enabled} onChange={e => updateContent({ gadgetConfig: { ...generatedContent.gadgetConfig!, enabled: e.target.checked } })} className="w-4 h-4 accent-purple-500" />
                                                <span className="text-xs font-bold text-purple-600">Gadget Add-on</span>
                                            </label>
                                        </div>
                                    </EditorSection>

                                    {/* 3. TESTO & CONTENUTO */}
                                    <EditorSection title="Testo & Contenuto" num="3" icon={<FileTextIcon className="w-4 h-4"/>}>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Headline H1</label>
                                            <textarea value={generatedContent.headline} onChange={e => updateContent({ headline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-xs h-20 outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Subheadline H2</label>
                                            <textarea value={generatedContent.subheadline} onChange={e => updateContent({ subheadline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-xs h-20 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Testo Barra Annunci</label>
                                            <input type="text" value={generatedContent.announcementBarText} onChange={e => updateContent({ announcementBarText: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Testo Bottone CTA</label>
                                            <input type="text" value={generatedContent.ctaText} onChange={e => updateContent({ ctaText: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Sottotesto Bottone</label>
                                            <input type="text" value={generatedContent.ctaSubtext} onChange={e => updateContent({ ctaSubtext: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                    </EditorSection>

                                    {/* 4. GALLERIA IMMAGINI */}
                                    <EditorSection title="Galleria Immagini" num="4" icon={<Images className="w-4 h-4"/>}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{generatedContent.generatedImages?.length || 0} immagini</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {generatedContent.generatedImages?.map((img, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button onClick={() => updateContent({ generatedImages: generatedContent.generatedImages?.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                                                    <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Gallery {i}</div>
                                                </div>
                                            ))}
                                            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-all bg-slate-50">
                                                <Plus className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] font-bold uppercase">Aggiungi</span>
                                            </button>
                                        </div>
                                    </EditorSection>

                                    {/* 5. BENEFICI */}
                                    <EditorSection title="Benefici" num="5" icon={<CheckCircle className="w-4 h-4"/>}>
                                        {generatedContent.benefits.map((b, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input type="text" value={b} onChange={e => {
                                                    const newB = [...generatedContent.benefits];
                                                    newB[i] = e.target.value;
                                                    updateContent({ benefits: newB });
                                                }} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                <button onClick={() => updateContent({ benefits: generatedContent.benefits.filter((_, idx) => idx !== i) })} className="text-slate-300 hover:text-red-500"><X className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => updateContent({ benefits: [...generatedContent.benefits, "Nuovo beneficio"] })} className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><Plus className="w-3 h-3"/> Aggiungi Beneficio</button>
                                        
                                        <div className="pt-4 border-t border-slate-100 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer mb-4">
                                                <input type="checkbox" checked={generatedContent.boxContent?.enabled} onChange={e => updateContent({ boxContent: { ...generatedContent.boxContent!, enabled: e.target.checked, title: generatedContent.boxContent?.title || 'Cosa Ricevi', items: generatedContent.boxContent?.items || [] } })} className="w-4 h-4 accent-emerald-500" />
                                                <span className="text-xs font-bold text-slate-700 uppercase">Box Contenuto</span>
                                            </label>
                                            {generatedContent.boxContent?.enabled && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="block text-[10px] text-slate-400 mb-1">Titolo (es. "Cosa Ricevi")</label>
                                                        <input type="text" value={generatedContent.boxContent.title} onChange={e => updateContent({ boxContent: { ...generatedContent.boxContent!, title: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-slate-400 mb-1">Elementi della lista</label>
                                                        {generatedContent.boxContent.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-2 mb-2">
                                                                <input type="text" value={item} onChange={e => {
                                                                    const newItems = [...generatedContent.boxContent!.items];
                                                                    newItems[idx] = e.target.value;
                                                                    updateContent({ boxContent: { ...generatedContent.boxContent!, items: newItems } });
                                                                }} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" />
                                                                <button onClick={() => updateContent({ boxContent: { ...generatedContent.boxContent!, items: generatedContent.boxContent!.items.filter((_, i) => i !== idx) } })} className="text-slate-300"><X className="w-4 h-4"/></button>
                                                            </div>
                                                        ))}
                                                        <button onClick={() => updateContent({ boxContent: { ...generatedContent.boxContent!, items: [...generatedContent.boxContent!.items, "Nuovo elemento"] } })} className="text-[10px] font-bold text-blue-600 uppercase">+ Aggiungi Elemento</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </EditorSection>

                                    {/* 6. PARAGRAFI FEATURES */}
                                    <EditorSection title="Paragrafi Features" num="6" icon={<Zap className="w-4 h-4"/>}>
                                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                                            <input type="checkbox" checked={generatedContent.showFeatureIcons} onChange={e => updateContent({ showFeatureIcons: e.target.checked })} className="w-4 h-4 accent-blue-500" />
                                            <span className="text-xs font-bold text-slate-700">Mostra Icone</span>
                                        </label>
                                        <div className="space-y-8">
                                            {generatedContent.features.map((f, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 relative group/feature">
                                                    <button onClick={() => updateContent({ features: generatedContent.features.filter((_, idx) => idx !== i) })} className="absolute -top-2 -right-2 bg-white text-slate-300 hover:text-red-500 rounded-full p-1 border border-slate-100 shadow-sm transition-colors"><X className="w-3 h-3"/></button>
                                                    <input type="text" placeholder={`Titolo ${i+1}`} value={f.title} onChange={e => {
                                                        const newF = [...generatedContent.features];
                                                        newF[i] = { ...f, title: e.target.value };
                                                        updateContent({ features: newF });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                                                    <textarea placeholder={`Descrizione ${i+1}`} value={f.description} onChange={e => {
                                                        const newF = [...generatedContent.features];
                                                        newF[i] = { ...f, description: e.target.value };
                                                        updateContent({ features: newF });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-20 outline-none resize-none" />
                                                    <div className="flex items-center justify-between gap-4">
                                                        <button onClick={() => alert("Funzione Carica Foto non collegata in questo blocco.")} className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm"><Images className="w-3 h-3" /> Carica Immagine</button>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input type="checkbox" checked={f.showCta} onChange={e => {
                                                                const newF = [...generatedContent.features];
                                                                newF[i] = { ...f, showCta: e.target.checked };
                                                                updateContent({ features: newF });
                                                            }} className="w-3.5 h-3.5 accent-emerald-500" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Mostra CTA</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => updateContent({ features: [...generatedContent.features, { title: "Nuova Feature", description: "Descrizione della feature...", showCta: false }] })} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 hover:text-slate-600 transition-all">+ Aggiungi Paragrafo</button>
                                        </div>
                                    </EditorSection>

                                    {/* 7. RECENSIONI */}
                                    <EditorSection title="Recensioni" num="7" icon={<Star className="w-4 h-4"/>}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <label className="text-xs font-bold text-slate-500">Inserisci dopo paragrafo #</label>
                                            <input type="number" min="0" value={generatedContent.reviewsPosition || 0} onChange={e => updateContent({ reviewsPosition: parseInt(e.target.value) || 0 })} className="w-16 border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div className="space-y-4">
                                            {generatedContent.testimonials?.map((t, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                                    <input type="text" value={t.name} onChange={e => {
                                                        const newT = [...generatedContent.testimonials!];
                                                        newT[i] = { ...t, name: e.target.value };
                                                        updateContent({ testimonials: newT });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold" />
                                                    <input type="text" placeholder="Titolo Recensione" value={t.title} onChange={e => {
                                                        const newT = [...generatedContent.testimonials!];
                                                        newT[i] = { ...t, title: e.target.value };
                                                        updateContent({ testimonials: newT });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                                    <textarea value={t.text} onChange={e => {
                                                        const newT = [...generatedContent.testimonials!];
                                                        newT[i] = { ...t, text: e.target.value };
                                                        updateContent({ testimonials: newT });
                                                    }} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-16 outline-none" />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, k) => <button key={k} onClick={() => {
                                                                const newT = [...generatedContent.testimonials!];
                                                                newT[i] = { ...t, rating: k+1 };
                                                                updateContent({ testimonials: newT });
                                                            }}><Star className={`w-3.5 h-3.5 ${k < (t.rating || 5) ? 'fill-current' : 'text-slate-200'}`} /></button>)}
                                                        </div>
                                                        <button onClick={() => updateContent({ testimonials: generatedContent.testimonials?.filter((_, idx) => idx !== i) })} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => updateContent({ testimonials: [...(generatedContent.testimonials || []), { name: "Nuovo Cliente", title: "Recensione Fantastica", text: "Prodotto incredibile!", rating: 5, role: "Acquisto Verificato" }] })} className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-500 font-bold text-xs uppercase shadow-sm">+ Aggiungi Recensione</button>
                                        </div>
                                    </EditorSection>

                                    {/* 8. FORM CONTATTI */}
                                    <EditorSection title="Form Contatti" num="8" icon={<Mail className="w-4 h-4"/>}>
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
                                            <button onClick={() => updateContent({ formType: 'classic' })} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${generatedContent.formType !== 'html' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Builder Classico</button>
                                            <button onClick={() => updateContent({ formType: 'html' })} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${generatedContent.formType === 'html' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Codice HTML</button>
                                        </div>
                                        {generatedContent.formType === 'html' ? (
                                            <textarea value={generatedContent.customFormHtml || ''} onChange={e => updateContent({ customFormHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-40 bg-slate-900 text-emerald-400" placeholder="<form>...</form>" />
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Webhook URL</label>
                                                    <input type="text" value={generatedContent.webhookUrl || ''} onChange={e => updateContent({ webhookUrl: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="https://hook.make.com/..." />
                                                </div>
                                                <div className="space-y-1">
                                                    {generatedContent.formConfiguration?.map((field, idx) => (
                                                        <div key={field.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white group">
                                                            <div className="flex-1">
                                                                <input type="text" value={field.label} onChange={e => {
                                                                    const newFields = [...generatedContent.formConfiguration!];
                                                                    newFields[idx] = { ...field, label: e.target.value };
                                                                    updateContent({ formConfiguration: newFields });
                                                                }} className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-800 focus:ring-0" />
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-[8px] font-bold text-slate-300 uppercase">{field.type}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <button onClick={() => {
                                                                    const newFields = [...generatedContent.formConfiguration!];
                                                                    newFields[idx] = { ...field, required: !field.required };
                                                                    updateContent({ formConfiguration: newFields });
                                                                }} className={`text-[9px] font-bold uppercase transition-colors ${field.required ? 'text-red-500' : 'text-slate-300'}`}>Obbl.</button>
                                                                <button onClick={() => {
                                                                    const newFields = [...generatedContent.formConfiguration!];
                                                                    newFields[idx] = { ...field, enabled: !field.enabled };
                                                                    updateContent({ formConfiguration: newFields });
                                                                }} className={`text-[9px] font-bold uppercase transition-colors ${field.enabled ? 'text-emerald-500' : 'text-slate-300'}`}>Attivo</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </EditorSection>

                                    {/* 9. STILE & COLORI */}
                                    <EditorSection title="Stile & Colori" num="9" icon={<Palette className="w-4 h-4"/>}>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Stile Bottone CTA</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {BUTTON_GRADIENTS.map((g, i) => (
                                                    <button key={i} onClick={() => updateContent({ buttonColor: g.class })} className={`${g.class} h-10 rounded-lg text-[10px] font-bold border-2 ${generatedContent.buttonColor === g.class ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-transparent shadow-sm'}`}>
                                                        {g.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 mt-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Colore Prezzo</label>
                                            <div className="flex flex-wrap gap-2">
                                                {COLOR_PRESETS.map(c => (
                                                    <button key={c} onClick={() => updateContent({ priceStyles: { ...generatedContent.priceStyles, color: c } })} className={`w-8 h-8 rounded-full border-2 transition-all ${generatedContent.priceStyles?.color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 mt-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Background Builder</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {BACKGROUND_PRESETS.map(b => (
                                                    <button key={b.name} onClick={() => updateContent({ backgroundColor: b.value })} className={`p-2 border rounded-lg text-[10px] font-bold transition-all ${generatedContent.backgroundColor === b.value ? 'border-slate-900 bg-white' : 'border-slate-100 bg-slate-50'}`} style={{ color: b.value === '#ffffff' ? '#000' : '#444' }}>
                                                        {b.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-3">
                                                <label className="block text-[10px] text-slate-400 mb-1">Colore Custom</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={generatedContent.backgroundColor?.startsWith('#') ? generatedContent.backgroundColor : '#ffffff'} onChange={e => updateContent({ backgroundColor: e.target.value })} className="h-10 w-10 border border-slate-200 rounded-lg p-1 bg-white" />
                                                    <input type="text" value={generatedContent.backgroundColor} onChange={e => updateContent({ backgroundColor: e.target.value })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" placeholder="#ffffff o linear-gradient..." />
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* 10. TIPOGRAFIA */}
                                    <EditorSection title="Tipografia" num="10" icon={<Type className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Font Famiglia</label>
                                                <div className="flex gap-2">
                                                    {['sans', 'serif', 'mono'].map(f => (
                                                        <button key={f} onClick={() => updateContent({ typography: { ...generatedContent.typography!, fontFamily: f as any } })} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${generatedContent.typography?.fontFamily === f ? 'bg-slate-900 text-white shadow-lg border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{f.toUpperCase()}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['h1', 'h2', 'body'].map(type => (
                                                    <div key={type}>
                                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">{type.toUpperCase()}</label>
                                                        <select value={generatedContent.typography?.[`${type}Size` as keyof TypographyConfig] || 'md'} onChange={e => updateContent({ typography: { ...generatedContent.typography!, [`${type}Size`]: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white">
                                                            {['sm', 'md', 'lg', 'xl'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-slate-100">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Dimensioni Custom (px)</label>
                                                <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                                                    {['h1', 'h2', 'h3', 'body', 'small', 'cta'].map(tag => (
                                                        <div key={tag}>
                                                            <label className="block text-[8px] font-black text-slate-400 mb-1 uppercase">{tag === 'h3' ? 'H3 (Features)' : tag.toUpperCase()}</label>
                                                            <input type="number" value={generatedContent.customTypography?.[tag as keyof typeof generatedContent.customTypography] || ''} onChange={e => updateContent({ customTypography: { ...generatedContent.customTypography!, [tag]: e.target.value } })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="px" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* 11. AVANZATO */}
                                    <EditorSection title="Avanzato" num="11" icon={<Terminal className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">HTML Extra Body</label>
                                                <textarea value={generatedContent.extraLandingHtml || ''} onChange={e => updateContent({ extraLandingHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-24 bg-slate-900 text-emerald-400" placeholder="<div>...</div>" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Script HEAD (Meta)</label>
                                                <textarea value={generatedContent.metaLandingHtml || ''} onChange={e => updateContent({ metaLandingHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-20 bg-slate-900 text-blue-400" placeholder="<script>...</script>" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Script HEAD (TikTok)</label>
                                                <textarea value={generatedContent.tiktokLandingHtml || ''} onChange={e => updateContent({ tiktokLandingHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-20 bg-slate-900 text-pink-400" placeholder="<script>...</script>" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Testo Copyright Footer</label>
                                                <input type="text" value={generatedContent.customFooterCopyrightText || ''} onChange={e => updateContent({ customFooterCopyrightText: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="© 2024 ..." />
                                            </div>
                                        </div>
                                    </EditorSection>
                                </>
                            ) : (
                                <>
                                    {/* THANK YOU PAGE SPECIFIC EDITOR */}
                                    {/* 1. Testo Thank You Page */}
                                    <EditorSection title="Testo Thank You Page" num="1" icon={<FileTextIcon className="w-4 h-4"/>} defaultOpen={true}>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Titolo (Usa {"{name}"} e {"{phone}"})</label>
                                            <input type="text" value={generatedThankYouContent?.headline} onChange={e => updateTYContent({ headline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="Grazie {name}!" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Messaggio (Usa {"{name}"} e {"{phone}"})</label>
                                            <textarea value={generatedThankYouContent?.subheadline} onChange={e => updateTYContent({ subheadline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-24 outline-none resize-none" placeholder="Il tuo ordine è stato ricevuto..." />
                                        </div>
                                    </EditorSection>

                                    {/* 2. Design Thank You Page */}
                                    <EditorSection title="Design Thank You Page" num="2" icon={<Palette className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Immagine Principale</label>
                                                <div className="flex gap-2">
                                                    <button onClick={() => tyFileInputRef.current?.click()} className="flex-1 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl text-slate-600 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200">
                                                        <Images className="w-4 h-4" /> Carica
                                                    </button>
                                                    <input type="file" ref={tyFileInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept="image/*" />
                                                </div>
                                                {generatedThankYouContent?.heroImageBase64 && (
                                                    <div className="mt-2 relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={generatedThankYouContent.heroImageBase64} className="w-full h-full object-cover" />
                                                        <button onClick={() => updateTYContent({ heroImageBase64: undefined })} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md shadow-sm"><X className="w-3 h-3"/></button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Colore Sfondo Pagina</label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={generatedThankYouContent?.backgroundColor?.startsWith('#') ? generatedThankYouContent.backgroundColor : '#f8fafc'} onChange={e => updateTYContent({ backgroundColor: e.target.value })} className="h-10 w-10 border border-slate-200 rounded-lg p-1 bg-white" />
                                                    <input type="text" value={generatedThankYouContent?.backgroundColor} onChange={e => updateTYContent({ backgroundColor: e.target.value })} className="flex-1 border border-slate-200 rounded-lg p-2 text-xs" placeholder="#f8fafc" />
                                                </div>
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* 3. Script Thank You Page */}
                                    <EditorSection title="Script Thank You Page" num="3" icon={<Terminal className="w-4 h-4"/>}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">HTML Extra Body</label>
                                                <textarea value={generatedThankYouContent?.extraThankYouHtml || ''} onChange={e => updateTYContent({ extraThankYouHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-24 bg-slate-900 text-emerald-400" placeholder="<div>...</div>" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Script HEAD (Meta)</label>
                                                <textarea value={generatedThankYouContent?.metaThankYouHtml || ''} onChange={e => updateTYContent({ metaThankYouHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-20 bg-slate-900 text-blue-400" placeholder="<script>...</script>" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Script HEAD (TikTok)</label>
                                                <textarea value={generatedThankYouContent?.tiktokThankYouHtml || ''} onChange={e => updateTYContent({ tiktokThankYouHtml: e.target.value })} className="w-full border border-slate-200 rounded-lg p-3 text-[10px] font-mono h-40 bg-slate-900 text-pink-400" />
                                                <button 
                                                    onClick={() => updateTYContent({ tiktokThankYouHtml: DEFAULT_TIKTOK_SCRIPT })}
                                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 underline flex items-center gap-1 mt-1"
                                                >
                                                    Ripristina script default
                                                </button>
                                            </div>
                                        </div>
                                    </EditorSection>
                                </>
                            )}

                            <div className="pt-4 border-t border-slate-100">
                                <button onClick={handleSaveToDb} disabled={isSaving} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salva e Pubblica</>}
                                </button>
                                <p className="text-[10px] text-slate-400 text-center mt-3 italic">Tutte le modifiche sono visibili nell'anteprima a destra in tempo reale.</p>
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
                                    {adminPages.map(page => <PageCard key={page.id} page={page} onView={handleViewPage} onEdit={handleEdit} onDelete={handleDelete} />)}
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