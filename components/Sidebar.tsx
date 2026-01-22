import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, Wallet, Headset, ChevronRight, ArrowLeft, Copy, Clock, CheckCircle2, History, TrendingDown, ArrowUpRight, Trophy } from 'lucide-react';
import { UserData, api } from '../api/supabase';

export type SidebarView = 'menu' | 'deposit' | 'withdraw' | 'support' | 'history' | 'screenshot_confirm' | 'promo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  initialView?: SidebarView;
  user: UserData | null;
  settings?: { [key: string]: string };
  onBalanceUpdate?: (newBalance: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, balance, initialView = 'menu', user, settings = {}, onBalanceUpdate }) => {
  const [activeView, setActiveView] = useState<SidebarView>('menu');
  const [depositAmount, setDepositAmount] = useState<string>('1000');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) setActiveView(initialView);
    else { const t = setTimeout(() => setActiveView('menu'), 300); return () => clearTimeout(t); }
  }, [isOpen, initialView]);

  const handleDeposit = async () => {
      if (user) {
          await api.createDeposit(user.id, parseInt(depositAmount));
          setActiveView('screenshot_confirm');
      }
  };

  const handlePromoActivate = async () => {
    if (!user || !promoCode.trim()) return;
    
    const result = await api.activatePromo(promoCode.trim(), user.id);
    setPromoMessage(result.message);
    
    if (result.success && onBalanceUpdate) {
      setPromoCode('');
      // Обновляем баланс через callback
      onBalanceUpdate(balance + result.amount);
      
      // Показываем уведомление
      setTimeout(() => {
        setPromoMessage('');
        setActiveView('menu');
      }, 2000);
    }
  };

  const renderMenu = () => (
      <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-6">
         <div className="flex items-center gap-4 p-2">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 overflow-hidden">
               {user?.photo_url ? (
                 <img src={user.photo_url} alt={user.username} className="w-full h-full object-cover" />
               ) : (
                 <User size={32} />
               )}
            </div>
            <div>
               <h3 className="text-white font-bold text-lg">{user?.username || 'Игрок'}</h3>
               <span className="text-xs text-zinc-500 font-mono">ID: {user?.id}</span>
            </div>
         </div>

         <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-white/5 shadow-xl">
             <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Баланс</div>
             <div className="text-3xl font-black text-white mb-6 italic">{balance.toLocaleString()} ₽</div>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setActiveView('deposit')} className="bg-red-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-all">Пополнить</button>
                 <button onClick={() => setActiveView('promo')} className="bg-yellow-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-all">Промокод</button>
             </div>
         </div>

         <div className="space-y-1">
             <button onClick={() => setActiveView('support')} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                    <Headset size={20} className="text-zinc-400" />
                    <span className="text-white font-bold">Поддержка</span>
                </div>
                <ChevronRight size={16} className="text-zinc-700" />
             </button>
         </div>
      </div>
  );

  const renderDeposit = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <button onClick={() => setActiveView('menu')} className="flex items-center gap-2 text-zinc-400 mb-4">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          
          <div className="bg-white/5 rounded-3xl p-8 flex flex-col items-center border border-white/5">
             <span className="text-[10px] text-zinc-500 font-bold uppercase mb-4">Сумма депозита</span>
             <input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-transparent text-center text-5xl font-light text-white w-full outline-none"
             />
             <div className="grid grid-cols-3 gap-2 mt-6 w-full">
                {[1000, 2000, 5000].map(v => (
                    <button key={v} onClick={() => setDepositAmount(v.toString())} className="py-2 bg-white/5 rounded-xl text-xs font-bold text-zinc-400">{v}</button>
                ))}
             </div>
          </div>
          <button onClick={handleDeposit} className="w-full bg-red-600 text-white font-bold py-5 rounded-2xl shadow-lg active:scale-95 transition-all">Создать заявку</button>
      </div>
  );

  const renderPromo = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <button onClick={() => setActiveView('menu')} className="flex items-center gap-2 text-zinc-400 mb-4">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          
          <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
             <h3 className="text-white font-bold text-lg mb-4">Активировать промокод</h3>
             <input 
                type="text" 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Введите промокод"
                className="w-full bg-white/10 text-white p-4 rounded-xl outline-none border border-white/10 focus:border-yellow-500 transition-colors"
             />
             {promoMessage && (
               <div className={`mt-4 p-3 rounded-xl text-sm ${promoMessage.includes('Начислено') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                 {promoMessage}
               </div>
             )}
          </div>
          <button 
            onClick={handlePromoActivate} 
            disabled={!promoCode.trim()}
            className="w-full bg-yellow-600 text-white font-bold py-5 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Активировать
          </button>
      </div>
  );

  const renderScreenshotConfirm = () => (
      <div className="mt-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
          <button onClick={() => setActiveView('deposit')} className="flex items-center gap-2 text-zinc-400 mb-4 self-start">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Заявка создана</h3>
          <div className="bg-white/5 rounded-2xl p-4 w-full">
            <p className="text-zinc-300 text-sm mb-2">Переведите <b className="text-white">{depositAmount} ₽</b> на:</p>
            <div className="bg-white/10 rounded-xl p-3 font-mono text-sm text-white">
              {settings.deposit_wallet || '4276 **** **** 9012'}
            </div>
          </div>
          <p className="text-zinc-500 text-xs">После перевода отправьте скриншот чека боту для подтверждения</p>
          <a 
            href={`https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'PinUp_PlayBot'}`} 
            className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
             Отправить чек в Telegram
          </a>
      </div>
  );

  const renderSupport = () => (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
          <button onClick={() => setActiveView('menu')} className="flex items-center gap-2 text-zinc-400 mb-4">
            <ArrowLeft size={16} />
            <span>Назад</span>
          </button>
          
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <Headset size={32} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Поддержка 24/7</h3>
              <p className="text-zinc-400 text-sm">Наша команда поддержки готова помочь вам в любое время</p>
            </div>
            <a 
              href={`https://t.me/${(settings.support_url || '@support').replace('@', '')}`}
              className="w-full bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Headset size={20} />
              Написать в поддержку
            </a>
          </div>
      </div>
  );

  return (
    <>
      <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[340px] bg-[#09090b] z-50 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-white/5`}>
        <div className="p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">PIN<span className="text-red-600">UP</span></h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
           {activeView === 'menu' && renderMenu()}
           {activeView === 'deposit' && renderDeposit()}
           {activeView === 'promo' && renderPromo()}
           {activeView === 'screenshot_confirm' && renderScreenshotConfirm()}
           {activeView === 'support' && renderSupport()}
        </div>
      </div>
    </>
  );
};

export default Sidebar;