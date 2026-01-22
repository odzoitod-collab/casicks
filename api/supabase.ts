import { createClient } from '@supabase/supabase-js';
import WebApp from '@twa-dev/sdk';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface UserData {
  id: number; // Это теперь Telegram ID по вашей схеме
  username: string;
  photo_url?: string; // Фото профиля из Telegram
  referrer_id?: number;
  balance: number;
  win_rate: number;
  is_banned: boolean;
  created_at: string;
}

export const api = {
  // Получение самых свежих данных пользователя (критично для win_rate)
  getUserData: async (userId: number): Promise<UserData | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) return null;
    return data;
  },

  initUser: async (): Promise<UserData | null> => {
    let tgUser;
    try {
        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            tgUser = WebApp.initDataUnsafe.user;
        }
    } catch (e) {
        console.warn('Telegram SDK not available');
    }

    // Мок для разработки
    if (!tgUser) {
        tgUser = { 
          id: 89301293, 
          username: 'Player_Dev',
          photo_url: 'https://via.placeholder.com/150'
        };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', tgUser.id) // Используем id как Telegram ID
      .single();

    if (error && error.code === 'PGRST116') {
        // Создаем нового пользователя по вашей схеме
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: tgUser.id, 
            username: tgUser.username || 'Player',
            photo_url: tgUser.photo_url || null,
            balance: 1000, // Начальный бонус
            win_rate: 30 
          }])
          .select()
          .single();
        
        if (createError) return null;
        return newUser;
    }

    // Обновляем фото и никнейм если изменились
    if (user && (user.username !== tgUser.username || user.photo_url !== tgUser.photo_url)) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ 
            username: tgUser.username || user.username,
            photo_url: tgUser.photo_url || user.photo_url
          })
          .eq('id', tgUser.id)
          .select()
          .single();
        
        return updatedUser || user;
    }

    return user;
  },

  updateBalance: async (userId: number, newBalance: number) => {
    return await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);
  },

  // Логирование игры для уведомления воркера
  logGame: async (userId: number, gameName: string, bet: number, result: number) => {
    return await supabase
      .from('game_logs')
      .insert([{
        user_id: userId,
        game_name: gameName,
        bet: bet,
        result: result
      }]);
  },

  createDeposit: async (userId: number, amount: number) => {
    return await supabase
      .from('deposits')
      .insert([{ 
        user_id: userId, 
        amount: amount, 
        status: 'pending' 
      }]);
  },

  // Серверная логика игр с подкруткой на основе win_rate
  playGame: async (userId: number, gameName: string, bet: number, gameData?: any): Promise<{
    isWin: boolean;
    winAmount: number;
    gameResult: any;
    newBalance: number;
  }> => {
    // Получаем актуальный win_rate пользователя
    const userData = await api.getUserData(userId);
    if (!userData) throw new Error('User not found');

    const winRate = userData.win_rate;
    const randomValue = Math.random() * 100;
    const isWin = randomValue <= winRate;

    let winAmount = 0;
    let gameResult: any = {};

    // Логика для каждой игры
    switch (gameName) {
      case 'Слоты':
        const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
        if (isWin) {
          // Принудительно выдаем выигрышную комбинацию
          const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          gameResult.reels = [winSymbol, winSymbol, winSymbol];
          winAmount = bet * 5;
        } else {
          // Принудительно выдаем проигрышную комбинацию
          gameResult.reels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
          ];
          // Убеждаемся что это не выигрышная комбинация
          while (gameResult.reels[0] === gameResult.reels[1] && gameResult.reels[1] === gameResult.reels[2]) {
            gameResult.reels[2] = symbols[(symbols.indexOf(gameResult.reels[2]) + 1) % symbols.length];
          }
        }
        break;

      case 'Колесо':
        const sectors = gameData?.sectors || ['Красное', 'Черное', 'Зеленое'];
        const playerChoice = gameData?.choice || 'Красное';
        
        if (isWin) {
          // Принудительно выбираем сектор игрока
          gameResult.sector = playerChoice;
          winAmount = bet * 2;
        } else {
          // Принудительно выбираем любой сектор КРОМЕ выбора игрока
          const otherSectors = sectors.filter(s => s !== playerChoice);
          gameResult.sector = otherSectors[Math.floor(Math.random() * otherSectors.length)];
        }
        break;

      case 'Наперстки':
        const playerCup = gameData?.selectedCup || 1;
        if (isWin) {
          // Мяч под выбранным стаканом
          gameResult.ballCup = playerCup;
          winAmount = Math.floor(bet * 2.8);
        } else {
          // Мяч под любым другим стаканом
          gameResult.ballCup = playerCup === 0 ? 1 : 0;
        }
        break;

      case 'Кости':
        // Генерируем значение кости (1-6)
        const diceValue = Math.floor(Math.random() * 6) + 1;
        gameResult.diceResult = diceValue;
        
        if (isWin) {
          // Принудительно делаем четное число для выигрыша
          gameResult.diceResult = diceValue % 2 === 0 ? diceValue : (diceValue === 6 ? 4 : diceValue + 1);
          winAmount = bet * 2;
        } else {
          // Принудительно делаем нечетное число для проигрыша
          gameResult.diceResult = diceValue % 2 === 1 ? diceValue : (diceValue === 1 ? 3 : diceValue - 1);
        }
        break;

      default:
        throw new Error('Unknown game');
    }

    // Атомарно обновляем баланс и логируем игру через RPC
    const { data: rpcResult, error } = await supabase.rpc('update_balance_after_game', {
      user_id_param: userId,
      bet_amount: bet,
      win_amount: winAmount,
      game_name_param: gameName
    });

    if (error) {
      throw new Error(`Game transaction failed: ${error.message}`);
    }

    if (!rpcResult.success) {
      throw new Error(rpcResult.error || 'Game transaction failed');
    }

    return { 
      isWin, 
      winAmount, 
      gameResult,
      newBalance: rpcResult.new_balance
    };
  },

  activatePromo: async (code: string, userId: number) => {
    const { data: promo, error } = await supabase
      .from('promocodes')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error || !promo) return { success: false, message: 'Код не найден' };
    if (promo.uses_left <= 0) return { success: false, message: 'Код истек' };

    // Атомарное обновление промокода и баланса (в идеале делать через RPC, но для примера так)
    await supabase.from('promocodes').update({ uses_left: promo.uses_left - 1 }).eq('id', promo.id);
    
    // Получаем текущий баланс для обновления
    const user = await api.getUserData(userId);
    if (user) {
        await api.updateBalance(userId, user.balance + promo.amount);
    }
    
    return { success: true, amount: promo.amount, message: `Начислено ${promo.amount}₽!` };
  },

  // Получение настроек сайта
  getSettings: async (): Promise<{ [key: string]: string }> => {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');
    
    if (error) return {};
    
    // Преобразуем в объект key-value
    const settings: { [key: string]: string } = {};
    data.forEach(item => {
      settings[item.key] = item.value;
    });
    
    return settings;
  },

  // Получение конкретной настройки
  getSetting: async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) return null;
    return data.value;
  }
};