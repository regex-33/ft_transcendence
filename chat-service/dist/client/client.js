"use strict";
const client = new WebSocket('ws://localhost:8080');
const msg = document.getElementById('messages');
const input = document.getElementById('input');
const buton = document.getElementById('sendBtn');
client.onmessage = (event) => {
    console.log("client recive msg from server");
    const data = document.createElement('div');
    data.textContent = event.data;
    msg.appendChild(data);
};
buton.onclick = () => {
    const text = input.value.trim();
    if (text) {
        client.send(text);
        input.value = '';
    }
};
