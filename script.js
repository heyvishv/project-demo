const searchForm = document.querySelector('form[role="search"]');
const searchInput = document.getElementById("JOB-SEARCH");
const filterSection = document.querySelector(
  'section[aria-label="Job-filters"]',
);
const filterForm = filterSection ? filterSection.querySelector("form") : null;
const filterCheckboxes = filterForm
  ? filterForm.querySelectorAll('input[type="checkbox"]')
  : [];
const jobsSection = document.querySelector(
  'section[aria-label="Available jobs"]',
);
const jobList = jobsSection
  ? jobsSection.querySelector('ul[role="list"]')
  : null;
const jobCards = jobList
  ? Array.from(jobList.querySelectorAll(':scope > li[role="listitem"]'))
  : [];
const statusRegion = jobsSection
  ? jobsSection.querySelector('div[role="status"]')
  : null;

function normalizeTag(text) {
  return text.trim().toUpperCase().replace(/\s+/g, "-");
}

function readCard(card) {
  const tagItems = card.querySelectorAll('ul[role="list"] li');
  const tags = Array.from(tagItems).map((li) => normalizeTag(li.textContent));
  return {
    tags,
    haystack: card.textContent.toLowerCase(),
  };
}

function checkedValues(groupName) {
  return Array.from(filterCheckboxes)
    .filter((box) => box.name === groupName && box.checked)
    .map((box) => box.value);
}

function updateStatus(count) {
  if (!statusRegion) return;
  statusRegion.textContent =
    count === 1 ? "showing 1 job" : `showing ${count} jobs`;
}

function runFilters() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const jobTypes = checkedValues("JOB-TYPE");
  const locations = checkedValues("LOCATION");
  const levels = checkedValues("EXP-LEVEL");
  let visibleCount = 0;

  jobCards.forEach((card) => {
    const { tags, haystack } = readCard(card);
    const matchesQuery = query.length === 0 || haystack.includes(query);
    const matchesType =
      jobTypes.length === 0 || jobTypes.some((v) => tags.includes(v));
    const matchesLocation =
      locations.length === 0 || locations.some((v) => tags.includes(v));
    const matchesLevel =
      levels.length === 0 || levels.some((v) => tags.includes(v));
    const shouldShow =
      matchesQuery && matchesType && matchesLocation && matchesLevel;

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  updateStatus(visibleCount);
}

let toastTimer = null;

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}

function titleFromLabel(label) {
  return label.replace(/^apply (now )?for /i, "").split(" at ")[0];
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runFilters();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", runFilters);
}

filterCheckboxes.forEach((box) => {
  box.addEventListener("change", () => {
    box.setAttribute("aria-pressed", String(box.checked));
    runFilters();
  });
});

if (filterForm) {
  filterForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      filterCheckboxes.forEach((box) =>
        box.setAttribute("aria-pressed", "false"),
      );
      runFilters();
    }, 0);
  });
}

jobCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    jobCards.forEach((other) => other.classList.remove("is-selected"));
    card.classList.add("is-selected");
  });
});

document.querySelectorAll("a[aria-label]").forEach((link) => {
  const label = link.getAttribute("aria-label") || "";
  if (!/^apply/i.test(label.trim())) return;

  link.addEventListener("click", (event) => {
    if (link.getAttribute("href") !== "new.html") return;
    event.preventDefault();
    showToast(`Application started for ${titleFromLabel(label)}`);
  });
});

runFilters();
