export const keys = {
  keyFor: (y, m) => `calDiary:${y}-${String(m+1).padStart(2,"0")}`,
  doodleKeyFor: (y, m) => `calDoodle:${y}-${String(m+1).padStart(2,"0")}`,
  photoKeyFor: (y, m) => `calPhotos:${y}-${String(m+1).padStart(2,"0")}`,
  memoKeyFor:  (y, m) => `calMonthMemo:${y}-${String(m+1).padStart(2,"0")}`,
  textKeyFor:  (y, m) => `calTexts:${y}-${String(m+1).padStart(2,"0")}`,
};

export function loadDoodleDataURL(y, m){
  return localStorage.getItem(keys.doodleKeyFor(y,m)) || "";
}
export function saveDoodleDataURL(y, m, dataURL){
  localStorage.setItem(keys.doodleKeyFor(y,m), dataURL);
}

export function loadPhotos(y, m){
  try{ return JSON.parse(localStorage.getItem(keys.photoKeyFor(y,m)) || "[]"); }
  catch{ return []; }
}
export function savePhotos(y, m, photos){
  localStorage.setItem(keys.photoKeyFor(y,m), JSON.stringify(photos));
}

export function loadTexts(y, m){
  try{ return JSON.parse(localStorage.getItem(keys.textKeyFor(y,m)) || "[]"); }
  catch{ return []; }
}
export function saveTexts(y, m, texts){
  localStorage.setItem(keys.textKeyFor(y,m), JSON.stringify(texts));
}

export function loadMonthMemo(y, m){
  return localStorage.getItem(keys.memoKeyFor(y,m)) || "";
}
export function saveMonthMemo(y, m, v){
  localStorage.setItem(keys.memoKeyFor(y,m), v || "");
}

export function stripSavePhoto(p){
  return { id:p.id, src:p.src, x:p.x, y:p.y, w:p.w, h:p.h, rot:p.rot || 0 };
}