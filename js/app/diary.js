import {
  keys,
  loadDoodleDataURL, saveDoodleDataURL,
  loadPhotos, savePhotos,
  loadTexts, saveTexts,
  loadMonthMemo, saveMonthMemo,
  stripSavePhoto
} from "../shared/diary.storage.js";

import { createCanvasEngine } from "../shared/diary.canvas.js";
import { initDiaryColorPopover } from "../shared/diary-color-popover.js";

// ===== DOM =====
const gridEl = document.getElementById("grid");
const doodle = document.getElementById("doodle");
const sheetEl = document.getElementById("sheet");
const dowRowEl = document.getElementById("dowRow");

const monthNumEl = document.getElementById("monthNum");
const monthLabelEl = document.querySelector(".monthLabel");
const yearTagEl = document.getElementById("yearTag");

const leftMonthNumEl = document.getElementById("leftMonthNum");
const leftMonthLabelEl = document.getElementById("leftMonthLabel");
const leftYearEl = document.getElementById("leftYear");
const monthMemoEl = document.getElementById("monthMemo");

const tabs = Array.from(document.querySelectorAll(".tab"));

const toolPointer = document.getElementById("tool-pointer");
const toolPen = document.getElementById("tool-pen");
const toolHi = document.getElementById("tool-hi");
const toolErase = document.getElementById("tool-erase");
const toolClear = document.getElementById("tool-clear");
const toolText = document.getElementById("tool-text");
const toolPhoto = document.getElementById("tool-photo");
const photoInput = document.getElementById("photoInput");

const resetAllBtn = document.getElementById("resetAll");
const photoUi = document.getElementById("photoUi");

// palette
const toolPalette = document.getElementById("toolPalette");
const toolPaletteTitle = document.getElementById("toolPaletteTitle");
const toolPaletteRow = document.getElementById("toolPaletteRow");
const toolPaletteClose = document.getElementById("toolPaletteClose");

