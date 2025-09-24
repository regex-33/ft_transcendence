import { h } from '../../vdom/createElement';
import { Header } from '../home/Header';
import GameTournamentImg from '../../../images/game-tournament.png';
import { ComponentFunction } from "../../types/global";
import './style.css';

const CardButton = () => {
    return (
        <div className={"flex font-luckiest flex-row justify-center items-center "}>
            <div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
            <div className="bg-[#5FDBE3] px-4 pt-5 pb-4 text-2xl text-white">VS</div>
            <div className="bg-white pt-4 pb-3 px-8 text-[#5FDBE3] text-xs">One</div>
        </div>
    )
}

export const TournamentPage: ComponentFunction = () => {
    return (
        <div
            className="relative flex flex-col overflow-hidden h-screen w-screen"
            style={{ backgroundColor: 'rgba(94, 156, 171, 0.9)' }}
        >
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url(/images/bg-home1.png)',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%',
                }}
            />

            <div className="relative z-10">
                <Header />
            </div>
            <div className="z-10 m-auto w-[90%]">
                <div className="bg-[#58D7DFAD]/30 flex flex-col justify-center py-20 my-2 px-10 rounded-2xl border-white-100 border-2">
                    <div class="grid grid-flow-col grid-rows-2 ">
                        <div class="row-span-2 flex justify-center items-center tournament-game1-card"><CardButton /></div>
                        <div class="col-span-1 flex justify-center items-center">
                            <img src={GameTournamentImg} className="max-w-[150px]"/>
                        </div>
                        <div className="flex flex-col justify-center mx-[-2px]">
                            <div className="flex justify-center ">
                                <div className="border-r-0 w-full border-t-2 min-h-[4vh] border-white">
                                </div>
                                <div className="border-l-2 w-full border-t-2 min-h-[2vh] border-white">
                                </div>
                            </div>
                            <div class="col-span-1 row-span-1 flex justify-center m-0 tournament-gamefinal-card items-center"><CardButton /></div>
                        </div>
                        <div class="row-span-2 flex justify-center items-center tournament-game2-card"><CardButton /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

