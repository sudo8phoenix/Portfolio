'use strict';
// One 24px outline vocabulary for controls and technology categories.
const portfolioIconPaths = {
 code:'<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
 nodes:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 5h10M6 7l5 10m7-10-5 10"/>',
 atom:'<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1"/>',
 bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
 database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
 flame:'<path d="M12 3c1 5-4 6-4 10 0 3 4 5 6 2 1-2 0-3 0-3 3 2 5 4 4 6-3 6-13 3-13-3 0-4 5-7 7-12Z"/>',
 chart:'<path d="M4 3v17h17M8 15v-4m5 4V7m5 8v-6"/>',
 boxes:'<rect x="3" y="5" width="7" height="6" rx="1"/><rect x="14" y="5" width="7" height="6" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="15" width="7" height="6" rx="1"/>',
 'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 'arrow-left':'<path d="M20 12H4m6-6-6 6 6 6"/>',
 'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 quote:'<path d="M4 5h6v7H6c0 4-2 5-3 6m11-13h6v7h-4c0 4-2 5-3 6"/>',
 music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
 replay:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 volume:'<path d="M3 9v6h4l5 4V5L7 9H3Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 'volume-off':'<path d="M3 9v6h4l5 4V5L7 9H3Zm13 1 5 5m0-5-5 5"/>'
};
window.portfolioIcon = name => '<svg class="ui-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(portfolioIconPaths[name] || portfolioIconPaths['arrow-right'])+'</svg>';
document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=window.portfolioIcon(el.dataset.icon);});
