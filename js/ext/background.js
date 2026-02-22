export function initDefaultBackground() {
  const BG_CUSTOM_KEY = "momentum:customBg:dataurl:v1";

  const appBg = document.querySelector(".appBg");
  if (!appBg) return;

  function applyDefaultBg() {
    appBg.style.background =
      "radial-gradient(1200px 600px at 50% 10%, rgba(255,255,255,0.55), rgba(255,255,255,0.10) 60%, rgba(0,0,0,0) 100%)";
    appBg.style.backgroundSize = "cover";
    appBg.style.backgroundPosition = "center";
  }

  function hasCustomBg() {
    return !!localStorage.getItem(BG_CUSTOM_KEY);
  }

  // 커스텀 배경이 없으면 기본 배경 적용
  if (!hasCustomBg()) {
    applyDefaultBg();
  }

  window.addEventListener("bg:resetToDefault", () => {
    applyDefaultBg();
  });
}