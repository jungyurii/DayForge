const USERNAME_KEY = "username";

const loginForm = document.getElementById("login-form");
const loginInput = document.getElementById("login-name");

// 폼/인풋 없으면 그냥 종료
if (!loginForm || !loginInput) {
} else {
  // 폼 보여주기
  loginForm.classList.remove("hidden");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = loginInput.value.trim();
    if (!username) return;

    localStorage.setItem(USERNAME_KEY, username);

    // 로그인 성공 → 메인으로 이동
    window.location.replace("./index.html");
  });
}