# EcoFlow Battery Card for Home Assistant

<!-- Badges -->
<p align="left">
  <!-- Replace OWNER/REPO below when you publish to GitHub -->
  <a href="https://github.com/lemannrus/ecoflow-battery-card/releases">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/lemannrus/ecoflow-battery-card?logo=github" />
  </a>
  <a href="https://github.com/lemannrus/ecoflow-battery-card/releases">
    <img alt="Downloads" src="https://img.shields.io/github/downloads/lemannrus/ecoflow-battery-card/total?logo=github" />
  </a>
  <a href="https://hacs.xyz/">
    <img alt="HACS" src="https://img.shields.io/badge/HACS-Custom-41BDF5?logo=homeassistant&logoColor=white" />
  </a>
  <a href="https://www.home-assistant.io/">
    <img alt="Home Assistant" src="https://img.shields.io/badge/Home%20Assistant-2024.6%2B-41BDF5?logo=homeassistant&logoColor=white" />
  </a>
  <a href="LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green" />
  </a>
</p>

A custom Lovelace card for Home Assistant that displays EcoFlow battery levels with a beautiful, animated battery icon. This card provides an intuitive visual representation of your EcoFlow power station's battery status with color-coded indicators.

## ✨ Features

### Battery Display
- **Visual Battery Display**: SVG battery with segmented columns that fill left-to-right
- **Color-Coded Status**: Green (good), yellow (warning), red (critical) battery levels
- **Animated Status Indicator**: Pulsing circular badge on the right showing battery state
  - ↑ Color-matched circle with up arrow when charging (bounces up)
  - ↓ Color-matched circle with down arrow when discharging (bounces down)
  - ⚡ Green circle with lightning bolt when connected to power but idle (scales/pulses)
  - Smooth pulsing ring animation
  - Icons animate with motion (bounce or scale)
- **Animated Energy Flow**: Beautiful animated particles flowing from battery to output when power is being used
- **Real-Time Power Display**: Shows current AC output power with automatic W/kW formatting
- **Smart Time Display**: Automatically shows discharge time (⏱) or charge time (⚡) with automatic formatting
  - Discharge time displayed when battery is discharging
  - Charge time displayed when battery is charging (discharge = 0)
  - Automatically converts minutes to "Xh Ymin" format

### Outage Management (NEW in v0.2.0) 🔌
- **Smart Outage Analysis**: Intelligent monitoring and recommendations for power outages
  - Compares battery remaining time vs outage duration
  - Calculates if you can fully charge before next outage
  - Color-coded alerts: Critical (red), Warning (yellow), Info (blue), OK (green)
- **Current Outage Display**: Shows active outage information
  - Outage end time with smart formatting (Today/Tomorrow)
  - Time remaining until power returns
  - Battery sufficiency warnings
- **Next Outage Preview**: Helps you prepare for scheduled outages
  - Next outage start time
  - Time until next outage
  - Required charging time calculation
- **Outage Schedule Display**: View your complete outage schedule
  - Supports both plain text and JSON formats
  - Perfect for scheduled/rolling blackouts
- **Automated Recommendations**: Get actionable insights
  - "⚠️ Battery may run out before outage ends!"
  - "⏰ Start charging soon - limited time margin"
  - "✅ Battery sufficient for outage"

### General Features
- **Configurable Thresholds**: Customize when colors change based on your needs
- **Flexible Entity Support**: Works with any percentage-based sensor (0-100%)
- **HACS Compatible**: Easy installation through Home Assistant Community Store
- **No Build Step Required**: Single JavaScript file, ready to use
- **Home Assistant Theme Integration**: Automatically adapts to your HA theme colors
- **Responsive Design**: Scales beautifully across different screen sizes
- **Google Nest Hub Compatible**: CSS-based animations work seamlessly on Cast devices

## 🖼️ Screenshot

![Eco Battery Card screenshot](./assets/eco-battery-card.png)

The card displays a battery icon with:
- Battery outline and terminal cap
- Vertical segments (columns) that fill left-to-right based on charge level
- Optional percentage text overlay
- Theme-aware colors (uses your HA theme CSS variables)

## 📦 Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Frontend" section
3. Click the "+" button and search for "Eco Battery Card"
4. Download and install the card
5. Add the resource to your Lovelace configuration (HACS usually handles this automatically)

### Manual Installation

1. Download the `eco-battery-card.js` file
2. Copy it to your `config/www/` directory
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/eco-battery-card.js
    type: module
