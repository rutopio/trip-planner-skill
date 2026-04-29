---
name: ui-style
description: Apply beautiful UI design styles to frontend projects. Use this skill whenever the user wants to style a UI, apply a design aesthetic, change the look and feel of an interface, or mentions any design style by name (e.g. "make it brutalist", "cyberpunk theme", "glassmorphism", "retro 90s look", "luxury feel", "terminal style"). Also trigger when the user says things like "make it look like X", "style this as Y", "I want a Z aesthetic", "apply a dark theme", "make it more playful/professional/minimal", or asks to redesign or restyle any frontend component, page, or application. Even vague requests like "make it look better" or "give it more personality" should trigger this skill so you can present the style catalog. Covers 30 distinct design systems with complete color palettes, typography, spacing, shadows, borders, animations, and component patterns — all Tailwind CSS ready.
---

# UI Style — Design Style Applicator

Apply any of 30 professionally crafted design styles to frontend projects. Each style is a complete design system with colors, typography, spacing, shadows, border radius, animations, and component patterns.

## How This Works

1. **User picks a style** (or you recommend one based on their project)
2. **Read the style's reference file** from `references/<style-name>.md`
3. **Apply the design system** to the user's code — Tailwind config, CSS variables, component markup

## Available Styles (30)

| # | Style | Reference File | Vibe |
|---|-------|---------------|------|
| 1 | **SaaS** | `saas.md` | Clean, structured, bold CTAs with electric blue gradient accents |
| 2 | **Claymorphism** | `claymorphism.md` | Soft 3D clay/plastic feel with layered shadows and rounded corners |
| 3 | **Neo-Brutalism** | `neo-brutalism.md` | Punk rebellion — hard shadows, thick borders, zero blur, raw energy |
| 4 | **Modern Dark** | `modern-dark.md` | Linear-inspired — cinematic lighting, indigo accent, gradient blobs |
| 5 | **Cyberpunk** | `cyberpunk.md` | Neon glows, scanlines, chamfered corners, terminal aesthetic |
| 6 | **Neumorphism** | `neumorphism.md` | Soft extruded UI — dual opposing shadows on monochrome surface |
| 7 | **Flat Design** | `flat-design.md` | Zero shadows, zero depth — hierarchy through color and size only |
| 8 | **Retro 90s** | `retro.md` | Windows 95 nostalgia — beveled borders, marquee, hit counters |
| 9 | **Luxury Editorial** | `luxury.md` | High-end magazine — gold accents, serif type, grayscale imagery |
| 10 | **Material Design 3** | `material-design.md` | Google's Material You — tonal surfaces, pill buttons, organic shapes |
| 11 | **Swiss Minimalist** | `swiss-minimalist.md` | International typographic style — grid precision, red accent, zero radius |
| 12 | **Playful Geometric** | `playful-geometric.md` | Memphis-inspired — hard pop shadows, candy colors, bouncy animations |
| 13 | **Monochrome** | `monochrome.md` | Pure black and white — typography as graphics, instant hover inversions |
| 14 | **Industrial** | `industrial.md` | Skeuomorphic precision instruments — screws, vents, CRT scanlines |
| 15 | **Academia** | `academia.md` | University library — mahogany, brass, serif type, wax seals |
| 16 | **Terminal CLI** | `terminal.md` | Hacker aesthetic — green on black, monospace, blinking cursor |
| 17 | **Kinetic Typography** | `kinetic.md` | Motion-first — infinite marquees, massive type, acid yellow accent |
| 18 | **Newsprint** | `newsprint.md` | Newspaper editorial — columns, drop caps, justified text, serif type |
| 19 | **Professional Serif** | `professional.md` | Literary magazine — burnished gold, Playfair Display, warm ivory |
| 20 | **Enterprise** | `enterprise.md` | Corporate SaaS — indigo/violet gradients, 3D transforms, trust |
| 21 | **Bold Typography** | `bold-typography.md` | Poster design on web — extreme scale contrast, vermillion accent |
| 22 | **Minimal Dark** | `minimal-dark.md` | Developer tools vibe — amber accent, glass cards, atmospheric depth |
| 23 | **Maximalism** | `maximalism.md` | Sensory overload — 5 accent colors, floating shapes, animated emoji |
| 24 | **Web3 / DeFi** | `web3.md` | Bitcoin orange, digital gold gradients, orbital animations |
| 25 | **Vaporwave** | `vaporwave.md` | Retro-futurism — magenta/cyan neon, CRT effects, aggressive skew |
| 26 | **Botanical** | `botanical.md` | Nature-inspired — sage/terracotta, arch imagery, paper grain texture |
| 27 | **Sketch / Hand-drawn** | `sketch.md` | Napkin diagrams — wobbly borders, handwritten fonts, hard shadows |
| 28 | **Bauhaus** | `bauhaus.md` | Constructivist — primary colors only, geometric shapes, color blocks |
| 29 | **Art Deco** | `art-deco.md` | Roaring Twenties — gold on black, geometric precision, roman numerals |
| 30 | **Organic / Natural** | `organic.md` | Wabi-sabi — earth tones, blob shapes, rounded serif, moss shadows |

