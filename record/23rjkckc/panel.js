// Live panel. Reads panel.json (counts and health only) and renders one number.
// A dead or old feed reads STALE, never green. Nothing here writes anywhere.
(function () {
  var el = document.getElementById("live");
  if (!el) return;
  var big = document.getElementById("live-big");
  var sub = document.getElementById("live-sub");
  var staleHours = Number(el.getAttribute("data-stale-hours") || 36);
  function stale(msg) {
    el.classList.add("stale");
    big.textContent = "STALE";
    sub.textContent = el.getAttribute("data-stale-label") + (msg ? " " + msg : "");
  }
  function ago(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    var m = Math.round(ms / 60000);
    if (m < 60) return m + (m === 1 ? " minute ago" : " minutes ago");
    var h = Math.round(m / 60);
    if (h < 48) return h + (h === 1 ? " hour ago" : " hours ago");
    var d = Math.round(h / 24); return d + (d === 1 ? " day ago" : " days ago");
  }
  fetch(el.getAttribute("data-src"), { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (p) {
      var t = new Date(p.generated_at).getTime();
      if (!t || (Date.now() - t) > staleHours * 3600000) return stale("Last update " + (t ? ago(p.generated_at) : "unknown") + ".");
      big.textContent = p.healthy + " of " + p.scheduled;
      sub.textContent = el.getAttribute("data-label") + ", healthy at the last check, " + ago(p.generated_at) + ". " + (p.scope || "");
    })
    .catch(function (e) { stale(""); });
})();
