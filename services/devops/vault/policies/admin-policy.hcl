
# ===== ADMIN POLICY (admin-policy.hcl) =====
# Full access for administrators
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}