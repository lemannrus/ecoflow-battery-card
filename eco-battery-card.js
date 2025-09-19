/*
 * Eco Battery Card for Home Assistant (no build step, HACS-friendly)
 * Author: ChatGPT (for Alex, who likes order in the battery chaos)
 * Version: 0.2.0
 *
 * Config example:
 * type: custom:eco-battery-card
 * entity: sensor.ecoflow_battery
 * name: EcoFlow Delta 2
 * green: 60        # green threshold (for palette: 'threshold')
 * yellow: 25       # yellow threshold (for palette: 'threshold')
 * palette: gradient  # 'threshold' | 'gradient'
 * segments: 5      # number of battery segments
 * gap: 3           # gap between segments in px
 * precision: 0
 * show_state: true
 * invert: false
 */

/* Lit helpers from HA (pattern used by many cards) */
const LitBase = customElements.get('ha-panel-lovelace')
  ? Object.getPrototypeOf(customElements.get('ha-panel-lovelace'))
  : Object.getPrototypeOf(customElements.get('hui-masonry-view'));

const html = LitBase.prototype.html;
const css = LitBase.prototype.css;
const svg = LitBase.prototype.svg || ((strings, ...values) => strings.raw ? strings : strings);

class EcoBatteryCard extends LitBase {
  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error('You must specify an entity with a battery percentage (0..100).');
    }
    this._config = {
      name: config.name || '',
      entity: config.entity,
      green: typeof config.green === 'number' ? config.green : 60,
      yellow: typeof config.yellow === 'number' ? config.yellow : 25,
      show_state: config.show_state !== false,
      precision: typeof config.precision === 'number' ? config.precision : 0,
      invert: !!config.invert,
      palette: ['threshold','gradient'].includes(config.palette) ? config.palette : 'threshold',
      segments: Number.isFinite(config.segments) ? Math.max(1, Math.floor(config.segments)) : 5,
      gap: Number.isFinite(config.gap) ? Math.max(0, config.gap) : 3,
    };
  }

  getCardSize() { return 3; }

  _pct() {
    const st = this.hass?.states?.[this._config.entity];
    if (!st) return 0;
    let n = Number(st.state);
    if (Number.isNaN(n)) {
      n = Number(st.attributes?.battery ?? st.attributes?.level ?? 0);
    }
    if (this._config.invert) n = 100 - n;
    if (!Number.isFinite(n)) n = 0;
    return Math.max(0, Math.min(100, n));
  }

  _color(p) {
    if (this._config.palette === 'gradient') {
      // 0% -> красный (0deg), 100% -> зелёный (120deg)
      const h = Math.round((p / 100) * 120);
      return `hsl(${h} 65% 45%)`;
    }
    // threshold
    const y = this._config.yellow;
    const g = this._config.green;
    if (p < y) return 'var(--error-color, #e53935)';
    if (p < g) return 'var(--warning-color, #fbc02d)';
    return 'var(--success-color, #43a047)';
  }

  render() {
    if (!this._config) return html``;
    const pct = this._pct();
    const color = this._color(pct);

    // SVG geometry
    const W = 220; // total width
    const H = 130; // total height
    const PAD = 8; // compact outer padding
    const bodyX = PAD;
    const bodyY = PAD;
    const bodyW = 160;
    const bodyH = 90;

    const capW = 12;
    const capH = 28;
    const capX = bodyX + bodyW + 4;
    const capY = bodyY + (bodyH - capH) / 2;

    const innerX = bodyX + 6;
    const innerY = bodyY + 6;
    const innerW = bodyW - 12;
    const innerH = bodyH - 12;

    const label = this._config.name || this._friendlyName();
    const stateText = `${pct.toFixed(this._config.precision)}%`;

    // Battery segments (vertical columns), fill left-to-right
    const numSegments = this._config.segments;
    const gap = this._config.gap;
    const segmentW = (innerW - (numSegments - 1) * gap) / numSegments;

    const progressCols = (pct / 100) * numSegments; // how many columns correspond to percentage
    const fullCols = Math.floor(progressCols);
    const partialFrac = progressCols - fullCols; // 0..1 for the partially filled column

    const segments = [];
    const createRect = (attrs) => {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      for (const [k, v] of Object.entries(attrs)) {
        r.setAttribute(k, String(v));
      }
      return r;
    };
    for (let i = 0; i < numSegments; i++) {
      const x = innerX + i * (segmentW + gap);
      // column background
      segments.push(createRect({
        x, y: innerY, width: segmentW, height: innerH, rx: 3, ry: 3,
        fill: '#333333', class: 'segment', stroke: 'rgba(255,255,255,0.2)', 'stroke-width': 1,
      }));
      // fill left-to-right
      let w = 0;
      if (i < fullCols) {
        w = segmentW;
      } else if (i === fullCols && partialFrac > 0) {
        w = Math.max(0, Math.min(segmentW, segmentW * partialFrac));
      }
      if (w > 0) {
        segments.push(createRect({
          x, y: innerY, width: w, height: innerH, rx: 3, ry: 3,
          fill: color, class: 'segment',
        }));
      }
    }

    return html`
      <ha-card .header=${label} class="eco-card">
        <div class="wrap">
          <svg viewBox="0 0 ${W} ${H}" part="svg">
            <!-- Battery body -->
            <rect x="${bodyX}" y="${bodyY}" rx="10" ry="10" width="${bodyW}" height="${bodyH}" class="case" />
            <!-- Battery cap -->
            <rect x="${capX}" y="${capY}" rx="3" ry="3" width="${capW}" height="${capH}" class="cap" />

            <!-- Inner area -->
            <rect x="${innerX}" y="${innerY}" rx="3" ry="3" width="${innerW}" height="${innerH}" class="inner-bg" />

            <!-- Segments -->
            ${segments}

            <!-- Percentage centered -->
            <text x="${bodyX + bodyW/2}" y="${bodyY + bodyH/2}"
                  text-anchor="middle" dominant-baseline="central" class="pct" fill="white">${stateText}</text>
            
          </svg>
        </div>
      </ha-card>
    `;
  }

  _friendlyName() {
    const st = this.hass?.states?.[this._config.entity];
    return st?.attributes?.friendly_name || this._config.entity;
  }

  static get styles() {
    return css`
      .wrap { display: grid; place-items: center; padding: 0; }
      ha-card.eco-card { padding: 6px 8px 8px; }
      svg { width: 100%; max-width: 460px; height: auto; }
      .case { fill: none; stroke: var(--primary-text-color); stroke-width: 3; opacity: 0.85; }
      .cap { fill: var(--primary-text-color); opacity: 0.8; }
      .inner-bg { fill: #000000; stroke: var(--divider-color); stroke-width: 0; }
      .segment { transition: opacity 250ms ease, fill 250ms ease; }
      .pct { 
        fill: var(--primary-text-color); 
        font-weight: 700; 
        font-size: 26px; 
        text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
        filter: drop-shadow(0 0 2px rgba(255,255,255,0.3));
      }
    `;
  }

  static getStubConfig() { return { entity: 'sensor.battery_level', name: 'EcoFlow' }; }
}

if (!customElements.get('eco-battery-card')) {
  customElements.define('eco-battery-card', EcoBatteryCard);
}

console.info('%c ECO-BATTERY-CARD %c v0.2.0 ', 'background:#0b8043;color:white;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#263238;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px');
