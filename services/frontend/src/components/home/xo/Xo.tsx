import { useEffect } from "../../../hooks/useEffect";
import { useState } from "../../../hooks/useState";
import { ComponentFunction, VNode } from "../../../types/global";
import { h } from "../../../vdom/createElement";
let turn = !true;
let reset_class = "w-full h-20 text-white text-2xl font-['Irish_Grover'] text-4xl ";
reset_class += "bg-[url(/images/home-assests/bg-gameMode.svg)] bg-no-repeat bg-[length:100%_100%] ";
let table_class = " bg-[url(/images/xo/xo.png)] bg-no-repeat bg-[length:100%_100%] ";
table_class += " w-full h-[70%] ";
table_class += "  m-auto justify-self-end ";
let container_class = "w-full h-full flex flex-col  ";
let td_class = "border-5 bg-no-repeat bg-[length:50%_50%]";
td_class += " bg-center"
async function safeFetch(url: string, options: any) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null; // swallow silently
    }
}

const click = (i: number, j: number, setMap: any) => {
    safeFetch('/xo-game/play', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            cell: {
                x: i,
                y: j
            }
        })
    }).then(data => {
        if (data?.map)
            setMap(data.map)

    }).catch(error => console.log("error"))

};

const reset = (setMap: any) => {
    fetch('/xo-game/reset', {
        method: 'DELETE'
    })
        .then(data => data.json())
        .then(data => {
            if (data && data.map) {
                setMap(data.map);
            }
        }).catch(error => console.log("error"))
}

const Xo: ComponentFunction = () => {
    const table = <table
        className={table_class}
    ></table>;
    const [map, setMap] = useState([['-', 'O', 'X'], ['-', 'X', 'O'], ['-', 'O', '-']]);
    useEffect(() => {
        const datafetching = async () => {
            try {
                const response = await fetch('/xo-game/create', {
                    method: 'POST'
                });
                if (!response.ok)
                    return;
                const data: any = await response.json();
                if (data.map) {
                    setMap(data.map);
                }
            } catch (error) {
                console.log(error);
            }
        };
        datafetching();
    }, [])
    for (let i = 0; i < 3; i++) {
        const tr = <tr></tr>;
        for (let j = 0; j < 3; j++) {
            const td = <td
                id={`cell-${i}-${j}`}
                onclick={() => click(j, i, setMap)}
                className={`bg-[url(/images/xo/${(() => {
                    if (turn && map[i][j] != '-') return map[i][j] == 'X' ? 'O' : 'X';
                    return map[i][j];
                })()}.png)] ${td_class}`}
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
            onclick={() => reset(setMap)}
        >
            Tic tac Toe
        </button>
        {table}
    </div>;
}

export default Xo;