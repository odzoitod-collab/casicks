import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GameGrid from './components/GameGrid';
import InfoBlock from './components/InfoBlock';
import PromoBanner from './components/PromoBanner';
import Sidebar, { SidebarView } from './components/Sidebar';
import { IMAGES } from './constants';
import { Headset, Loader2 } from 'lucide-react';
import { api, supabase, UserData } from './api/supabase';
import { useNotifications } from './contexts/NotificationContext';
import WebApp from '@twa-dev/sdk';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('menu');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  
  const { showSuccess, showInfo, showWarning, showError } = useNotifications();

  useEffect(() => {
    try {
        WebApp.expand();
        WebApp.ready();
    } catch (e) {}

    const setup = async () => {
        try {
          const data = await api.initUser();
          if (data) {
            setUser(data);
            showSuccess('🎰 Добро пожаловать!', `Привет, ${data.username}!`);
          }
          
          // Загружаем настройки
          const settingsData = await api.getSettings();
          setSettings(settingsData);
          
          setIsLoading(false);
        } catch (error) {
          console.error('Ошибка инициализации:', error);
          showError('❌ Ошибка подключения', 'Не удалось подключиться к серверу');
          setIsLoading(false);
        }
    };
    setup();
  }, [showSuccess, showError]);

  // 🔥 REALTIME: Подписка на изменения пользователя
  useEffect(() => {
    if (!user) return;

    console.log(`🔄 Подписываемся на изменения пользователя ${user.id}`);

    const userChannel = supabase
      .channel(`user-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'users', 
          filter: `id=eq.${user.id}` 
        },
        (payload) => {
          console.log('🔄 Получено обновление пользователя:', payload);
          const updated = payload.new as UserData;
          const oldUser = user;
          
          setUser(prev => prev ? { 
            ...prev, 
            balance: updated.balance, 
            win_rate: updated.win_rate,
            is_banned: updated.is_banned,
            username: updated.username,
            photo_url: updated.photo_url
          } : null);
          
          // Показываем уведомления об изменениях
          if (updated.balance !== oldUser.balance) {
            const diff = updated.balance - oldUser.balance;
            if (diff > 0) {
              showSuccess('💰 Баланс пополнен!', `+${diff.toFixed(0)} ₽`);
            } else if (diff < 0) {
              showInfo('💸 Списание с баланса', `${diff.toFixed(0)} ₽`);
            }
          }

          if (updated.is_banned !== oldUser.is_banned) {
            if (updated.is_banned) {
              showError('🚫 Аккаунт заблокирован', 'Обратитесь в поддержку');
            } else {
              showSuccess('✅ Аккаунт разблокирован', 'Добро пожаловать обратно!');
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Отписываемся от изменений пользователя');
      supabase.removeChannel(userChannel);
    };
  }, [user?.id, user?.balance, user?.is_banned, showSuccess, showInfo, showError]);

  // 🔥 REALTIME: Подписка на изменения настроек
  useEffect(() => {
    console.log('🔄 Подписываемся на изменения настроек');

    const settingsChannel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'settings' 
        },
        (payload) => {
          console.log('🔄 Получено обновление настроек:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const { key, value } = payload.new as { key: string; value: string };
            setSettings(prev => ({ ...prev, [key]: value }));
            
            // Показываем уведомление о конкретной настройке
            const settingNames: { [key: string]: string } = {
              'support_url': 'Контакт поддержки',
              'deposit_wallet': 'Реквизиты для пополнения'
            };
            
            showInfo('⚙️ Настройки обновлены', `${settingNames[key] || key} изменен`);
          }
          
          if (payload.eventType === 'DELETE') {
            const { key } = payload.old as { key: string };
            setSettings(prev => {
              const newSettings = { ...prev };
              delete newSettings[key];
              return newSettings;
            });
            showWarning('⚙️ Настройка удалена', `${key} удален`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Отписываемся от изменений настроек');
      supabase.removeChannel(settingsChannel);
    };
  }, [showInfo, showWarning]);

  // 🔥 REALTIME: Подписка на депозиты пользователя
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Подписываемся на изменения депозитов');

    const depositsChannel = supabase
      .channel(`deposits-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'deposits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Получено обновление депозита:', payload);
          const deposit = payload.new as any;
          
          if (deposit.status === 'approved') {
            showSuccess('✅ Депозит одобрен!', `+${deposit.amount}$ зачислено на счет`);
          } else if (deposit.status === 'rejected') {
            showError('❌ Депозит отклонен', 'Проверьте данные и попробуйте снова');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Отписываемся от изменений депозитов');
      supabase.removeChannel(depositsChannel);
    };
  }, [user?.id, showSuccess, showError]);

  const handleBalanceUpdate = (newBalance: number) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, balance: newBalance } : null);
  };

  const openSidebar = (view: SidebarView) => {
    setSidebarView(view);
    setIsSidebarOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="animate-spin text-red-600" size={48} />
        <div className="font-black italic tracking-tighter text-2xl uppercase">PIN<span className="text-red-600">UP</span></div>
        <div className="text-sm text-zinc-500">Подключение к серверу...</div>
      </div>
    );
  }

  const currentBalance = user?.balance || 0;

  return (
    <div className="min-h-screen bg-slate-900 max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans selection:bg-red-500/30">
      <Header onMenuClick={() => openSidebar('menu')} balance={currentBalance} user={user} />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        balance={currentBalance}
        initialView={sidebarView}
        user={user}
        settings={settings}
        onBalanceUpdate={handleBalanceUpdate}
      />
      
      <main className="animate-in fade-in duration-700">
        <div className="w-full relative group cursor-pointer overflow-hidden">
          <img 
            src={IMAGES.mainBanner} 
            alt="Welcome Bonus" 
            className="w-full h-auto object-cover border-b-2 border-red-600 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
        </div>

        <GameGrid 
            balance={currentBalance} 
            setBalance={handleBalanceUpdate} 
            userId={user?.id}
        />

        <PromoBanner 
          onActivate={() => openSidebar('promo')} 
          userId={user?.id} 
          onPromoSuccess={(amt) => handleBalanceUpdate(currentBalance + amt)} 
        />

        <div className="px-4 py-2">
          <div 
            className="w-full relative rounded-2xl overflow-hidden shadow-xl border border-white/5 group cursor-pointer" 
            onClick={() => openSidebar('support')}
          >
            <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md z-10 flex items-center gap-1.5 shadow-lg uppercase tracking-wider">
              <Headset size={12} strokeWidth={3} />
              Support 24/7
            </div>
            <img 
              src={IMAGES.supportBanner} 
              alt="Tech Support" 
              className="w-full h-40 object-cover object-top group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md p-3 border-t border-white/5">
              <span className="text-white font-black text-sm uppercase tracking-tighter italic">
                {settings.support_url ? `Связаться: ${settings.support_url}` : 'Связаться с оператором'}
              </span>
            </div>
          </div>
        </div>

        <InfoBlock />
      </main>
    </div>
  );
};

export default App;