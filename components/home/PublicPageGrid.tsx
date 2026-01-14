import React from 'react';
import { ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { LandingPageRow } from '../../types';

interface PageCardProps {
  page: LandingPageRow;
  onView: (p: LandingPageRow) => void;
}

const PageCard: React.FC<PageCardProps> = ({ page, onView }) => {
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 relative" onClick={() => onView(page)}>
        <div className="aspect-video bg-slate-200 relative overflow-hidden">
            <img 
              src={page.content.heroImageBase64 || (page.content.generatedImages?.[0] || `https://picsum.photos/seed/${page.product_name.replace(/\s/g,'')}/800/600`)} 
              alt={page.product_name} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
              loading="lazy" 
            />
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
  );
};

interface PublicPageGridProps {
  isLoading: boolean;
  pages: LandingPageRow[];
  onViewPage: (p: LandingPageRow) => void;
}

export const PublicPageGrid: React.FC<PublicPageGridProps> = ({ isLoading, pages, onViewPage }) => {
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500"/></div>;
  }

  if (pages.length === 0) {
    return (
      <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
          <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-lg">Nessuna offerta disponibile al momento.</p>
          <p className="text-slate-400 text-sm mt-1">Torna a trovarci presto per scoprire le novità!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in zoom-in-95 duration-500">
        {pages.map(page => <PageCard key={page.id} page={page} onView={onViewPage} />)}
    </div>
  );
};