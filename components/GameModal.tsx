import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, Star, PartyPopper, Frown, Zap, Hexagon } from 'lucide-react';
// Импорт вашего API. Убедитесь, что путь правильный.
import { api } from '../api/supabase';

// --- ТИПЫ ДАННЫХ ---
interface Game {
  name: string;
  label: string;
  image: string;
}

interface GameModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  setBalance: (amount: number) => void;
  userId?: number;
}

// --- ГЛОБАЛЬНЫЕ СТИЛИ И АНИМАЦИИ ---
// Внедряются динамически при открытии модального окна
const GLOBAL_STYLES = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.2); }
    50% { box-shadow: 0 0 40px rgba(234, 179, 8, 0.6); }
  }

  /* 3D DICE STYLES (Для игры в Кости) */
  .scene { perspective: 500px; }
  .cube {
    width: 80px; height: 80px; position: relative;
    transform-style: preserve-3d;
    transition: transform 1s cubic-bezier(0.1, 0.9, 0.2, 1);
  }
  .cube__face {
    position: absolute; width: 80px; height: 80px;
    background: linear-gradient(145deg, #ffffff, #e6e6e6);
    border: 2px solid #d4d4d4; border-radius: 12px;
    display: flex; justify-content: center; align-items: center;
    box-shadow: inset 0 0 12px rgba(0,0,0,0.1);
  }
  .dot { width: 14px; height: 14px; background: #ef4444; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.4); }
  
  .face-1 { transform: rotateY(0deg) translateZ(40px); }
  .face-2 { transform: rotateY(90deg) translateZ(40px); }
  .face-3 { transform: rotateY(180deg) translateZ(40px); }
  .face-4 { transform: rotateY(-90deg) translateZ(40px); }
  .face-5 { transform: rotateX(90deg) translateZ(40px); }
  .face-6 { transform: rotateX(-90deg) translateZ(40px); }

  /* SLOT BLUR (Размытие при вращении слотов) */
  .slot-blur { filter: blur(4px); }
`;

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

// 1. Оверлей результата (Победа/Поражение)
const ResultOverlay: React.FC<{ type: 'win' | 'loss' | 'jackpot' | null; amount: number; onClose: () => void; }> = ({ type, amount, onClose }) => {
  if (!type) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
       <div className="relative w-full max-w-xs bg-zinc-900 border border-white/10 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
           
           {/* Иконка статуса */}
           <div className="mb-6 relative">
              <div className={`absolute inset-0 blur-xl opacity-50 ${type === 'loss' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              {type === 'jackpot' && <Star size={80} className="text-yellow-400 fill-yellow-400 relative z-10 animate-pulse" />}
              {type === 'win' && <PartyPopper size={72} className="text-green-400 relative z-10" />}
              {type === 'loss' && <Frown size={72} className="text-zinc-500 relative z-10" />}
           </div>

           <h2 className="text-3xl font-black italic uppercase mb-2 text-white tracking-wider">
               {type === 'jackpot' ? 'JACKPOT!' : type === 'win' ? 'ПОБЕДА!' : 'МИМО'}
           </h2>

           {type !== 'loss' && (
             <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8 drop-shadow-sm">
               +{amount.toLocaleString()} ₽
             </div>
           )}

           <button 
             onClick={onClose} 
             className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm uppercase tracking-widest transition-colors"
           >
             Продолжить
           </button>
       </div>
    </div>
  );
};

// 2. Панель ставок (Bet Controls)
const BetControls: React.FC<{ bet: number; setBet: (val: number) => void; balance: number; disabled: boolean }> = ({ bet, setBet, balance, disabled }) => (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2 flex items-center justify-between border border-white/5 shadow-inner">
        <div className="flex items-center gap-2">
            <button disabled={disabled} onClick={() => setBet(Math.max(10, bet - 100))} className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center text-zinc-400 active:scale-95 transition-all disabled:opacity-50 hover:bg-[#3f3f46]">
                <Minus size={20} />
            </button>
            <div className="flex flex-col items-center w-28">
                 <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ставка</span>
                 <input 
                    type="number" 
                    value={bet} 
                    onChange={(e) => setBet(Math.max(10, parseInt(e.target.value) || 0))} 
                    disabled={disabled} 
                    className="w-full bg-transparent text-center text-white font-black text-xl outline-none"
                 />
            </div>
            <button disabled={disabled} onClick={() => setBet(Math.min(balance, bet + 100))} className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center text-zinc-400 active:scale-95 transition-all disabled:opacity-50 hover:bg-[#3f3f46]">
                <Plus size={20} />
            </button>
        </div>
        <div className="flex gap-1 pl-2 border-l border-white/5">
            <button disabled={disabled} onClick={() => setBet(Math.min(balance, bet * 2))} className="px-3 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">x2</button>
            <button disabled={disabled} onClick={() => setBet(Math.min(balance, 50000))} className="px-3 py-2 rounded-lg text-xs font-bold text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">MAX</button>
        </div>
    </div>
);

// --- ИГРОВЫЕ КОМПОНЕНТЫ ---

// ИГРА 1: СЛОТЫ
const SlotsGame: React.FC<{ balance: number; setBalance: (val: number) => void; userId: number }> = ({ balance, setBalance, userId }) => {
    const symbols = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
    const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
    const [isSpinning, setIsSpinning] = useState(false);
    const [bet, setBet] = useState(100);
    const [result, setResult] = useState<any>(null);

    const spin = async () => {
        if (balance < bet || isSpinning) return;
        setIsSpinning(true);
        setResult(null);

        // Старт визуального вращения (интервал)
        const interval = setInterval(() => {
            setReels(prev => prev.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
        }, 50);

        try {
            const gameResult = await api.playGame(userId, 'Слоты', bet);
            
            // Крутим 1.5 секунды перед остановкой
            setTimeout(() => {
                clearInterval(interval);
                setReels(gameResult.gameResult.reels);
                setIsSpinning(false);
                setBalance(gameResult.newBalance);
                
                setTimeout(() => {
                    setResult({ 
                        type: gameResult.isWin ? (gameResult.winAmount > bet * 5 ? 'jackpot' : 'win') : 'loss', 
                        amount: gameResult.winAmount 
                    });
                }, 300);
            }, 1500);
        } catch (e) {
            clearInterval(interval);
            setIsSpinning(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ResultOverlay type={result?.type} amount={result?.amount} onClose={() => setResult(null)} />
            
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Корпус автомата */}
                <div className="bg-gradient-to-b from-zinc-800 to-zinc-950 p-5 rounded-[32px] shadow-2xl border border-white/5 relative w-full max-w-xs">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-3 bg-zinc-800 rounded-full blur-xl opacity-50"></div>
                    
                    {/* Экран слотов */}
                    <div className="bg-black rounded-2xl p-3 flex gap-2 border-3 border-zinc-900 shadow-inner overflow-hidden relative">
                         {/* Блики на стекле */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-20 rounded-xl"></div>
                        
                        {reels.map((symbol, i) => (
                            <div key={i} className="flex-1 h-24 bg-[#18181b] rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                                <div className={`text-4xl transition-all duration-100 ${isSpinning ? 'slot-blur scale-90 opacity-70' : 'scale-100'}`}>
                                    {symbol}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 text-center">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Комбинация</div>
                        <div className="text-yellow-500 font-mono text-sm">7️⃣ 7️⃣ 7️⃣ = x100</div>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <BetControls bet={bet} setBet={setBet} balance={balance} disabled={isSpinning} />
                <button 
                    onClick={spin} 
                    disabled={isSpinning || balance < bet}
                    className="w-full py-6 bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl text-white font-black text-xl uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative z-10">{isSpinning ? 'УДАЧА...' : 'КРУТИТЬ'}</span>
                </button>
            </div>
        </div>
    );
};

// ИГРА 2: КОЛЕСО ФОРТУНЫ (С исправленной логикой секторов)
const FortuneWheelGame: React.FC<{ balance: number; setBalance: (val: number) => void; userId: number }> = ({ balance, setBalance, userId }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [bet, setBet] = useState(100);
    const [color, setColor] = useState<'red' | 'black' | 'green'>('red');
    const [result, setResult] = useState<any>(null);

    // Конфигурация секторов (CSS gradient начинается с 0deg сверху по часовой стрелке)
    const sectorConfig = [
        { id: 'red',   center: 30 },  // 0-60deg
        { id: 'black', center: 90 },  // 60-120deg
        { id: 'green', center: 150 }, // 120-180deg
        { id: 'red',   center: 210 }, // 180-240deg
        { id: 'black', center: 270 }, // 240-300deg
        { id: 'green', center: 330 }, // 300-360deg
    ];

    const spin = async () => {
        if (balance < bet || isSpinning) return;
        setIsSpinning(true);
        setResult(null);

        try {
            const apiColorMap: Record<string, string> = { 'red': 'Красное', 'black': 'Черное', 'green': 'Зеленое' };
            
            // 1. Запрос к серверу
            const gameResult = await api.playGame(userId, 'Колесо', bet, { 
                choice: apiColorMap[color],
                sectors: ['Красное', 'Черное', 'Зеленое']
            });

            // 2. Определяем целевой цвет из ответа
            const targetSectorName = gameResult.gameResult.sector; 
            const targetColorId = targetSectorName === 'Красное' ? 'red' : 
                                  targetSectorName === 'Черное' ? 'black' : 'green';
            
            // 3. Находим подходящий сектор и считаем угол
            const possibleSectors = sectorConfig.filter(s => s.id === targetColorId);
            const targetSector = possibleSectors[Math.floor(Math.random() * possibleSectors.length)];
            
            if (targetSector) {
                // Расчет угла для точной остановки
                const fullSpins = 360 * 5; // 5 оборотов
                const adjustmentToTop = 360 - targetSector.center; 
                const randomOffset = Math.floor(Math.random() * 40) - 20; 

                const currentMod = rotation % 360;
                const newRotation = rotation + fullSpins + (adjustmentToTop - currentMod) + randomOffset;
                const finalRotation = newRotation > rotation ? newRotation : newRotation + 360;

                setRotation(finalRotation);
                
                // Ждем окончания CSS анимации (3 сек)
                setTimeout(() => {
                    setIsSpinning(false);
                    setBalance(gameResult.newBalance);
                    setResult({ 
                        type: gameResult.isWin ? (gameResult.winAmount > bet * 10 ? 'jackpot' : 'win') : 'loss', 
                        amount: gameResult.winAmount 
                    });
                }, 3000);
            }

        } catch (e) {
            console.error(e);
            setIsSpinning(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ResultOverlay type={result?.type} amount={result?.amount} onClose={() => setResult(null)} />

            <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                {/* МАРКЕР */}
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 z-20 filter drop-shadow-lg">
                     <div className="w-8 h-12 bg-gradient-to-b from-yellow-300 to-yellow-600 clip-path-polygon" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)' }}></div>
                </div>

                {/* КОЛЕСО */}
                <div className="relative w-64 h-64">
                    <div 
                        className="w-full h-full rounded-full border-[6px] border-zinc-800 shadow-2xl relative"
                        style={{ 
                            transform: `rotate(${rotation}deg)`, 
                            transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0, 0.2, 1)' : 'none',
                            background: `conic-gradient(
                                #ef4444 0deg 60deg,    /* 1. Красное */
                                #18181b 60deg 120deg,  /* 2. Черное */
                                #22c55e 120deg 180deg, /* 3. Зеленое */
                                #ef4444 180deg 240deg, /* 4. Красное */
                                #18181b 240deg 300deg, /* 5. Черное */
                                #22c55e 300deg 360deg  /* 6. Зеленое */
                            )`
                        }}
                    >
                        <div className="absolute inset-0 m-auto w-12 h-12 bg-zinc-800 rounded-full border-3 border-zinc-700 shadow-lg z-10 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                        </div>
                        {[0, 60, 120, 180, 240, 300].map(d => (
                            <div key={d} className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/20 origin-bottom -translate-x-1/2" style={{ transform: `translateX(-50%) rotate(${d}deg)` }}></div>
                        ))}
                    </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-3 mt-6 p-2 bg-zinc-900/80 rounded-2xl border border-white/5 backdrop-blur shadow-xl">
                    {[
                        { id: 'red', bg: 'bg-red-600', label: 'RED x2' },
                        { id: 'black', bg: 'bg-zinc-800', label: 'BLACK x2' },
                        { id: 'green', bg: 'bg-green-600', label: 'GREEN x14' }
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            onClick={() => setColor(btn.id as any)}
                            disabled={isSpinning}
                            className={`w-24 py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                                color === btn.id 
                                ? `${btn.bg} ring-2 ring-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)] opacity-100` 
                                : 'bg-transparent hover:bg-white/5 opacity-50 grayscale'
                            }`}
                        >
                            <span className={`w-3 h-3 rounded-full mb-2 ${btn.bg} border border-white/30`}></span>
                            <span className="text-white text-[10px] font-black tracking-widest">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 space-y-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                <BetControls bet={bet} setBet={setBet} balance={balance} disabled={isSpinning} />
                <button 
                    onClick={spin} 
                    disabled={isSpinning || balance < bet}
                    className="w-full py-6 bg-yellow-500 hover:bg-yellow-400 rounded-2xl text-black font-black text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isSpinning ? 'УДАЧА...' : 'КРУТИТЬ'}
                </button>
            </div>
        </div>
    );
};

// ИГРА 3: КОСТИ (3D)
const DiceGame: React.FC<{ balance: number; setBalance: (val: number) => void; userId: number }> = ({ balance, setBalance, userId }) => {
    const [rolling, setRolling] = useState(false);
    const [diceResult, setDiceResult] = useState(1);
    const [bet, setBet] = useState(100);
    const [result, setResult] = useState<any>(null);

    const faces: Record<number, [number, number]> = {
        1: [0, 0], 2: [0, -90], 3: [0, -180], 4: [0, 90], 5: [-90, 0], 6: [90, 0]
    };

    const roll = async () => {
        if (balance < bet || rolling) return;
        setRolling(true);
        setResult(null);

        // Временная "тряска"
        const interval = setInterval(() => {
            setDiceResult(Math.floor(Math.random() * 6) + 1);
        }, 100);

        try {
            const gameResult = await api.playGame(userId, 'Кости', bet);
            const finalVal = gameResult.gameResult.diceResult;

            setTimeout(() => {
                clearInterval(interval);
                setDiceResult(finalVal); // Ставим финальное значение (кубик повернется к нему)
                setRolling(false);
                setBalance(gameResult.newBalance);
                
                setTimeout(() => {
                    setResult({ 
                        type: gameResult.isWin ? 'win' : 'loss', 
                        amount: gameResult.winAmount 
                    });
                }, 800);
            }, 1000);
        } catch (e) {
            clearInterval(interval);
            setRolling(false);
        }
    };

    const [rx, ry] = faces[diceResult] || [0,0];
    const displayRx = rolling ? rx + 720 + Math.random() * 360 : rx;
    const displayRy = rolling ? ry + 720 + Math.random() * 360 : ry;

    return (
        <div className="flex flex-col h-full">
            <ResultOverlay type={result?.type} amount={result?.amount} onClose={() => setResult(null)} />

            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900/20 to-transparent">
                <div className="scene">
                    <div className="cube" style={{ transform: `rotateX(${displayRx}deg) rotateY(${displayRy}deg)` }}>
                        <div className="cube__face face-1"><div className="dot"></div></div>
                        <div className="cube__face face-2"><div className="flex gap-4"><div className="dot"></div><div className="dot"></div></div></div>
                        <div className="cube__face face-3"><div className="flex gap-4"><div className="dot self-start"></div><div className="dot self-center"></div><div className="dot self-end"></div></div></div>
                        <div className="cube__face face-4">
                            <div className="flex flex-col justify-between h-full w-full p-4">
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                            </div>
                        </div>
                        <div className="cube__face face-5">
                            <div className="flex flex-col justify-between h-full w-full p-4">
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                                <div className="flex justify-center"><div className="dot"></div></div>
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                            </div>
                        </div>
                        <div className="cube__face face-6">
                            <div className="flex flex-col justify-between h-full w-full p-4">
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                                <div className="flex justify-between"><div className="dot"></div><div className="dot"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <div className="text-blue-200 text-sm font-medium">Четное = <span className="text-green-400 font-bold">ПОБЕДА</span></div>
                    <div className="text-blue-200 text-sm font-medium">Нечетное = <span className="text-red-400 font-bold">ПРОИГРЫШ</span></div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <BetControls bet={bet} setBet={setBet} balance={balance} disabled={rolling} />
                <button 
                    onClick={roll} 
                    disabled={rolling || balance < bet}
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-black text-xl uppercase tracking-widest shadow-[0_0_25px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {rolling ? 'БРОСОК...' : 'БРОСИТЬ КУБИК'}
                </button>
            </div>
        </div>
    );
};

// ИГРА 4: НАПЕРСТКИ (С исправленной видимостью мяча)
const ThimblesGame: React.FC<{ balance: number; setBalance: (val: number) => void; userId: number }> = ({ balance, setBalance, userId }) => {
    const [state, setState] = useState<'idle' | 'shuffling' | 'picking' | 'revealing'>('idle');
    const [ballPos, setBallPos] = useState(1); 
    const [bet, setBet] = useState(100);
    const [result, setResult] = useState<any>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [positions, setPositions] = useState([0, 1, 2]); // Для анимации перемешивания

    const start = async () => {
        if (balance < bet) return;
        setState('shuffling');
        setResult(null);
        setSelected(null);
        setBallPos(1);

        // Логика анимации перемешивания
        let shuffleCount = 0;
        const maxShuffles = 5;
        
        const shuffleInterval = setInterval(() => {
            setPositions(prev => {
                const newPos = [...prev];
                const a = Math.floor(Math.random() * 3);
                let b = Math.floor(Math.random() * 3);
                while (a === b) b = Math.floor(Math.random() * 3);
                const temp = newPos[a]; newPos[a] = newPos[b]; newPos[b] = temp;
                return newPos;
            });
            
            shuffleCount++;
            if (shuffleCount >= maxShuffles) {
                clearInterval(shuffleInterval);
                setState('picking');
                setPositions([0, 1, 2]); // Сброс визуальных позиций
            }
        }, 400);
    };

    const pick = async (index: number) => {
        if (state !== 'picking') return;
        setSelected(index);
        setState('revealing');
        
        try {
            const gameResult = await api.playGame(userId, 'Наперстки', bet, { selectedCup: index });
            
            // Логика размещения шарика в зависимости от результата
            if (gameResult.isWin) {
                // Если победа - шарик под выбранным стаканом
                setBallPos(index);
            } else {
                // Если проигрыш - шарик под любым другим стаканом
                const otherPositions = [0, 1, 2].filter(pos => pos !== index);
                const randomOtherPos = otherPositions[Math.floor(Math.random() * otherPositions.length)];
                setBallPos(randomOtherPos);
            }
            
            setBalance(gameResult.newBalance);

            setTimeout(() => {
                setResult({ 
                    type: gameResult.isWin ? 'win' : 'loss', 
                    amount: gameResult.winAmount 
                });
            }, 800);
        } catch (e) {
            setState('idle');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ResultOverlay type={result?.type} amount={result?.amount} onClose={() => { setResult(null); setState('idle'); }} />
            
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="relative w-full max-w-xs h-32">
                    {[0, 1, 2].map((i) => {
                        const isLifted = (state === 'idle' && i === 1) || (state === 'revealing' && i === selected);
                        const showBall = ballPos === i && state === 'revealing';
                        const xPos = state === 'shuffling' ? (positions.indexOf(i) - 1) * 80 : (i - 1) * 80;

                        return (
                            <div 
                                key={i} 
                                className="absolute top-0 left-1/2 w-20 h-28 flex justify-center transition-all duration-300 ease-in-out"
                                style={{ transform: `translateX(calc(-50% + ${xPos}px))` }}
                                onClick={() => pick(i)}
                            >
                                {/* МЯЧ (opacity: 0 скрывает его пока стакан опущен) */}
                                <div className={`absolute bottom-2 w-6 h-6 rounded-full bg-yellow-400 shadow-[inset_-3px_-3px_8px_rgba(0,0,0,0.5),0_4px_8px_rgba(0,0,0,0.5)] z-0 transition-opacity duration-200 ${
                                    showBall && isLifted ? 'opacity-100' : 'opacity-0'
                                }`}></div>

                                {/* СТАКАН */}
                                <div 
                                    className={`
                                        absolute w-16 h-24 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-t-[32px] rounded-b-lg border-t border-white/20 shadow-2xl z-10 transition-transform duration-500 ease-in-out cursor-pointer
                                        ${isLifted ? '-translate-y-12' : 'translate-y-0'}
                                        ${state === 'picking' ? 'hover:-translate-y-2 hover:bg-zinc-800' : ''}
                                        ${selected === i ? 'ring-2 ring-yellow-500' : ''}
                                    `}
                                >
                                    <div className="w-full h-3 bg-black/20 mt-3"></div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-12 text-center font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
                    {state === 'idle' && "Нажмите Играть"}
                    {state === 'shuffling' && "Перемешивание..."}
                    {state === 'picking' && "Где спрятан мяч?"}
                    {state === 'revealing' && "Открываем..."}
                </div>
            </div>

            <div className="p-5 space-y-4">
                <BetControls bet={bet} setBet={setBet} balance={balance} disabled={state !== 'idle'} />
                <button 
                    onClick={start} 
                    disabled={state !== 'idle' || balance < bet}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black text-xl uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    ИГРАТЬ
                </button>
            </div>
        </div>
    );
};

// --- ОСНОВНОЙ МОДАЛЬНЫЙ КОМПОНЕНТ ---
const GameModal: React.FC<GameModalProps> = ({ game, isOpen, onClose, balance, setBalance, userId }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) { setShow(true); } 
        else { const t = setTimeout(() => setShow(false), 300); return () => clearTimeout(t); }
    }, [isOpen]);

    if (!isOpen && !show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
            <style>{GLOBAL_STYLES}</style>
            
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                onClick={onClose} 
            />
            
            {/* Modal Body */}
            <div className={`
                relative w-full max-w-lg h-[95vh] sm:h-[900px] bg-[#09090b] rounded-t-[40px] sm:rounded-[40px] flex flex-col shadow-2xl border border-white/10 overflow-hidden transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) pointer-events-auto
                ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-20 sm:scale-95'}
            `}>
                
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-black/20 backdrop-blur z-20">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                            {game?.name === 'Slots' && <Zap size={20} className="text-red-500" />}
                            {game?.name === 'Fortune' && <Hexagon size={20} className="text-yellow-500" />}
                            {game?.name === 'Dice' && <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>}
                            {game?.name === 'Thimbles' && <div className="w-4 h-4 rounded-full border-2 border-blue-500"></div>}
                        </div>
                        <h3 className="text-white font-black text-lg uppercase tracking-wide">{game?.label}</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-green-400 font-mono font-bold text-lg shadow-inner">
                           {balance.toFixed(0)} ₽
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors">
                            <X size={20} />
                        </button>
                     </div>
                </div>

                {/* Game Area */}
                <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black">
                     {userId ? (
                        <>
                            {game?.name === 'Slots' && <SlotsGame balance={balance} setBalance={setBalance} userId={userId} />}
                            {game?.name === 'Fortune' && <FortuneWheelGame balance={balance} setBalance={setBalance} userId={userId} />}
                            {game?.name === 'Dice' && <DiceGame balance={balance} setBalance={setBalance} userId={userId} />}
                            {game?.name === 'Thimbles' && <ThimblesGame balance={balance} setBalance={setBalance} userId={userId} />}
                        </>
                     ) : (
                         <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">Загрузка профиля...</div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default GameModal;