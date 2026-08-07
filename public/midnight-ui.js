const siteHeader = document.querySelector('.site-header');

function syncHeader() {
  siteHeader?.classList.toggle('scrolled', window.scrollY > 12);
}

window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

const revealNodes = document.querySelectorAll('.editorial-reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px -24px' });

  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('visible'));
}
