import { useEffect } from "../../../hooks/useEffect";
import { useState } from "../../../hooks/useState";
import { ComponentFunction, VNode } from "../../../types/global";
import { h } from "../../../vdom/createElement";
let turn = 'X';
let aimode = false;
let reset_class = "";
let table_class = " bg-[url(/images/xo/xo.png)] bg-no-repeat bg-[length:100%_100%] ";
table_class += " w-full h-[70%] ";
table_class += "  m-auto justify-self-end ";
let container_class = "w-full h-full flex flex-col  ";
let td_class = "border-5 bg-no-repeat bg-[length:50%_50%]";
td_class += " bg-center"
let ai_class = "w-full h-20 text-white text-2xl font-['Irish_Grover'] text-4xl ";
async function safeFetch(url: string, options: any) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

const click = (x: number, y: number, setMap: any, map: any) => {
    if (aimode) {
        safeFetch('/xo-game/play', {
            method: 'POST',
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cell: { x: y, y: x } })
        }).then(data => {
            if (data?.map)
                setMap(data.map)

        }).catch(error => console.log("error"))
    }
    else if (map[x][y] === '-') {
        let new_map = [[...map[0]], [...map[1]], [...map[2]]]

        new_map[x][y] = turn;
        turn = turn == 'X' ? 'O' : 'X';
        setMap(new_map);
    }

};

const reset = (setMap: any) => {
    fetch('/xo-game/reset', {
        method: 'DELETE',
        credentials: "include",

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
                    method: 'POST',
                    credentials: "include",
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
    for (let y = 0; y < 3; y++) {
        const tr = <tr></tr>;
        for (let x = 0; x < 3; x++) {
            const td = <td
                id={`cell-${x}-${y}`}
                onclick={() => click(x, y, setMap, map)}
                className={`bg-[url(/images/xo/${map[x][y]}.png)] ${td_class}`}
            >
            </td>;
            tr.children.push(td);
        }
        table.children.push(tr);
    }
    return <div className={container_class}>
        <div className="w-full relative flex justify-center ">
            <button

                type="button"
                className={`bg-[url(/images/xo/ai.png)] w-[52px] h-[52px] absolute top-4 left-[-150px] bg-center bg-no-repeat ${ai_class}`}
                onclick={() => {
                    aimode = true;
                    reset(setMap);
                }}>
            </button>
            <button
                type="button"
                className={`bg-[url(/images/xo/title.png)] font-['Irish_Grover']   w-[200px] h-20 absolute top-[-20px]  bg-center bg-no-repeat  ${reset_class}`}
                onclick={() => reset(setMap)}>
                Tic tac Toe
            </button>
            <button
                type="button"
                className={`bg-[url(/images/xo/local.png)] w-[52px] h-[52px] absolute top-4 right-0 bg-center bg-no-repeat`}
                onclick={() => {
                    aimode = false;
                    setMap([['-', '-', '-'], ['-', '-', '-'], ['-', '-', '-']]);
                }}
            >
            </button>
        </div>
        {table}
    </div>;
}

export default Xo;