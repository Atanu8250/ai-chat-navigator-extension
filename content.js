/**
 * ChatGPT User Message Navigator – Sidebar Version (FIXED)
 *
 * Fixes:
 * - Sidebar now visible (overrides CSS display:none)
 * - Collapse handled via CSS classes only
 * - Stable on long conversations
 */

console.log("ChatGPT Message Navigator injected");



/* -------------------------------------------------------------------------- */
/*                              FA ICONS INJECT                               */
/* -------------------------------------------------------------------------- */

function injectFontAwesome() {
  if (document.getElementById("cgpt-fa-style")) return;

  const link = document.createElement("link");
  link.id = "cgpt-fa-style";
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("fontawesome/css/all.min.css");

  document.head.appendChild(link);
}

injectFontAwesome();

/* -------------------------------------------------------------------------- */
/*                                   STATE                                    */
/* -------------------------------------------------------------------------- */

let navPanel = null;
let sidebarExpanded = true;

let rebuildScheduled = false;
let cachedMessages = [];
let lastMessageCount = 0;

/* -------------------------------------------------------------------------- */
/*                            PANEL INITIALIZATION                             */
/* -------------------------------------------------------------------------- */

function initPanel() {
  if (navPanel) return;

  navPanel = document.createElement("div");
  navPanel.id = "cgpt-msg-nav";
  navPanel.classList.add("expanded");

  // IMPORTANT: override CSS `display: none`
  navPanel.style.display = "block";

  navPanel.innerHTML = `
    <button id="cgpt-sidebar-toggle" title="Toggle sidebar">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <header>User Messages</header>
    <ul></ul>
  `;

  document.body.appendChild(navPanel);
  setupSidebarToggle();
}

/* -------------------------------------------------------------------------- */
/*                          SIDEBAR TOGGLE BUTTON                              */
/* -------------------------------------------------------------------------- */

function setupSidebarToggle() {
  const toggleBtn = navPanel.querySelector("#cgpt-sidebar-toggle");

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    sidebarExpanded = !sidebarExpanded;

    navPanel.classList.toggle("collapsed", !sidebarExpanded);
    navPanel.classList.toggle("expanded", sidebarExpanded);

    // toggleBtn.textContent = sidebarExpanded ? "◀" : "▶";
  });
}

/* -------------------------------------------------------------------------- */
/*                            REBUILD SCHEDULER                                */
/* -------------------------------------------------------------------------- */

function scheduleRebuild() {
  if (rebuildScheduled || !navPanel) return;

  rebuildScheduled = true;

  requestAnimationFrame(() => {
    rebuildMessageList();
    rebuildScheduled = false;
  });
}

/* -------------------------------------------------------------------------- */
/*                           MESSAGE LIST BUILDER                              */
/* -------------------------------------------------------------------------- */

function rebuildMessageList() {
  const messages = collectUserMessages();
  if (messages.length === lastMessageCount) return;

  lastMessageCount = messages.length;

  const list = navPanel.querySelector("ul");
  list.textContent = ""; // fast clear

  messages.forEach((msg) => {
    const item = document.createElement("li");
    item.className = "cgpt-msg-item";

    /* ------------------------- Static Structure -------------------------- */
    const row = document.createElement("div");
    row.className = "cgpt-msg-row";

    const expandBtn = document.createElement("button");
    expandBtn.className = "cgpt-expand-btn";
    expandBtn.innerHTML = `<i class="fa-solid fa-chevron-down"></i>`;

    const previewEl = document.createElement("div");
    previewEl.className = "cgpt-msg-preview";

    const fullEl = document.createElement("div");
    fullEl.className = "cgpt-msg-full";

    /* ----------------------- SAFE TEXT INSERTION -------------------------- */
    const previewText = msg.text.replace(/\s+/g, " ").trim();

    previewEl.textContent = previewText;
    fullEl.textContent = msg.text;

    /* ----------------------- Expand / Collapse ---------------------------- */
    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      item.classList.toggle("expanded");
    });

    /* -------------------------- Navigation Only --------------------------- */
    item.addEventListener("click", () => {
      scrollToMessage(msg.element);
    });

    /* -------------------------- DOM Assembly ------------------------------ */
    row.appendChild(expandBtn);
    row.appendChild(previewEl);

    item.appendChild(row);
    item.appendChild(fullEl);

    list.appendChild(item);
  });
}


/* -------------------------------------------------------------------------- */
/*                               SCROLL FIX                                   */
/* -------------------------------------------------------------------------- */

function scrollToMessage(element) {
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  requestAnimationFrame(() => {
    window.scrollBy({ top: -80 });
  });
}

/* -------------------------------------------------------------------------- */
/*                          MESSAGE COLLECTION                                 */
/* -------------------------------------------------------------------------- */

function collectUserMessages() {
  const nodes = document.querySelectorAll(
    '[data-message-author-role="user"]'
  );

  if (nodes.length === cachedMessages.length) {
    return cachedMessages;
  }

  cachedMessages = [];

  nodes.forEach((node) => {
    const text = node.innerText;
    if (!text) return;

    cachedMessages.push({ text, element: node });
  });

  return cachedMessages;
}

/* -------------------------------------------------------------------------- */
/*                            MUTATION OBSERVER                                */
/* -------------------------------------------------------------------------- */

const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (
      m.target instanceof HTMLElement &&
      m.target.closest("#cgpt-msg-nav")
    ) {
      return;
    }
  }
  scheduleRebuild();
});

const chatRoot = document.querySelector("main") || document.body;
observer.observe(chatRoot, { childList: true, subtree: true });

/* -------------------------------------------------------------------------- */
/*                                BOOTSTRAP                                   */
/* -------------------------------------------------------------------------- */

initPanel();
scheduleRebuild();
