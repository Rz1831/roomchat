// On-site edit mode for the owner, opened from the Telegram Mini App.
// It only activates when Telegram's initData validates for the owner chat.
export const EDIT_JS = String.raw`
(function () {
  "use strict";
  const tg = window.Telegram && window.Telegram.WebApp;
  try { if (tg) tg.ready(); } catch (e) {}
  const initData = (tg && tg.initData) ||
    new URLSearchParams((location.hash || "").replace(/^#/, "")).get("tgWebAppData") || "";
  if (!initData) return;

  const headers = { "x-telegram-init-data": initData };
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);
  let target = null;

  const say = (msg, bad) => {
    if (window.lumiereToast) return window.lumiereToast(msg, bad ? "err" : "ok");
    console.log("[edit]", msg);
  };

  async function upload(slot, file) {
    const form = new FormData();
    form.append("file", file);
    form.append("slot", slot);
    const res = await fetch("/api/tg/media", { method: "POST", headers, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "Upload failed.");
    return data;
  }

  function enable(user) {
    document.body.classList.add("is-editing");
    const bar = document.createElement("div");
    bar.className = "edit-bar";
    bar.innerHTML = '<span><b>TAP-TO-EDIT</b> ' + (user && user.first_name ? user.first_name : "Owner") + " — tap any image to replace it</span>" +
      '<button type="button">Done</button>';
    document.body.appendChild(bar);
    bar.querySelector("button").addEventListener("click", () => document.body.classList.remove("is-editing"));

    document.querySelectorAll("[data-edit-only]").forEach((el) => { el.hidden = false; });

    document.querySelectorAll("[data-gallery-item]").forEach((item) => {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "edit-delete";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", "Delete this gallery image");
      remove.dataset.editDelete = item.dataset.galleryItem;
      item.appendChild(remove);
    });

    document.addEventListener("click", (event) => {
      if (!document.body.classList.contains("is-editing")) return;
      const del = event.target.closest("[data-edit-delete]");
      if (del) {
        event.preventDefault();
        event.stopPropagation();
        if (!confirm("Remove this photo from the gallery?")) return;
        fetch("/api/tg/gallery/" + del.dataset.editDelete, { method: "DELETE", headers })
          .then((res) => { if (!res.ok) throw new Error("Could not delete that photo."); })
          .then(() => {
            const item = del.closest("[data-gallery-item]");
            if (item) item.remove();
            say("Photo removed.");
          })
          .catch((err) => say(err.message, true));
        return;
      }
      const add = event.target.closest("[data-edit-add]");
      if (add) {
        event.preventDefault();
        event.stopPropagation();
        target = "gallery";
        fileInput.click();
        return;
      }
      const slot = event.target.closest("[data-slot]");
      if (!slot) return;
      event.preventDefault();
      event.stopPropagation();
      target = slot.getAttribute("data-slot");
      fileInput.click();
    }, true);
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!file || !target) return;
    try {
      const data = await upload(target, file);
      if (target === "gallery") {
        say("Added to the gallery — refreshing.");
        setTimeout(() => window.location.reload(), 900);
        return;
      }
      const holder = document.querySelector('[data-slot="' + target + '"]');
      const img = holder && (holder.tagName === "IMG" ? holder : holder.querySelector("img"));
      if (img) img.src = data.url + "?v=" + Date.now();
      say("Image replaced — live now.");
    } catch (err) {
      say(err.message, true);
    }
  });

  fetch("/api/tg/whoami", { headers })
    .then((res) => { if (!res.ok) throw new Error("not owner"); return res.json(); })
    .then((data) => enable(data.user))
    .catch(() => {});
})();
`;
