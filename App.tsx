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
    { label: 'Solid Black', class: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' },
];

const SUPPORTED_LANGUAGES = [{ code: 'Italiano', label: 'Italiano' }];
const SUPPORTED_CURRENCIES = [{ symbol: '€', label: 'Euro (€)' }];

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

  useEffect(() => {
    if (view === 'home' && isSupabaseConfigured()) fetchPublicPages();
    if (view === 'admin' && session) fetchAllAdminPages();
  }, [view, session, fetchPublicPages, fetchAllAdminPages]);

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
      const ty = {
          ...result,
          headline: 'Grazie {name}!',
          subheadline: "Il tuo ordine è stato ricevuto. Un nostro operatore ti contatterà a breve al numero {phone} per confermare l'ordine.",
          backgroundColor: '#f8fafc',
          tiktokThankYouHtml: DEFAULT_TIKTOK_SCRIPT
      };
      setGeneratedContent({ ...result, generatedImages: finalImages });
      setGeneratedThankYouContent(ty);
      setSlug(formatSlug(product.name)); 
      setTySlug(formatSlug(product.name) + '-grazie');
    } finally { setIsGenerating(false); }
  };

  const handleEdit = (page: LandingPageRow) => {
    setEditingPageId(page.id);
    setProduct({
        name: page.product_name, niche: page.niche || '', description: page.content.subheadline || '', 
        targetAudience: '', tone: PageTone.PROFESSIONAL, language: page.content.language || 'Italiano',
        images: page.content.generatedImages || [], featureCount: page.content.features?.length || 3
    });
    setGeneratedContent(page.content);
    setGeneratedThankYouContent(page.thank_you_content || page.content);
    setSlug(page.slug || '');
    setTySlug(page.thank_you_slug || '');
    setSelectedTemplate(page.content.templateId || 'gadget-cod');
  };

  const updateContent = (updates: Partial<GeneratedContent>) => { if (generatedContent) setGeneratedContent({ ...generatedContent, ...updates }); };
  const updateTYContent = (updates: Partial<GeneratedContent>) => { if (generatedThankYouContent) setGeneratedThankYouContent({ ...generatedThankYouContent, ...updates }); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isThankYou = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (!generatedContent) { setProduct(prev => ({ ...prev, images: [...(prev.images || []), base64] })); }
        else { if (isThankYou) updateTYContent({ heroImageBase64: base64 }); else updateContent({ generatedImages: [...(generatedContent.generatedImages || []), base64] }); }
      };
      reader.readAsDataURL(file);
    }
  };

  if (view === 'product_view' && selectedPublicPage) {
      return <LandingPage content={selectedPublicPage.content} thankYouSlug={selectedPublicPage.thank_you_slug} onRedirect={(data) => { setOrderData(data); setView('thank_you_view'); }} />;
  }
  if (view === 'thank_you_view' && selectedPublicPage) {
      return <ThankYouPage content={selectedPublicPage.thank_you_content || selectedPublicPage.content} initialData={orderData} />;
  }

  if (view === 'admin' && session) {
    return (
      <AdminLayout session={session} adminSection={adminSection} setAdminSection={setAdminSection} onlineUsersCount={onlineUsers.length} isMapOpen={isMapOpen} setIsMapOpen={setIsMapOpen} handleLogout={handleLogout} onGoHome={() => setView('home')}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
                {!generatedContent ? (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500" /> Nuova Pagina</h2>
                        <input type="text" placeholder="Nome Prodotto" value={product.name} onChange={e => setProduct({...product, name: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3" />
                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold">
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Genera con AI"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                        <EditorHeader productName={product.name} editingMode={editingMode} setEditingMode={setEditingMode} setPreviewMode={setPreviewMode} onDiscard={handleCloseEditor} />
                        
                        {editingMode === 'landing' ? (
                            <>
                                <EditorSection title="URL & Link" num="0" icon={<LinkIcon className="w-4 h-4"/>} defaultOpen={true}>
                                    <div className="space-y-3">
                                        <input type="text" value={slug} onChange={e => setSlug(formatSlug(e.target.value))} className="w-full border p-2 rounded text-xs" placeholder="Slug Landing" />
                                        <input type="text" value={tySlug} onChange={e => setTySlug(formatSlug(e.target.value))} className="w-full border p-2 rounded text-xs" placeholder="Slug Thank You" />
                                        <input type="text" value={generatedContent.customThankYouUrl || ''} onChange={e => updateContent({ customThankYouUrl: e.target.value })} className="w-full border p-2 rounded text-xs" placeholder="Redirect URL Esterno" />
                                    </div>
                                </EditorSection>
                                <EditorSection title="Prezzo & Offerta" num="2" icon={<Banknote className="w-4 h-4"/>}>
                                    <input type="text" value={generatedContent.price} onChange={e => updateContent({ price: e.target.value })} className="w-full border p-2 rounded text-xs" />
                                </EditorSection>
                            </>
                        ) : (
                            <>
                                <EditorSection title="Testo Thank You Page" num="1" icon={<FileTextIcon className="w-4 h-4"/>} defaultOpen={true}>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Titolo (Usa {"{name}"} e {"{phone}"})</label>
                                            <input type="text" value={generatedThankYouContent?.headline} onChange={e => updateTYContent({ headline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Messaggio (Usa {"{name}"} e {"{phone}"})</label>
                                            <textarea value={generatedThankYouContent?.subheadline} onChange={e => updateTYContent({ subheadline: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2 text-xs h-24 outline-none resize-none" />
                                        </div>
                                    </div>
                                </EditorSection>
                                <EditorSection title="Design Thank You Page" num="2" icon={<Palette className="w-4 h-4"/>}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Immagine Principale</label>
                                            <button onClick={() => tyFileInputRef.current?.click()} className="w-full bg-slate-100 p-2.5 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-2">
                                                <Images className="w-4 h-4" /> Carica
                                            </button>
                                            <input type="file" ref={tyFileInputRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept="image/*" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Colore Sfondo Pagina</label>
                                            <input type="text" value={generatedThankYouContent?.backgroundColor} onChange={e => updateTYContent({ backgroundColor: e.target.value })} className="w-full border p-2 rounded text-xs" />
                                        </div>
                                    </div>
                                </EditorSection>
                                <EditorSection title="Script Thank You Page" num="3" icon={<Terminal className="w-4 h-4"/>}>
                                    <div className="space-y-4">
                                        <textarea value={generatedThankYouContent?.extraThankYouHtml || ''} onChange={e => updateTYContent({ extraThankYouHtml: e.target.value })} className="w-full border p-2 rounded text-[10px] font-mono h-24 bg-slate-900 text-emerald-400" placeholder="HTML Extra Body" />
                                        <textarea value={generatedThankYouContent?.metaThankYouHtml || ''} onChange={e => updateTYContent({ metaThankYouHtml: e.target.value })} className="w-full border p-2 rounded text-[10px] font-mono h-20 bg-slate-900 text-blue-400" placeholder="Script HEAD (Meta)" />
                                        <textarea value={generatedThankYouContent?.tiktokThankYouHtml || ''} onChange={e => updateTYContent({ tiktokThankYouHtml: e.target.value })} className="w-full border p-2 rounded text-[10px] font-mono h-40 bg-slate-900 text-pink-400" placeholder="Script HEAD (TikTok)" />
                                    </div>
                                </EditorSection>
                            </>
                        )}
                        <button onClick={handleSaveToDb} disabled={isSaving} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold">Salva Pagina</button>
                    </div>
                )}
            </div>
            <div className="lg:col-span-8">
                {generatedContent ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[80vh] sticky top-24">
                        {previewMode === 'landing' ? <LandingPage content={generatedContent} /> : <ThankYouPage content={generatedThankYouContent!} />}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {adminPages.map(page => (
                            <div key={page.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                                <div><h3 className="font-bold">{page.product_name}</h3><p className="text-xs text-slate-400">/{page.slug}</p></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(page)} className="p-2 bg-blue-50 text-blue-600 rounded"><Pencil className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-2xl" onClick={() => setView('home')}><Sparkles className="w-7 h-7 text-emerald-500" /><span>{siteConfig.siteName}</span></div>
        <button onClick={() => session ? setView('admin') : setIsLoginOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Admin</button>
      </header>
      <main className="container mx-auto px-6 py-16">
        <HomeHero />
        <PublicPageGrid isLoading={isLoadingPages} pages={publicPages} onViewPage={p => { setSelectedPublicPage(p); setView('product_view'); }} />
      </main>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} isRegistering={isRegistering} setIsRegistering={setIsRegistering} email={email} setEmail={setEmail} password={password} setPassword={setPassword} loading={loading} authError={authError} authSuccess={authSuccess} handleAuth={handleAuth} />
    </div>
  );
};

export default App;