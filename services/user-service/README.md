
disable 2fa
## User Service README (Updated)

This document reflects the CURRENT implemented routes in `services/user-service` (generated from the actual router files). Removed endpoints that were previously documented but not implemented in code.

## Run

```sh
sudo make
```

The service listens (by default) on: `PORT=8001` `HOST=0.0.0.0`.

Authentication uses JWT stored in cookies: `token` (JWT) and `session_id` (session identifier). Most protected routes require these cookies to be present and valid.

---
## Users (`/api/users`)

| Method | Endpoint | Auth | Body / Params | Description |
| ------ | -------- | :--: | ------------- | ----------- |
| POST | /register | No | { username, password, email, avatar? } | Register user, sets auth cookies & redirects `HOME_PAGE`. |
| POST | /login | No | { username, password, code? } | Login (if 2FA active, `code` required). Sets cookies & redirects. |
| GET  | /logout | Yes | - | Destroys session & clears cookies. |
| PUT  | /update | Yes | multipart/form-data (any of username,email,location,bio,birthday,avatar) | Bulk update; individual field handlers invoked. |
| PUT  | /update/password | Yes | { password } | Direct password replacement (legacy path). |
| GET  | /:username | Yes | username param | Get public profile + relationship status. |
| GET  | /id/:id | Yes | id param | Get user by id. |
| GET  | / | Yes | - | List other users (filters blocked / self). |
| GET  | /get/me | Yes | - | Get authenticated user profile. |
| GET  | /online/:username | Yes | username param | Check if user currently online. |
| PUT  | /online | Yes | { isOnline:boolean } | Set current user's presence. |
| GET  | /online-tracker (websocket) | Yes | WS upgrade | Realtime online tracking stream. |

Returned user objects include: `{ id, username, email, avatar, bio, online, location, birthday, status? }` (status present when relationship exists).

---
## Friends (`/api/friends`)

All require auth.

| Method | Endpoint | Body | Description |
| ------ | -------- | ---- | ----------- |
| POST | /add | { username } | Send friend request. |
| POST | /actions | { username, action } | Perform action: accept / cancel / block / unblock. |
| GET  | /friends | - | List accepted friends. |
| GET  | /pending-friends | - | Requests received (waiting your decision). |
| GET  | /requested-friends | - | Requests you sent. |
| GET  | /blocked-users | - | Users you blocked. |
| GET  | /rel/:id | id param | Relationship (friend / blocked / pending / request / null). |

`action` values: `accept | cancel | block | unblock`.

---
## OAuth (`/api/oauth`)

Currently only starts third‑party flows (no immediate token return until frontend completes flow handling).

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | /github | Redirect to GitHub OAuth. |
| GET | /github/callback | GitHub callback handler. |
| GET | /intra | Redirect to Intra OAuth. |
| GET | /intra/callback | Intra callback handler. |
| GET | /google | Redirect to Google OAuth. |
| GET | /google/callback | Google callback handler. |

All are public (no prior auth needed).

---
## Email Code / Password Reset (`/api`)

| Method | Endpoint | Auth | Body | Description |
| ------ | -------- | :--: | ---- | ----------- |
| POST | /sendcode | No | { email } | Send 6‑digit reset code to email. |
| POST | /checkcode | No | { email, code } | Verify code, sets auth cookies, redirects `HOME_PAGE`. |

Notes: After successful `/checkcode`, the reset code record is destroyed.

---
## Two-Factor Authentication (`/api/2fa`)

All endpoints REQUIRE auth (JWT cookie). (Previous README incorrectly stated some were public or used `/verify`).

| Method | Endpoint | Body | Description |
| ------ | -------- | ---- | ----------- |
| GET | /generate | - | Create (or refresh inactive) secret & return `{ qrCodeUrl, secret }`. Fails if already active. |
| POST | /active2fa | { code } | Verify TOTP `code` and mark 2FA active. |
| POST | /disable | - | Remove 2FA (record deleted). |

Client must submit TOTP code from authenticator after scanning QR to activate.

---
## Notifications (`/api/notifications`)

Auth required.

| Method | Endpoint | Body | Description |
| ------ | -------- | ---- | ----------- |
| POST | /create | { userId:number, type:string, gameId:string } | Create notification (types: MATCH_NOTIFICATION, MESSAGE, FRIEND_REQUEST). |
| GET  | / | (query: readed?) | Fetch notifications, auto-marks unread as read. Includes notifier `user` object. |
| DELETE | /:gameId | gameId as a params | Delete a notification by gameId (only if user is involved). |

Returned fields: `userId, type, notifierId, readed, createdAt, user { id, username, avatar }`.

---
## Auth (Sessions & Password) (`/api/auth`)

| Method | Endpoint | Body | Description |
| ------ | -------- | ---- | ----------- |
| GET | /sessions | - | List active sessions ordered by last activity. |
| DELETE | /sessions/:sessionId | - | Terminate a specific session (cannot terminate current). |
| DELETE | /sessions | - | Terminate all OTHER sessions (keeps current). |
| POST | /change-password | { currentPassword, newPassword } | Change password after verifying current password. |

NOT IMPLEMENTED (but were previously mentioned in comments): `validate-password`, `forgot-password`, `reset-password` — therefore NOT documented here.

Session objects returned: `{ sessionId, lastActive, isActive }`.

---
## Token / Auth Check (`/api/check`)

| Method | Endpoint | Auth | Description |
| ------ | -------- | :--: | ----------- |
| GET | /token | Yes | Returns 200 if token valid (no body). |

---
## Data Models (Highlights)

Relevant Sequelize models used by these routes (not exhaustive): `User`, `Session`, `Relationship`, `TwoFA`, `Notification`, `ResetCode`.

TwoFA model fields: `{ userId:int, secret:string, isActive:boolean }`.

---
## 2FA Flow Summary
1. User logged in without active 2FA.
2. Client calls `GET /api/2fa/generate` → receives QR + secret.
3. User scans in authenticator app, generates code.
4. Client calls `POST /api/2fa/active2fa { code }`.
5. On future logins, backend expects `code` alongside username/password.
6. To disable: `POST /api/2fa/disable`.

---
## Environment Variables (Used in Code)
| Variable | Purpose |
| -------- | ------- |
| JWT_SECRET | JWT signing secret. |
| TIME_TOKEN_EXPIRATION | Expiration (e.g. 10h). |
| HOME_PAGE | Redirect target after auth success. |
| GMAIL_APP_EMAIL / GMAIL_APP_PASSWORD | Nodemailer credentials for email codes. |

Others may exist in broader project context (e.g. DB config). Ensure they are set before running.

