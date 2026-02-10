# Nutrition Llama Brand Guidelines

## Brand Overview

**Nutrition Llama** is an AI-powered nutrition tracking application that simplifies healthy living through intelligent automation. Our brand represents the intersection of cutting-edge technology and personal wellness, making nutrition tracking accessible, accurate, and effortless.

### Mission
To empower individuals to make informed nutritional decisions by removing friction from food tracking through AI-powered automation.

### Brand Promise
Intelligent nutrition tracking that works as hard as you do—snap, scan, and know your macros instantly.

---

## Brand Personality

### Core Attributes
- **Intelligent**: Leveraging AI to provide smart, accurate nutrition analysis
- **Approachable**: Friendly and accessible, never intimidating or clinical
- **Modern**: Clean, contemporary design that feels current and tech-forward
- **Trustworthy**: Accurate data and reliable performance users can depend on
- **Empowering**: Putting nutritional knowledge and control in users' hands

### Brand Voice
- **Tone**: Encouraging, informative, and conversational
- **Style**: Clear and concise without being overly technical
- **Attitude**: Positive and motivating, celebrating progress over perfection
- **Language**: Use "we" and "you" to create partnership; avoid medical jargon

**Examples:**
- ✅ "Track your nutrition with AI"
- ✅ "Snap a photo, get instant nutrition facts"
- ❌ "Utilize our computational algorithms for nutritional analysis"
- ❌ "Optimize your macronutrient intake protocol"

---

## Color Palette

### Primary Color
Our primary color is a vibrant, healthy green that evokes growth, health, and vitality.

**Green (Primary)**
- `primary-50`: #f0fdf4 - Lightest background tint
- `primary-100`: #dcfce7 - Light backgrounds, subtle highlights
- `primary-200`: #bbf7d0 - Borders, dividers
- `primary-300`: #86efac - Hover states
- `primary-400`: #4ade80 - Active states
- `primary-500`: #22c55e - Icons, accents
- `primary-600`: #16a34a - Main brand color, CTAs, links
- `primary-700`: #15803d - Hover on CTAs
- `primary-800`: #166534 - Dark accents
- `primary-900`: #14532d - Darkest shade

**Usage:**
- Primary CTAs (buttons, links)
- Brand elements (logo, navigation highlights)
- Success states and positive feedback
- Active navigation items

### Secondary Colors
These colors provide visual variety and help categorize different types of information.

**Blue (Information)**
- `blue-50` to `blue-600`
- Use for: Food browsing, informational content, neutral actions

**Purple (Logging & Tracking)**
- `purple-50` to `purple-600`
- Use for: Food logs, daily tracking, time-based activities

**Yellow/Amber (Carbohydrates)**
- `yellow-50` to `yellow-600`
- Use for: Carbohydrate metrics, energy-related features

**Red (Protein)**
- `red-50` to `red-600`
- Use for: Protein metrics, important notices (not errors)

**Green (Fat - Secondary)**
- Use lighter greens or blue-greens for fat metrics to differentiate from primary brand color

### Neutral Colors
**Gray Scale**
- `gray-50`: #f9fafb - Lightest backgrounds
- `gray-100`: #f3f4f6 - Card backgrounds, subtle sections
- `gray-200`: #e5e7eb - Borders, dividers
- `gray-300`: #d1d5db - Disabled states
- `gray-500`: #6b7280 - Secondary text
- `gray-600`: #4b5563 - Body text
- `gray-700`: #374151 - Emphasized text
- `gray-900`: #111827 - Headings, primary text
- `white`: #ffffff - Pure white backgrounds

---

## Typography

### Font Philosophy
Typography should be clean, highly legible, and modern. We rely on system fonts for optimal performance and native feel across platforms.

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Type Scale

**Display Headings (Hero/Landing)**
- Size: 48px–72px (3xl–6xl)
- Weight: 800 (extrabold)
- Line height: 1.1
- Use: Hero headlines, major landing sections

**H1 - Page Titles**
- Size: 30px–36px (2xl–4xl)
- Weight: 700 (bold)
- Line height: 1.2
- Use: Main page headings

**H2 - Section Headings**
- Size: 24px–28px (xl–2xl)
- Weight: 600–700 (semibold–bold)
- Line height: 1.3
- Use: Major sections within pages

**H3 - Subsection Headings**
- Size: 18px–20px (lg–xl)
- Weight: 500–600 (medium–semibold)
- Line height: 1.4
- Use: Cards, component headings

**Body Text**
- Size: 16px (base)
- Weight: 400 (regular)
- Line height: 1.5
- Color: gray-700
- Use: Main content, descriptions

