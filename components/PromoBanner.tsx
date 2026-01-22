import React, { useState } from 'react';
import { Gift, Zap, Ticket, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/supabase';

interface PromoBannerProps {
  onActivate: () => void;
  userId?: number;
  onPromoSuccess?: (amount: number) => void;
}

const PromoBanner: React.FC<PromoBannerProps> = ({ onActivate, userId, onPromoSuccess }) => {
  const [isPromoMode, setIsPromoMode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [activationStatus, setActivationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleWelcomeClick = () => {
    // Open deposit sidebar
    onActivate();
    // Switch view to Promo Code input for next time
    setIsPromoMode(true);
  };

  const handlePromoSubmit = async () => {
    if (!promoCode.trim() || !userId) return;
    
    setActivationStatus('idle');
    const result = await api.activatePromo(promoCode, userId);

    if (result.success) {
        setActivationStatus('success');
        setMessage(result.message || 'Activated!');
        if (onPromoSuccess && result.amount) onPromoSuccess(result.amount);
        
        setTimeout(() => {
            setActivationStatus('idle');
            setPromoCode('');
            setMessage('');
        }, 2500);
    } else {
        setActivationStatus('error');
        setMessage(result.message || 'Error');
        setTimeout(() => setActivationStatus('idle'), 2000);
    }
  };

  return (
    <div className="px-4 py-6 bg-slate-900">
      <div className="relative rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-yellow-500 via-red-500 to-purple-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
        <div className="bg-slate-900 rounded-[14px] p-5 relative overflow-hidden min-h-[200px] flex flex-col justify-center">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            {!isPromoMode ? (
                // VIEW 1: WELCOME PACKAGE
                <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in duration-500">
                    <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-[10px] tracking-[0.2em] uppercase mb-2">
                        <Zap size={12} className="fill-yellow-500" />
                        <span>Бонус дня</span>
                        <Zap size={12} className="fill-yellow-500" />
                    </div>
                    
                    <h3 className="text-2xl font-black italic text-white leading-none mb-1">
                        ПРИВЕТСТВЕННЫЙ ПАКЕТ
                    </h3>
                    <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 italic tracking-tighter mb-3 drop-shadow-sm">
                        150% + 150 FS
                    </h4>
                    
                    <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[90%] mb-4">
                        Сделай первый депозит и получи максимальный бонус на счет для игры в лучшие слоты!
                    </p>

                    <button 
                      onClick={handleWelcomeClick}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-red-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
                    >
                        <Gift size={14} />
                        Активировать бонус
                    </button>
                </div>
            ) : (
                // VIEW 2: PROMO CODE INPUT
                <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10">
                        <Ticket className="text-yellow-500" size={24} />
                    </div>

                    <h3 className="text-xl font-black italic text-white leading-none mb-2 uppercase tracking-wide">
                        Есть промокод?
                    </h3>
                    
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[90%] mb-4">
                        Введите ваш уникальный промокод для получения секретных бонусов и фриспинов.
                    </p>

                    {activationStatus === 'success' ? (
                        <div className="w-full py-3 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center justify-center gap-2 text-green-400 font-bold text-sm animate-in zoom-in duration-300">
                            <CheckCircle2 size={18} />
                            {message}
                        </div>
                    ) : (
                        <div className="w-full flex gap-2">
                            <input 
                                type="text" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="PROMO2024"
                                className={`flex-1 bg-black/40 border rounded-lg px-3 text-center text-white font-bold uppercase placeholder-zinc-700 outline-none focus:border-red-500 transition-colors ${activationStatus === 'error' ? 'border-red-500' : 'border-white/10'}`}
                            />
                            <button 
                                onClick={handlePromoSubmit}
                                className="bg-white text-black font-bold px-4 rounded-lg hover:bg-zinc-200 active:scale-95 transition-all flex items-center justify-center"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                    {activationStatus === 'error' && <p className="text-red-500 text-xs mt-2 font-bold">{message}</p>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;