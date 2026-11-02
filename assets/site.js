const root = document.documentElement;

document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch {}
});

const tocLinks = [...document.querySelectorAll(".toc a")];
if (tocLinks.length) {
  const byId = new Map(tocLinks.map((a) => [a.hash.slice(1), a]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      tocLinks.forEach((a) => a.classList.remove("active"));
      byId.get(entry.target.id)?.classList.add("active");
    }
  }, { rootMargin: "0px 0px -70% 0px" });
  document.querySelectorAll(".article-content h2[id]").forEach((h) => observer.observe(h));
}