```

## 🔧 Configuration

### Basic Configuration

```yaml
type: custom:eco-battery-card
entity: sensor.ecoflow_battery_level
name: "EcoFlow Delta 2"
```

### Advanced Configuration

```yaml
type: custom:eco-battery-card
entity: sensor.ecoflow_battery_level
name: "EcoFlow Delta 2"

# Battery time & power entities
remaining_time_entity: sensor.delta_2_discharge_remaining_time  # Optional - discharge time in minutes
charge_remaining_time_entity: sensor.delta_2_charge_remaining_time  # Optional - charge time in minutes
ac_out_power_entity: sensor.delta_2_ac_out_power  # Optional - AC output power in watts

# Outage integration entities (NEW in v0.2.0)
outage_status_entity: sensor.outage_status  # Optional - current outage status (on/off, true/false, active/inactive)
outage_end_time_entity: sensor.outage_end_time  # Optional - when current outage will end (ISO datetime or timestamp)
next_outage_time_entity: sensor.next_outage_time  # Optional - when next outage starts (ISO datetime or timestamp)
outage_schedule_entity: sensor.outage_schedule  # Optional - outage schedule text or JSON

# Battery specifications for charge calculations
charge_rate_watts: 1000  # Optional - charging power in watts (default: 1000)
battery_capacity_wh: 1024  # Optional - battery capacity in watt-hours (default: 1024)

# Display settings
green: 60        # Battery level >= 60% shows green
yellow: 25       # Battery level >= 25% and < 60% shows yellow
                 # Battery level < 25% shows red
show_state: true # Show percentage text on battery
precision: 1     # Decimal places for percentage (0 = whole numbers)
invert: false    # Set to true if your sensor reports 0=full, 100=empty
segments: 5      # Number of vertical columns
gap: 3           # Gap between columns in px
palette: threshold  # 'threshold' | 'gradient'
```

## ⚙️ Configuration Options

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **Required** | The entity ID of your battery sensor |
| `name` | string | Entity friendly name | Display name for the card |
| `green` | number | `60` | Battery percentage threshold for green color |
| `yellow` | number | `25` | Battery percentage threshold for yellow color |
| `show_state` | boolean | `true` | Whether to display percentage text on battery |
| `precision` | number | `0` | Number of decimal places for percentage display |
| `invert` | boolean | `false` | Invert the battery reading (for sensors that report inversely) |
| `segments` | number | `5` | Number of vertical columns in the battery |
| `gap` | number | `3` | Gap between columns in pixels |
| `palette` | string | `threshold` | Color mode: `threshold` (red/yellow/green) or `gradient` |

### Battery Time & Power Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `remaining_time_entity` | string | `null` | Optional entity ID for discharge remaining time (in minutes, shows ⏱ icon) |
| `charge_remaining_time_entity` | string | `null` | Optional entity ID for charge remaining time (in minutes, shows ⚡ icon, displayed when discharge is 0) |
| `ac_out_power_entity` | string | `null` | Optional entity ID for AC output power (in watts, shows animated energy flow and power value) |

### Outage Integration Options (NEW in v0.2.0)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `outage_status_entity` | string | `null` | Entity ID for current outage status. Supports states: `on`/`off`, `true`/`false`, `active`/`inactive`, `1`/`0` |
| `outage_end_time_entity` | string | `null` | Entity ID for outage end time. Supports ISO datetime format or Unix timestamp |
| `next_outage_time_entity` | string | `null` | Entity ID for next scheduled outage start time. Supports ISO datetime format or Unix timestamp |
| `outage_schedule_entity` | string | `null` | Entity ID for outage schedule information. Can be plain text or JSON string |
| `charge_rate_watts` | number | `1000` | Charging power in watts. Used to calculate charging time needed |
| `battery_capacity_wh` | number | `1024` | Battery capacity in watt-hours. Used to calculate charging time needed |

## 🔌 Compatible Sensors

This card works with any Home Assistant sensor that reports battery levels as:
- **State value**: A number between 0-100
- **Battery attribute**: If state is not numeric, looks for `battery` attribute
- **Level attribute**: If neither state nor battery attribute found, looks for `level` attribute

### Example Sensor Types
- EcoFlow power station battery sensors
- Device battery levels
- UPS battery percentages
- Solar battery banks
- Any custom sensor reporting 0-100% values

## 🎨 Theming

The card automatically integrates with your Home Assistant theme using CSS custom properties:

- `--error-color`: Used for critical battery levels (red)
- `--warning-color`: Used for warning battery levels (yellow)  
- `--success-color`: Used for good battery levels (green)
- `--primary-text-color`: Used for text and battery outline
- `--card-background-color`: Used for card background
- `--divider-color`: Used for tick marks and borders

## 🔧 Integration Examples

### EcoFlow Integration

If you're using the EcoFlow integration, your configuration might look like:

```yaml
type: custom:eco-battery-card
entity: sensor.ecoflow_delta2_battery_level
name: "EcoFlow Delta 2"
remaining_time_entity: sensor.delta_2_discharge_remaining_time
charge_remaining_time_entity: sensor.delta_2_charge_remaining_time
ac_out_power_entity: sensor.delta_2_ac_out_power
green: 80
yellow: 30
```

The card will automatically show:
- 🔵 **Animated status badge** on the right:
  - ↑ Colored circle when charging (has charge remaining time)
  - ↓ Colored circle when discharging (has discharge remaining time)
  - ⚡ Green circle when connected to power but idle (neither charging nor discharging)
- ⏱ **Discharge time** when battery is providing power (e.g., "5h 33min")
- ⚡ **Charge time** when battery is charging (e.g., "2h 15min")
- 🌊 **Animated energy flow** particles when power is being consumed
- ⚡ **Power output** display (e.g., "Output: 1.2 kW")

### Generic Battery Sensor

```yaml
type: custom:eco-battery-card
entity: sensor.ups_battery_level  
name: "UPS Battery"
green: 90
yellow: 50
```

## 🔌 Outage Integration Setup

### Overview

The outage integration helps you manage scheduled power outages (rolling blackouts) by:
1. **Monitoring** current outages and battery sufficiency
2. **Predicting** if you can charge before the next outage
3. **Alerting** you when action is needed
4. **Displaying** your outage schedule

### Required Sensors

To use outage features, you need to create template sensors in your Home Assistant configuration. Here are examples:

#### Example 1: Simple Scheduled Outages

```yaml
# configuration.yaml
template:
  - sensor:
      # Outage Status - assumes daily outage from 14:00-16:00
      - name: "Power Outage Status"
        unique_id: power_outage_status
        state: >
          {% set now_hour = now().hour %}
          {% if 14 <= now_hour < 16 %}
            on
          {% else %}
            off
          {% endif %}
      
      # Outage End Time
      - name: "Power Outage End Time"
        unique_id: power_outage_end_time
        state: >
          {% set today = now().date() %}
          {{ today.replace(hour=16, minute=0).isoformat() }}
      
      # Next Outage Time
      - name: "Next Power Outage"
        unique_id: next_power_outage
        state: >
          {% set today = now().date() %}
          {% set now_hour = now().hour %}
          {% if now_hour < 14 %}
            {{ today.replace(hour=14, minute=0).isoformat() }}
          {% else %}
            {{ (today + timedelta(days=1)).replace(hour=14, minute=0).isoformat() }}
          {% endif %}
      
      # Outage Schedule
      - name: "Power Outage Schedule"
        unique_id: power_outage_schedule
        state: >
          Daily outage: 14:00 - 16:00 (2 hours)
          Please ensure battery is charged by 13:30
