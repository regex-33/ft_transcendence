import { ComponentFunction, VNode } from "../../../types/global";
import { h } from "../../../vdom/createElement";
let turn = 'X';
let arr: Array<Array<Cell>> = [];
let table = <table class="w-[300px] h-[300px] table-auto border-separate border-spacing-0"></table>;
const editTurn = () => {
    turn = turn === 'X' ? 'O' : 'X';
};
const click = (i: number, j: number) => {
    // console.log(turn);
    // table.children[i].children[j].innerText = turn;
    const td = document.getElementById(`cell-${i}-${j}`);
    if (td && td.innerText === '') {
        td.innerText = turn;
    }
    editTurn();
};

type Cell = {
    x: number;
    y: number;
    el: VNode;
};

const Xo: ComponentFunction = () => {
    for (let i = 0; i < 3; i++) {
        const tr = <tr></tr>;
        let charr: Array<Cell> = [];
        for (let j = 0; j < 3; j++) {
            const td = <td
                id={`cell-${i}-${j}`}
                onclick={() => click(i, j)}
                class="w-[100px] h-[100px] border-4 border-black bg-green-500 text-center align-middle select-none leading-[100px] text-[50px] border-box font-bold"
            >
                {' '}
            </td>;
            charr.push({
                x: j,
                y: i,
                el: td
            });
            tr.children.push(td);
        }
        arr.push(charr);
        table.children.push(tr);
    }
    return table;
}

export default Xo;