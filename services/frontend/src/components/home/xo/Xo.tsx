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
let container_class = "w-full h-full flex flex-col  max-w-[500px] ";
let td_class = "border-5 bg-no-repeat bg-[length:50%_50%]";
td_class += " bg-center"
let gameon = true;
let ws: WebSocket | null = null;
let yourturn = true;
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
    window.location.href = '/xo';
}

const handlepvp = (map: string[][], setMap: any, state: number, setState: any) => {
    // ws = new WebSocket('ws://localhost:8083/xo-game/pvp/handler');
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
                console.log(`==============>${typeof data.map}  ${typeof map}<==============`);
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

const Xo: ComponentFunction = ({ mode }) => {
    const [state, setState] = useState(1); // 0: playing, 1: waiting, -1: error
    mode_ = mode as 'pvp' | 'ai';
    if (mode_ != 'ai') {
        reset_class += ' cursor-not-allowed ';
    }
    else
        reset_class += ' cursor-pointer ';
    const table = <table
        className={table_class}
    ></table>;
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
                className={` ${td_class}`}
            >
            </td>;
            tr.children.push(td);
        }
        table.children.push(tr);
    }
    return <div className={container_class}>
        <button
            type="button"
            className={reset_class}
            onclick={() => mode == 'ai' && reset(setMap)}
        >
            Tic tac Toe
        </button>
        {mode == 'pvp' && (
            state == 1 ? (
                <div className="text-white text-2xl font-['Irish_Grover'] text-center mt-2">Waiting for an opponent...</div>
            ) : state == -1 ? (
                <div className="text-white text-2xl font-['Irish_Grover'] text-center mt-2">Something went wrong, please refresh the page.</div>
            ) : (
                <div className="text-white text-2xl font-['Irish_Grover'] text-center mt-2">{yourturn ? "Your turn" : "Opponent's turn"}</div>
            )
        )}
        {table}
    </div>;
}
export const Xo_page: ComponentFunction = () => {
    return (

        <div className="w-full h-[100vh] bg-[url(/images/bg-home1.png)] bg-no-repeat bg-[length:100%_100%] flex justify-center items-center ">
            <Xo mode='pvp' />
        </div>
    );
}
export default Xo;