import React, { useState } from 'react';
import { IMAGES } from '../constants';
import { Play } from 'lucide-react';
import GameModal from './GameModal';
import WebApp from '@twa-dev/sdk';

const games = [
  { name: "Slots", image: IMAGES.games.slots, label: "Слоты" },
  { name: "Fortune", image: IMAGES.games.wheel, label: "Колесо" },
  { name: "Thimbles", image: IMAGES.games.thimbles, label: "Наперстки" },
  { name: "Dice", image: IMAGES.games.dice, label: "Кости" },
];

interface GameGridProps {
  balance: number;
  setBalance: (amount: number) => void;
  userId?: number;
}

const GameGrid: React.FC<GameGridProps> = ({ balance, setBalance, userId }) => {
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null);

  const handleGameSelect = (game: typeof games[0]) => {
    try {
        WebApp.HapticFeedback.impactOccurred('medium');
    } catch (e) {}
    setSelectedGame(game);
  };

  return (
    <>
      <div className="w-full py-6 bg-gradient-to-b from-slate-900 to-slate-800 border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-red-600 rounded-full inline-block"></span>
            Топ игры
          </h2>
          <span className="text-xs text-red-500 font-semibold cursor-pointer">Все игры &rarr;</span>
        </div>

        <div className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar snap-x">
          {games.map((game, index) => (
            <button 
              key={index} 
              className="min-w-[40%] snap-start flex flex-col items-center group cursor-pointer outline-none active:scale-95 transition-transform"
              onClick={() => handleGameSelect(game)}
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-700 group-hover:border-red-500 transition-all duration-300">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {/* pointer-events-none гарантирует, что оверлей не блокирует клик */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                   <div className="bg-red-600 rounded-full p-2 shadow-lg shadow-red-900/50">
                      <Play size={20} className="text-white fill-white ml-0.5" />
                   </div>
                </div>
              </div>
              <span className="mt-3 text-xs font-bold text-slate-200 uppercase tracking-wide text-center truncate w-full group-hover:text-red-500 transition-colors">
                {game.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <GameModal 
        game={selectedGame} 
        isOpen={!!selectedGame} 
        onClose={() => setSelectedGame(null)} 
        balance={balance}
        setBalance={setBalance}
        userId={userId}
      />
    </>
  );
};

export default GameGrid;