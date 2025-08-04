# HealthProcure Design System

## Overview

This document outlines the enhanced visual design system implemented for HealthProcure, including color palettes, typography, spacing, components, and usage guidelines. The system is designed with a clean, modern light theme optimized for professional healthcare environments.

## 🎨 Color Palette

### Primary Colors
- **Primary**: `hsl(207 90% 54%)` - Main brand color
- **Primary Hover**: `hsl(207 90% 48%)` - Hover state
- **Primary Light**: `hsl(207 90% 92%)` - Light variant
- **Primary Foreground**: `hsl(0 0% 100%)` - Text on primary

### Semantic Colors
- **Success**: `hsl(142 76% 36%)` - Green for success states
- **Warning**: `hsl(38 92% 50%)` - Orange for warnings
- **Info**: `hsl(199 89% 48%)` - Blue for information
- **Destructive**: `hsl(0 84% 60%)` - Red for errors/destructive actions

### Neutral Colors
- **Background**: `hsl(210 100% 98%)` - Main background
- **Foreground**: `hsl(220 20% 15%)` - Main text color
- **Muted**: `hsl(210 40% 96%)` - Muted backgrounds
- **Muted Foreground**: `hsl(215 16% 47%)` - Muted text

## 📝 Typography

### Font Hierarchy
- **H1**: `text-4xl font-bold tracking-tight` - Page titles
- **H2**: `text-3xl font-semibold tracking-tight` - Section headers
- **H3**: `text-2xl font-semibold tracking-tight` - Subsection headers
- **H4**: `text-xl font-semibold tracking-tight` - Component titles
- **H5**: `text-lg font-medium` - Small headers
- **H6**: `text-base font-medium` - Smallest headers
- **Body**: `text-base` with `line-height: 1.625` - Regular text
- **Small**: `text-sm` - Secondary text

### Font Families
- **Body**: Inter (via `--font-inter`)
- **Headline**: Inter (via `--font-inter`)
- **Code**: Monospace

## 📏 Spacing System

### Spacing Scale
- **XS**: `0.25rem` (4px)
- **SM**: `0.5rem` (8px)
- **MD**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)
- **2XL**: `3rem` (48px)
- **3XL**: `4rem` (64px)

### Usage
```css
.space-md { gap: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
```

## 🔲 Border Radius

### Radius Scale
- **SM**: `0.25rem`
- **Default**: `0.5rem`
- **MD**: `0.75rem`
- **LG**: `1rem`
- **XL**: `1.5rem`
- **Full**: `9999px`

### Usage
```css
.rounded-custom { border-radius: var(--radius); }
.rounded-custom-lg { border-radius: var(--radius-lg); }
```

## 🌟 Shadows

### Shadow Scale
- **SM**: Subtle shadow for small elements
- **Default**: Standard shadow for cards
- **MD**: Medium shadow for elevated elements
- **LG**: Large shadow for modals/dropdowns
- **XL**: Extra large shadow for floating elements

### Usage
```css
.shadow-custom { box-shadow: var(--shadow); }
.shadow-custom-lg { box-shadow: var(--shadow-lg); }
```

## 🎭 Gradients

### Available Gradients
- **Primary**: `linear-gradient(135deg, primary, accent)`
- **Success**: `linear-gradient(135deg, success variants)`
- **Warning**: `linear-gradient(135deg, warning variants)`
- **Card**: `linear-gradient(135deg, card variants)`

### Usage
```css
.bg-gradient-primary { background: var(--gradient-primary); }
.btn-gradient { /* Predefined gradient button */ }
```

## 🧩 Component Variants

### Button Variants
- **Default**: Primary button with hover effects
- **Destructive**: Red button for dangerous actions
- **Outline**: Outlined button
- **Secondary**: Secondary styling
- **Ghost**: Transparent button
- **Link**: Link-styled button
- **Gradient**: Gradient background button
- **Success**: Green success button
- **Warning**: Orange warning button
- **Info**: Blue info button

