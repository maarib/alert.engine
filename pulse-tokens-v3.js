/* ============================================================================
   Pulse Design System v3 — token engine (light + dark, editable)
   ----------------------------------------------------------------------------
   Superset of v2: keeps every color/font/type-scale/radius/shadow token, and
   adds the categories v2 didn't cover — spacing, font-weight, line-height,
   letter-spacing, motion (duration/easing) and z-index. All new categories are
   shared across themes (not re-colored by light/dark) except where noted.

   - LIGHT holds every light-mode value (colors + all shared scales).
   - DARK is the full dark-mode map (light values + dark overrides merged).
   - Overrides stored per-theme: { light:{…}, dark:{…} } in localStorage,
     keyed 'pulse.tokens.v3' (independent from v1/v2 so nothing collides).
   - apply() writes resolved LIGHT to :root inline AND rebuilds a
     <style id="pulse-dark-vars"> for [data-pulse-theme="dark"] — both the app
     and this page repaint instantly, in the right theme, no reload.
   ========================================================================== */
(function (root) {
  'use strict';

  var KEY = 'pulse.tokens.v3';
  var DARK_STYLE_ID = 'pulse-dark-vars';

  // ---- LIGHT (shipped light-mode values) -----------------------------------
  var LIGHT = {
    /* ink / neutral */
    '--ink-900': '#15181D', '--ink-800': '#2A2E35', '--ink-700': '#3A3F47',
    '--ink-650': '#54585F', '--ink-600': '#646B76', '--ink-500': '#888F99',
    '--ink-400': '#9AA1AC', '--ink-300': '#C5CCD6', '--ink-200': '#D7DCE4',
    /* surface */
    '--surface-app': '#F4F5F7', '--surface-card': '#FFFFFF',
    '--surface-subtle': '#F1F3F7', '--surface-muted': '#EDEFF3',
    '--surface-inset': '#EEF0F4', '--surface-hover': '#E9ECF1',
    '--surface-thumb': '#F4F6F9',
    /* border */
    '--border-strong': '#E5E8EE', '--border-faint': '#EFF1F5',
    /* accent */
    '--accent': '#3B63D6', '--accent-strong': '#2F50B8',
    '--accent-soft': '#5B7EE0', '--accent-tint': '#E6EDFB',
    /* positive */
    '--pos': '#0E7A4F', '--pos-bright': '#16A06A',
    '--pos-tint': '#DCF1E8', '--pos-tint-2': '#E7F4EC',
    /* negative */
    '--neg': '#991B1B', '--neg-alt': '#9B2C2C',
    '--neg-tint': '#FBEAEA', '--neg-tint-2': '#FBF1F1',
    /* warning */
    '--warn': '#D97706', '--warn-deep': '#92400E',
    '--warn-tint': '#FFFBEB', '--warn-line': '#FDE68A',
    /* inverse / tooltip */
    '--scrim': '#1B1E24', '--tip-bg': '#1B1E24', '--tip-fg': '#F4F5F7',
    /* categorical */
    '--cat-1': '#3B63D6', '--cat-2': '#6366F1', '--cat-3': '#0891B2',
    '--cat-4': '#7C3AED', '--cat-5': '#DB2777', '--cat-6': '#EA580C',
    '--cat-7': '#0E7A4F', '--cat-8': '#CA8A04', '--cat-9': '#0D9488',
    /* typography — families */
    '--font-ui': "'Saans', system-ui, sans-serif",
    '--font-display': "'Saans', system-ui, sans-serif",
    '--font-numeric': "'Space Grotesk', sans-serif",
    '--font-mono': "'JetBrains Mono', monospace",
    /* typography — scale */
    '--text-2xs': '10px', '--text-xs': '11px', '--text-sm': '12px',
    '--text-base': '13px', '--text-md': '14px', '--text-lg': '15px',
    '--text-xl': '16px', '--text-2xl': '18px', '--text-3xl': '22px',
    '--text-4xl': '24px',
    /* typography — weight */
    '--fw-regular': '400', '--fw-medium': '500', '--fw-semibold': '600',
    '--fw-bold': '700', '--fw-heavy': '800',
    /* typography — line-height */
    '--lh-tight': '1.15', '--lh-snug': '1.3', '--lh-normal': '1.5', '--lh-relaxed': '1.6',
    /* typography — letter-spacing */
    '--tracking-tight': '-0.02em', '--tracking-snug': '-0.01em', '--tracking-normal': '0em',
    '--tracking-wide': '0.03em', '--tracking-wider': '0.06em', '--tracking-widest': '0.1em',
    /* spacing */
    '--space-1': '4px', '--space-2': '8px', '--space-3': '12px', '--space-4': '16px',
    '--space-5': '20px', '--space-6': '24px', '--space-7': '28px', '--space-8': '32px',
    '--space-10': '40px', '--space-12': '48px', '--space-16': '64px',
    /* radii */
    '--radius-xs': '4px', '--radius-sm': '8px', '--radius-md': '10px',
    '--radius-base': '11px', '--radius-lg': '13px', '--radius-xl': '16px',
    '--radius-2xl': '18px', '--radius-pill': '999px',
    /* shadows */
    '--shadow-sm': '0 1px 2px rgba(17,24,39,.04)',
    '--shadow-xs': '0 1px 2px rgba(17,24,39,.05)',
    '--shadow-card': '0 1px 2px rgba(17,24,39,.05), 0 14px 34px rgba(17,24,39,.05)',
    '--shadow-card-hover': '0 1px 2px rgba(17,24,39,.05), 0 10px 28px rgba(17,24,39,.04)',
    '--shadow-pop': '0 20px 60px rgba(17,24,39,.16)',
    '--shadow-menu': '0 24px 60px rgba(17,24,39,.20)',
    '--shadow-modal': '0 30px 80px rgba(17,24,39,.3)',
    /* motion */
    '--duration-fast': '120ms', '--duration-base': '180ms', '--duration-slow': '340ms',
    '--ease-standard': 'cubic-bezier(.4,0,.2,1)', '--ease-out': 'cubic-bezier(0,0,.2,1)',
    /* z-index — matched to the app's real stacking order, not an invented scale */
    '--z-decor': '2', '--z-sticky': '30', '--z-modal': '200', '--z-modal-alt': '210',
    '--z-dropdown': '390', '--z-palette': '500', '--z-menu': '555', '--z-tooltip': '600',
    /* layout — page container & navbar */
    '--content-w': '80%', '--content-w-wide': '90%', '--content-w-compact': '80%',
    '--nav-w': '90%', '--nav-height': '60px', '--layout-min-width': '1140px'
  };

  // ---- DARK overrides (only the tokens that differ in dark mode) -----------
  var DARK_DIFF = {
    '--ink-900': '#F4F6FA', '--ink-800': '#E6E9EF', '--ink-700': '#D3D8E0',
    '--ink-650': '#BBC1CC', '--ink-600': '#A2A9B5', '--ink-500': '#858C98',
    '--ink-400': '#6E7681', '--ink-300': '#4C525C', '--ink-200': '#3B414A',
    '--surface-app': '#15171B', '--surface-card': '#1E2127',
    '--surface-subtle': '#22262D', '--surface-muted': '#282C34',
    '--surface-inset': '#22262D', '--surface-hover': '#2C313A',
    '--surface-thumb': '#1E2127',
    '--border-strong': '#2E333C', '--border-faint': '#262A31',
    '--accent-tint': '#1C2A47',
    '--pos-tint': '#14271F', '--pos-tint-2': '#16281F',
    '--neg-tint': '#2C1919', '--neg-tint-2': '#2A1A1A',
    '--warn-tint': '#2A2413', '--warn-line': '#4A3E1C',
    '--scrim': '#05070A', '--tip-bg': '#EDEFF4', '--tip-fg': '#15171B',
    '--shadow-card': '0 1px 2px rgba(0,0,0,.4), 0 14px 34px rgba(0,0,0,.35)',
    '--shadow-card-hover': '0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.3)',
    '--shadow-pop': '0 20px 60px rgba(0,0,0,.5)',
    '--shadow-menu': '0 24px 60px rgba(0,0,0,.55)',
    '--shadow-modal': '0 30px 80px rgba(0,0,0,.6)'
  };
  // full dark map = light values + dark overrides
  var DARK = (function () { var o = {}, k; for (k in LIGHT) o[k] = LIGHT[k]; for (k in DARK_DIFF) o[k] = DARK_DIFF[k]; return o; })();

  // ---- GROUPS (catalog rendered by the design-system page) -----------------
  // kind: 'color' | 'font' | 'size' | 'radius' | 'shadow' | 'weight' | 'lineheight' | 'tracking' | 'duration' | 'zindex'
  // themed:true  → color has a distinct dark value (editable per theme)
  // unit         → suffix shown next to numeric editors ('px','ms','', 'em')
  var GROUPS = [
    { id: 'ink', title: 'Ink & Neutral', kind: 'color', themed: true,
      blurb: 'Text and neutral strokes, darkest to faintest. The backbone of every label, value and divider — inverted for dark mode.',
      tokens: [
        ['--ink-900', 'Primary text'], ['--ink-800', 'Body strong'],
        ['--ink-700', 'Body'], ['--ink-650', 'Muted control text'],
        ['--ink-600', 'Secondary text'], ['--ink-500', 'Tertiary text'],
        ['--ink-400', 'Muted / placeholder'], ['--ink-300', 'Disabled / faint'],
        ['--ink-200', 'Track / volume bars'] ] },
    { id: 'surface', title: 'Surface', kind: 'color', themed: true,
      blurb: 'Backgrounds, from the app canvas up through cards, fills and hover states.',
      tokens: [
        ['--surface-app', 'App canvas'], ['--surface-card', 'Card / panel'],
        ['--surface-subtle', 'Subtle fill / hover'], ['--surface-muted', 'Muted fill / divider'],
        ['--surface-inset', 'Inset (keycap, chips)'], ['--surface-hover', 'Row hover'],
        ['--surface-thumb', 'Thumbnail backing'] ] },
    { id: 'border', title: 'Border', kind: 'color', themed: true,
      blurb: 'Hairline strokes separating surfaces.',
      tokens: [ ['--border-strong', 'Default border'], ['--border-faint', 'Faint divider'] ] },
    { id: 'accent', title: 'Accent', kind: 'color', themed: true,
      blurb: 'The Pulse blue — links, active nav, primary actions and focus.',
      tokens: [
        ['--accent', 'Primary accent'], ['--accent-strong', 'Pressed / link'],
        ['--accent-soft', 'Muted accent'], ['--accent-tint', 'Accent surface'] ] },
    { id: 'pos', title: 'Positive', kind: 'color', themed: true,
      blurb: 'Gains, upside and confirmation.',
      tokens: [
        ['--pos', 'Gains text'], ['--pos-bright', 'Gains bar'],
        ['--pos-tint', 'Gains surface'], ['--pos-tint-2', 'Gains surface alt'] ] },
    { id: 'neg', title: 'Negative', kind: 'color', themed: true,
      blurb: 'Losses, danger and destructive actions.',
      tokens: [
        ['--neg', 'Loss text'], ['--neg-alt', 'Alert / danger'],
        ['--neg-tint', 'Loss surface'], ['--neg-tint-2', 'Loss surface alt'] ] },
    { id: 'warn', title: 'Warning', kind: 'color', themed: true,
      blurb: 'Caution, unusual activity and review states.',
      tokens: [
        ['--warn', 'Caution text'], ['--warn-deep', 'Caution deep'],
        ['--warn-tint', 'Caution surface'], ['--warn-line', 'Caution border'] ] },
    { id: 'inverse', title: 'Inverse & Tooltip', kind: 'color', themed: true,
      blurb: 'Contrast surfaces — the scrim and the tooltip pair. In dark mode the tooltip flips to a light chip so it never reads dark-on-dark.',
      tokens: [ ['--scrim', 'Inverse surface'], ['--tip-bg', 'Tooltip background'], ['--tip-fg', 'Tooltip text'] ] },
    { id: 'cat', title: 'Categorical', kind: 'color', themed: false,
      blurb: 'A nine-step qualitative ramp for sectors, avatars and any series that needs distinct, non-ranked hues. Shared across both themes.',
      tokens: [
        ['--cat-1', 'Series 1'], ['--cat-2', 'Series 2'], ['--cat-3', 'Series 3'],
        ['--cat-4', 'Series 4'], ['--cat-5', 'Series 5'], ['--cat-6', 'Series 6'],
        ['--cat-7', 'Series 7'], ['--cat-8', 'Series 8'], ['--cat-9', 'Series 9'] ] },
    { id: 'fonts', title: 'Typefaces', kind: 'font',
      blurb: 'Saans carries the entire interface — body, labels and headings. Space Grotesk is reserved for the big display numerals only (portfolio value, account value, share price). JetBrains Mono marks code and keys.',
      tokens: [
        ['--font-ui', 'Interface / body — Saans'], ['--font-display', 'Headings — Saans'],
        ['--font-numeric', 'Display numerals — Space Grotesk'], ['--font-mono', 'Code / keycaps'] ] },
    { id: 'scale', title: 'Type scale', kind: 'size', unit: 'px',
      blurb: 'A 10–24px ramp covering captions through card titles. Larger hero numerals are set ad-hoc in Space Grotesk.',
      tokens: [
        ['--text-2xs', 'Micro-labels, uppercase eyebrows'], ['--text-xs', 'Captions, meta'],
        ['--text-sm', 'Secondary text'], ['--text-base', 'Body default'],
        ['--text-md', 'Emphasised body'], ['--text-lg', 'List titles'],
        ['--text-xl', 'Card titles'], ['--text-2xl', 'Section titles'],
        ['--text-3xl', 'Page titles'], ['--text-4xl', 'Display headings'] ] },
    { id: 'weight', title: 'Font weight', kind: 'weight', unit: '',
      blurb: 'Five weights, used consistently: regular for body copy, medium for secondary labels, semibold for emphasis and active states, bold for values, heavy for hero numerals.',
      tokens: [
        ['--fw-regular', 'Body copy'], ['--fw-medium', 'Secondary labels, inactive nav'],
        ['--fw-semibold', 'Emphasis, active states, buttons'], ['--fw-bold', 'Values, tickers'],
        ['--fw-heavy', 'Hero numerals, page titles'] ] },
    { id: 'leading', title: 'Line height', kind: 'lineheight', unit: '', min: 1, max: 2, step: 0.05,
      blurb: 'Unitless line-height ramp — tight for large display numerals, relaxed for multi-line body copy.',
      tokens: [
        ['--lh-tight', 'Display numerals, single-line headings'], ['--lh-snug', 'Card titles'],
        ['--lh-normal', 'Body copy'], ['--lh-relaxed', 'Long-form / help text'] ] },
    { id: 'tracking', title: 'Letter spacing', kind: 'tracking', unit: 'em', min: -0.03, max: 0.12, step: 0.005,
      blurb: 'From tight display headings to widely-tracked uppercase eyebrows.',
      tokens: [
        ['--tracking-tight', 'Large display headings'], ['--tracking-snug', 'Card / section titles'],
        ['--tracking-normal', 'Body copy'], ['--tracking-wide', 'Ticker symbols'],
        ['--tracking-wider', 'Small caps labels'], ['--tracking-widest', 'Uppercase eyebrows'] ] },
    { id: 'spacing', title: 'Spacing', kind: 'size', unit: 'px', min: 0, max: 96,
      blurb: 'A 4px-based scale driving padding, margin and gap. Reach for the nearest step rather than a bespoke number.',
      tokens: [
        ['--space-1', 'Icon-to-label gaps'], ['--space-2', 'Tight stacks, chip padding'],
        ['--space-3', 'Control padding'], ['--space-4', 'Default gap, card padding (tight)'],
        ['--space-5', 'Row padding'], ['--space-6', 'Card padding (standard)'],
        ['--space-7', 'Section padding (tight)'], ['--space-8', 'Card padding (roomy)'],
        ['--space-10', 'Section padding'], ['--space-12', 'Page gutters'],
        ['--space-16', 'Page section spacing'] ] },
    { id: 'radius', title: 'Radius', kind: 'radius', unit: 'px',
      blurb: 'Corner rounding, from badges to large panels. Drag any step to set the overall softness of the UI.',
      tokens: [
        ['--radius-xs', 'Badges, tags'], ['--radius-sm', 'Buttons, pills'],
        ['--radius-md', 'Small chips'], ['--radius-base', 'Inputs, controls'],
        ['--radius-lg', 'Icon tiles'], ['--radius-xl', 'Cards'],
        ['--radius-2xl', 'Large panels'], ['--radius-pill', 'Fully round'] ] },
    { id: 'shadow', title: 'Elevation', kind: 'shadow', themed: true,
      blurb: 'A soft shadow ramp — flat at rest, lifting for popovers and modals. Dark mode deepens the tint for the same felt elevation.',
      tokens: [
        ['--shadow-sm', 'Resting hairline'], ['--shadow-xs', 'Resting card'],
        ['--shadow-card', 'Standard card'], ['--shadow-card-hover', 'Card hover'],
        ['--shadow-pop', 'Popover'], ['--shadow-menu', 'Menu'],
        ['--shadow-modal', 'Modal / dialog'] ] },
    { id: 'motion', title: 'Motion', kind: 'duration', unit: 'ms', min: 0, max: 600,
      blurb: 'Two easing curves and three durations cover every hover, toggle and panel transition in the app.',
      tokens: [
        ['--duration-fast', 'Color / small state changes'], ['--duration-base', 'Panels, toggles'],
        ['--duration-slow', 'Ticker show/hide, large panels'] ] },
    { id: 'zindex', title: 'Z-index', kind: 'zindex', unit: '', min: 0, max: 700, step: 1,
      blurb: 'The app\'s real stacking order — sticky bars lowest, then modal scrims, dropdown scrims, the search palette, popover menus, and tooltips always on top.',
      tokens: [
        ['--z-decor', 'Decorative overlays (ticker edge fades)'], ['--z-sticky', 'Sticky sub-bars'],
        ['--z-modal', 'Modal scrims & dialogs'], ['--z-modal-alt', 'Stacked modal (rename dialog)'],
        ['--z-dropdown', 'Dropdown / menu scrims'], ['--z-palette', 'Search command palette'],
        ['--z-menu', 'Add-to-watchlist menu'], ['--z-tooltip', 'Tooltips'] ] },
    { id: 'layout-width', title: 'Layout · Container width', kind: 'size', unit: '%', min: 50, max: 100, step: 1,
      blurb: 'Width of the centered content column, as a percentage of viewport. Every app page shares one of these — drag to see it ripple everywhere at once.',
      tokens: [
        ['--content-w', 'Standard page width (most pages)'],
        ['--content-w-wide', 'Wide page width (Discover)'],
        ['--content-w-compact', 'Compact width — viewports under 1300px'],
        ['--nav-w', 'Navbar inner row width'] ] },
    { id: 'layout-size', title: 'Layout · Fixed sizes', kind: 'size', unit: 'px', min: 40, max: 1400, step: 10,
      blurb: 'The navbar\'s fixed height, and the shared minimum width below which the container and navbar stop shrinking and start scrolling instead.',
      tokens: [
        ['--nav-height', 'Navbar height'],
        ['--layout-min-width', 'Shared min-width — container & navbar row'] ] }
  ];

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY)) || {};
      if (!raw.light) raw.light = {};
      if (!raw.dark) raw.dark = {};
      return raw;
    } catch (e) { return { light: {}, dark: {} }; }
  }
  function defaults(theme) { return theme === 'dark' ? DARK : LIGHT; }
  function resolved(theme) {
    var base = defaults(theme), ov = load()[theme] || {}, o = {}, k;
    for (k in base) o[k] = base[k];
    for (k in ov) if (k in base) o[k] = ov[k];
    return o;
  }
  function ensureDarkStyle() {
    var el = document.getElementById(DARK_STYLE_ID);
    if (!el) { el = document.createElement('style'); el.id = DARK_STYLE_ID; document.head.appendChild(el); }
    return el;
  }
  function apply() {
    // light → :root inline props
    var lite = resolved('light'), el = document.documentElement, k;
    for (k in lite) el.style.setProperty(k, lite[k]);
    // dark → injected style rule scoped to the themed subtree
    var dark = resolved('dark'), css = '[data-pulse-theme="dark"]{';
    for (k in dark) css += k + ':' + dark[k] + ';';
    css += '}';
    ensureDarkStyle().textContent = css;
  }
  function save(overrides) {
    var cur = load();
    if (overrides) { cur = overrides; }
    if (!cur.light) cur.light = {};
    if (!cur.dark) cur.dark = {};
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    apply();
    try { window.dispatchEvent(new CustomEvent('pulse-tokens-changed')); } catch (e) {}
  }
  function setToken(theme, name, val) {
    var cur = load();
    var base = defaults(theme);
    if (val === base[name]) delete cur[theme][name]; else cur[theme][name] = val;
    save(cur);
  }
  function reset() { save({ light: {}, dark: {} }); }
  function get(name, theme) { return resolved(theme || 'light')[name]; }

  var API = {
    KEY: KEY, LIGHT: LIGHT, DARK: DARK, DEFAULTS: LIGHT, GROUPS: GROUPS,
    load: load, defaults: defaults, resolved: resolved,
    apply: apply, save: save, setToken: setToken, reset: reset, get: get,
    init: function () {
      apply();
      window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
    }
  };

  root.PulseTokens = API;
  if (document.documentElement) API.init();
  else document.addEventListener('DOMContentLoaded', API.init);
})(window);
