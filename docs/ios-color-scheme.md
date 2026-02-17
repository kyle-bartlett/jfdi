# iOS App Color Scheme (Phase 3 Reference)

Saved from `/Users/kylebartlett/Personal/anker-ios-app-colors.md.txt` for the future JFDI iOS app.

## Anker Brand Colors
- **Primary**: `#00A9E0` — Anker Brand Blue
- **Focus/Ring**: `#40C7FB` — Highlight Blue (focus/ring/selection)
- **Accent**: `#00DB84` — Accent Green (positive states only)

## SwiftUI Design System Structure
```
/DesignSystem/
  DesignTokens.swift     — semantic colors (light/dark), typography, spacing, radii
  Theme.swift            — Theme struct exposing all tokens
  ThemeMode.swift         — enum: system/dark/light
  /Components/
    DSCard.swift          — surface + border + radius + padding
    DSPrimaryButton.swift — primary token + consistent height/radius
    DSSecondaryButton.swift
    DSTag.swift           — badge variants: neutral, primary, success, warning, danger
    DSMetricTile.swift    — dashboard KPI blocks

/AppCore/
  ThemeManager.swift     — ObservableObject, persists to UserDefaults, default = .dark
```

## Semantic Color Tokens (both themes)
- background, surface, surface2, border
- textPrimary, textSecondary
- primary, primaryPressed
- accent (positive only)
- success, warning, danger
- focusRing

## Rules
1. No hardcoded colors in views (no Color.blue, no Color(.system*), no hex in screens)
2. Hex values ONLY inside DesignSystem token definitions
3. All colors are semantic tokens
4. Dark is default unless user selects Light or System in Settings
5. No gradients unless explicitly requested; if ever, ONLY #00A9E0 -> #00DB84
6. Theme toggle lives in Settings screen, NOT dashboard header

## Typography Tokens
- title, sectionHeader, body, caption

## Spacing + Radii
- Spacing scale: 4/8/12/16/24
- Radii: cards/buttons

## Navigation
- TabView: Dashboard + Settings
- Theme updates propagate instantly across all tabs