// ===== Config =====
const TEXT_FONT_FAMILY = "OngleIpSeaBreeze";
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function toISO(d){
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yy}-${mm}-${dd}`;
}

const TODAY = new Date();
const TODAY_ISO = toISO(TODAY);

let year = TODAY.getFullYear();
let month = TODAY.getMonth();

let activeTool = "pointer";

// palette state
const PALETTE = ["#cfe4ff", "#cfe9c7", "#f6e59a", "#f5c9c9", "#2d2d2d", "#ffffff"];
let penColor = "#2d2d2d";
let hiColor  = "#f6e59a";
let paletteMode = "pen";

initDiaryColorPopover({
  penBtn: toolPen,
  hiBtn: toolHi,
  pop: toolPalette,
  titleEl: toolPaletteTitle,
  rowEl: toolPaletteRow,

  getPenColor: () => penColor,
  getHiColor: () => hiColor,
  setPenColor: (hex) => { penColor = hex; renderAll(); },
  setHiColor: (hex) => { hiColor = hex; renderAll(); },

  openPopoverAt: (anchorBtn, mode) => openPalette(anchorBtn, mode),
  closePopover: () => closePalette(),
  isOpen: () => isPaletteOpen(),
});


// runtime
let doodleImg = null;

let photos = [];
let photoImgs = new Map();
let selectedPhotoId = null;

let texts = [];
let selectedTextId = null;

let textEditorEl = null;

// canvas engine
const canvas = createCanvasEngine({ doodle, TEXT_FONT_FAMILY });

function killTextEditor(){
  if(textEditorEl){
    textEditorEl.remove();
    textEditorEl = null;
  }
}
function hasTextEditor(){ return !!textEditorEl; }

function hitPhotoBody(ph, pt){
  const cx = ph.x + ph.w/2;
  const cy = ph.y + ph.h/2;
  const a = -(ph.rot || 0);

  const dx = pt.x - cx;
  const dy = pt.y - cy;

  const lx = dx * Math.cos(a) - dy * Math.sin(a) + ph.w/2;
  const ly = dx * Math.sin(a) + dy * Math.cos(a) + ph.h/2;

  return (lx >= 0 && lx <= ph.w && ly >= 0 && ly <= ph.h);
}

function hitTextBody(t, pt){
  const cx = t.x + t.w/2;
  const cy = t.y + t.h/2;
  const a = -(t.rot || 0);

  const dx = pt.x - cx;
  const dy = pt.y - cy;

  const lx = dx * Math.cos(a) - dy * Math.sin(a) + t.w/2;
  const ly = dx * Math.sin(a) + dy * Math.cos(a) + t.h/2;

  return (lx >= 0 && lx <= t.w && ly >= 0 && ly <= t.h);
}

function boundingBox(p){
  const cx = p.x + p.w/2;
  const cy = p.y + p.h/2;
  const a = p.rot || 0;

  const corners = [
    { x:p.x, y:p.y },
    { x:p.x+p.w, y:p.y },
    { x:p.x+p.w, y:p.y+p.h },
    { x:p.x, y:p.y+p.h }
  ].map(pt=>{
    const dx = pt.x - cx, dy = pt.y - cy;
    return {
      x: cx + dx*Math.cos(a) - dy*Math.sin(a),
      y: cy + dx*Math.sin(a) + dy*Math.cos(a)
    };
  });

  const xs = corners.map(c=>c.x);
  const ys = corners.map(c=>c.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  return { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
}

function mkBtn(x,y,text){
  const b = document.createElement("div");
  b.className = "photoUiBtn";
  b.style.left = `${x}px`;
  b.style.top = `${y}px`;
  b.textContent = text;
  return b;
}

function updateOverlayUi(){
  if(!photoUi) return;
  photoUi.innerHTML = "";

  const selP = photos.find(p => p.id === selectedPhotoId);
  if(selP){
    const box = boundingBox(selP);

    const frame = document.createElement("div");
    frame.style.position = "absolute";
    frame.style.left = `${box.x}px`;
    frame.style.top = `${box.y}px`;
    frame.style.width = `${box.w}px`;
    frame.style.height = `${box.h}px`;
    frame.style.border = "4px solid rgba(255,140,60,0.85)";
    frame.style.borderRadius = "18px";
    frame.style.boxShadow = "0 10px 18px rgba(0,0,0,0.12)";
    frame.style.pointerEvents = "none";
    photoUi.appendChild(frame);

    const del = mkBtn(box.x + box.w - 18, box.y - 18, "🗑");
    del.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); });
    del.addEventListener("click", ()=>{
      photos = photos.filter(p => p.id !== selectedPhotoId);
      selectedPhotoId = null;
      savePhotos(year, month, photos.map(stripSavePhoto));
      renderAll();
    });
    photoUi.appendChild(del);

    const rs = mkBtn(box.x + box.w - 18, box.y + box.h - 18, "↔");
    rs.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); startResize(e, selP, "photo"); });
    photoUi.appendChild(rs);

    const rot = mkBtn(box.x - 18, box.y - 18, "⟳");
    rot.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); startRotate(e, selP, "photo"); });
    photoUi.appendChild(rot);

    return;
  }

  const selT = texts.find(t => t.id === selectedTextId);
  if(selT){
    const box = boundingBox(selT);

    const frame = document.createElement("div");
    frame.style.position = "absolute";
    frame.style.left = `${box.x}px`;
    frame.style.top = `${box.y}px`;
    frame.style.width = `${box.w}px`;
    frame.style.height = `${box.h}px`;
    frame.style.border = "4px solid rgba(255,140,60,0.85)";
    frame.style.borderRadius = "18px";
    frame.style.boxShadow = "0 10px 18px rgba(0,0,0,0.12)";
    frame.style.pointerEvents = "none";
    photoUi.appendChild(frame);

    const del = mkBtn(box.x + box.w - 18, box.y - 18, "🗑");
    del.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); });
    del.addEventListener("click", ()=>{
      texts = texts.filter(t => t.id !== selectedTextId);
      selectedTextId = null;
      saveTexts(year, month, texts);
      killTextEditor();
      renderAll();
    });
    photoUi.appendChild(del);

    const rs = mkBtn(box.x + box.w - 18, box.y + box.h - 18, "↔");
    rs.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); startResize(e, selT, "text"); });
    photoUi.appendChild(rs);

    const rot = mkBtn(box.x - 18, box.y - 18, "⟳");
    rot.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); startRotate(e, selT, "text"); });
    photoUi.appendChild(rot);

    const ed = mkBtn(box.x - 18, box.y + box.h - 18, "✎");
    ed.addEventListener("mousedown", (e)=>{ e.preventDefault(); e.stopPropagation(); });
    ed.addEventListener("click", ()=> openTextEditor(selT));
    photoUi.appendChild(ed);
  }
}

function renderAll(){
  canvas.render({ photos, photoImgs, texts, doodleImg, updateOverlayUi });
}

// 캘린더
function fitGridToSheet(){
  const sheetRect = sheetEl.getBoundingClientRect();
  const dowRect = dowRowEl.getBoundingClientRect();

  const usable = sheetRect.height - dowRect.height - 10;
  const row = Math.floor(usable / 6);
  const clamped = Math.max(120, Math.min(row, 210));
  gridEl.style.gridAutoRows = `${clamped}px`;
}

function loadRuntimeForMonth(){
  const saved = loadDoodleDataURL(year, month);
  doodleImg = null;
  if(saved){
    const img = new Image();
    img.onload = () => { doodleImg = img; renderAll(); };
    img.src = saved;
  }

  photos = loadPhotos(year, month) || [];
  photoImgs.clear();
  selectedPhotoId = null;

  photos.forEach(p => {
    const img = new Image();
    img.onload = () => renderAll();
    img.src = p.src;
    photoImgs.set(p.id, img);
  });

  texts = loadTexts(year, month) || [];
  selectedTextId = null;
}

function buildCalendar(y, m){
  gridEl.innerHTML = "";

  monthNumEl.textContent = String(m+1);
  monthLabelEl.textContent = MONTH_NAMES[m];
  yearTagEl.textContent = String(y);

  leftMonthNumEl.textContent = String(m+1);
  leftMonthLabelEl.textContent = MONTH_NAMES[m];
  leftYearEl.textContent = String(y);

  tabs.forEach((t, idx) => t.classList.toggle("isActive", idx === m));

  if(monthMemoEl) monthMemoEl.value = loadMonthMemo(y, m);

  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const totalCells = 42;
  const startDate = new Date(y, m, 1 - startDow);

  for(let i=0;i<totalCells;i++){
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const cell = document.createElement("div");
    cell.className = "cell";

    const isOther = d.getMonth() !== m;
    if(isOther) cell.classList.add("isOtherMonth");

    const iso = toISO(d);
    cell.dataset.date = iso;

    if(!isOther && iso === TODAY_ISO) cell.classList.add("isToday");

    const dn = document.createElement("div");
    dn.className = "dayNum";
    dn.textContent = String(d.getDate());
    cell.appendChild(dn);

    const note = document.createElement("div");
    note.className = "note";
    note.textContent = "";
    cell.appendChild(note);

    gridEl.appendChild(cell);
  }

  requestAnimationFrame(() => {
    canvas.resize();
    loadRuntimeForMonth();
    fitGridToSheet();
    renderAll();
  });
}

function setTool(t){
  activeTool = t;

  [toolPointer, toolPen, toolHi, toolErase, toolPhoto, toolText].forEach(b => b && b.classList.remove("isActive"));

  if(t === "pointer") toolPointer?.classList.add("isActive");
  if(t === "pen") toolPen?.classList.add("isActive");
  if(t === "hi") toolHi?.classList.add("isActive");
  if(t === "erase") toolErase?.classList.add("isActive");
  if(t === "photo") toolPhoto?.classList.add("isActive");
  if(t === "text") toolText?.classList.add("isActive");

  if(t !== "pointer" && t !== "photo" && t !== "text"){
    selectedPhotoId = null;
    selectedTextId = null;
    killTextEditor();
  }

  renderAll();
}

// 팔레트
function openPalette(anchorEl, mode){
  paletteMode = mode;
  if(toolPaletteTitle){
    toolPaletteTitle.textContent = (mode === "pen") ? "Pen Color" : "Highlighter Color";
  }

  toolPaletteRow.innerHTML = "";
  const selected = (paletteMode === "pen") ? penColor : hiColor;

  for(const hex of PALETTE){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toolSwatch";
    b.style.background = hex;
    b.classList.toggle("isSelected", hex.toLowerCase() === selected.toLowerCase());
    b.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      if(paletteMode === "pen") penColor = hex;
      else hiColor = hex;
      openPalette(anchorEl, mode); // re-render
    });
    toolPaletteRow.appendChild(b);
  }

  toolPalette.hidden = false;
  toolPalette.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    const r = anchorEl.getBoundingClientRect();
    const bubble = toolPalette.querySelector(".toolPalette__bubble");
    const bw = bubble ? bubble.getBoundingClientRect().width : 260;

    const margin = 12;
    const center = r.left + r.width / 2;

    let left = center - bw / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - bw - margin));

    const top = r.bottom + 10;

    toolPalette.style.left = `${left}px`;
    toolPalette.style.top = `${top}px`;

    const arrowX = Math.max(18, Math.min(bw - 18, center - left));
    if(bubble) bubble.style.setProperty("--arrow-x", `${arrowX}px`);
  });
}

function closePalette(){
  toolPalette.hidden = true;
  toolPalette.setAttribute("aria-hidden", "true");
}
function isPaletteOpen(){
  return toolPalette && !toolPalette.hidden;
}

let dragState = null;

function bringToFront(kind, id){
  if(kind === "photo"){
    const idx = photos.findIndex(p=>p.id===id);
    if(idx < 0) return;
    const [p] = photos.splice(idx,1);
    photos.push(p);
  }else{
    const idx = texts.findIndex(t=>t.id===id);
    if(idx < 0) return;
    const [t] = texts.splice(idx,1);
    texts.push(t);
  }
}

function startMove(e, sel, kind){
  const p = canvas.pos(e);
  dragState = { type:"move", kind, id:sel.id, start:p, orig:{...sel} };
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd, { once:true });
}
function startResize(e, sel, kind){
  const p = canvas.pos(e);
  const cx = sel.x + sel.w/2;
  const cy = sel.y + sel.h/2;
  dragState = { type:"resize", kind, id:sel.id, start:p, orig:{...sel}, cx, cy };
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd, { once:true });
}
function startRotate(e, sel, kind){
  const p = canvas.pos(e);
  const cx = sel.x + sel.w/2;
  const cy = sel.y + sel.h/2;
  const dx0 = p.x - cx;
  const dy0 = p.y - cy;
  dragState = { type:"rotate", kind, id:sel.id, orig:{...sel}, cx, cy, startAngle: Math.atan2(dy0, dx0) };
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd, { once:true });
}

function onDragMove(e){
  if(!dragState) return;

  const p = canvas.pos(e);
  const arr = dragState.kind === "photo" ? photos : texts;
  const obj = arr.find(x => x.id === dragState.id);
  if(!obj) return;

  if(dragState.type === "move"){
    obj.x = dragState.orig.x + (p.x - dragState.start.x);
    obj.y = dragState.orig.y + (p.y - dragState.start.y);
  }

  if(dragState.type === "resize"){
    const o = dragState.orig;

    const dx0 = dragState.start.x - dragState.cx;
    const dy0 = dragState.start.y - dragState.cy;
    const dx1 = p.x - dragState.cx;
    const dy1 = p.y - dragState.cy;

    const r0 = Math.max(10, Math.hypot(dx0, dy0));
    const r1 = Math.max(10, Math.hypot(dx1, dy1));
    const s = r1 / r0;

    if(dragState.kind === "photo"){
      obj.w = Math.max(40, o.w * s);
      obj.h = Math.max(40, o.h * s);
      obj.x = dragState.cx - obj.w/2;
      obj.y = dragState.cy - obj.h/2;
    }else{
      const fs0 = o.fontSize || 20;
      const fs = Math.max(10, Math.min(110, fs0 * s));
      obj.fontSize = fs;

      const box = canvas.measureTextBox(obj.text, fs);
      obj.w = box.w;
      obj.h = box.h;
      obj.x = dragState.cx - obj.w/2;
      obj.y = dragState.cy - obj.h/2;
    }
  }

  if(dragState.type === "rotate"){
    const o = dragState.orig;
    const dx = p.x - dragState.cx;
    const dy = p.y - dragState.cy;
    const a1 = Math.atan2(dy, dx);
    obj.rot = (o.rot || 0) + (a1 - dragState.startAngle);
  }

  if(dragState.kind === "photo"){
    savePhotos(year, month, photos.map(stripSavePhoto));
  }else{
    saveTexts(year, month, texts);
  }

  renderAll();
}

function onDragEnd(){
  window.removeEventListener("mousemove", onDragMove);
  dragState = null;
}

// 텍스트
function openTextEditor(t){
  killTextEditor();

  const wrap = document.createElement("div");
  wrap.className = "textEditor";
  wrap.style.left = `${t.x}px`;
  wrap.style.top = `${t.y}px`;

  const ta = document.createElement("textarea");
  ta.value = (t.text || "").trim() === "" ? "" : t.text;
  ta.placeholder = "텍스트 입력...";
  ta.style.fontFamily = `"${TEXT_FONT_FAMILY}", ui-sans-serif, system-ui, -apple-system, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  ta.style.fontSize = `${t.fontSize || 20}px`;

  wrap.appendChild(ta);
  sheetEl.appendChild(wrap);
  textEditorEl = wrap;

  ta.focus();

  const commit = () => {
    const v = (ta.value || "").trim();
    t.text = v || " ";

    const fs = t.fontSize || 20;
    const box = canvas.measureTextBox(t.text, fs);
    t.w = box.w;
    t.h = box.h;

    saveTexts(year, month, texts);
    killTextEditor();
    renderAll();
  };

  ta.addEventListener("blur", commit);
  ta.addEventListener("keydown", (ev) => {
    if(ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)){
      ev.preventDefault();
      ta.blur();
    }
    if(ev.key === "Escape"){
      ev.preventDefault();
      killTextEditor();
      renderAll();
    }
  });
}

