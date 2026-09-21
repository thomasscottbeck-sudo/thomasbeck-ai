(() => {
  "use strict";
  const svg = document.getElementById("schematic");
  const parts = [...svg.querySelectorAll(".part")];
  const wires = [...svg.querySelectorAll(".wire")];
  const controls = [...svg.querySelectorAll(".control")];
  const mode = matchMedia("(min-width: 1000px)");
  function layout() {
    const wide = mode.matches;
    const positions = new Map();
    svg.setAttribute("viewBox", `0 0 ${wide ? 1360 : 360} ${wide ? svg.dataset.wideHeight : svg.dataset.height}`);
    parts.forEach(part => {
      const box = (wide ? part.dataset.wide : part.dataset.small).split(",").map(Number);
      positions.set(part.dataset.key, box);
      part.setAttribute("transform", `translate(${box[0]},${box[1]})`);
      part.querySelector("rect").setAttribute("width", box[2]);
    });
    svg.querySelectorAll(".group-title").forEach(title => {
      const point = (wide ? title.dataset.wide : title.dataset.small).split(",");
      title.setAttribute("x", point[0]); title.setAttribute("y", point[1]);
    });
    wires.forEach(wire => {
      const [x, y, w, h] = positions.get(wire.dataset.start);
      const [a, b, c, d] = positions.get(wire.dataset.end);
      const sx = x + w / 2, tx = a + c / 2;
      const sy = b < y ? y : y + h, ty = b < y ? b + d : b;
      const mid = (sy + ty) / 2;
      wire.firstElementChild.setAttribute("d", `M${sx},${sy} C${sx},${mid} ${tx},${mid} ${tx},${ty}`);
    });
    controls.forEach(control => {
      const point = (wide ? control.dataset.wide : control.dataset.small).split(",");
      control.setAttribute("transform", `translate(${point[0]},${point[1]})`);
    });
  }
  mode.addEventListener("change", layout);
  layout();
  const dialog = document.getElementById("inspect");
  const content = dialog.querySelector(".inspection-content");
  let opener;
  function highlight(key) {
    parts.forEach(part => part.classList.toggle("selected", part.dataset.key === key));
    wires.forEach(wire => wire.classList.toggle("selected", wire.getAttribute("href") === "#" + key));
  }
  function inspect(target, origin) {
    if (!dialog.open) opener = origin;
    content.replaceChildren(...[...target.childNodes].map(node => node.cloneNode(true)));
    content.querySelector("h3").id = "inspect-title";
    highlight(target.id);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".close").focus();
  }
  document.addEventListener("click", event => {
    const anchor = event.target.closest("a[href^='#']");
    if (!anchor) return;
    const target = document.getElementById(anchor.getAttribute("href").slice(1));
    if (target?.tagName === "ARTICLE") {
      event.preventDefault(); inspect(target, anchor);
    } else if (dialog.open && target) {
      event.preventDefault();
      dismiss(target.querySelector("textarea,button,a") || target);
      target.scrollIntoView({behavior: "instant"});
    }
  });
  function dismiss(target = opener) {
    dialog.close();
    highlight("");
    if (target?.isConnected) target.focus({preventScroll: true});
    opener = null;
  }
  dialog.querySelector(".close").addEventListener("click", () => dismiss());
  dialog.addEventListener("cancel", event => { event.preventDefault(); dismiss(); });
  function revealHash() {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.tagName === "ARTICLE") {
      target.closest("details").open = true;
      target.scrollIntoView();
    }
  }
  window.addEventListener("hashchange", revealHash);
  revealHash();
  const put = (id, value) => { document.getElementById(id).textContent = value; };
  const draft = document.getElementById("sample-draft");
  const destination = document.getElementById("sample-destination");
  const result = document.getElementById("sample-result");
  const approve = document.getElementById("approve");
  approve.disabled = false;
  document.getElementById("reset-demo").disabled = false;
  const verify = document.getElementById("verify-demo");
  const readout = document.querySelector(".approval-readout");
  const initialDraft = draft.value;
  let permission = null;
  let version = 1;
  let wasApproved = false;
  const exactDraft = () => draft.value + "\u0000" + destination.value;
  const permitted = () => permission !== null && permission === exactDraft();
  function invalidate() {
    permission = null;
    version += 1;
    verify.disabled = true;
    approve.disabled = !draft.value.trim();
    readout.dataset.state = wasApproved ? "revoked" : "prepared";
    put("approval-version", "VERSION " + String(version).padStart(2, "0"));
    put("approval-seal", wasApproved ? "×" : "○");
    put("approval-title", wasApproved ? "Changed.\nPermission revoked." : "Prepared.\nNot permitted.");
    put("approval-copy", wasApproved
      ? "This is a different draft or destination. The previous decision cannot authorize it, even if the original text is restored."
      : "This draft has no approval. The demonstration cannot advance to a result check.");
    put("approval-state", wasApproved ? "A NEW HUMAN DECISION IS REQUIRED" : "AWAITING HUMAN DECISION");
    put("verification-result", "Unverified. Approval is required first.");
  }
  draft.addEventListener("input", invalidate);
  destination.addEventListener("change", invalidate);
  approve.addEventListener("click", () => {
    if (!draft.value.trim()) return;
    permission = exactDraft();
    wasApproved = true;
    readout.dataset.state = "approved";
    verify.disabled = false;
    put("approval-seal", "✓");
    put("approval-title", "This version.\nThis destination.");
    put("approval-copy", "The sample is permitted. Editing either field revokes this decision. The result still has to be checked.");
    put("approval-state", "SIMULATED APPROVAL / EXACT VERSION");
    put("verification-result", "Permitted, but unverified. Test the observed result.");
  });
  verify.addEventListener("click", () => {
    if (!permitted()) { invalidate(); return; }
    put("verification-result", result.value === "pass"
      ? "Verified in this model: the expected result was observed."
      : "Check failed. The expected result is absent. Completion remains unverified.");
  });
  result.addEventListener("change", () => {
    put("verification-result", permitted()
      ? "Observation changed. Test the result again; verification is pending."
      : "Unverified. Approval is required first.");
  });
  document.getElementById("reset-demo").addEventListener("click", () => {
    draft.value = initialDraft; destination.selectedIndex = 0; result.value = "pass";
    wasApproved = false; version = 0; invalidate();
  });
})();