```

#### Example 2: Integration with External API

If you have an integration that provides outage data (e.g., utility company API):

```yaml
# configuration.yaml
template:
  - sensor:
      - name: "Outage Status"
        state: "{{ states('binary_sensor.utility_outage') }}"
      
      - name: "Outage End Time"
        state: "{{ state_attr('sensor.utility_data', 'outage_end') }}"
      
      - name: "Next Outage Time"
        state: "{{ state_attr('sensor.utility_data', 'next_outage_start') }}"
      
      - name: "Outage Schedule"
        state: "{{ state_attr('sensor.utility_data', 'schedule') }}"
```

#### Example 3: DTEK (Ukrainian Energy Provider) Integration

```yaml
# Example for users with DTEK integration
template:
  - sensor:
      - name: "DTEK Outage Status"
        state: >
          {{ is_state('sensor.dtek_current_status', 'outage') and 'on' or 'off' }}
      
      - name: "DTEK Outage End"
        state: >
          {{ state_attr('sensor.dtek_schedule', 'current_outage_end') }}
      
      - name: "DTEK Next Outage"
        state: >
          {{ state_attr('sensor.dtek_schedule', 'next_outage_start') }}
      
      - name: "DTEK Schedule Text"
        state: >
          {{ state_attr('sensor.dtek_schedule', 'today_schedule') }}
```

### Full Card Configuration with Outage Features

```yaml
type: custom:eco-battery-card
entity: sensor.ecoflow_battery_level
name: "EcoFlow Delta 2"

# Standard battery sensors
remaining_time_entity: sensor.delta_2_discharge_remaining_time
charge_remaining_time_entity: sensor.delta_2_charge_remaining_time
ac_out_power_entity: sensor.delta_2_ac_out_power