// 사진 업로드
async function toStickerDataURL(img, max = 900, mime = "image/jpeg", quality = 0.86){
  const ratio = img.width / img.height;
  let w = img.width, h = img.height;

  if(w > h && w > max){ w = max; h = Math.round(w / ratio); }
  if(h >= w && h > max){ h = max; w = Math.round(h * ratio); }

  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.drawImage(img, 0, 0, w, h);
  return c.toDataURL(mime, quality);
}

photoInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if(!file) return;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;

  img.onload = async () => {
    const dataURL = await toStickerDataURL(img);

    const rect = doodle.getBoundingClientRect();
    const w = Math.min(320, rect.width * 0.30);
    const h = (img.height / img.width) * w;

    const id = `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const pObj = {
      id,
      src: dataURL,
      x: rect.width * 0.55 - w/2,
      y: rect.height * 0.22 - h/2,
      w, h,
      rot: 0
    };

    photos.push(pObj);

    const rim = new Image();
    rim.onload = () => renderAll();
    rim.src = dataURL;
    photoImgs.set(id, rim);

    selectedPhotoId = id;
    selectedTextId = null;
    savePhotos(year, month, photos.map(stripSavePhoto));
    setTool("photo");
    renderAll();

    URL.revokeObjectURL(url);
    photoInput.value = "";
  };
});

doodle.addEventListener("mousedown", (e) => {
  if(hasTextEditor()) return;

  const p = canvas.pos(e);

  if(activeTool === "pointer" || activeTool === "photo" || activeTool === "text"){
    for(let i=photos.length-1; i>=0; i--){
      const ph = photos[i];
      if(hitPhotoBody(ph, p)){
        selectedPhotoId = ph.id;
        selectedTextId = null;
        bringToFront("photo", ph.id);
        renderAll();
        startMove(e, ph, "photo");
        return;
      }
    }

    for(let i=texts.length-1; i>=0; i--){
      const t = texts[i];
      if(hitTextBody(t, p)){
        selectedTextId = t.id;
        selectedPhotoId = null;
        bringToFront("text", t.id);
        renderAll();
        startMove(e, t, "text");
        return;
      }
    }

    selectedPhotoId = null;
    selectedTextId = null;
    renderAll();

    if(activeTool === "pointer") return;

    if(activeTool === "text"){
      const id = `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const fontSize = 24;
      const box = canvas.measureTextBox("텍스트", fontSize);

      const t = { id, text:" ", x:Math.max(8,p.x), y:Math.max(8,p.y), w:box.w, h:box.h, rot:0, fontSize };
      texts.push(t);
      selectedTextId = id;
      saveTexts(year, month, texts);
      renderAll();
      openTextEditor(t);
      return;
    }

    if(activeTool === "photo") return;
  }

  if(activeTool === "pen" || activeTool === "hi" || activeTool === "erase"){
    canvas.beginDoodle(e);
  }
});