**Small Text**
- Size: 14px (sm)
- Weight: 400–500
- Line height: 1.4
- Color: gray-500–gray-600
- Use: Captions, metadata, secondary info

**Labels & Buttons**
- Size: 14px–16px (sm–base)
- Weight: 500–600 (medium–semibold)
- Use: Form labels, button text, navigation

---

## Logo & Iconography

### Logo Usage
**Primary Logo**: "Nutrition Llama"
- Color: `primary-600` (#16a34a)
- Font weight: 700 (bold)
- Size: 20px–24px (xl–2xl)
- Always maintain clear space around logo (minimum 16px)

**Logo Variations:**
- Full color on white background (primary)
- White on dark background (reversed)
- Never distort, rotate, or add effects to logo

### Iconography Style
**Icon Library**: Heroicons (outline style preferred)
- Stroke width: 2px
- Size: 20px–24px for UI elements
- Size: 16px for inline icons
- Color: Match parent text or use `primary-600`

**Icon Usage Patterns:**
- Camera icon: Scanning/photo capture
- Chart/graph icon: Analytics and summaries
- Food/utensils icon: Meals and food items
- Clock icon: Time-based tracking
- Barcode icon: Quick entry

---

## UI Components & Patterns

### Buttons

**Primary Buttons**
```
Background: primary-600
Hover: primary-700
Text: white
Padding: 12px 24px (py-3 px-6)
Border radius: 6px (rounded-md)
Font weight: 500 (medium)
```

**Secondary Buttons**
```
Background: white
Border: 1px solid gray-300
Hover background: gray-50
Text: gray-700
Same padding and radius as primary
```

**Icon Buttons**
- Circular or square
- Size: 40px×40px
- Icon size: 20px
- Center aligned

### Cards
```
Background: white
Border: 1px solid gray-200 (optional)
Border radius: 8px (rounded-lg)
Shadow: subtle (shadow-sm) or medium (shadow)
Padding: 24px (p-6)
```

**Card Hover State:**
- Slight shadow increase
- Subtle background change (gray-50)
- Smooth transition (150ms–200ms)

### Forms

**Input Fields**
```
Background: white
Border: 1px solid gray-300
Focus border: primary-600
Border radius: 6px (rounded-md)
Padding: 8px 12px
Font size: 16px (prevent mobile zoom)
```

**Labels**
```
Font size: 14px
Font weight: 500
Color: gray-700
Margin bottom: 4px–8px
```

### Navigation

**Top Navigation**
```
Background: white
Border bottom: 1px solid gray-200
Height: 64px (h-16)
Shadow: subtle (shadow-sm)
```

**Navigation Items**
- Default: gray-700
- Hover: primary-600
- Active: primary-600 with optional underline
- Font weight: 500

**Mobile Navigation**
- Bottom tab bar on mobile
- Icon + label combination
- Active state: primary-600

---

## Layout & Spacing

### Grid System
- Max container width: 1280px (max-w-7xl)
- Padding: 16px mobile, 24px tablet, 32px desktop
- Column gaps: 16px–32px

### Spacing Scale
Based on Tailwind's default spacing scale (4px base unit):
- **Tight**: 4px–8px (1–2) - Between related elements
- **Default**: 16px (4) - Standard element spacing
- **Relaxed**: 24px–32px (6–8) - Section spacing
- **Loose**: 48px–64px (12–16) - Major section breaks

### Component Spacing
- Form fields: 16px vertical gap
- Card grid: 16px–32px gap
- Section padding: 64px–96px vertical
- Content max-width: 768px (max-w-3xl) for readability

---

## Imagery & Photography

### Photo Style
**Characteristics:**
- Clean, well-lit food photography
- Natural lighting preferred
- Uncluttered backgrounds
- High quality and sharp focus
- Diverse food types and cuisines

**Avoid:**
- Overly staged or artificial-looking images
- Heavy filters or saturated colors
- Dark or poorly lit photos
- Stock photos that look generic

### Illustrations
If using illustrations:
- Simple, modern line style
- Use brand colors (primary green)
- Maintain consistent stroke weight
- Avoid overly complex or detailed illustrations

### Empty States
- Use friendly, encouraging messaging
- Include relevant icon (primary-600)
- Clear call-to-action
- Never make users feel bad about empty data

---

## Interaction & Animation

### Principles
- **Purposeful**: Animations should guide attention or provide feedback
- **Swift**: Keep animations fast (150ms–300ms)
- **Smooth**: Use easing functions (ease-in-out)
- **Subtle**: Don't distract from content

### Common Animations
**Hover Effects:**
- Scale: 1.02–1.05
- Color transitions
- Shadow depth increase

**Loading States:**
- Skeleton screens for content loading
- Spinners for actions
- Progress bars for multi-step processes

**Transitions:**
- Page transitions: 200ms
- Modal/dialog: 150ms slide + fade
- Dropdown menus: 100ms

---

## Responsive Design

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px–1024px (sm–lg)
- **Desktop**: > 1024px (lg+)

### Mobile-First Approach
- Design for mobile first, enhance for larger screens
- Touch targets minimum 44px×44px
- Readable font sizes (minimum 16px body text)
- Bottom navigation for core actions on mobile

### Considerations
- Stack grid layouts vertically on mobile
- Hide secondary navigation in hamburger menu
- Use full-width CTAs on mobile
- Optimize images for mobile bandwidth

---

## Accessibility

### WCAG 2.1 Level AA Compliance

**Color Contrast**
- Text on white: minimum 4.5:1 ratio
- Large text (18px+): minimum 3:1 ratio
- Our primary-600 on white: ~7:1 ✓
- Never use color alone to convey information

**Keyboard Navigation**
- All interactive elements keyboard accessible
- Visible focus indicators (primary-600 outline)
- Logical tab order

**Screen Readers**
- Semantic HTML (proper heading hierarchy)
- Alt text for all images
- ARIA labels where needed
- Skip navigation links

**Motion**
- Respect prefers-reduced-motion
- Provide alternatives to motion-based feedback

---

## Content Patterns

### Messaging Hierarchy

**Success Messages**
- Color: green-600
- Icon: checkmark
- Tone: Encouraging ("Great job!", "Added successfully")

**Error Messages**
- Color: red-600
- Icon: alert circle
- Tone: Helpful, solution-oriented
- Always explain what went wrong and how to fix it

**Information Messages**
- Color: blue-600
- Icon: info circle
- Tone: Neutral, instructive

### Microcopy Guidelines

**Empty States:**
- "No foods logged today" → "Log your first meal"
- "Nothing here yet" → "Get started by scanning a label"

**Button Copy:**
- Be specific: "Scan Label" not "Start"
- Use action verbs: "Log Food", "Add to Diary"
- Keep it short: 1–3 words ideal

**Helper Text:**
- Explain why, not just what
- Anticipate user questions
- Keep it concise but friendly

---

## Implementation Notes

### Tailwind CSS Configuration
Our custom theme extends Tailwind with:
- Custom primary color palette (green)
- Standard spacing and typography scales
- Responsive design utilities

### Component Library
Potential component libraries that align with our brand:
- **Headless UI**: Matches our design system
- **Radix UI**: Accessible primitives
- Custom components built with Tailwind

### Performance
- Optimize images (WebP format)
- Lazy load below-the-fold content
- Minimize animation overhead
- Use system fonts for instant loading

---

## Design Principles

### 1. Clarity Over Cleverness
Information should be immediately understandable. Avoid ambiguous icons or unclear language.

### 2. Speed is a Feature
Every interaction should feel instant. Loading states should be informative.

### 3. Progressive Disclosure
Show the most important information first. Hide complexity until needed.

### 4. Forgiveness Over Prevention
Let users undo actions easily. Confirm destructive actions only.

### 5. Data Visualization
Present nutrition data visually whenever possible:
- Use color coding for macros
- Bar charts for comparisons
- Numbers with context and units

---

## Don'ts

**Visual:**
- Don't use bright, neon colors
- Don't mix too many accent colors on one screen
- Don't use small font sizes (< 14px for body)
- Don't overcrowd interfaces

**Interaction:**
- Don't hide important actions in menus
- Don't use vague error messages
- Don't make users confirm obvious actions
- Don't auto-play animations or videos

**Content:**
- Don't use diet culture language ("cheat day", "guilt-free")
- Don't make assumptions about user goals
- Don't use technical jargon without explanation
- Don't shame users about their food choices

---

## Future Considerations

As the brand evolves, consider:
- Custom illustrations for empty states
- Potential llama mascot character
- Dark mode variant (primary-400 on dark backgrounds)
- Expanded color palette for premium features
- Motion design system
- Branded loading states

---

## Resources

### Design Tools
- **Figma**: For design mockups and prototypes
- **Tailwind CSS**: For implementation
- **Heroicons**: For iconography

### Inspiration
- Modern health and fitness apps
- Clean dashboard interfaces
- AI-powered productivity tools

### Testing
- Accessibility: WAVE, axe DevTools
- Color contrast: Contrast Checker
- Mobile: Real device testing
- Performance: Lighthouse

---

**Version**: 1.0
**Last Updated**: January 2026
**Maintained by**: Nutrition Llama Design Team

For questions or updates to these guidelines, please open an issue or submit a pull request.
