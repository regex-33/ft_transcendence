#!/usr/bin/env bash
export VAULT_ADDR="http://127.0.0.1:8200"
vtree() {
    local path="${1:-secret/}"
    echo "Vault secrets tree for $path:"
    vault kv list -format=json "$path" 2>/dev/null | jq -r '.[]' | while read -r item; do
        if [[ "$item" == */ ]]; then
            echo "📁 $item"
            vtree "$path$item" | sed 's/^/  /'
        else
            echo "🔑 $item"
            # Show values
            vault kv get -format=json "$path$item" 2>/dev/null | jq -r '.data.data | to_entries[] | "    \(.key): \(.value)"'
        fi
    done
}

echo "==========================================================="
vtree
echo "==========================================================="

