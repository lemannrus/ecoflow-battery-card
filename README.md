# EcoFlow Battery Card for Home Assistant

A custom Lovelace card for Home Assistant that displays EcoFlow battery levels with a beautiful, animated battery icon. This card provides an intuitive visual representation of your EcoFlow power station's battery status with color-coded indicators.

## ✨ Features

- **Visual Battery Display**: SVG battery with segmented columns that fill left-to-right
- **Color-Coded Status**: Green (good), yellow (warning), red (critical) battery levels
- **Configurable Thresholds**: Customize when colors change based on your needs
- **Flexible Entity Support**: Works with any percentage-based sensor (0-100%)
- **HACS Compatible**: Easy installation through Home Assistant Community Store
- **No Build Step Required**: Single JavaScript file, ready to use
- **Home Assistant Theme Integration**: Automatically adapts to your HA theme colors
- **Responsive Design**: Scales beautifully across different screen sizes

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
green: 80
yellow: 30
```

### Generic Battery Sensor

```yaml
type: custom:eco-battery-card
entity: sensor.ups_battery_level  
name: "UPS Battery"
green: 90
yellow: 50
```

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏷️ Version

**Current Version**: 0.2.0

## 🙏 Credits

- Built with Lit-based components for seamless Home Assistant integration
- Designed for the Home Assistant community
- HACS compatible for easy distribution and updates

---

*Made with ❤️ for the Home Assistant community*
