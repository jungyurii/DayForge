export function initAuthGateAndHeader() {
  const USERNAME_KEY = "username";
  const greetingEl = document.getElementById("greeting");
  const authLink = document.getElementById("authLink");

  const username = localStorage.getItem(USERNAME_KEY);

  // 로그인 안 했으면 로그인 페이지로
  if (!username) {
    window.location.replace("./login.html");
    return;
  }

  // greeting
  if (greetingEl) {
    greetingEl.textContent = `Welcome, ${username}!`;
  }

  // Login/Logout 토글
  if (!authLink) return;

  const isLoggedIn = !!username;

  if (isLoggedIn) {
    authLink.textContent = "Logout";
    authLink.href = "#";

    authLink.addEventListener("click", (e) => {
      e.preventDefault();

      // 로그아웃 처리
      localStorage.removeItem("username");
      localStorage.removeItem("loggedIn");

      window.location.href = "./login.html";
    });
  } else {
    authLink.textContent = "Login";
    authLink.href = "./login.html";
  }
}