/*
 * Eco Battery Card for Home Assistant (no build step, HACS-friendly)
 * Author: ChatGPT (for Alex, who definitely has better things to do)
 * Version: 0.1.0
 *
 * Config example:
 * type: custom:eco-battery-card
 * entity: sensor.ecoflow_battery
 * name: EcoFlow Delta 2
 * green: 60      # >= this -> green
 * yellow: 25     # >= this and < green -> yellow; below -> red
 * show_state: true
 */

/* Grab Lit helpers from HA (stable pattern used by many cards) */
const LitBase = customElements.get('ha-panel-lovelace')
  ? Object.getPrototypeOf(customElements.get('ha-panel-lovelace'))
  : Object.getPrototypeOf(customElements.get('hui-masonry-view'));

const html = LitBase.prototype.html;
const css = LitBase.prototype.css;

class EcoBatteryCard extends LitBase {
  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error('Вы должны указать entity с процентом заряда (0..100).');
    }
    this._config = {
      name: config.name || '',
      entity: config.entity,
      green: typeof config.green === 'number' ? config.green : 50,
      yellow: typeof config.yellow === 'number' ? config.yellow : 20,
      show_state: config.show_state !== false,
      precision: typeof config.precision === 'number' ? config.precision : 0,
      invert: !!config.invert, // if your sensor is 0 when full, 100 when empty (why), set true
    };
  }

  getCardSize() {
    return 3;
  }

  _pct() {
    const st = this.hass?.states?.[this._config.entity];
    if (!st) return 0;
    let n = Number(st.state);
    if (Number.isNaN(n)) {
      // try attribute 'battery' or 'level'
      n = Number(st.attributes?.battery ?? st.attributes?.level ?? 0);
    }
    if (this._config.invert) n = 100 - n;
    if (!Number.isFinite(n)) n = 0;
    return Math.max(0, Math.min(100, n));
  }

  _color(p) {
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
    const W = 200; // total width
    const H = 110; // total height
    const PAD = 16;
    const bodyX = PAD;
    const bodyY = PAD;
    const bodyW = 150;
    const bodyH = 78;

    const capW = 12;
    const capH = 26;
    const capX = bodyX + bodyW + 4;
    const capY = bodyY + (bodyH - capH) / 2;

    const innerX = bodyX + 6;
    const innerY = bodyY + 6;
    const innerW = bodyW - 12;
    const innerH = bodyH - 12;

    const label = this._config.name || this._friendlyName();
    const stateText = `${pct.toFixed(this._config.precision)}%`;

    // Create segments for battery fill
    const numSegments = 10;
    const segmentHeight = (innerH - (numSegments - 1) * 2) / numSegments; // 2px gap between segments
    const filledSegments = Math.ceil((pct / 100) * numSegments);
    
    const segments = [];
    for (let i = 0; i < numSegments; i++) {
      const segmentY = innerY + innerH - (i + 1) * (segmentHeight + 2) + 2;
      const isFilled = i < filledSegments;
      const segmentColor = isFilled ? color : 'var(--divider-color, #e0e0e0)';
      const opacity = isFilled ? 1 : 0.3;
      
      segments.push(html`
        <rect x="${innerX + 2}" y="${segmentY}" width="${innerW - 4}" height="${segmentHeight}"
              rx="2" ry="2" fill="${segmentColor}" opacity="${opacity}" class="segment" />
      `);
    }

    return html`
      <ha-card .header=${label} class="eco-card">
        <div class="wrap">
          <svg viewBox="0 0 ${W} ${H}" part="svg">
            <!-- Battery body -->
            <rect x="${bodyX}" y="${bodyY}" rx="8" ry="8" width="${bodyW}" height="${bodyH}"
                  class="case" />
            <!-- Battery cap -->
            <rect x="${capX}" y="${capY}" rx="3" ry="3" width="${capW}" height="${capH}"
                  class="cap" />

            <!-- Inner background -->
            <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" class="inner-bg" />

            <!-- Battery segments -->
            ${segments}

            <!-- Ticks -->
            ${[0,25,50,75,100].map(v => {
              const y = innerY + innerH - Math.round((v/100)*innerH);
              return html`<line x1="${innerX-2}" x2="${innerX+2}" y1="${y}" y2="${y}" class="tick" />`;
            })}

            <!-- Large percentage text in center -->
            <text x="${bodyX + bodyW/2}" y="${bodyY + bodyH/2 + 8}" text-anchor="middle" class="pct-large">${stateText}</text>
            
            <!-- Additional sensor value display -->
            ${this._config.show_state ? html`
              <text x="${bodyX + bodyW/2}" y="${bodyY + bodyH + 20}" text-anchor="middle" class="pct-small">Battery Level</text>
            ` : ''}
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
      ha-card.eсo-card { /* unicode-escape to avoid weird minifiers */ }
      .wrap {
        display: grid;
        place-items: center;
        padding: 8px 0 12px;
      }
      svg { width: 100%; max-width: 420px; height: auto; }
      .case { fill: none; stroke: var(--primary-text-color); stroke-width: 3; opacity: 0.8; }
      .cap { fill: var(--primary-text-color); opacity: 0.7; }
      .inner-bg { fill: var(--card-background-color); stroke: var(--divider-color); stroke-width: 1; }
      .segment { transition: all 300ms ease; }
      .tick { stroke: var(--divider-color); stroke-width: 1; opacity: 0.6; }
      .pct-large { 
        fill: var(--primary-text-color); 
        font-weight: 700; 
        font-size: 28px; 
        text-shadow: 0 0 3px var(--card-background-color);
        dominant-baseline: central;
      }
      .pct-small { 
        fill: var(--secondary-text-color); 
        font-weight: 500; 
        font-size: 12px; 
        opacity: 0.8;
      }
    `;
  }

  static getStubConfig() {
    return {
      entity: 'sensor.battery_level',
      name: 'EcoFlow',
    };
  }
}

if (!customElements.get('eco-battery-card')) {
  customElements.define('eco-battery-card', EcoBatteryCard);
}

// Optional: expose version in console for the three people who care
console.info('%c ECO-BATTERY-CARD %c v0.1.0 ', 'background:#0b8043;color:white;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#263238;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px');