window.addEventListener("mousemove", (e) => {
  if(hasTextEditor()) return;
  if(activeTool === "photo" || activeTool === "text" || activeTool === "pointer") return;
  canvas.moveDoodle(e, { activeTool, penColor, hiColor });
});

window.addEventListener("mouseup", () => {
  if(hasTextEditor()) return;
  if(activeTool === "photo" || activeTool === "text" || activeTool === "pointer") return;

  const ended = canvas.endDoodle();
  if(!ended) return;

  const dataURL = doodle.toDataURL("image/png");
  saveDoodleDataURL(year, month, dataURL);

  doodleImg = new Image();
  doodleImg.onload = () => renderAll();
  doodleImg.src = dataURL;
});

// 툴바
toolPointer?.addEventListener("click", () => { setTool("pointer"); closePalette(); });
toolErase?.addEventListener("click", () => { setTool("erase"); closePalette(); });
toolText?.addEventListener("click", () => { setTool("text"); closePalette(); });

toolClear?.addEventListener("click", () => {
  const rect = doodle.getBoundingClientRect();
  canvas.ctx.clearRect(0,0,rect.width,rect.height);
  saveDoodleDataURL(year, month, "");
  doodleImg = null;
  renderAll();
});

toolPhoto?.addEventListener("click", () => {
  setTool("photo");
  closePalette();
  photoInput.click();
});

