#!/bin/bash

# Base log directory
BASE_DIR="/var/log/ft-transcendence"

# Create directories
mkdir -p $BASE_DIR/api-gateway
mkdir -p $BASE_DIR/chat-service/messages
mkdir -p $BASE_DIR/game-service/events
mkdir -p $BASE_DIR/user-service
mkdir -p $BASE_DIR/tournament-service
mkdir -p $BASE_DIR/notification-service
mkdir -p $BASE_DIR/security


# Create files for chat-service
touch $BASE_DIR/chat-service/chat.log
touch $BASE_DIR/chat-service/chat-error.log
touch $BASE_DIR/chat-service/messages/messages.log
touch $BASE_DIR/chat-service/messages/messages-archive.log

# Create files for game-service
touch $BASE_DIR/game-service/game.log
touch $BASE_DIR/game-service/game-error.log
touch $BASE_DIR/game-service/game-service.log
touch $BASE_DIR/game-service/events/game-events.log
touch $BASE_DIR/game-service/events/match-events.log


# Create files for user-service
touch $BASE_DIR/user-service/file.log
touch $BASE_DIR/user-service/file-service.log
touch $BASE_DIR/user-service/user-service.log
touch $BASE_DIR/user-service/user-access.log
touch $BASE_DIR/user-service/user-error.log

# Create files for tournament-service
touch $BASE_DIR/tournament-service/tournament.log
touch $BASE_DIR/tournament-service/tournament-error.log

# Create files for notification-service
touch $BASE_DIR/notification-service/notification.log
touch $BASE_DIR/notification-service/notification-error.log

# Create files for security
touch $BASE_DIR/security/security.log
touch $BASE_DIR/security/failed-logins.log
touch $BASE_DIR/security/suspicious-activity.log

echo "Log directory structure and files created successfully."