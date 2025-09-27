import { useEffect } from "../../../hooks/useEffect";
import { useState } from "../../../hooks/useState";
import { ComponentFunction, VNode } from "../../../types/global";
import { h } from "../../../vdom/createElement";
let mode_: 'pvp' | 'ai' = 'pvp';
let reset_class = "w-full h-20 text-white text-2xl font-['Irish_Grover'] text-4xl ";
reset_class += "bg-[url(/images/home-assests/bg-gameMode.svg)] bg-no-repeat bg-[length:100%_100%] ";
let table_class = " bg-[url(/images/xo/xo.png)] bg-no-repeat bg-[length:100%_100%] ";
table_class += " w-full h-[70%] ";
table_class += "  m-auto justify-self-end ";
let container_class = "w-full h-full flex flex-col justify-center items-center max-w-[500px] ";
let td_class = "border-5 bg-no-repeat bg-[length:50%_50%]";
td_class += " bg-center"
let gameon = true;
let ws: WebSocket | null = null;
let yourturn = true;
import './Xo.css';
async function safeFetch(url: string, options: any) {
    try {
        const res = await fetch(`/xo-game/${mode_}/${url}`, options);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

const click = (i: number, j: number, map: string[][], setMap: any) => {
    if (map[j][i] != '-' || (mode_ == 'pvp' && (!gameon || !yourturn))) {
        return;
    }
    const send = JSON.stringify({
        type: 'move',
        cell: {
            x: i,
            y: j
        }
    })
    if (mode_ == 'ai')
        safeFetch(`play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: send
        }).then(data => {
            if (data?.map)
                setMap(data.map)

        }).catch(error => console.log("error"))
    else if (ws) { if (yourturn) { yourturn = false; ws.send(send); } else alert(yourturn) };
};

const reset = (setMap: any) => {
    safeFetch(`reset`, {
        method: 'DELETE'
    }).then(data => {
        if (data?.map)
            setMap(data.map)
    }).catch(error => console.log("error"))
}

const handlepvp = (map: string[][], setMap: any, state: number, setState: any) => {
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${scheme}://${location.host}/xo-game/pvp/handler`);
    ws.onopen = () => {
        console.log('WebSocket connection established');
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'end') {
            alert(data.winner);
            window.location.href = '/home';
            return;
        }
        else if (data.type === 'noauth') {
            alert('you are not authorized');
            window.location.href = '/home';
            return;
        }
        else if (data.type === 'error') {
            alert('something wrong');
            setState(-1);
            return;
        }
        else if (data.type === 'wait') {
            gameon = false;
            setState(1);
            return;
        }
        else if (data.type === 'start') {
            gameon = true;
            window.location.reload();
            setState(0);
        }
        else if (data.type === 'move' || data.type === 'update') {
            gameon = true;
            setState(0);
            yourturn = !!data.turn;
            if (data.map) {
                if (typeof data.map === 'string')
                    data.map = JSON.parse(data.map);
                setMap(data.map);
            }
        }
        else if (data.type === 'reset') {
            setMap([['-', '-', '-'], ['-', '-', '-'], ['-', '-', '-']]);
        }
    };
    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };
    ws.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };
}

