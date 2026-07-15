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
