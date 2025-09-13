
const statusDiv = document.getElementById('status');
const statusIndicator = document.getElementById('status-indicator');
const messagesUl = document.getElementById('messages');
const messageInput = document.getElementById('data');
const sendButton = document.getElementById('send');
const number_online = document.getElementById('numbre');
const friendsUl = document.getElementById('friends');
const chatArea = document.getElementById('chat-area');
const welcomeMessage = document.getElementById('welcome-message');
const ws = new WebSocket("ws://localhost:8002/ws/chat");
let currentUser = null;
let selectedFriendId = null;

ws.onopen = () => {
    messageInput.disabled = true;
    sendButton.disabled = true;

    async function initializeConnection() {
        const userData = await get_ip();
        if (!userData || !userData.id) {
            console.log("Could not get user data. Chat disabled.");
            statusDiv.innerHTML = "Error";
            statusIndicator.style.backgroundColor = "red";
            return;
        }

        console.log("User data loaded:", userData);
        currentUser = userData;
        messageInput.disabled = false;
        sendButton.disabled = false;
        statusDiv.innerHTML = "Online";
        statusIndicator.style.backgroundColor = "#31A24C";
        const registrationMessage = {
            type: 'register',
            id: userData.id 
        };
        ws.send(JSON.stringify(registrationMessage));
        fetch_friends();
    }

    initializeConnection();
    console.log("WebSocket connection opened with server 8002");

};

function sendChatMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    if (!selectedFriendId) {
        alert('Select a friend to chat with.');
        return;
    }
    const messageObject = {
        type: 'message',
        id: currentUser.id,
        message: text,
        user: currentUser.username,
        to: selectedFriendId,
    };
    ws.send(JSON.stringify(messageObject));
    messageInput.value = '';
}

sendButton.addEventListener('click', sendChatMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendChatMessage();
    }
});

ws.onclose = () => { 
    console.log("WebSocket connection closed");
    statusDiv.innerHTML = "Offline";
    statusIndicator.style.backgroundColor = "grey";
};

ws.onerror = () => {
    console.log("WebSocket error occurred");
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'history') {
        messagesUl.innerHTML = '';
        data.payload.forEach(msg => {
            displayMessage(msg);
        });
    } else if (data.type === 'newMessage') {
        const m = data.payload;
        if (!selectedFriendId || (m.from !== currentUser.id && m.to !== currentUser.id)) return;
        if ((m.from === currentUser.id && m.to === selectedFriendId) || (m.from === selectedFriendId && m.to === currentUser.id)) {
            displayMessage(m);
        }
    } else if (data.type === 'count') {
        number_online.innerHTML = data.payload.count;
    }
};

function displayMessage(msg) {
    const listItem = document.createElement('li');
    listItem.classList.add('message');
    const isSent = msg.from === currentUser?.id;
    listItem.classList.add(isSent ? 'sent' : 'received');

    const messageTime = new Date(msg.time).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    listItem.innerHTML = `
        <span class="message-sender">${isSent ? 'You' : msg.user}</span>
        <span class="message-content">${msg.message}</span>
        <span class="message-time">${messageTime}</span>
    `;
    messagesUl.appendChild(listItem);
    messagesUl.scrollTop = messagesUl.scrollHeight;
}

async function get_ip() {
    let data_user ;
    try{
        data_user  = await fetch("http://localhost:8080/api/users/get/me",{
            method:"GET",
            credentials :"include"
        })
        return await data_user.json()
    }
    catch(err){
        console.log("error fetch data user")
    }
}

async function fetch_friends() {
    if (!friendsUl) return;
    try {
        const response = await fetch("http://localhost:8080/api/friends/", {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) {
            console.log("Failed to fetch friends");
            return;
        }
        const friends = await response.json();
        renderFriends(friends);
    } catch (err) {
        console.log("error fetch friends");
    }
}

function renderFriends(friends) {
    friendsUl.innerHTML = "";
    if (!Array.isArray(friends)) return;
    friends.forEach(friend => {
        const li = document.createElement('li');
        li.className = 'friend-item';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'friend-name';
        nameSpan.textContent = friend.username || 'Unknown';
        li.appendChild(nameSpan);
        li.addEventListener('click', () => {
            selectedFriendId = friend.id;
            Array.from(friendsUl.children).forEach(el => el.classList.remove('selected'));
            li.classList.add('selected');
            welcomeMessage.style.display = 'none';
            chatArea.style.display = 'flex';
            
            messagesUl.innerHTML = '';
            if (currentUser && selectedFriendId) {
                ws.send(JSON.stringify({ type: 'selectFriend', id: currentUser.id, to: selectedFriendId }));
            }
        });
        friendsUl.appendChild(li);
    });
}