// Navigation enhances the static document; all content works without JavaScript.
const sectionLinks = [...document.querySelectorAll('.case-nav a')];
const sections = sectionLinks.map(link => document.querySelector(link.hash));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of sectionLinks) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-10% 0px -55% 0px' });
  sections.filter(Boolean).forEach(section => observer.observe(section));
}