### Button Sizes
- **SM**: Small button (`h-8`)
- **Default**: Standard button (`h-10`)
- **LG**: Large button (`h-12`)
- **XL**: Extra large button (`h-14`)
- **Icon**: Square icon button
- **Icon SM/LG**: Different icon sizes

### Card Variants
- **Default**: Standard card with shadow
- **Elevated**: Card with larger shadow
- **Gradient**: Gradient background card
- **Success/Warning/Info/Destructive**: Semantic colored cards
- **Glass**: Glass morphism effect


## 🎬 Animations

### Available Animations
- **Fade In**: `animate-fade-in` - Smooth opacity transition
- **Slide Up**: `animate-slide-up` - Slide from bottom
- **Scale In**: `animate-scale-in` - Scale from center
- **Pulse Soft**: `animate-pulse-soft` - Gentle pulsing

### Transitions
All interactive elements include smooth transitions:
- `transition-all duration-200` - Standard transition
- `hover:scale-105` - Subtle hover scaling
- `hover:shadow-lg` - Shadow elevation on hover

## 🎯 Status Indicators

### Status Classes
- **Pending**: `.status-pending` - Warning colors
- **Approved**: `.status-approved` - Success colors
- **Rejected**: `.status-rejected` - Destructive colors

### Priority Classes
- **High**: `.priority-high` - Red/destructive
- **Medium**: `.priority-medium` - Orange/warning
- **Low**: `.priority-low` - Green/success

## 🛠️ Utility Classes

### Custom Utilities
- `.text-gradient` - Gradient text effect
- `.glass-effect` - Glass morphism
- `.focus-ring` - Consistent focus styling
- `.animate-*` - Animation utilities
- `.shadow-custom-*` - Custom shadow utilities

## 📱 Responsive Design

### Breakpoints
- **SM**: `640px` and up
- **MD**: `768px` and up
- **LG**: `1024px` and up
- **XL**: `1280px` and up

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement for larger screens.

## ♿ Accessibility

### Features
- High contrast ratios optimized for readability
- Focus indicators on all interactive elements
- Screen reader friendly markup
- Keyboard navigation support
- Semantic HTML structure

## 🔧 Implementation Examples

### Enhanced Stats Cards
```tsx
<Card variant="elevated" className="animate-fade-in">
  <CardHeader>
    <CardTitle className="font-headline">Total Requests</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-gradient">42</div>
  </CardContent>
</Card>
```

### Gradient Button
```tsx
<Button variant="gradient" size="lg" className="shadow-custom-lg">
  Submit Request
</Button>
```

### Themed Header
```tsx
<header className="bg-background/95 backdrop-blur-md shadow-custom-sm">
  <div className="bg-gradient-primary p-2 rounded-custom">
    <Icon className="text-primary-foreground" />
  </div>
  <h1 className="text-gradient font-headline">HealthProcure</h1>
  <ThemeToggle />
</header>
```

## 🚀 Performance Considerations

### Optimizations
- CSS custom properties for efficient theme switching
- Minimal animation overhead
- Optimized shadow and gradient definitions
- Efficient class composition with Tailwind

### Best Practices
- Use semantic color names instead of specific values
- Leverage CSS custom properties for consistency
- Apply animations sparingly for better performance
- Use appropriate shadow levels for visual hierarchy

## 📋 Migration Guide

### From Old System
1. Replace hardcoded colors with CSS custom properties
2. Update spacing using the new scale
3. Apply new shadow and border radius utilities
4. Implement new component variants
5. Test visual consistency across components

### Component Updates
- Cards: Add variant props and new styling
- Buttons: Use new variants and sizes
- Typography: Apply new hierarchy classes
- Spacing: Use new spacing utilities

This design system provides a solid foundation for consistent, accessible, and beautiful user interfaces across the HealthProcure application, with a focus on professional healthcare environments and optimal readability.