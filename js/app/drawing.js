// drawing.js (ES Module)

export function initDrawing(options = {}) {
  const {
    canvasId = "canvas",
    destroyBtnId = "destroy-btn",
    fillBtnId = "eraser-btn",   // fill
    textBtnId = "text-btn",
    strokeBtnId = "mode-btn",   // stroke
    eraserBtnId = "undo-btn",   // eraser
    saveBtnId = "save",
    fileInputId = "file",
    lineWidthId = "line-width",
    colorId = "color",
    colorOptionClass = "color-option",
    canvasFrameSelector = ".canvasFrame",
    previewSelector = ".rightColorPreview",
  } = options;

  const destroyBtn = document.getElementById(destroyBtnId);
  const fillBtn = document.getElementById(fillBtnId);
  const textBtn = document.getElementById(textBtnId);
  const strokeBtn = document.getElementById(strokeBtnId);
  const eraserBtn = document.getElementById(eraserBtnId);
  const saveBtn = document.getElementById(saveBtnId);

  const fileInput = document.getElementById(fileInputId);
  const lineWidth = document.getElementById(lineWidthId);
  const color = document.getElementById(colorId);
  const canvas = document.getElementById(canvasId);

  if (!canvas) throw new Error(`[drawing] canvas #${canvasId} not found`);
  const ctx = canvas.getContext("2d");

  const colorOptions = Array.from(document.getElementsByClassName(colorOptionClass));

  let isPainting = false;
  let currentText = "";

  let tool = "stroke";

  function setActive(btn) {
    [strokeBtn, fillBtn, textBtn, eraserBtn].forEach((b) => b && b.classList.remove("toolBtn--active"));
    btn && btn.classList.add("toolBtn--active");
  }

  function syncColorPreview(value) {
    const preview = document.querySelector(previewSelector);
    if (preview) preview.style.background = value;
  }

  // 도구 스타일 적용
  function applyToolStyle() {
    const dpr = window.devicePixelRatio || 1;
    ctx.lineWidth = parseFloat(lineWidth?.value ?? "5") * dpr;

    if (tool === "eraser") {
      ctx.strokeStyle = "white";
      ctx.fillStyle = "white";
      return;
    }

    const v = color?.value ?? "#000000";
    ctx.strokeStyle = v;
    ctx.fillStyle = v;
  }

  function setupCanvas(preserve = true) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    let snapshot = null;
    if (preserve && canvas.width > 0 && canvas.height > 0) {
      snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      snapshot.getContext("2d").drawImage(canvas, 0, 0);
    }

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = parseFloat(lineWidth?.value ?? "5") * dpr;

    // 배경 흰색
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 복원
    if (snapshot) {
      ctx.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, canvas.width, canvas.height);
    }

    applyToolStyle();
    if (color) syncColorPreview(color.value);
  }

  setupCanvas(false);
  requestAnimationFrame(() => setupCanvas(false));

  const frame = document.querySelector(canvasFrameSelector);
  if (frame) {
    const ro = new ResizeObserver(() => setupCanvas(true));
    ro.observe(frame);
  }
  window.addEventListener("resize", () => setupCanvas(true));

  function getCanvasPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  }

  // ====== 드로잉 ======
  function onMove(event) {
    if (tool !== "stroke" && tool !== "eraser") return;

    const { x, y } = getCanvasPos(event);

    if (!isPainting) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function startPainting() {
    if (tool === "text") return;
    if (tool === "fill") return;
    isPainting = true;
  }

  function cancelPainting() {
    isPainting = false;
  }

  function onCanvasClick(event) {
    const { x, y } = getCanvasPos(event);

    if (tool === "text") {
      const text = (currentText || "").trim();
      if (!text) return;

      ctx.save();
      ctx.lineWidth = 1;
      ctx.fillStyle = color?.value ?? "#000000";
      ctx.font = "42px serif";
      ctx.fillText(text, x, y);
      ctx.restore();
      return;
    }

    if (tool === "fill") {
      ctx.save();
      ctx.fillStyle = color?.value ?? "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function onLineWidthChange(event) {
    const dpr = window.devicePixelRatio || 1;
    ctx.lineWidth = parseFloat(event.target.value) * dpr;
  }

  function onColorChange(event) {
    const v = event.target.value;
    syncColorPreview(v);

    if (tool !== "eraser") {
      ctx.strokeStyle = v;
      ctx.fillStyle = v;
    }
  }

  function onColorClick(event) {
    const selected = event.target.dataset.color;
    if (!selected) return;

    if (color) color.value = selected;
    syncColorPreview(selected);

    if (tool !== "eraser") {
      ctx.strokeStyle = selected;
      ctx.fillStyle = selected;
    }
  }

  // stroke
  function onStrokeClick() {
    tool = "stroke";
    applyToolStyle();
    setActive(strokeBtn);
  }

  // fill
  function onFillClick() {
    tool = "fill";
    applyToolStyle();
    setActive(fillBtn);
  }

  // eraser
  function onEraserClick() {
    tool = "eraser";
    applyToolStyle();
    setActive(eraserBtn);
  }

  // text
  function onTextClick() {
    tool = "text";
    applyToolStyle();
    setActive(textBtn);

    const t = prompt("캔버스에 찍을 텍스트를 입력해");
    currentText = t || "";

    if (!currentText.trim()) {
      tool = "stroke";
      applyToolStyle();
      setActive(strokeBtn);
    }
  }

  // Reset
  function onDestroyBtn() {
    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.beginPath();
    applyToolStyle();
  }

  // Add Photo
  function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;

    image.onload = () => {
      const cw = canvas.width;
      const ch = canvas.height;

      const iw = image.width;
      const ih = image.height;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;

      const dx = (cw - nw) / 2;
      const dy = (ch - nh) / 2;

      ctx.drawImage(image, dx, dy, nw, nh);
      ctx.beginPath();

      if (fileInput) fileInput.value = "";
      URL.revokeObjectURL(url);
    };
  }

  // Save
  function onSaveClick() {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "그림판.png";
    a.click();
  }

  // ====== 이벤트 바인딩 ======
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mousedown", startPainting);
  canvas.addEventListener("mouseup", cancelPainting);
  canvas.addEventListener("mouseleave", cancelPainting);
  canvas.addEventListener("click", onCanvasClick);

  lineWidth?.addEventListener("change", onLineWidthChange);
  color?.addEventListener("change", onColorChange);
  colorOptions.forEach((c) => c.addEventListener("click", onColorClick));

  strokeBtn?.addEventListener("click", onStrokeClick);
  fillBtn?.addEventListener("click", onFillClick);
  textBtn?.addEventListener("click", onTextClick);
  eraserBtn?.addEventListener("click", onEraserClick);

  destroyBtn?.addEventListener("click", onDestroyBtn);
  fileInput?.addEventListener("change", onFileChange);
  saveBtn?.addEventListener("click", onSaveClick);

  // 초기 상태
  setActive(strokeBtn);
  applyToolStyle();
  if (color) syncColorPreview(color.value);

  return {
    get tool() {
      return tool;
    },
    setTool(next) {
      if (!["stroke", "fill", "eraser", "text"].includes(next)) return;
      tool = next;
      applyToolStyle();
      if (next === "stroke") setActive(strokeBtn);
      if (next === "fill") setActive(fillBtn);
      if (next === "eraser") setActive(eraserBtn);
      if (next === "text") setActive(textBtn);
    },
    setColor(hex) {
      if (!hex) return;
      if (color) color.value = hex;
      syncColorPreview(hex);
      if (tool !== "eraser") {
        ctx.strokeStyle = hex;
        ctx.fillStyle = hex;
      }
    },
    reset: onDestroyBtn,
    save: onSaveClick,
    resize: (preserve = true) => setupCanvas(preserve),
  };
}

function autoBoot() {
  // initDrawing이 여러 번 실행되는 사고 방지
  if (window.__drawing_inited__) return;
  window.__drawing_inited__ = true;

  try {
    initDrawing();
  } catch (e) {
    console.error(e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoBoot, { once: true });
} else {
  autoBoot();
}