## Applying a Style

When the user selects a style (or you recommend one), read the corresponding reference file. Each file contains:

### What's In Each Reference File

- **Philosophy** — the design intent (helps you make judgment calls)
- **Color Palette** — exact hex codes with semantic token names
- **Typography** — font families, weights, scale, tracking, line-height
- **Border Radius** — specific radius values (some styles are strictly 0px!)
- **Shadows** — shadow definitions per elevation level
- **Spacing** — padding/margin conventions, section rhythm
- **Component Patterns** — buttons, cards, inputs, navigation specifics
- **Animation** — timing, easing, hover/active states
- **Signature Elements** — the non-negotiable visual details that make the style recognizable
- **Anti-Patterns** — what to explicitly avoid

### Implementation Steps

1. **Set up the color system** — Add CSS custom properties or Tailwind theme extension with the style's color tokens
2. **Configure typography** — Import the specified Google Fonts, set up the type scale
3. **Apply global styles** — Background, default text color, border radius conventions
4. **Style components** — Buttons, cards, inputs, navigation following the component patterns
5. **Add signature elements** — The unique visual details (textures, patterns, decorative elements)
6. **Wire up interactions** — Hover states, active states, transitions with the specified easing

### Tailwind Integration

Most styles map cleanly to Tailwind. In `tailwind.config.js`:

```js
// Example: extending theme with style tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add the style's color palette here
      },
      fontFamily: {
        // Add the style's fonts here
      },
      borderRadius: {
        // Override if the style has specific radius rules
      },
      boxShadow: {
        // Add custom shadow definitions
      },
    },
  },
}
```

For styles that use CSS custom properties or need global CSS (textures, patterns, animations), add them to your global stylesheet.

## Recommending a Style

If the user hasn't picked a specific style, help them choose based on:

| Project Type | Recommended Styles |
|---|---|
| **Travel guide / Itinerary planner** | **Swiss Minimalist, Luxury Editorial, Botanical, Newsprint, Professional Serif, Academia, Organic, Monochrome** |
| SaaS / Dashboard | SaaS, Enterprise, Modern Dark, Minimal Dark, Professional |
| Portfolio / Creative | Bold Typography, Kinetic, Monochrome, Swiss Minimalist |
| E-commerce / Luxury | Luxury Editorial, Art Deco, Professional Serif |
| Fun / Personal | Playful Geometric, Retro 90s, Sketch, Maximalism |
| Tech / Developer | Terminal CLI, Cyberpunk, Modern Dark, Minimal Dark |
| Blog / Editorial | Newsprint, Professional Serif, Botanical, Monochrome |
| Web3 / Crypto | Web3, Cyberpunk, Vaporwave |
| Nature / Wellness | Botanical, Organic, Neumorphism |
| Education / Academic | Academia, Swiss Minimalist, Newsprint |
| Trendy / Experimental | Claymorphism, Neo-Brutalism, Vaporwave, Maximalism |

### Travel-suitable styles — why these (and not the others)

A trip planner needs styles that prioritize **information density, readability, and longevity**. Avoid styles that fight the dense data UI (calendar grids, POI lists, maps, budget tables):

| ✅ Travel-suitable | Why it works |
|--------------------|---------------|
| Swiss Minimalist | Grid-friendly, neutral, high info density |
| Luxury Editorial | Magazine-grade typography for long-form trip narratives |
| Botanical / Organic | Warm earth tones — feels like a travel journal |
| Newsprint | Multi-column layouts shine for itineraries |
| Professional Serif | Reads beautifully on long pages |
| Academia | Encyclopedia-of-the-trip aesthetic |
| Monochrome | Disappears, lets the content shine |

| ❌ Avoid for travel | Why |
|---------------------|------|
| Cyberpunk, Vaporwave, Web3, Terminal | Dark/neon aesthetics fight against map and calendar density |
| Neo-Brutalism, Maximalism | Visual noise at the cost of itinerary clarity |
| Kinetic, Bold Typography | Designed for posters, not 14-day plans |
| Industrial, Claymorphism | Skeuomorphic chrome distracts from content |

When the `trip-planner` skill picks a style at Phase 4.5, it filters this travel-suitable subset and asks the user to choose. See [trip-planner/references/phase-4_5-style-and-audit.md](../../trip-planner/references/phase-4_5-style-and-audit.md).

## Important Notes

- Each style's reference file is the authoritative source — read it fully before applying
- Respect the **anti-patterns** — they define what NOT to do, which is just as important as what to do
- The **signature elements** are what make each style distinctive — skip them and it just looks generic
- All styles are designed for Tailwind CSS but can be adapted to any CSS framework
- Styles can be mixed carefully, but start pure and adjust from there

## Credits

All design style specifications sourced from [designprompts.dev](https://www.designprompts.dev/).
