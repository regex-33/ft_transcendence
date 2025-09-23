```
{
  "timestamp": "2024-01-15T14:30:45.123Z",
  "level": "INFO",
  "message": "Hey everyone! Ready for the tournament?",
  "service": "chat-service",
  "request_id": "req_8a7b9c1d-2e3f-4g5h-6i7j-8k9l0m1n2o3p",
  "user_id": "user_1234",
  "username": "alice_42",
  "session_id": "sess_abc12345",
  "action": "send_message",
  "success": true,
  "message_id": "msg_4q5r6s7t-8u9v-0w1x-2y3z-4a5b6c7d8e9f",
  "channel_id": "tournament",
  "to_username": "lobby-1",
  "event_type": "message_sent",
  "request": {
    "method": "POST",
    "url": "/api/v1/chat/messages",
    "ip": "192.168.1.142",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "response": {
    "status": 201,
    "time": 0.234,
    "duration": 45.67
  }
}

{
  "timestamp": "2024-01-15T14:31:12.456Z",
  "level": "INFO",
  "message": "Good game! That was intense!",
  "service": "chat-service",
  "request_id": "req_9b8c7d6e-5f4g-3h2i-1j0k-9l8m7n6o5p4q",
  "user_id": "user_5678",
  "username": "bob_gamer",
  "session_id": "sess_def67890",
  "action": "send_message",
  "success": true,
  "message_id": "msg_3r2s1t0u-9v8w-7x6y-5z4a-3b2c1d0e9f8g",
  "channel_id": "game-lobby",
  "to_username": "game-room-1",
  "event_type": "message_sent",
  "request": {
    "method": "POST",
    "url": "/api/v1/chat/messages",
    "ip": "192.168.1.203",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  },
  "response": {
    "status": 200,
    "time": 0.156,
    "duration": 32.18
  }
}

{
  "timestamp": "2024-01-15T14:31:45.789Z",
  "level": "ERROR",
  "message": "Rate limit exceeded",
  "service": "chat-service",
  "request_id": "req_7c6d5e4f-3g2h-1i0j-9k8l-7m6n5o4p3q2r",
  "user_id": "user_9012",
  "username": "charlie_dev",
  "session_id": "sess_ghi12345",
  "action": "send_message",
  "success": false,
  "message_id": "msg_1s0t9u8v-7w6x-5y4z-3a2b-1c0d9e8f7g6h",
  "channel_id": "general",
  "to_username": "lobby-2",
  "event_type": "message_failed",
  "request": {
    "method": "POST",
    "url": "/api/v1/chat/messages",
    "ip": "192.168.1.167",
    "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
  },
  "response": {
    "status": 429,
    "time": 0.089,
    "duration": 12.34
  },
  "error": "Rate limit exceeded",
  "error_reason": "Too many requests",
  "error_code": "RATE_LIMITED"
}

{
  "timestamp": "2024-01-15T14:32:18.012Z",
  "level": "INFO",
  "message": "Anyone up for a quick match?",
  "service": "chat-service",
  "request_id": "req_5d4e3f2g-1h0i-9j8k-7l6m-5n4o3p2q1r0s",
  "user_id": "user_3456",
  "username": "diana_pro",
  "session_id": "sess_jkl67890",
  "action": "send_message",
  "success": true,
  "message_id": "msg_9t8u7v6w-5x4y-3z2a-1b0c-9d8e7f6g5h4i",
  "channel_id": "game-lobby",
  "to_username": "waiting-room",
  "event_type": "message_sent",
  "request": {
    "method": "POST",
    "url": "/api/v1/chat/messages",
    "ip": "192.168.1.189",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "response": {
    "status": 200,
    "time": 0.298,
    "duration": 67.89
  }
}

{
  "timestamp": "2024-01-15T14:32:56.345Z",
  "level": "INFO",
  "message": "user_7890 joined the channel",
  "service": "chat-service",
  "request_id": "req_3e2f1g0h-9i8j-7k6l-5m4n-3o2p1q0r9s8t",
  "user_id": "user_7890",
  "username": "eve_ninja",
  "session_id": "sess_mno34567",
  "action": "join_channel",
  "success": true,
  "message_id": "msg_7u6v5w4x-3y2z-1a0b-9c8d-7e6f5g4h3i2j",
  "channel_id": "tournament",
  "to_username": "tournament-room-1",
  "event_type": "user_joined",
  "request": {
    "method":
```
