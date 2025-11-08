/*
 * Eco Battery Card for Home Assistant (no build step, HACS-friendly)
 * Author: ChatGPT (for Alex, who likes order in the battery chaos)
 * Version: 0.1.14
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
 * remaining_time_entity: sensor.delta_2_discharge_remaining_time  # optional
 * charge_remaining_time_entity: sensor.delta_2_charge_remaining_time  # optional
 * ac_out_power_entity: sensor.delta_2_ac_out_power  # optional
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
      remaining_time_entity: config.remaining_time_entity || null,
      charge_remaining_time_entity: config.charge_remaining_time_entity || null,
      ac_out_power_entity: config.ac_out_power_entity || null,
      green: typeof config.green === 'number' ? config.green : 60,
      yellow: typeof config.yellow === 'number' ? config.yellow : 25,
      show_state: config.show_state !== false,
      precision: typeof config.precision === 'number' ? config.precision : 0,
      invert: !!config.invert,
      palette: ['threshold', 'gradient'].includes(config.palette) ? config.palette : 'threshold',
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

  _remainingTime() {
    // Debug logging
    if (this._config.remaining_time_entity) {
      const dischargeSt = this.hass?.states?.[this._config.remaining_time_entity];
      console.log('[ECO-BATTERY-CARD] Discharge sensor:', this._config.remaining_time_entity, 'State:', dischargeSt?.state);
    }
    if (this._config.charge_remaining_time_entity) {
      const chargeSt = this.hass?.states?.[this._config.charge_remaining_time_entity];
      console.log('[ECO-BATTERY-CARD] Charge sensor:', this._config.charge_remaining_time_entity, 'State:', chargeSt?.state);
    }

    // Try discharge time first
    if (this._config.remaining_time_entity) {
      const dischargeSt = this.hass?.states?.[this._config.remaining_time_entity];
      if (dischargeSt && dischargeSt.state && dischargeSt.state !== 'unknown' && dischargeSt.state !== 'unavailable') {
        const dischargeMinutes = Number(dischargeSt.state);

        // If discharge time is valid and > 0, use it
        if (Number.isFinite(dischargeMinutes) && dischargeMinutes > 0) {
          console.log('[ECO-BATTERY-CARD] Showing discharge:', dischargeMinutes, 'minutes');
          return { time: this._formatMinutes(dischargeMinutes), type: 'discharge' };
        }
      }
    }

    // If discharge is 0 or unavailable, try charge time
    if (this._config.charge_remaining_time_entity) {
      const chargeSt = this.hass?.states?.[this._config.charge_remaining_time_entity];
      if (chargeSt && chargeSt.state && chargeSt.state !== 'unknown' && chargeSt.state !== 'unavailable') {
        const chargeMinutes = Number(chargeSt.state);

        if (Number.isFinite(chargeMinutes) && chargeMinutes > 0) {
          console.log('[ECO-BATTERY-CARD] Showing charge:', chargeMinutes, 'minutes');
          return { time: this._formatMinutes(chargeMinutes), type: 'charge' };
        }
      }
    }

    console.log('[ECO-BATTERY-CARD] No valid remaining time found');
    return null;
  }

  _formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }

  _acOutPower() {
    if (!this._config.ac_out_power_entity) return null;
    const st = this.hass?.states?.[this._config.ac_out_power_entity];
    if (!st) return null;
    const value = st.state;
    if (!value || value === 'unknown' || value === 'unavailable') return null;

    const power = Number(value);
    if (!Number.isFinite(power) || power < 0) return null;

    return power;
  }

  _formatPower(watts) {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${Math.round(watts)} W`;
  }

  _renderEnergyFlow(bodyX, bodyW, bodyY, bodyH, W, PAD, color) {
    const mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainG.setAttribute('class', 'energy-flow');

    const startX = bodyX + bodyW;
    const endX = W - PAD - 15;
    const distance = endX - startX;
    const y = bodyY + bodyH / 2;

    // Create 8 particles with staggered delays for seamless continuous flow
    for (let i = 1; i <= 8; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', `flow-particle particle-${i}`);
      circle.setAttribute('r', '2.5');
      circle.setAttribute('cx', String(startX));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('fill', color);
      circle.style.setProperty('--flow-distance', `${distance}px`);

      mainG.appendChild(circle);
    }

    return mainG;
  }

  _renderStatusIndicator(W, PAD, bodyY, bodyH, color, isConnected, statusIcon, isCharging, isDischarging) {
    const x = W - PAD - 15;
    const y = bodyY + bodyH / 2;
    const fillColor = isConnected ? 'var(--success-color, #43a047)' : color;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'status-indicator');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    // Outer ring with CSS animation class
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('class', 'status-ring-anim');
    ring.setAttribute('r', '18');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', fillColor);
    ring.setAttribute('stroke-width', '2.5');

    g.appendChild(ring);

    // Inner circle with CSS animation class
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'status-circle-anim');
    circle.setAttribute('r', '15');
    circle.setAttribute('fill', fillColor);

    g.appendChild(circle);

    // Icon text with appropriate animation class
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('font-size', '18');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-weight', 'bold');
    text.textContent = statusIcon;

    // Add animation class based on state
    if (isCharging) {
      text.setAttribute('class', 'status-icon-charging');
    } else if (isDischarging) {
      text.setAttribute('class', 'status-icon-discharging');
    } else if (isConnected) {
      text.setAttribute('class', 'status-icon-connected');
    }

    g.appendChild(text);

    return g;
  }

  render() {
    if (!this._config) return html``;
    const pct = this._pct();
    const color = this._color(pct);
    const remainingTime = this._remainingTime();
    const acOutPower = this._acOutPower();

    // SVG geometry
    const W = 220; // total width
    const H = 130; // total height
    const PAD = 8; // compact outer padding
    const bodyX = PAD;
    const bodyY = PAD;
    const bodyW = 100;
    const bodyH = 60;

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

    // Determine charging/discharging state
    const isCharging = remainingTime?.type === 'charge';
    const isDischarging = remainingTime?.type === 'discharge';
    const isConnected = !isCharging && !isDischarging && (this._config.remaining_time_entity || this._config.charge_remaining_time_entity);
    const statusIcon = isCharging ? '↑' : (isDischarging ? '↓' : (isConnected ? '⚡' : ''));

    // Debug logging for status
    console.log('[ECO-BATTERY-CARD] Status:', {
      remainingTime: remainingTime,
      isCharging: isCharging,
      isDischarging: isDischarging,
      isConnected: isConnected,
      statusIcon: statusIcon,
      hasEntities: !!(this._config.remaining_time_entity || this._config.charge_remaining_time_entity)
    });

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
            <text x="${bodyX + bodyW / 2}" y="${bodyY + bodyH / 2}"
                  text-anchor="middle" dominant-baseline="central" class="pct" fill="white">${stateText}</text>
            
            <!-- Energy Flow Animation (behind status indicator) -->
            ${acOutPower && acOutPower > 0 ? this._renderEnergyFlow(bodyX, bodyW, bodyY, bodyH, W, PAD, color) : ''}
            
            <!-- Status Indicator Circle (Charging/Discharging/Connected) -->
            ${(isCharging || isDischarging || isConnected) ? this._renderStatusIndicator(W, PAD, bodyY, bodyH, color, isConnected, statusIcon, isCharging, isDischarging) : ''}
          </svg>
          ${remainingTime ? html`
            <div class="remaining-time">
              <span class="time-icon">${remainingTime.type === 'charge' ? '⚡' : '⏱'}</span>
              <span class="time-value">${remainingTime.time}</span>
            </div>
          ` : ''}
          ${acOutPower && acOutPower > 0 ? html`
            <div class="power-output">
              <span class="power-icon">⚡</span>
              <span class="power-label">Out:</span>
              <span class="power-value">${this._formatPower(acOutPower)}</span>
            </div>
          ` : ''}
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
      ha-card.eco-card { padding: 2px 8px 2px; }
      svg { width: 100%; max-width: 300px; height: auto; }
      .case { fill: none; stroke: var(--primary-text-color); stroke-width: 3; opacity: 0.85; }
      .cap { fill: var(--primary-text-color); opacity: 0.8; }
      .inner-bg { fill: #000000; stroke: var(--divider-color); stroke-width: 0; }
      .segment { transition: opacity 250ms ease, fill 250ms ease; }
      .pct { 
        fill: var(--primary-text-color); 
        font-weight: 700; 
        font-size: 18px; 
        text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
        filter: drop-shadow(0 0 2px rgba(255,255,255,0.3));
      }
      .remaining-time {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: -55px;
        padding: 0px 0px;
        background: var(--card-background-color, rgba(255,255,255,0.05));
        border-radius: 12px;
        font-size: 40px;
        color: var(--primary-text-color);
        opacity: 0.95;
      }
      .time-icon {
        font-size: 40px;
        opacity: 0.85;
      }
      .time-value {
        font-weight: 600;
        font-size: 40px;
      }
      .power-output {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 2px;
        padding: 2px 16px;
        background: var(--card-background-color, rgba(255,255,255,0.05));
        border-radius: 12px;
        font-size: 24px;
        color: var(--primary-text-color);
        opacity: 0.95;
      }
      .power-icon {
        font-size: 28px;
        opacity: 0.9;
        animation: pulse 2s ease-in-out infinite;
      }
      .power-label {
        font-size: 18px;
        font-weight: 500;
        opacity: 0.8;
      }
      .power-value {
        font-weight: 700;
        font-size: 28px;
        color: var(--success-color, #43a047);
      }
      .energy-flow {
        opacity: 0.9;
      }
      .flow-particle {
        filter: drop-shadow(0 0 3px currentColor);
        animation: flowParticle 2.4s linear infinite;
      }
      .flow-particle.particle-1 { animation-delay: 0s; }
      .flow-particle.particle-2 { animation-delay: 0.3s; }
      .flow-particle.particle-3 { animation-delay: 0.6s; }
      .flow-particle.particle-4 { animation-delay: 0.9s; }
      .flow-particle.particle-5 { animation-delay: 1.2s; }
      .flow-particle.particle-6 { animation-delay: 1.5s; }
      .flow-particle.particle-7 { animation-delay: 1.8s; }
      .flow-particle.particle-8 { animation-delay: 2.1s; }
      .status-indicator {
        filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));
      }
      .status-ring-anim {
        opacity: 0.6;
        animation: ringPulse 2s ease-in-out infinite;
      }
      .status-circle-anim {
        opacity: 0.9;
        animation: circlePulse 2s ease-in-out infinite;
      }
      .status-icon-charging {
        animation: bounceUp 1.5s ease-in-out infinite;
        user-select: none;
        pointer-events: none;
      }
      .status-icon-discharging {
        animation: bounceDown 1.5s ease-in-out infinite;
        user-select: none;
        pointer-events: none;
      }
      .status-icon-connected {
        animation: scaleIcon 1.5s ease-in-out infinite;
        user-select: none;
        pointer-events: none;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.9; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes flowParticle {
        0% { opacity: 0; transform: translateX(0); }
        5% { opacity: 0.8; }
        95% { opacity: 0.8; }
        100% { opacity: 0; transform: translateX(var(--flow-distance, 89px)); }
      }
      @keyframes ringPulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 0.3; transform: scale(1.15); }
      }
      @keyframes circlePulse {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 1; }
      }
      @keyframes bounceUp {
        0%, 100% { transform: translateY(1.5px); }
        50% { transform: translateY(-1.5px); }
      }
      @keyframes bounceDown {
        0%, 100% { transform: translateY(-1.5px); }
        50% { transform: translateY(1.5px); }
      }
      @keyframes scaleIcon {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
    `;
  }

  static getStubConfig() { return { entity: 'sensor.battery_level', name: 'EcoFlow' }; }
}

if (!customElements.get('eco-battery-card')) {
  customElements.define('eco-battery-card', EcoBatteryCard);
}

console.info('%c ECO-BATTERY-CARD %c v0.1.18 ', 'background:#0b8043;color:white;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#263238;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px');
