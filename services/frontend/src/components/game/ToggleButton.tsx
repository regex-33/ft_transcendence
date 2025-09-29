import { h } from '../../vdom/createElement';
import { ComponentFunction } from "../../types/global";
import { useState } from '../../hooks/useState';
import { GameType } from './game';
import TournamentButtonSvg from '/images/tournament-button.svg';

interface ToggleButtonProps {
    onStart: (type: GameType) => void;
}

export const ToggleButton: ComponentFunction<ToggleButtonProps> = ({ onStart }) => {
    const [gameType, setGameType] = useState<GameType>(GameType.SOLO);

    const toggleGameType = () => {
        setGameType(gameType === GameType.SOLO ? GameType.TEAM : GameType.SOLO);
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                onClick={toggleGameType}
                className="relative w-[200px] h-16 cursor-pointer transition-all hover:scale-105"
                style={{ backgroundImage: `url('/images/toggle-bg.svg')`, backgroundSize: 'cover' }}
            >
                <div 
                    className={`absolute top-1 w-12 h-12 rounded-full transition-all duration-500 flex items-center justify-center  ${
                        gameType === GameType.SOLO ? 'left-1' : 'left-[calc(100%-3.75rem)]'
                    }`}
                    style={{ backgroundImage: `url('/images/togglebutton.svg')`, backgroundSize: 'cover' }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-3 font-luckiest text-xs text-white pointer-events-none">
                    <span className={gameType === GameType.SOLO ? 'opacity-0' : 'opacity-100'}>SOLO</span>
                    <span className={gameType === GameType.TEAM ? 'opacity-0' : 'opacity-100'}>TEAM</span>
                </div>
            </div>

            <button 
                onClick={() => onStart(gameType)}
                className=""
            >
                <img src={TournamentButtonSvg} className="hover:scale-[0.96]" />
            </button>
        </div>
    );
};