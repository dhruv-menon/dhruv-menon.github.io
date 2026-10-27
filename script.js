const tocList = document.getElementById("toc-list");
const headers = document.querySelectorAll("h2");
const contentScroll = document.querySelector(".content-scroll");
const themeToggle = document.querySelector(".theme-toggle");

const applyTheme = (theme) => {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  themeToggle?.setAttribute("aria-pressed", String(dark));
};

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

themeToggle?.addEventListener("click", () => {
  const theme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});

if (tocList && contentScroll && headers.length) {
  headers.forEach((header) => {
    const link = document.createElement("a");
    link.textContent = header.textContent.toLowerCase();

    if (!header.id) {
      header.id = header.textContent.toLowerCase().replace(/\s+/g, "-");
    }

    link.href = `#${header.id}`;
    tocList.appendChild(link);
  });

  const navLinks = tocList.querySelectorAll("a");

  const updateActiveSection = () => {
    let index = 0;
    const viewportOffset = window.innerHeight / 6 + 1;

    headers.forEach((header, headerIndex) => {
      if (contentScroll.scrollTop + viewportOffset >= header.offsetTop) {
        index = headerIndex;
      }
    });

    navLinks.forEach((link) => link.classList.remove("active"));
    navLinks[index].classList.add("active");
  };

  contentScroll.addEventListener("scroll", updateActiveSection);
  updateActiveSection();

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(link.getAttribute("href").slice(1));

      if (target) {
        contentScroll.scrollTo({
          top: target.offsetTop - window.innerHeight / 6,
          behavior: "smooth",
        });
      }
    });
  });
}

const profileFrame = document.querySelector(".profile-frame");

if (profileFrame) {
  const reveal = profileFrame.querySelector(".profile-reveal");
  // Only enable the reveal once the photo has actually loaded.
  const enableReveal = () => profileFrame.classList.add("has-reveal");

  if (reveal?.complete && reveal.naturalWidth) {
    enableReveal();
  } else {
    reveal?.addEventListener("load", enableReveal);
  }

  profileFrame.addEventListener("pointerenter", (event) => {
    const rect = profileFrame.getBoundingClientRect();
    profileFrame.style.setProperty("--reveal-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    profileFrame.style.setProperty("--reveal-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  });

  // Touch screens have no hover, so a tap toggles the photo instead.
  profileFrame.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") profileFrame.classList.toggle("revealed");
  });
}

const updatesPanel = document.querySelector(".updates-panel");

if (updatesPanel) {
  const moreButton = updatesPanel.querySelector(".updates-more");
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  moreButton?.addEventListener("click", () => {
    const expanded = updatesPanel.classList.toggle("expanded");
    moreButton.setAttribute("aria-expanded", String(expanded));
    moreButton.textContent = expanded ? "Show fewer" : "Show all updates";
  });

  // On phones the panel reads best straight after About, not at the very end.
  const placeUpdates = () => {
    const interests = document.getElementById("interests");

    if (mobileQuery.matches && interests) {
      interests.before(updatesPanel);
    } else if (contentScroll) {
      contentScroll.after(updatesPanel);
    }
  };

  mobileQuery.addEventListener("change", placeUpdates);
  placeUpdates();
}

const latentPanel = document.querySelector(".latent-panel");

