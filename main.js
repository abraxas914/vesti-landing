(() => {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = reduceMotionQuery.matches;
  const header = document.querySelector(".site-header");

  const syncHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });

  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const navTargets = navLinks
    .map((link) => {
      const target = document.querySelector(link.getAttribute("href"));
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  if (navTargets.length > 0) {
    const setActiveNav = (activeLink) => {
      navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
    };

    const activeObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const mostVisible = visibleEntries.reduce((current, candidate) =>
          candidate.intersectionRatio > current.intersectionRatio ? candidate : current
        );

        const match = navTargets.find(({ target }) => target === mostVisible.target);
        if (match) setActiveNav(match.link);
      },
      { threshold: [0.3, 0.55, 0.8], rootMargin: "-18% 0px -52% 0px" }
    );

    navTargets.forEach(({ target }) => activeObserver.observe(target));
    setActiveNav(navTargets[0].link);
  }

  const revealElements = [...document.querySelectorAll("[data-reveal]")];
  if (reduceMotion) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const parallaxElements = [...document.querySelectorAll("[data-parallax]")];
  if (!reduceMotion && parallaxElements.length > 0) {
    let rafId = 0;

    const updateParallax = () => {
      const viewportHeight = window.innerHeight || 1;
      parallaxElements.forEach((element) => {
        const speed = Number(element.getAttribute("data-parallax")) || 12;
        const rect = element.getBoundingClientRect();
        const distance = rect.top + rect.height / 2 - viewportHeight / 2;
        const shift = (distance / viewportHeight) * (speed * -1);
        element.style.setProperty("--parallax", `${shift.toFixed(2)}px`);
      });
      rafId = 0;
    };

    const queueParallax = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", queueParallax, { passive: true });
    window.addEventListener("resize", queueParallax);
  }

  const canvas = document.querySelector("[data-hero-canvas]");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  const tokens = [
    "memory://session",
    "thread.summary",
    "archive.ready",
    "signal:worth-keeping",
    "local_first=true",
    "source:claude",
    "source:chatgpt",
    "source:gemini",
    "source:qwen",
    "source:doubao",
    "source:deepseek",
    "knowledge.trace",
    "note://insight",
    "library.timeline",
    "capsule.folded",
    "capsule.expanded",
    "retrieval > evidence",
    "observe > classify",
    "agent.step:verified",
    "[archive now]",
    "[curate deliberately]",
    "[meaning is relational]",
    "topic/foundations",
    "topic/product",
    "topic/research",
    "topic/writing",
    "query -> sources",
    "rag.answer()",
    "cross-platform recall",
    "export.markdown",
    "inspect the trail",
    "storageapi boundary",
    "semantic neighbor",
    "network topology",
    "reader view",
    "thinking stays yours",
    "curate > recall",
  ];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let fragments = [];
  let nodes = [];
  let animationId = 0;
  let lastTime = 0;

  const fontStack = '"Cascadia Mono", "SFMono-Regular", Consolas, monospace';

  function createScene() {
    const fragmentCount = Math.max(28, Math.floor(width / 34));
    const nodeCount = Math.max(10, Math.floor(width / 120));

    fragments = Array.from({ length: fragmentCount }, (_, index) => {
      const band = index % 4;
      return {
        text: tokens[index % tokens.length],
        x: Math.random() * width,
        y: Math.random() * height,
        vx: -12 - Math.random() * 12,
        vy: (Math.random() - 0.5) * 5,
        size: 10.6 + Math.random() * 2.2 + band * 0.16,
        alpha: 0.08 + Math.random() * 0.12,
        accent: band === 0 || band === 3,
      };
    });

    nodes = Array.from({ length: nodeCount }, (_, index) => ({
      x: (index / Math.max(nodeCount - 1, 1)) * width + (Math.random() - 0.5) * 70,
      y: height * (0.18 + Math.random() * 0.66),
      radius: 1.5 + Math.random() * 2.4,
      amplitude: 7 + Math.random() * 12,
      speed: 0.00035 + Math.random() * 0.0009,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 16,
    }));
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createScene();
    drawScene(0);
  }

  function wrapFragment(fragment) {
    if (fragment.x < -180) {
      fragment.x = width + Math.random() * 120;
      fragment.y = Math.random() * height;
      fragment.text = tokens[Math.floor(Math.random() * tokens.length)];
    }
    if (fragment.y < -40) fragment.y = height + 20;
    if (fragment.y > height + 40) fragment.y = -20;
  }

  function drawBackgroundGlow() {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(255, 237, 212, 0.05)");
    gradient.addColorStop(0.48, "rgba(60, 104, 158, 0.024)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function drawNodes(time) {
    const points = nodes.map((node) => ({
      x: node.x + Math.sin(time * node.speed + node.phase) * node.amplitude + node.drift,
      y: node.y + Math.cos(time * node.speed * 1.4 + node.phase) * (node.amplitude * 0.38),
      radius: node.radius,
    }));

    context.save();
    context.lineWidth = 1;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150) {
          context.strokeStyle = `rgba(197, 210, 225, ${0.072 - distance / 2350})`;
          context.beginPath();
          context.moveTo(points[i].x, points[i].y);
          context.lineTo(points[j].x, points[j].y);
          context.stroke();
        }
      }
    }

    points.forEach((point, index) => {
      const isAccent = index % 4 === 0;
      context.fillStyle = isAccent ? "rgba(220, 194, 155, 0.84)" : "rgba(192, 209, 229, 0.68)";
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    });
    context.restore();
  }

  function drawFragments(deltaSeconds) {
    fragments.forEach((fragment, index) => {
      fragment.x += fragment.vx * deltaSeconds;
      fragment.y += fragment.vy * deltaSeconds;
      if (index % 7 === 0) {
        fragment.y += Math.sin((fragment.x + fragment.y) * 0.008) * 0.35;
      }

      wrapFragment(fragment);
      context.save();
      context.font = `${fragment.size}px ${fontStack}`;
      context.fillStyle = fragment.accent
        ? `rgba(220, 194, 155, ${fragment.alpha})`
        : `rgba(214, 225, 238, ${fragment.alpha})`;
      context.shadowBlur = fragment.accent ? 12 : 0;
      context.shadowColor = fragment.accent ? "rgba(220, 194, 155, 0.12)" : "transparent";
      context.fillText(fragment.text, fragment.x, fragment.y);
      context.restore();
    });
  }

  function drawScene(timestamp) {
    const deltaSeconds = Math.min((timestamp - lastTime) / 1000 || 0, 0.032);
    lastTime = timestamp;
    context.clearRect(0, 0, width, height);
    drawBackgroundGlow();
    drawNodes(timestamp);
    drawFragments(deltaSeconds);
  }

  function animate(timestamp) {
    drawScene(timestamp);
    animationId = window.requestAnimationFrame(animate);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  if (!reduceMotion) {
    animationId = window.requestAnimationFrame(animate);
    reduceMotionQuery.addEventListener("change", (event) => {
      if (event.matches) {
        window.cancelAnimationFrame(animationId);
        drawScene(0);
      }
    });
  }
})();
