```bash
/var/log/ft-transcendence/
                ├── auth-service/
                │   ├── auth.log
                │   ├── auth-access.log
                │   ├── auth-error.log
                │   ├── auth-vlog
                │   └── security-events.log
                ├── api-gateway/
                │   ├── access.log
                │   ├── error.log
                │   └── gateway.log
                ├── chat-service/
                │   ├── chat.log
                │   ├── chat-error.log
                │   └── messages/
                │       ├── messages.log
                │       └── messages-archive.log
                ├── game-service/
                │   ├── game.log
                │   ├── game-error.log
                │   └── events/
                │       ├── game-events.log
                │       └── match-events.log
                ├── user-service/
                │   ├── file.log --> see Gen-Logs-file-service.py
                │   └── file-error.log  --> Gen-Logs-file-service.py
                │   ├── user.log
                │   ├── user-access.log
                │   └── user-error.log
                ├── tournament-service/
                │   ├── tournament.log
                │   └── tournament-error.log
                ├── notification-service/
                │   ├── notification.log
                │   └── notification-error.log
                ├── match-service/
                │   ├── match.log
                │   └── match-error.log
                ├── security/
                │   ├── security.log
                │   ├── failed-logins.log
                │   └── suspicious-activity.log
```