toolPaletteClose?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); closePalette(); });
document.addEventListener("click", (e) => {
  if(!isPaletteOpen()) return;
  if(toolPalette.contains(e.target)) return;
  if(toolPen.contains(e.target)) return;
  if(toolHi.contains(e.target)) return;
  closePalette();
});
document.addEventListener("keydown", (e) => { if(e.key === "Escape") closePalette(); });

// 메모
let memoTimer = null;
monthMemoEl?.addEventListener("input", () => {
  clearTimeout(memoTimer);
  memoTimer = setTimeout(() => saveMonthMemo(year, month, monthMemoEl.value), 250);
});

// 리셋
resetAllBtn?.addEventListener("click", () => {
  localStorage.removeItem(keys.keyFor(year, month));
  localStorage.removeItem(keys.doodleKeyFor(year, month));
  localStorage.removeItem(keys.photoKeyFor(year, month));
  localStorage.removeItem(keys.memoKeyFor(year, month));
  localStorage.removeItem(keys.textKeyFor(year, month));
  buildCalendar(year, month);
});

tabs.forEach((t) => {
  t.addEventListener("click", () => {
    month = parseInt(t.dataset.month, 10);
    closePalette();
    buildCalendar(year, month);
  });
});

function init(){
  setTool(activeTool);
  buildCalendar(year, month);

  canvas.resize();
  fitGridToSheet();
  loadRuntimeForMonth();
  renderAll();

  document.fonts?.ready?.then(() => renderAll());

  const ro = new ResizeObserver(() => {
    canvas.resize();
    fitGridToSheet();
    renderAll();
  });
  ro.observe(sheetEl);

  window.addEventListener("resize", () => {
    canvas.resize();
    fitGridToSheet();
    renderAll();
  });
}

init();