
# ===== OAUTH TEMPLATE (services/devops/vault/templates/oauth.tpl) =====
{{ with secret "secret/app/oauth/github" }}
GITHUB_CLIENT_ID={{ .Data.data.client_id }}
GITHUB_CLIENT_SECRET={{ .Data.data.client_secret }}
GITHUB_CALLBACK_URL={{ .Data.data.callback_url }}
{{ end }}

{{ with secret "secret/app/oauth/intra" }}
INTRA_CLIENT_ID={{ .Data.data.client_id }}
INTRA_CLIENT_SECRET={{ .Data.data.client_secret }}
INTRA_CALLBACK_URL={{ .Data.data.callback_url }}
{{ end }}

{{ with secret "secret/app/oauth/google" }}
GOOGLE_CLIENT_ID={{ .Data.data.client_id }}
GOOGLE_CLIENT_SECRET={{ .Data.data.client_secret }}
GOOGLE_CALLBACK_URL={{ .Data.data.callback_url }}
{{ end }}

{{ with secret "secret/app/email" }}
GMAIL_APP_EMAIL={{ .Data.data.email }}
GMAIL_APP_PASSWORD={{ .Data.data.password }}
{{ end }}