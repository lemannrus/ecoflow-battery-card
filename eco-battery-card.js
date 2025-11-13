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
 * remaining_time_entity: sensor.delta_2_discharge_remaining_time  # optional
 * charge_remaining_time_entity: sensor.delta_2_charge_remaining_time  # optional
 * ac_out_power_entity: sensor.delta_2_ac_out_power  # optional
 * outage_status_entity: sensor.outage_status  # optional (binary: on/off or active/inactive)
 * outage_end_time_entity: sensor.outage_end_time  # optional (datetime or timestamp)
 * next_outage_time_entity: sensor.next_outage_time  # optional (datetime or timestamp)
 * charge_rate_watts: 1000  # optional (charging power in watts, for time calculations)
 * battery_capacity_wh: 1024  # optional (battery capacity in watt-hours)
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
      outage_status_entity: config.outage_status_entity || null,
      outage_end_time_entity: config.outage_end_time_entity || null,
      next_outage_time_entity: config.next_outage_time_entity || null,
      charge_rate_watts: typeof config.charge_rate_watts === 'number' ? config.charge_rate_watts : 1000,
      battery_capacity_wh: typeof config.battery_capacity_wh === 'number' ? config.battery_capacity_wh : 1024,
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

  /**
   * Get current outage status
   * Returns: { isActive: boolean, endTime: Date|null, minutesRemaining: number|null }
   */
  _getOutageStatus() {
    if (!this._config.outage_status_entity) return { isActive: false, endTime: null, minutesRemaining: null };

    const statusSt = this.hass?.states?.[this._config.outage_status_entity];
    if (!statusSt) return { isActive: false, endTime: null, minutesRemaining: null };

    // Check if outage is active (support various formats: on/off, true/false, active/inactive)
    const state = statusSt.state?.toLowerCase();
    const isActive = state === 'on' || state === 'true' || state === 'active' || state === '1';

    let endTime = null;
    let minutesRemaining = null;

    if (isActive && this._config.outage_end_time_entity) {
      const endTimeSt = this.hass?.states?.[this._config.outage_end_time_entity];
      if (endTimeSt && endTimeSt.state && endTimeSt.state !== 'unknown' && endTimeSt.state !== 'unavailable') {
        endTime = this._parseDateTime(endTimeSt.state);
        if (endTime) {
          minutesRemaining = Math.max(0, Math.round((endTime - new Date()) / 60000));
        }
      }
    }

    return { isActive, endTime, minutesRemaining };
  }

  /**
   * Get next scheduled outage information
   * Returns: { startTime: Date|null, minutesUntil: number|null }
   */
  _getNextOutage() {
    if (!this._config.next_outage_time_entity) return { startTime: null, minutesUntil: null };

    const nextOutageSt = this.hass?.states?.[this._config.next_outage_time_entity];
    if (!nextOutageSt || !nextOutageSt.state || nextOutageSt.state === 'unknown' || nextOutageSt.state === 'unavailable') {
      return { startTime: null, minutesUntil: null };
    }

    const startTime = this._parseDateTime(nextOutageSt.state);
    if (!startTime) return { startTime: null, minutesUntil: null };

    const minutesUntil = Math.max(0, Math.round((startTime - new Date()) / 60000));
    return { startTime, minutesUntil };
  }

  /**
   * Parse datetime string (supports ISO format, timestamps, etc.)
   */
  _parseDateTime(value) {
    if (!value) return null;

    // Try parsing as ISO date
    let date = new Date(value);
    if (!isNaN(date.getTime())) return date;

    // Try parsing as Unix timestamp (seconds)
    const timestamp = Number(value);
    if (Number.isFinite(timestamp)) {
      date = new Date(timestamp * 1000);
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  /**
   * Calculate time needed to charge battery to target percentage
   * Returns minutes needed
   */
  _calculateChargeTime(currentPct, targetPct = 100) {
    if (currentPct >= targetPct) return 0;

    const pctToCharge = targetPct - currentPct;
    const whToCharge = (this._config.battery_capacity_wh * pctToCharge) / 100;
    const hoursNeeded = whToCharge / this._config.charge_rate_watts;
    return Math.ceil(hoursNeeded * 60);
  }

  /**
   * Analyze outage situation and provide recommendations
   * Returns: {
   *   sufficientForOutage: boolean|null,
   *   canChargeBeforeNext: boolean|null,
   *   warningLevel: 'critical'|'warning'|'info'|'ok',
   *   message: string
   * }
   */
  _analyzeOutageSituation() {
    const outageStatus = this._getOutageStatus();
    const nextOutage = this._getNextOutage();
    const remainingTime = this._remainingTime();
    const currentPct = this._pct();

    let sufficientForOutage = null;
    let canChargeBeforeNext = null;
    let warningLevel = 'ok';
    let message = '';

    // Analysis 1: Current outage - is battery sufficient?
    if (outageStatus.isActive && outageStatus.minutesRemaining !== null) {
      if (remainingTime && remainingTime.type === 'discharge') {
        const dischargeMinutes = this._parseTimeToMinutes(remainingTime.time);
        sufficientForOutage = dischargeMinutes >= outageStatus.minutesRemaining;

        if (!sufficientForOutage) {
          warningLevel = 'critical';
          const shortfall = outageStatus.minutesRemaining - dischargeMinutes;
          message = `⚠️ Battery may run out ${this._formatMinutes(shortfall)} before outage ends!`;
        } else {
          const excess = dischargeMinutes - outageStatus.minutesRemaining;
          if (excess < 30) {
            warningLevel = 'warning';
            message = `⚡ Battery sufficient, but only ${this._formatMinutes(excess)} spare time`;
          } else {
            warningLevel = 'ok';
            message = `✅ Battery sufficient for outage (${this._formatMinutes(excess)} spare)`;
          }
        }
      }
    }

    // Analysis 2: Next outage - can we charge enough?
    if (!outageStatus.isActive && nextOutage.minutesUntil !== null) {
      const chargeTimeNeeded = this._calculateChargeTime(currentPct, 100);
      canChargeBeforeNext = nextOutage.minutesUntil >= chargeTimeNeeded;

      if (currentPct < 80) {
        if (!canChargeBeforeNext) {
          warningLevel = warningLevel === 'critical' ? 'critical' : 'warning';
          message = message || `⚠️ Not enough time to fully charge before next outage!`;
        } else {
          const timeMargin = nextOutage.minutesUntil - chargeTimeNeeded;
          if (timeMargin < 60 && warningLevel === 'ok') {
            warningLevel = 'info';
            message = message || `⏰ Start charging soon - ${this._formatMinutes(timeMargin)} margin`;
          }
        }
      }
    }

    return { sufficientForOutage, canChargeBeforeNext, warningLevel, message };
  }

  /**
   * Parse time string like "2h 30m" or "45m" to minutes
   */
  _parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;

    let totalMinutes = 0;
    const hoursMatch = timeStr.match(/(\d+)h/);
    const minutesMatch = timeStr.match(/(\d+)m/);

    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

    return totalMinutes;
  }

  /**
   * Format datetime for display
   */
  _formatDateTime(date) {
    if (!date) return '';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  _renderEnergyFlow(bodyX, bodyW, bodyY, bodyH, W, PAD, color) {
    const mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainG.setAttribute('class', 'energy-flow');

    const startX = bodyX + bodyW;
    const endX = W - PAD - 15;
    const distance = endX - startX;
    const y = bodyY + bodyH / 2;

    // Create particles distributed along the entire path
    // They stay in place, only their opacity animates in a wave pattern
    const numParticles = 12;

    for (let i = 0; i < numParticles; i++) {
      // Calculate position along the path (0 to 1)
      const progress = i / (numParticles - 1);
      const x = startX + (distance * progress);

      // Create circle at its fixed position
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('class', `flow-particle-static particle-${i + 1}`);
      circle.setAttribute('r', '2.5');
      circle.setAttribute('cx', String(x));
      circle.setAttribute('cy', String(y));
      circle.setAttribute('fill', color);

      // Set animation delay based on position
      circle.style.animationDelay = `${(i * 0.15)}s`;

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
    const outageStatus = this._getOutageStatus();
    const nextOutage = this._getNextOutage();
    const analysis = this._analyzeOutageSituation();

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
            <!-- Energy Flow Animation (rendered first, behind everything) -->
            ${acOutPower && acOutPower > 0 ? this._renderEnergyFlow(bodyX, bodyW, bodyY, bodyH, W, PAD, color) : ''}
            
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
          
          <!-- Outage Analysis Warning/Info -->
          ${analysis.message ? html`
            <div class="outage-analysis ${analysis.warningLevel}">
              <span class="analysis-message">${analysis.message}</span>
            </div>
          ` : ''}
          
          <!-- Current Outage Info -->
          ${outageStatus.isActive && outageStatus.endTime ? html`
            <div class="outage-compact">
              <div class="outage-compact-header">
                <span class="outage-icon">🔌</span>
                <span class="outage-label">Outage Active</span>
              </div>
              <div class="outage-compact-info">
                <span class="compact-label">Ends:</span>
                <span class="compact-value">${this._formatDateTime(outageStatus.endTime)}</span>
                <span class="compact-separator">•</span>
                <span class="compact-label">Remaining:</span>
                <span class="compact-value">${this._formatMinutes(outageStatus.minutesRemaining)}</span>
              </div>
            </div>
          ` : ''}
          
          <!-- Next Outage Info -->
          ${!outageStatus.isActive && nextOutage.startTime ? html`
            <div class="outage-compact outage-next">
              <div class="outage-compact-header">
                <span class="outage-icon">📅</span>
                <span class="outage-label">Next Outage</span>
              </div>
              <div class="outage-compact-info">
                <span class="compact-value-lg">${this._formatDateTime(nextOutage.startTime)}</span>
                <span class="compact-separator">•</span>
                <span class="compact-label">In:</span>
                <span class="compact-value">${this._formatMinutes(nextOutage.minutesUntil)}</span>
              </div>
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
        color: white;
        filter: brightness(0) invert(1);
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
        color: white;
        filter: brightness(0) invert(1);
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
      .flow-particle-static {
        filter: drop-shadow(0 0 3px currentColor);
        animation: flowWave 1.8s ease-in-out infinite;
      }
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
        filter: brightness(0) invert(1);
        user-select: none;
        pointer-events: none;
      }
      .status-icon-discharging {
        animation: bounceDown 1.5s ease-in-out infinite;
        filter: brightness(0) invert(1);
        user-select: none;
        pointer-events: none;
      }
      .status-icon-connected {
        animation: scaleIcon 1.5s ease-in-out infinite;
        filter: brightness(0) invert(1);
        user-select: none;
        pointer-events: none;
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.9; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      @keyframes flowWave {
        0%, 100% { 
          opacity: 0.2;
        }
        50% { 
          opacity: 0.85;
        }
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
      
      /* Outage Analysis Styles */
      .outage-analysis {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 12px;
        margin-top: 6px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
      }
      .outage-analysis.critical {
        background: var(--error-color, #e53935);
        color: white;
        animation: alertPulse 2s ease-in-out infinite;
      }
      .outage-analysis.warning {
        background: var(--warning-color, #fbc02d);
        color: #333;
      }
      .outage-analysis.info {
        background: var(--info-color, #2196f3);
        color: white;
      }
      .outage-analysis.ok {
        background: var(--success-color, #43a047);
        color: white;
      }
      .analysis-message {
        line-height: 1.3;
      }
      
      /* Compact Outage Styles */
      .outage-compact {
        background: var(--card-background-color, rgba(255,255,255,0.05));
        border: 2px solid var(--error-color, #e53935);
        border-radius: 8px;
        padding: 8px 12px;
        margin-top: 6px;
      }
      .outage-compact.outage-next {
        border-color: var(--info-color, #2196f3);
      }
      .outage-compact-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        font-size: 14px;
        font-weight: 700;
        color: var(--primary-text-color);
      }
      .outage-icon {
        font-size: 16px;
      }
      .outage-label {
        flex: 1;
      }
      .outage-compact-info {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 12px;
        line-height: 1.4;
      }
      .compact-label {
        color: var(--secondary-text-color);
        font-weight: 500;
      }
      .compact-value {
        color: var(--primary-text-color);
        font-weight: 600;
      }
      .compact-value-lg {
        color: var(--primary-text-color);
        font-weight: 700;
        font-size: 13px;
      }
      .compact-separator {
        color: var(--divider-color);
        opacity: 0.6;
      }
      
      /* Alert Pulse Animation */
      @keyframes alertPulse {
        0%, 100% { 
          opacity: 1;
          box-shadow: 0 0 0 0 var(--error-color, #e53935);
        }
        50% { 
          opacity: 0.85;
          box-shadow: 0 0 20px 5px rgba(229, 57, 53, 0.4);
        }
      }
    `;
  }

  static getStubConfig() { return { entity: 'sensor.battery_level', name: 'EcoFlow' }; }
}

if (!customElements.get('eco-battery-card')) {
  customElements.define('eco-battery-card', EcoBatteryCard);
}

console.info('%c ECO-BATTERY-CARD %c v0.2.0 ', 'background:#0b8043;color:white;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#263238;color:#fff;border-radius:0 3px 3px 0;padding:2px 4px');
