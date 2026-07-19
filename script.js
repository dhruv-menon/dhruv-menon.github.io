const tocList = document.getElementById("toc-list");
const headers = document.querySelectorAll("h2");
const contentScroll = document.querySelector(".content-scroll");

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

const latentPanel = document.querySelector(".latent-panel");

if (latentPanel) {
  const atoms = Array.from(latentPanel.querySelectorAll("[data-latent-node]")).map((element) => ({
    element,
    baseX: Number(element.dataset.x),
    baseY: Number(element.dataset.y),
    x: Number(element.dataset.x),
    y: Number(element.dataset.y),
    pull: Number(element.dataset.pull),
  }));
  const bonds = Array.from(latentPanel.querySelectorAll("[data-latent-bond]")).map((element) => {
    const [from, to] = element.dataset.latentBond.split("-").map(Number);
    return { element, from, to, base: element.dataset.baseBond === "true" };
  });
  const pointer = { x: 500, y: 170, active: false };
  let frame = 0;

  const setPointer = (event) => {
    const rect = latentPanel.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 1000;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 340;
    pointer.active = true;
  };

  latentPanel.addEventListener("pointermove", setPointer);
  latentPanel.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  const renderLatentSpace = () => {
    frame += 0.035;

    atoms.forEach((atom, index) => {
      const dx = pointer.x - atom.baseX;
      const dy = pointer.y - atom.baseY;
      const distance = Math.hypot(dx, dy);
      const influence = pointer.active ? atom.pull * Math.exp(-distance / 420) : 0;
      const driftX = Math.sin(frame + index * 1.7) * 5;
      const driftY = Math.cos(frame * 0.8 + index) * 4;
      const targetX = atom.baseX + dx * influence + driftX;
      const targetY = atom.baseY + dy * influence + driftY;

      atom.x += (targetX - atom.x) * 0.08;
      atom.y += (targetY - atom.y) * 0.08;
      atom.element.setAttribute("cx", atom.x.toFixed(2));
      atom.element.setAttribute("cy", atom.y.toFixed(2));
    });

    bonds.forEach((bond) => {
      const from = atoms[bond.from];
      const to = atoms[bond.to];
      const midpointX = (from.x + to.x) / 2;
      const midpointY = (from.y + to.y) / 2;
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      const cursorDistance = Math.hypot(pointer.x - midpointX, pointer.y - midpointY);
      const joined = pointer.active ? Math.max(0, 1 - cursorDistance / 190) : 0;
      const close = Math.max(0, 1 - (length - 145) / 115);
      const opacity = bond.base ? Math.max(0.12, Math.min(0.78, close + joined * 0.35)) : Math.min(0.62, close * joined);

      bond.element.setAttribute("x1", from.x.toFixed(2));
      bond.element.setAttribute("y1", from.y.toFixed(2));
      bond.element.setAttribute("x2", to.x.toFixed(2));
      bond.element.setAttribute("y2", to.y.toFixed(2));
      bond.element.style.opacity = opacity.toFixed(2);
      bond.element.style.strokeWidth = (2 + opacity * 3).toFixed(2);
    });

    requestAnimationFrame(renderLatentSpace);
  };

  renderLatentSpace();
}
