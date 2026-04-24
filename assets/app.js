// Minimal renderer. Fetches data/digests.json and renders today + archive.

const DATA_URL = "/data/digests.json";

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatDateShort(iso) {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function verdictClass(verdict) {
  if (!verdict) return "";
  return "verdict-" + verdict.replace(/\s+/g, "-").toLowerCase();
}

function subTagClass(sub) {
  if (!sub) return "";
  return "sub-tag-" + sub.toLowerCase();
}

function renderSource(s) {
  const pub = s.publication || "";
  const author = s.author ? ` · ${s.author}` : "";
  const date = s.date ? ` · ${s.date}` : "";
  const subTag = s.subscription
    ? `<span class="sub-tag ${subTagClass(s.subscription)}">${s.subscription}</span>`
    : "";
  const gist = s.gist ? ` — ${s.gist}` : "";
  return `<li><em>${pub}${author}${date}</em> ${subTag}${gist}</li>`;
}

function renderNewsItem(n, i) {
  const verdict = n.verdict
    ? `<span class="verdict ${verdictClass(n.verdict)}">${n.verdict}</span>`
    : "";
  const sources = (n.sources || []).map(renderSource).join("");
  return `
    <div class="news-item">
      <p class="takeaway">${i + 1}. ${n.takeaway}${verdict}</p>
      ${sources ? `<ul class="sources">${sources}</ul>` : ""}
    </div>
  `;
}

function renderAlert(a) {
  return `<li><strong>${a.headline}</strong> — ${a.detail}</li>`;
}

function renderJob(j) {
  if (j.kind === "deep-dive") {
    return `<li><span class="role">Company deep-dive:</span> <span class="company">${j.company}</span> <span class="source">— ${j.source} · ${j.source_date}</span></li>`;
  }
  if (j.kind === "roundup") {
    return `<li><span class="role">Role roundup:</span> <span class="company">${j.theme}</span> <span class="source">— ${j.source} · ${j.source_date}</span></li>`;
  }
  return `<li><span class="role">${j.role}</span> @ <span class="company">${j.company}</span> <span class="source">— ${j.source} · ${j.source_date}</span></li>`;
}

function renderDigestBody(d) {
  const top3 = (d.top3 || [])
    .map((t) => `<li>${t}</li>`)
    .join("");

  const convergence = d.convergence
    ? `<p class="convergence"><strong>This week's convergence:</strong> ${d.convergence}</p>`
    : "";

  const news = (d.news || []).map(renderNewsItem).join("");

  const alerts = (d.alerts && d.alerts.length)
    ? `<div class="alerts"><h3>Alerts</h3><ul>${d.alerts.map(renderAlert).join("")}</ul></div>`
    : "";

  const jobs = (d.jobs && d.jobs.length)
    ? `<div class="jobs"><h3>Job opportunities</h3><ul>${d.jobs.map(renderJob).join("")}</ul></div>`
    : "";

  const alsoSeen = d.also_seen
    ? `<div class="also-seen"><strong>Also seen:</strong> ${d.also_seen}</div>`
    : "";

  const emptyNotice = d.empty
    ? `<p class="empty">${d.empty}</p>`
    : "";

  const stats = d.stats
    ? `<p class="tally">Scanned ${d.stats.threads_scanned} threads from ${d.stats.senders} senders. Subscription sweep: ${d.stats.paid} paid, ${d.stats.lapsed} lapsed.</p>`
    : "";

  return `
    ${emptyNotice}
    ${top3 ? `<div class="top3"><h3>Top 3 today</h3><ol>${top3}</ol></div>` : ""}
    ${convergence}
    ${news ? `<h3>News</h3>${news}` : ""}
    ${alerts}
    ${jobs}
    ${alsoSeen}
    ${stats}
  `;
}

function renderToday(d) {
  const el = document.getElementById("today");
  el.innerHTML = `
    <p class="digest-date">${formatDate(d.date)}</p>
    ${renderDigestBody(d)}
  `;
}

function renderArchive(digests) {
  const list = document.getElementById("archive-list");
  if (!digests.length) {
    list.innerHTML = `<li class="empty">No archived digests yet.</li>`;
    return;
  }

  list.innerHTML = digests
    .map((d) => {
      const preview = d.top3 && d.top3.length
        ? d.top3[0].replace(/<[^>]+>/g, "").slice(0, 80) + (d.top3[0].length > 80 ? "…" : "")
        : (d.empty || "");
      return `
        <li>
          <details>
            <summary>
              <span>${formatDateShort(d.date)}</span>
              <span class="preview">${preview}</span>
            </summary>
            <div class="archive-content">${renderDigestBody(d)}</div>
          </details>
        </li>
      `;
    })
    .join("");
}

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to load digests");
    const digests = await res.json();

    if (!digests.length) {
      document.getElementById("today").innerHTML = `<p class="empty">No digests yet. First run scheduled for 5pm ET today.</p>`;
      return;
    }

    // Sort descending by date
    digests.sort((a, b) => (a.date < b.date ? 1 : -1));

    const [today, ...rest] = digests;
    renderToday(today);
    renderArchive(rest);
  } catch (err) {
    document.getElementById("today").innerHTML = `<p class="empty">Couldn't load digest data: ${err.message}</p>`;
    console.error(err);
  }
}

init();
