import React from 'react';
import { Menu, User } from 'lucide-react';
import { UserData } from '../api/supabase';

interface HeaderProps {
  onMenuClick: () => void;
  balance: number;
  user?: UserData | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, balance, user }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          <div className="flex flex-col">
             <h1 className="text-lg font-black tracking-tighter text-white leading-none italic">
                PIN<span className="text-red-600">UP</span>
             </h1>
             <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Official Casino</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="text-right">
                 <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Баланс</div>
                 <div className="text-sm font-bold text-white tabular-nums">{balance.toLocaleString('ru-RU')} ₽</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-700 p-0.5 shadow-lg">
                 <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {user?.photo_url ? (
                      <img 
                        src={user.photo_url} 
                        alt={user.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <User size={18} className={`text-zinc-300 ${user?.photo_url ? 'hidden' : ''}`} />
                 </div>
             </div>
        </div>
      </div>
    </header>
  );
};

export default Header;