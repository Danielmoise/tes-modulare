import React from 'react';

export const HomeHero: React.FC = () => {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">Le Migliori Offerte, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">Selezionate per Te</span></h2>
        <p className="text-lg text-slate-600 font-medium">Scopri prodotti unici e approfitta di sconti esclusivi. Pagamento sicuro alla consegna e spedizione rapida.</p>
    </div>
  );
};