if (latentPanel) {
  const svg = latentPanel.querySelector(".latent-svg");
  const svgNS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 520, y: 210, active: false };
  const centre = { x: 520, y: 210 };

  const make = (tag, parent, attrs = {}) => {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    parent.appendChild(element);
    return element;
  };
  const rand = (min, max) => min + Math.random() * (max - min);
  const drift = () => ({
    ax: rand(16, 38),
    ay: rand(12, 28),
    fx: rand(0.22, 0.55),
    fy: rand(0.18, 0.5),
    px: rand(0, Math.PI * 2),
    py: rand(0, Math.PI * 2),
  });

  // Ink lumps are blurred together by the goo filter into one organic mass.
  // The last lump follows the cursor, so it can pull a strand out of the ink.
  const inkLayer = svg.querySelector(".latent-ink");
  const pointLayer = svg.querySelector(".latent-points");
  const bondLayer = svg.querySelector(".latent-bonds");
  const lumps = [
    [430, 190, 78],
    [520, 150, 62],
    [600, 205, 86],
    [515, 270, 68],
    [680, 140, 50],
    [365, 250, 46],
    [655, 292, 54],
  ].map(([x, y, r]) => ({ x, y, r, bx: x, by: y, tx: x, ty: y, ...drift() }));
  lumps.push({ x: centre.x, y: centre.y, r: 34, query: true });

  lumps.forEach((lump) => {
    lump.blob = make("circle", inkLayer, { r: lump.r });
    lump.point = make("circle", pointLayer, lump.query ? { r: 7, class: "latent-query" } : { r: 4.5 });
  });

  const bonds = [];
  lumps.forEach((a, i) => {
    lumps.slice(i + 1).forEach((b) => bonds.push({ a, b, line: make("line", bondLayer) }));
  });

  // Coloured modes are smooth closed curves whose radius wobbles with angle.
  const modeLayer = svg.querySelector(".latent-modes");
  const modes = [
    [300, 268, 46],
    [645, 112, 30],
    [700, 290, 40],
  ].map(([x, y, r]) => ({
    x,
    y,
    r,
    bx: x,
    by: y,
    tx: x,
    ty: y,
    ...drift(),
    w1: rand(0.3, 0.6),
    w2: rand(0.2, 0.5),
    path: make("path", modeLayer),
  }));

  const blobPath = (cx, cy, radiusAt) => {
    const count = 12;
    const points = Array.from({ length: count }, (_, k) => {
      const angle = (k / count) * Math.PI * 2;
      const radius = radiusAt(angle);
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
    });
    const at = (k) => points[(k + count) % count];
    let d = `M${at(0)[0].toFixed(1)} ${at(0)[1].toFixed(1)}`;

    for (let k = 0; k < count; k += 1) {
      const [p0, p1, p2, p3] = [at(k - 1), at(k), at(k + 1), at(k + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }

    return `${d}Z`;
  };

  // Clicking draws a fresh sample: every lump and mode glides to a new home.
  const sample = () => {
    lumps.forEach((lump) => {
      if (lump.query) return;
      const angle = rand(0, Math.PI * 2);
      const spread = Math.sqrt(Math.random());
      lump.tx = centre.x + Math.cos(angle) * spread * 190;
      lump.ty = centre.y + Math.sin(angle) * spread * 80;
      Object.assign(lump, drift());
    });
    modes.forEach((mode) => {
      mode.tx = rand(240, 780);
      mode.ty = rand(95, 320);
    });
  };

  const setPointer = (event) => {
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = true;
  };

  latentPanel.addEventListener("pointermove", setPointer);
  latentPanel.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
  latentPanel.addEventListener("click", sample);
  latentPanel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      sample();
    }
  });

  const render = (now) => {
    const t = reduceMotion ? 0 : now / 1000;
    const pull = (x, y, strength, reach) => {
      if (!pointer.active) return [0, 0];
      const dx = pointer.x - x;
      const dy = pointer.y - y;
      const influence = strength * Math.exp(-Math.hypot(dx, dy) / reach);
      return [dx * influence, dy * influence];
    };

    lumps.forEach((lump) => {
      let targetX;
      let targetY;

      if (lump.query) {
        targetX = pointer.active ? pointer.x : centre.x;
        targetY = pointer.active ? pointer.y : centre.y;
      } else {
        lump.bx += (lump.tx - lump.bx) * 0.03;
        lump.by += (lump.ty - lump.by) * 0.03;
        const [px, py] = pull(lump.bx, lump.by, 0.16, 260);
        targetX = lump.bx + Math.sin(t * lump.fx + lump.px) * lump.ax + px;
        targetY = lump.by + Math.cos(t * lump.fy + lump.py) * lump.ay + py;
      }

      lump.x += (targetX - lump.x) * (lump.query ? 0.09 : 0.1);
      lump.y += (targetY - lump.y) * (lump.query ? 0.09 : 0.1);
      lump.blob.setAttribute("cx", lump.x.toFixed(1));
      lump.blob.setAttribute("cy", lump.y.toFixed(1));
      lump.point.setAttribute("cx", lump.x.toFixed(1));
      lump.point.setAttribute("cy", lump.y.toFixed(1));
    });

    // Bonds only show where two lumps have merged into the same piece of ink.
    bonds.forEach(({ a, b, line }) => {
      const reach = (a.r + b.r) * 0.8;
      const opacity = Math.max(0, Math.min(0.85, (reach - Math.hypot(a.x - b.x, a.y - b.y)) / 40));
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", b.x.toFixed(1));
      line.setAttribute("y2", b.y.toFixed(1));
      line.style.opacity = opacity.toFixed(2);
    });

    modes.forEach((mode) => {
      mode.bx += (mode.tx - mode.bx) * 0.025;
      mode.by += (mode.ty - mode.by) * 0.025;
      const [px, py] = pull(mode.bx, mode.by, 0.12, 300);
      mode.x += (mode.bx + Math.sin(t * mode.fx + mode.px) * mode.ax * 0.6 + px - mode.x) * 0.08;
      mode.y += (mode.by + Math.cos(t * mode.fy + mode.py) * mode.ay * 0.6 + py - mode.y) * 0.08;

      const towards = Math.atan2(pointer.y - mode.y, pointer.x - mode.x);
      const near = pointer.active ? Math.exp(-Math.hypot(pointer.x - mode.x, pointer.y - mode.y) / 220) : 0;

      mode.path.setAttribute(
        "d",
        blobPath(mode.x, mode.y, (angle) => {
          const lean = near * 0.32 * Math.max(0, Math.cos(angle - towards)) ** 3;
          const wobble = 0.1 * Math.sin(2 * angle + mode.px + t * mode.w1) + 0.06 * Math.sin(3 * angle + mode.py - t * mode.w2);
          return mode.r * (1 + wobble + lean);
        }),
      );
    });

    if (visible) frame = requestAnimationFrame(render);
  };

  // Only animate while the panel is on screen.
  let visible = false;
  let frame = 0;

  new IntersectionObserver(([entry]) => {
    const wasVisible = visible;
    visible = entry.isIntersecting;
    if (visible && !wasVisible) frame = requestAnimationFrame(render);
    if (!visible) cancelAnimationFrame(frame);
  }).observe(latentPanel);

  render(0);
}
