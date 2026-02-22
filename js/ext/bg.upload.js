export function initBgUpload() {
  const BG_CUSTOM_KEY = "momentum:customBg:dataurl:v1";
  const BG_CUSTOM_NAME_KEY = "momentum:customBg:name:v1";

  const appBg = document.querySelector(".appBg");
  const bgInput = document.getElementById("bgInput");

  const btnPick = document.getElementById("bg-download");
  const btnReset = document.getElementById("bg-refresh");

  const fileName1 = document.getElementById("bg-filename");
  const fileName2 = document.getElementById("bg-filename-2");

  if (!appBg || !bgInput || !btnPick || !btnReset) {
    return;
  }

  const bgPreview = document.querySelector(".bgPreview");

  function applyPreview(dataUrl) {
    if (!bgPreview) return;
    bgPreview.style.backgroundImage =
      `linear-gradient(0deg, rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url("${dataUrl}")`;
    bgPreview.style.backgroundSize = "cover";
    bgPreview.style.backgroundPosition = "center";
  }

  function setBgFileName(name) {
    if (fileName1) fileName1.textContent = name;
    if (fileName2) fileName2.textContent = name;
  }

  function applyCustomBg(dataUrl) {
    appBg.style.backgroundImage =
      `linear-gradient(0deg, rgba(0,0,0,0.18), rgba(0,0,0,0.18)), url("${dataUrl}")`;
    appBg.style.backgroundSize = "cover";
    appBg.style.backgroundPosition = "center";
    applyPreview(dataUrl);
  }

  function clearCustomBg() {
    appBg.style.backgroundImage = "";
    appBg.style.backgroundSize = "";
    appBg.style.backgroundPosition = "";

    localStorage.removeItem(BG_CUSTOM_KEY);
    localStorage.removeItem(BG_CUSTOM_NAME_KEY);

    setBgFileName("random-background.jpg");

    // 기본 배경 다시 적용하라고 신호
    window.dispatchEvent(new CustomEvent("bg:resetToDefault"));

    if (bgPreview) bgPreview.style.backgroundImage = "";
  }

  async function toBgDataURL(img, max = 1920, mime = "image/jpeg", quality = 0.86) {
    const ratio = img.width / img.height;
    let w = img.width;
    let h = img.height;

    if (w > h && w > max) { w = max; h = Math.round(w / ratio); }
    if (h >= w && h > max) { h = max; w = Math.round(h * ratio); }

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL(mime, quality);
  }

  function restoreCustomBgIfExists() {
    const saved = localStorage.getItem(BG_CUSTOM_KEY);
    const savedName = localStorage.getItem(BG_CUSTOM_NAME_KEY);

    if (saved) applyCustomBg(saved);
    if (savedName) setBgFileName(savedName);
  }

  btnPick.addEventListener("click", () => {
    bgInput.click();
  });

  bgInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = async () => {
      try {
        const dataURL = await toBgDataURL(img);
        applyCustomBg(dataURL);

        localStorage.setItem(BG_CUSTOM_KEY, dataURL);
        localStorage.setItem(BG_CUSTOM_NAME_KEY, file.name);

        setBgFileName(file.name);
      } finally {
        URL.revokeObjectURL(url);
        bgInput.value = "";
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      bgInput.value = "";
    };
  });

  // 리셋 버튼
  btnReset.addEventListener("click", () => {
    clearCustomBg();
  });

  restoreCustomBgIfExists();
}