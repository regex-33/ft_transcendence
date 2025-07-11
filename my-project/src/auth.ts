// auth.ts
export function showLogin() {
  document.getElementById("login-form")?.classList.remove("hidden");
  document.getElementById("register-form")?.classList.add("hidden");
}

export function showRegister() {
  document.getElementById("login-form")?.classList.add("hidden");
  document.getElementById("register-form")?.classList.remove("hidden");
}
