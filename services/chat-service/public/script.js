const statusDiv = document.getElementById('status');
const messagesDiv = document.getElementById('recive'); 
const messageInput = document.getElementById('data');
const sendButton = document.getElementById('send');

const ws = new WebSocket('ws://localhost:8002/ws/chat');
async function get(){
    // const data = await fetch("http://localhost:8080/api/users/get/me",{
    const data = await fetch("http://localhost/api/users/get/me",{
        method:"GET",
        credentials:"include"
    })
    console.table(await data.json())
}
get();
let time_out;
ws.onopen = () => {
    statusDiv.textContent = 'Online';
    statusDiv.className = 'status-online';
    time_out = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
        }
    }, 30000);
};

ws.onmessage = (event) => {

    if(event.data === 'pong')
    {
        console.log('Pong received from server.');
        return;
    }
    const data = JSON.parse(event.data);

    const messageElement = document.createElement('div');
    messageElement.className = 'message';

    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = data.text;

    const timeElement = document.createElement('div');
    timeElement.className = 'message-time';
    timeElement.textContent = data.time;
    
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);
    messagesDiv.appendChild(messageElement);
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

ws.onclose = () => {
    statusDiv.textContent = 'Offline';
    statusDiv.className = 'status-offline';
};

ws.onerror = (error) => {
    console.error('WebSocket Error:', error);
    statusDiv.textContent = 'Error';
    statusDiv.className = 'status-offline';
};

function sendMessage() {
    const message = messageInput.value;
    if (message.trim() !== '' && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        messageInput.value = '';
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});