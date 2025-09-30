import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import { ComponentFunction } from "../../types/global";
import { useEffect } from '../../hooks/useEffect';
import { useState } from '../../hooks/useState';

const modeButtons = [
    { id: 'classic', image: '/images/home-assests/racet.svg', alt: 'Classic Mode' },
    { id: 'speed', image: '/images/home-assests/speed.svg', alt: 'Speed Mode' },
    { id: 'vanish', image: '/images/home-assests/vanish.svg', alt: 'Vanish Mode' },
    { id: 'gold', image: '/images/home-assests/gold.svg', alt: 'Gold Mode' }
];

export const Modes: ComponentFunction = ({modes, setModes}) => {
    const handleModeClick = (modeId: string) => {
        setModes(modeId);
    };
    return (
        <div className="flex flex-row justify-center items-center gap-4  py-10 px-5">
            {modeButtons.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode.id)}
                    className={`w-24 h-24 rounded-2xl  flex items-center justify-center transition-all hover:scale-110 ${
                        modes === mode.id 
                            ? 'bg-[#58D7DFAD]/70 border-white-100 border-2' 
                            : 'bg-cyan-500/80 border-2 border-cyan-300'
                    }`}
                >
                    <div className="flex flex-col items-center gap-2">
                    <img src={mode.image} alt={mode.alt} className="w-12 h-12 object-contain" />
                    <span className="font-luckiest text-sm text-white">{mode.id}</span>
                    </div>
                </button>
            ))}
        </div>
    );
};