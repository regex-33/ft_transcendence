
## Run

```sh
sudo make
```

# Endpoints

## Users

These routes manage user accounts and all begin with `/api/users/...`

| Method                 | Endpoint                    | Content-Type        | Body Fields or Params                  | Need Token |
| ---------------------- | --------------------------- | ------------------- | -------------------------------------- | :--------: |
| [POST](#post-register) | [/register](#post-register) | application/json    | username, password, email              |     No     |
| [POST](#post-login)    | [/login](#post-login)       | application/json    | username, password                     |     No     |
| [PUT](#put-update)     | [/update](#put-update)      | form-data/multipart | Any fields you want to update          |    Yes     |
| [GET](#get-username)   | [/:username](#get-username) | -                   | username param                         |    Yes     |
| [GET](#get-id-id)      | [/id/:id](#get-id-id)       | -                   | id param                               |    Yes     |
| [GET](#get-users)      | [/](#get-users)             | -                   | -                                      |    Yes     |
| [POST](#post-logout)   | [/logout](#post-logout)     | -                   | -                                      |    Yes     |
| [GET](#get-online)     | [/online](#get-online)      | -                   | username as param if not the same user |    Yes     |
| [PUT](#put-online)     | [/online](#put-online)      | application/json    | online (bool: is online or is not)     |    Yes     |

---

## Friends

All routes require a token. These routes manage friends and begin with `/api/friends/...`

| Method                       | Endpoint                         | Content-Type     | Body Fields or Params | Need Token |
| ---------------------------- | -------------------------------- | ---------------- | --------------------- | :--------: |
| [POST](#post-add-friend)     | [/add](#post-add-friend)         | application/json | username              |    Yes     |
| [POST](#post-actions-friend) | [/actions](#post-actions-friend) | application/json | username              |    Yes     |
| [GET](#get-friends)          | [/](#get-friends)                | -                | -                     |    Yes     |

---

## OAuth

No routes require a token. These routes provide OAuth registration via other applications (Google, Intra, GitHub) and begin with `/api/Oauth/...`

| Method                   | Endpoint                     | Content-Type | Body Fields or Params |
| ------------------------ | ---------------------------- | ------------ | --------------------- |
| [GET](#get-oauth-github) | [/github](#get-oauth-github) | -            | -                     |
| [GET](#get-oauth-intra)  | [/intra](#get-oauth-intra)   | -            | -                     |
| [GET](#get-oauth-google) | [/google](#get-oauth-google) | -            | -                     |

---

## Check Code

These routes handle sending and verifying codes, and begin with `/api/...`

| Method                  | Endpoint                      | Content-Type     | Body Fields or Params | Need Token |
| ----------------------- | ----------------------------- | ---------------- | --------------------- | :--------: |
| [POST](#post-sendcode)  | [/sendcode](#post-sendcode)   | application/json | email                 |     No     |
| [POST](#post-checkcode) | [/checkcode](#post-checkcode) | application/json | email, code           |     No     |

---

## 2FA

These routes provide 2FA and begin with `/api/2fa/...`

| Method                   | Endpoint                       | Content-Type     | Body Fields or Params        | Need Token |
| ------------------------ | ------------------------------ | ---------------- | ---------------------------- | :--------: |
| [GET](#get-2fa-generate) | [/generate](#get-2fa-generate) | -                | -                            |     No     |
| [POST](#post-2fa-verify) | [/verify](#post-2fa-verify)    | application/json | username, code (named token) |     No     |
| [POST](#post-2fa-disable)| [/disable](#post-2fa-disable)  | -                | -                            |    Yes     |

---

## Checks

| Method | Endpoint                        | Content-Type | Body Fields or Params | Need Token |
| ------ | ------------------------------- | ------------ | --------------------- | :--------: |
| GET    | [/token](#get-check-token)      | -            | -                     |    Yes     |

# Route Explanations




### Users

#### <a name="post-register"></a>POST /register
Registers a new user with username, password, email, image, and name.
and return token jwt

#### <a name="post-login"></a>POST /login
Authenticates a user with username and password.
and return token jwt

#### <a name="put-update"></a>PUT /update
Updates user fields; requires authentication.

#### <a name="get-username"></a>GET /:username
Fetches user info by username; requires authentication.
return { id ,username,email,image,name,bio}

#### <a name="get-id-id"></a>GET /id/:id
Fetches user info by user ID; requires authentication.
return { id ,username,email,image,name,bio}

#### <a name="get-users"></a>GET /
Lists all users; requires authentication.
return like array of getById

### <a name="post-logout"></a> POST /logout
Logout by deleting cookies


#### <a name="get-online"></a>GET /online
Checks if a user is online by username; requires authentication.
Returns online status as a boolean.

#### <a name="put-online"></a>PUT /online
Sets the online status for the authenticated user; requires authentication.
Accepts `online` (boolean) in the request body.
---

### Friends

#### <a name="post-add-friend"></a>POST /add
Adds a friend by username; requires authentication.


#### <a name="post-actions-friend"></a>POST /actions
Performs friend-related actions by username; requires authentication.

#### <a name="get-friends"></a>GET /
Lists all friends; requires authentication.

---

### OAuth you can't get the token yet , i need frontend routing be ready first
 
#### <a name="get-oauth-github"></a>GET /github
Initiates OAuth registration via GitHub.

#### <a name="get-oauth-intra"></a>GET /intra
Initiates OAuth registration via Intra.

#### <a name="get-oauth-google"></a>GET /google
Initiates OAuth registration via Google.

---

### Check Code

#### <a name="post-sendcode"></a>POST /sendcode
Sends a verification code to the provided email.

#### <a name="post-checkcode"></a>POST /checkcode
Verifies the code sent to the provided email.
return token

---

### 2FA

#### <a name="get-2fa-generate"></a>GET /generate
Generates a 2FA qrcode.

#### <a name="post-2fa-verify"></a>POST /verify
Verifies a 2FA code for the user.
return token

#### <a name="post-2fa-disable"></a>POST /disable
disable 2fa

### Checks
#### <a name="get-check-token"></a>GET /token
Checks if the token exists and is valid.
