# Changelog

All notable changes to the Eco Battery Card will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-13

### Added 🎉

#### Outage Management System
- **Smart Outage Analysis**: Intelligent monitoring and recommendations for power outages
  - Compares battery remaining time vs outage duration
  - Calculates if you can fully charge before next outage
  - Color-coded alerts: Critical (red), Warning (yellow), Info (blue), OK (green)
  
- **Current Outage Display**: Shows active outage information
  - Outage end time with smart formatting (Today/Tomorrow/Date)
  - Time remaining until power returns
  - Battery sufficiency analysis and warnings
  
- **Next Outage Preview**: Helps prepare for scheduled outages
  - Next outage start time display
  - Countdown to next outage
  - Required charging time calculation with analysis
  
- **Outage Schedule Display**: View complete outage schedule
  - Supports both plain text and JSON formats
  - Perfect for scheduled/rolling blackouts
  - Collapsible schedule view
  
- **Automated Recommendations**: Get actionable insights
  - "⚠️ Battery may run out before outage ends!" (Critical)
  - "⚡ Battery sufficient, but only Xm spare time" (Warning)
  - "⏰ Start charging soon - limited time margin" (Info)
  - "✅ Battery sufficient for outage" (OK)

#### New Configuration Options
- `outage_status_entity`: Current outage status sensor (supports: on/off, true/false, active/inactive, 1/0)
- `outage_end_time_entity`: When current outage will end (ISO datetime or Unix timestamp)
- `next_outage_time_entity`: When next outage starts (ISO datetime or Unix timestamp)
- `outage_schedule_entity`: Outage schedule information (text or JSON)
- `charge_rate_watts`: Charging power in watts for accurate time calculations (default: 1000)
- `battery_capacity_wh`: Battery capacity in watt-hours for accurate calculations (default: 1024)

### Changed 📝
- Updated card version display to v0.2.0
- Enhanced documentation with comprehensive outage setup guide
- Improved README with detailed configuration examples

### Technical Details 🔧
- Added 11 new methods for outage analysis and time calculations
- Implemented intelligent datetime parsing (supports ISO format and Unix timestamps)
- Added charging time calculation based on battery specs
- Created comprehensive analysis logic for outage situations
- Implemented smart formatting for dates (Today/Tomorrow/Full date)
- Added CSS animations for critical alerts (pulsing red background)

### Documentation 📚
- Created `example-config.yaml` with multiple configuration scenarios
- Added extensive outage integration setup guide in README
- Included template sensor examples for:
  - Simple scheduled outages
  - External API integration
  - DTEK (Ukrainian energy provider) integration
- Added troubleshooting section for outage features
- Included battery specifications for common EcoFlow models

### Testing 🧪
- Created `test-outage.html` for interactive testing of outage features
- Added 4 preset scenarios:
  - Normal Operation
  - Active Outage - Sufficient
  - Active Outage - Critical
  - Charging Before Outage

## [0.1.26] - Previous Version

### Features
- Visual battery display with segmented columns
- Animated status indicator (charging/discharging/connected)
- Energy flow animation
- Real-time power display
- Smart time display (discharge/charge)
- Configurable thresholds and color palettes
- Theme integration
- HACS compatible

---

## Migration Guide

### From v0.1.x to v0.2.0

Version 0.2.0 is **fully backward compatible**. All existing configurations will continue to work without any changes.

#### To Enable Outage Features:

1. **Create outage sensors** in your Home Assistant configuration (see README for examples)

2. **Add outage entities** to your card configuration:
```yaml
outage_status_entity: sensor.outage_status
outage_end_time_entity: sensor.outage_end_time
next_outage_time_entity: sensor.next_outage_time
outage_schedule_entity: sensor.outage_schedule
```

3. **Configure battery specs** (optional, for accurate calculations):
```yaml
charge_rate_watts: 1200  # Your charger's wattage
battery_capacity_wh: 1024  # Your battery's capacity
```

That's it! The card will automatically show outage information when configured.

---

## Future Plans 🚀

Potential features for future releases:
- Multiple outage schedule support
- Historical outage data visualization
- Predictive battery optimization suggestions
- Integration with weather forecasts for solar charging
- Mobile notifications for critical situations
- Customizable alert thresholds
- Support for multiple batteries

---

## Support

For issues, feature requests, or questions:
- GitHub Issues: [Create an issue](https://github.com/lemannrus/ecoflow-battery-card/issues)
- Documentation: See README.md
- Examples: See example-config.yaml

---

*Made with ❤️ for the Home Assistant community*