type HistoryType = {
    ai: {
        win: number,
        total: number
    },
    pvp: {
        win: number,
        total: number
    }
}
const History: ComponentFunction = ({ close }) => {
    const [history, setHistory] = useState<HistoryType>({ ai: { win: 0, total: 0 }, pvp: { win: 0, total: 0 } });
    useEffect(() => {
        const fetching = async () => {
            const response = await fetch('/api/users/get/me', {
                method: 'GET'
            });
            if (!response.ok) return;
            const data = await response.json();
            if (data) {
                safeFetch(`history/${data.id}`, {
                    method: 'GET'
                }).then(data => {
                    console.log(data);
                    if (data)
                        setHistory(data);
                }).catch(error => console.log("error"));
            }
        };
        try {
            fetching();
        } catch (error) {
            console.log(error);
        }
    }, []);
    return (
        <div
            className="
            flex flex-col
            w-full h-auto
            p-4
            font-['Irish_Grover'] text-4xl
            bg-[#66AFB4]
            opacity-[77%]
            rounded-[20px]
            items-center gap-4
          "
        >
            <button
                onClick={close}
                className="
                p-2
                rounded-[10px]
                self-end
                bg-[url(/images/chat/close.png)] bg-no-repeat bg-[length:100%_100%]
              "
            ></button>
            <h1>Game History</h1>
            <div
                className="
                flex
                justify-center items-center
              "
            >
                <img src="/images/xo/X.png" alt="X" />
                <img src="/images/xo/O.png" alt="O" />
            </div>
            <div
                className="
                flex
                h-[100px]
                p-4
                bg-white
                rounded-[20px]
                opacity-[63%]
                place-content-around items-center
              "
            >
                <div
                    className="
                    w-[100px] h-[100px]
                    bg-[url('/images/xo/human.png'),url('/images/xo/dwara.png')] bg-[length:70px_70px,cover] bg-no-repeat bg-[position:center,_-5px_-5px]
                  "
                ></div>
                <h3
                    className="
                    text-sky-500
                  "
                >{`${history.ai?.win}/${history.ai?.total}`}</h3>
                <div
                    className="
                    w-[100px] h-[100px]
                    bg-[url(/images/xo/ai2.png)] bg-cover bg-no-repeat
                  "
                ></div>
            </div>
            <div
                className="
                flex
                h-[100px]
                p-4
                bg-white
                rounded-[20px]
                opacity-[63%]
                place-content-around items-center
              "
            >
                <div
                    className="
                    w-[100px] h-[100px]
                    bg-[url('/images/xo/human.png'),url('/images/xo/dwara.png')] bg-[length:70px_70px,cover] bg-no-repeat bg-[position:center,_-5px_-5px]
                  "
                ></div>
                <h3
                    className="
                    text-sky-500
                  "
                >{`${history.pvp?.win}/${history.pvp?.total}`}</h3>
                <div
                    className="
                    w-[100px] h-[100px]
                    bg-[url('/images/xo/human.png'),url('/images/xo/dwara.png')] bg-[length:70px_70px,cover] bg-no-repeat bg-[position:center,_-5px_-5px]
                  "
                ></div>
            </div>
        </div>
    );
};

const Xo: ComponentFunction = ({ mode }) => {
    const [state, setState] = useState(1); // 0: playing, 1: waiting, -1: error
    const [history, setHistory] = useState<Boolean>(false);

    mode_ = mode as 'pvp' | 'ai';
    const table = <table className={table_class}></table >;
    const [map, setMap] = useState([['-', '-', '-'], ['-', '-', '-'], ['-', '-', '-']]);
    useEffect(() => {
        const datafetching = async () => {
            try {
                const response = await safeFetch(`create`, {
                    method: 'POST'
                });
                if (response.map) {
                    setMap(response.map);
                }
            } catch (error) {
                console.log(error);
            }
        };
        if (mode == 'ai')
            datafetching();
        else
            handlepvp(map, setMap, state, setState);

    }, [])
    for (let i = 0; i < 3; i++) {
        const tr = <tr></tr>;
        for (let j = 0; j < 3; j++) {
            const td = <td
                id={`cell-${i}-${j}`}
                onclick={() => click(j, i, map, setMap)}
                style={{ backgroundImage: `url(/images/xo/${map[i][j] || '-'}.png)` }}
                className={`
                ${td_class}
              `}
            >
            </td>;
            tr.children.push(td);
        }
        table.children.push(tr);
    }
    return <div
        className={
            container_class
        }
    >
        {(history && mode_ == 'ai') && (<History close={() => setHistory(false)} />) || (<div
            className="
            w-full h-full
          "
        > <button
            type="button"
            onclick={() => window.location.href = mode == 'ai' ? '/xo' : '/home'}
            className={reset_class}
        >
                Tic tac Toe
            </button>

            {mode == 'pvp' && (
                state == 1 ? (
                    <div
                        className="
                        mt-2
                        text-white text-2xl font-['Irish_Grover'] text-center
                      "
                    >Waiting for an opponent...</div>
                ) : state == -1 ? (
                    <div
                        className="
                        mt-2
                        text-white text-2xl font-['Irish_Grover'] text-center
                      "
                    >Something went wrong, please refresh the page.</div>
                ) : (
                    <div
                        className="
                        mt-2
                        text-white text-2xl font-['Irish_Grover'] text-center
                      "
                    >{yourturn ? "Your turn" : "Opponent's turn"}</div>
                )
            ) || (
                    <div className="flex place-content-between gap-4">
                        <button
                            type="button"
                            className="
                                        mt-2
                                        text-white text-2xl font-['Irish_Grover'] text-center
                                    "
                            onclick={() => setHistory(true)}>
                            History
                        </button>
                        <button
                            type="button"
                            className="
                                        mt-2
                                        text-white text-2xl font-['Irish_Grover'] text-center
                                    "
                            onclick={() => reset(setMap)}>
                            Reset
                        </button>
                    </div>
                )
            }
            {table}</div>)
        }
    </div >;
}
export const Xo_page: ComponentFunction = () => {
    return (

        <div
            className="
            flex
            w-full h-[100vh]
            bg-[url(/images/bg-home1.png)] bg-no-repeat bg-[length:100%_100%]
            justify-center items-center
          "
        >
            <Xo mode='pvp' />
        </div>
    );
}
export default Xo;