import { useEffect, useRef } from 'react';
import { supabase } from '../api/supabase';

interface RealtimeHookOptions {
  onUserUpdate?: (user: any) => void;
  onSettingsUpdate?: (settings: { key: string; value: string }) => void;
  onPromoUpdate?: (promo: any) => void;
  onGameLogUpdate?: (gameLog: any) => void;
  onDepositUpdate?: (deposit: any) => void;
}

export const useRealtime = (userId?: number, options: RealtimeHookOptions = {}) => {
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Настройка Realtime подписок для пользователя:', userId);

    // Очищаем предыдущие подписки
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // 1. Подписка на изменения пользователя
    if (options.onUserUpdate) {
      const userChannel = supabase
        .channel(`user-updates-${userId}`)
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'users', 
            filter: `id=eq.${userId}` 
          },
          (payload) => {
            console.log('🔄 Обновление пользователя:', payload);
            options.onUserUpdate?.(payload.new);
          }
        )
        .subscribe();
      
      channelsRef.current.push(userChannel);
    }

    // 2. Подписка на изменения настроек
    if (options.onSettingsUpdate) {
      const settingsChannel = supabase
        .channel('settings-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'settings' 
          },
          (payload) => {
            console.log('🔄 Обновление настроек:', payload);
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              options.onSettingsUpdate?.(payload.new as { key: string; value: string });
            }
          }
        )
        .subscribe();
      
      channelsRef.current.push(settingsChannel);
    }

    // 3. Подписка на промокоды
    if (options.onPromoUpdate) {
      const promoChannel = supabase
        .channel('promo-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'promocodes' 
          },
          (payload) => {
            console.log('🔄 Обновление промокодов:', payload);
            options.onPromoUpdate?.(payload);
          }
        )
        .subscribe();
      
      channelsRef.current.push(promoChannel);
    }

    // 4. Подписка на игровые логи (для уведомлений)
    if (options.onGameLogUpdate) {
      const gameLogChannel = supabase
        .channel('game-logs')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'game_logs',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔄 Новый игровой лог:', payload);
            options.onGameLogUpdate?.(payload.new);
          }
        )
        .subscribe();
      
      channelsRef.current.push(gameLogChannel);
    }

    // 5. Подписка на депозиты
    if (options.onDepositUpdate) {
      const depositChannel = supabase
        .channel('deposit-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'deposits',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔄 Обновление депозита:', payload);
            options.onDepositUpdate?.(payload);
          }
        )
        .subscribe();
      
      channelsRef.current.push(depositChannel);
    }

    // Cleanup функция
    return () => {
      console.log('🔄 Очистка Realtime подписок');
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [userId, options.onUserUpdate, options.onSettingsUpdate, options.onPromoUpdate, options.onGameLogUpdate, options.onDepositUpdate]);

  // Функция для принудительного переподключения
  const reconnect = () => {
    console.log('🔄 Принудительное переподключение Realtime');
    // Триггерим useEffect заново
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  };

  return { reconnect };
};

// Хук для глобальных уведомлений
export const useRealtimeNotifications = () => {
  useEffect(() => {
    console.log('🔔 Настройка глобальных уведомлений');

    // Подписка на все важные события для уведомлений
    const notificationChannel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'users' 
        },
        (payload) => {
          // Можно добавить глобальные уведомления
          console.log('🔔 Глобальное событие пользователей:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, []);
};