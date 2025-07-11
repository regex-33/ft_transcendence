export function showLogin() {
  document.getElementById("login-form")?.classList.remove("hidden");
  document.getElementById("signup-form")?.classList.add("hidden");
}

export function showSignup() {
  document.getElementById("signup-form")?.classList.remove("hidden");
  document.getElementById("login-form")?.classList.add("hidden");
}

