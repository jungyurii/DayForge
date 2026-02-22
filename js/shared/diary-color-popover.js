const PALETTE = ["#cfe4ff", "#cfe9c7", "#f6e59a", "#f5c9c9", "#2d2d2d", "#ffffff"];

export function initDiaryColorPopover({
  penBtn,
  hiBtn,
  pop,
  titleEl,
  rowEl,
  getPenColor,
  getHiColor,
  setPenColor,
  setHiColor,
  openPopoverAt,
  closePopover,
  isOpen,
}) {
  if (!penBtn || !hiBtn || !pop || !rowEl) return;

  let picking = "pen"; // "pen" | "hi"

  rowEl.innerHTML = "";
  for (const hex of PALETTE) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toolSwatch";
    b.dataset.hex = hex;
    b.style.background = hex;

    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (picking === "pen") setPenColor(hex);
      else setHiColor(hex);

      syncSelectedUI();

      // 닫기
      if (closePopover) closePopover();
      else {
        pop.hidden = true;
        pop.setAttribute("aria-hidden", "true");
      }
    });

    rowEl.appendChild(b);
  }

  function syncSelectedUI() {
    const selected = (picking === "pen") ? getPenColor() : getHiColor();
    rowEl.querySelectorAll(".toolSwatch").forEach((el) => {
      el.classList.toggle(
        "isSelected",
        (el.dataset.hex || "").toLowerCase() === selected.toLowerCase()
      );
    });
  }

  function open(mode, anchorBtn) {
    picking = mode;
    if (titleEl) titleEl.textContent = (mode === "pen") ? "Pen Color" : "Highlighter Color";
    syncSelectedUI();

    if (openPopoverAt) openPopoverAt(anchorBtn, mode);

    pop.hidden = false;
    pop.setAttribute("aria-hidden", "false");
  }

  function toggle(mode, anchorBtn) {
    const opened = isOpen ? isOpen() : !pop.hidden;

    if (opened && picking === mode) {
      if (closePopover) closePopover();
      else {
        pop.hidden = true;
        pop.setAttribute("aria-hidden", "true");
      }
      return;
    }
    open(mode, anchorBtn);
  }

  // 버튼 클릭 시 토글
  penBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle("pen", penBtn);
  });

  hiBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle("hi", hiBtn);
  });

  document.addEventListener("click", (e) => {
    const opened = isOpen ? isOpen() : !pop.hidden;
    if (!opened) return;
    if (pop.contains(e.target)) return;
    if (penBtn.contains(e.target) || hiBtn.contains(e.target)) return;

    if (closePopover) closePopover();
    else {
      pop.hidden = true;
      pop.setAttribute("aria-hidden", "true");
    }
  });

  document.addEventListener("keydown", (e) => {
    const opened = isOpen ? isOpen() : !pop.hidden;
    if (e.key === "Escape" && opened) {
      if (closePopover) closePopover();
      else {
        pop.hidden = true;
        pop.setAttribute("aria-hidden", "true");
      }
    }
  });
}