# Outage integration sensors
outage_status_entity: sensor.power_outage_status
outage_end_time_entity: sensor.power_outage_end_time
next_outage_time_entity: sensor.next_power_outage
outage_schedule_entity: sensor.power_outage_schedule

# Battery specs for accurate calculations
# Example: EcoFlow Delta 2 specs
charge_rate_watts: 1200  # AC charging: 1200W
battery_capacity_wh: 1024  # 1024Wh capacity

# Display settings
green: 80
yellow: 40
palette: gradient
```

### Understanding the Analysis

The card provides intelligent analysis and warnings:

#### 🔴 **Critical Alert** (Red, Pulsing)
```
⚠️ Battery may run out 45m before outage ends!
```
**What it means**: Your battery's remaining discharge time is less than the outage duration. You need to reduce power consumption or the battery will die before power returns.

**Action**: Turn off non-essential devices immediately.

#### 🟡 **Warning** (Yellow)
```
⚡ Battery sufficient, but only 15m spare time
```
**What it means**: Battery will last through the outage, but with less than 30 minutes buffer.

**Action**: Monitor your power usage carefully. Consider turning off some devices.

#### 🔵 **Info** (Blue)
```
⏰ Start charging soon - 1h 15m margin
```
**What it means**: You have time to charge, but not much extra time. You should start charging within the next hour.

**Action**: Connect to power and start charging if not already doing so.

#### 🟢 **OK** (Green)
```
✅ Battery sufficient for outage (1h 23m spare)
```
**What it means**: You're all set! Battery will comfortably last through the outage.

**Action**: No immediate action needed.

### Charging Time Calculation

The card calculates how long it takes to charge based on your configuration:

```
Formula: Charge Time = (Capacity × % to Charge) / Charge Rate

Example:
- Current battery: 45%
- Target: 100%
- Capacity: 1024 Wh
- Charge rate: 1200 W

Time needed = (1024 × 0.55) / 1200 = 0.47 hours = 28 minutes
```

**Important**: Set accurate values for `charge_rate_watts` and `battery_capacity_wh` for your specific battery model for accurate predictions.

### Tips for Best Results

1. **Accurate Battery Specs**: Use your actual battery specifications
   - EcoFlow Delta 2: 1024Wh capacity, 1200W AC charge rate
   - EcoFlow Delta Pro: 3600Wh capacity, 1800W AC charge rate
   - EcoFlow River 2: 256Wh capacity, 360W AC charge rate

2. **Reliable Outage Data**: Ensure your outage sensors provide accurate information
   - Use official utility company APIs when available
   - Keep manual schedules updated
   - Account for timezone differences

3. **Safety Margins**: The card recommends charging when there's still time margin
   - Green status appears with 30+ minutes spare time
   - Warning appears with less than 30 minutes spare time
   - Plan to start charging before the warning appears

4. **Power Consumption**: The analysis assumes current power consumption
   - High AC output = faster battery drain
   - Adjust usage if warning appears

## 🐛 Troubleshooting

### Card Not Showing
- Ensure the resource is properly added to your Lovelace configuration
- Check the browser console for JavaScript errors
- Verify the entity exists and has a numeric state or battery/level attribute

### Wrong Battery Reading
- Check if your sensor reports values in the expected range (0-100)
- If your sensor reports inversely (0=full, 100=empty), set `invert: true`
- Verify the entity name is correct in your configuration

### Styling Issues
- Clear your browser cache and hard refresh (Ctrl+F5)
- Check if your Home Assistant theme defines the required CSS custom properties

### Outage Features Not Working
- **No outage information showing**: Verify that your outage sensor entities exist and have valid states
  - Check sensor states in Developer Tools → States
  - Ensure entity IDs match your configuration exactly
- **Wrong outage times**: Check datetime format in your sensors
  - Use ISO format: `2025-11-13T14:30:00` or Unix timestamps
  - Verify your timezone is configured correctly in Home Assistant
- **Incorrect charge time calculations**: 
  - Double-check `charge_rate_watts` and `battery_capacity_wh` values
  - These should match your actual battery specifications
  - Check sensor values in watts, not kilowatts
- **Analysis messages not appearing**:
  - Ensure both battery remaining time and outage entities are configured
  - Check that discharge/charge time sensors report values in minutes
  - Verify outage status sensor returns 'on'/'off' or similar boolean values

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- Built with Lit-based components for seamless Home Assistant integration
- Designed for the Home Assistant community
- HACS compatible for easy distribution and updates

---

*Made with ❤️ for the Home Assistant community*
