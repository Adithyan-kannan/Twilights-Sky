const body = document.body;
const themeToggle = document.querySelector("#themeToggle");
const progressBar = document.querySelector("#progressBar");
const searchInput = document.querySelector("#searchInput");
const searchForm = document.querySelector(".search-panel");
const filterButtons = document.querySelectorAll(".filter-button");
const articles = document.querySelectorAll("[data-topic]");
const topicLinks = document.querySelectorAll("[data-topic-link]");
const emptyState = document.querySelector("#emptyState");
const year = document.querySelector("#year");

let activeFilter = "all";

if (year) {
  year.textContent = new Date().getFullYear();
}

function syncGiscusTheme() {
  const iframe = document.querySelector("iframe.giscus-frame");
  const theme = body.classList.contains("dark") ? "dark" : "light";

  if (!iframe) return;

  iframe.contentWindow.postMessage(
    {
      giscus: {
        setConfig: {
          theme,
        },
      },
    },
    "https://giscus.app",
  );
}



function trackTopicView(topic, source) {
  const storageKey = `topic-views-${topic}`;
  const currentCount = Number(localStorage.getItem(storageKey) || 0);

  localStorage.setItem(storageKey, String(currentCount + 1));

  if (window.gtag) {
    window.gtag("event", "topic_view", {
      topic,
      source,
    });
  }

  if (window.plausible) {
    window.plausible("Topic View", {
      props: {
        topic,
        source,
      },
    });
  }
}

const savedTheme = localStorage.getItem("blog-theme");
if (savedTheme === "dark") {
  body.classList.add("dark");
  if (themeToggle) {
    themeToggle.querySelector("span").textContent = "☀";
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const isDark = body.classList.contains("dark");

    localStorage.setItem("blog-theme", isDark ? "dark" : "light");
    themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
    syncGiscusTheme();
  });
}

window.addEventListener("scroll", () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
});

function updateArticles() {
  if (!searchInput || !emptyState) return;

  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  articles.forEach((article) => {
    const category = article.dataset.category;
    const text = article.textContent.toLowerCase();
    const matchesFilter = activeFilter === "all" || category === activeFilter;
    const matchesSearch = text.includes(query);
    const shouldShow = matchesFilter && matchesSearch;

    article.classList.toggle("hidden", !shouldShow);
    if (shouldShow) visibleCount += 1;
  });

  emptyState.classList.toggle("visible", visibleCount === 0);
}

function setActiveFilter(filter) {
  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });

  activeFilter = filter;
  updateArticles();
}

if (searchInput) {
  searchInput.addEventListener("input", updateArticles);
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateArticles();
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveFilter(button.dataset.filter);

    if (activeFilter !== "all") {
      trackTopicView(activeFilter, "filter");
    }
  });
});

topicLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const selectedTopic = link.dataset.topicLink;

    setActiveFilter(selectedTopic);
    trackTopicView(selectedTopic, "topic_card");
  });
});

articles.forEach((article) => {
  article.addEventListener("click", () => {
    trackTopicView(article.dataset.topic, "article_card");
  });
});

const newsletterForm = document.querySelector(".newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = event.currentTarget.querySelector("input");

    emailInput.value = "";
    emailInput.placeholder = "Thanks for subscribing";
  });
}
