export function createCanvasEngine({ doodle, TEXT_FONT_FAMILY }){
  const ctx = doodle.getContext("2d");

  let drawing = false;
  let lastX = 0, lastY = 0;

  function resize(){
    const rect = doodle.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    doodle.width = Math.round(rect.width * dpr);
    doodle.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pos(e){
    const r = doodle.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function measureTextBox(text, fontSize){
    const lines = String(text || "").split("\n");
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.font = `${fontSize}px "${TEXT_FONT_FAMILY}", ui-sans-serif, system-ui, -apple-system, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

    let maxW = 80;
    for(const ln of lines){
      maxW = Math.max(maxW, ctx.measureText(ln || " ").width);
    }
    ctx.restore();

    const lineH = Math.round(fontSize * 1.2);
    const h = Math.max(lineH, lines.length * lineH);
    const w = Math.min(Math.max(120, maxW + 18), 520);
    return { w, h };
  }

  function drawPhoto(p, img){
    const cx = p.x + p.w/2;
    const cy = p.y + p.h/2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.rot || 0);
    ctx.translate(-p.w/2, -p.h/2);
    ctx.drawImage(img, 0, 0, p.w, p.h);
    ctx.restore();
  }

  function drawTextObj(t){
    const fs = t.fontSize || 20;
    const cx = t.x + t.w/2;
    const cy = t.y + t.h/2;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(40,30,30,0.88)";
    ctx.font = `${fs}px "${TEXT_FONT_FAMILY}", ui-sans-serif, system-ui, -apple-system, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
    ctx.textBaseline = "top";

    ctx.translate(cx, cy);
    ctx.rotate(t.rot || 0);
    ctx.translate(-t.w/2, -t.h/2);

    const lines = String(t.text || "").split("\n");
    const lineH = Math.round(fs * 1.2);
    let yy = 0;
    for(const ln of lines){
      ctx.fillText(ln, 0, yy);
      yy += lineH;
    }
    ctx.restore();
  }

  function render({ photos, photoImgs, texts, doodleImg, updateOverlayUi }){
    const rect = doodle.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;

    for(const p of photos){
      const img = photoImgs.get(p.id);
      if(!img) continue;
      drawPhoto(p, img);
    }

    for(const t of texts){
      drawTextObj(t);
    }

    if(doodleImg){
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(doodleImg, 0, 0, rect.width, rect.height);
      ctx.restore();
    }

    updateOverlayUi?.();
  }

  function beginDoodle(e){
    drawing = true;
    const p = pos(e);
    lastX = p.x; lastY = p.y;
  }

  function moveDoodle(e, { activeTool, penColor, hiColor }){
    if(!drawing) return;
    const p = pos(e);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if(activeTool === "pen"){
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 3.2;
    }else if(activeTool === "hi"){
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = hiColor;
      ctx.lineWidth = 14;
    }else{
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.lineWidth = 22;
    }

    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();

    lastX = p.x; lastY = p.y;
  }

  function endDoodle(){
    if(!drawing) return false;
    drawing = false;
    return true;
  }

  return { ctx, resize, pos, render, measureTextBox, beginDoodle, moveDoodle, endDoodle };
}