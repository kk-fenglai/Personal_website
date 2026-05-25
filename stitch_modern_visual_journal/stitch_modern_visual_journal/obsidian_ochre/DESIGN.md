---
name: Obsidian & Ochre
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#7d562d'
  on-secondary: '#ffffff'
  secondary-container: '#ffca98'
  on-secondary-container: '#7a532a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#111e1f'
  on-tertiary-container: '#798688'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#f0bd8b'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#623f18'
  tertiary-fixed: '#d7e5e7'
  tertiary-fixed-dim: '#bbc9cb'
  on-tertiary-fixed: '#111e1f'
  on-tertiary-fixed-variant: '#3c494b'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  caption:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
  asymmetric-offset: 120px
---

## Brand & Style
The design system is built for a personal portfolio that bridges the gap between intellectual discourse and visual artistry. The brand personality is **introspective, professional, and artistic**, demanding a UI that acts as a silent gallery frame rather than a distraction.

The aesthetic follows an **Editorial Minimalism** approach. It utilizes heavy whitespace to create a sense of "calm luxury" and focuses on high-end typography to establish an authoritative yet personal voice. The interface should feel like a premium digital monograph, emphasizing intentionality in every alignment and interaction.

## Colors
The palette is grounded in a sophisticated monochrome base to ensure photography remains the focal point.

- **Primary (#1A1A1A):** A deep charcoal used for typography and high-contrast structural elements.
- **Secondary (#D4A373):** A muted gold accent used sparingly for interactive highlights, focus states, or delicate decorative flourishes.
- **Tertiary (#4A5759):** A slate blue reserved for metadata, secondary labels, or subtle dividers.
- **Neutral (#F9F9F9):** An "off-white" paper tone that reduces eye strain and provides a softer backdrop than pure hex white.

Surface levels are achieved through subtle shifts between whites and very light grays (#F0F0F0) rather than heavy borders.

## Typography
The typographic system relies on the contrast between the graceful, historical weight of **EB Garamond** and the functional, understated clarity of **DM Sans**.

- **Headers:** Use EB Garamond for all editorial titles. Keep weights light or medium to maintain elegance. Use `display-lg` for landing hero sections and `headline-md` for essay titles.
- **Body:** Use DM Sans for long-form reading. The increased line height (1.6) is essential for readability against a minimalist backdrop.
- **Metadata:** Labels for dates, categories, or technical photo data should use `label-caps` to create a rhythmic, structured feel that contrasts with the fluid serif headers.

## Layout & Spacing
The layout employs an **Asymmetrical Grid** to evoke a contemporary editorial feel. 

- **The Grid:** A 12-column system where content often bypasses the first 2 or 3 columns to create "intentional void" or wide margins. 
- **Asymmetry:** Pair large, immersive images that span 8 columns with text blocks that span 4 columns, offset by the `asymmetric-offset` variable to create visual tension and interest.
- **Whitespace:** Vertical rhythm should be generous. Use 120px–160px sections gaps on desktop to allow the "eye to breathe" between different thoughts or photo series.
- **Reflow:** On mobile, the layout collapses to a single column with 24px margins, but maintains the high-end feel through large header sizes and full-bleed image containers.

## Elevation & Depth
This design system avoids traditional shadows in favor of **Tonal Layering** and **Fine Lines**.

- **Depth:** Created through the physical stacking of elements. For example, a caption might slightly overlap the corner of a photo using a higher z-index, but with no shadow.
- **Outlines:** Use extremely light, 1px borders (#E5E5E5) for UI elements like input fields or image frames to provide structure without adding visual weight.
- **Glassmorphism:** Use only for the navigation bar—a high-saturation backdrop blur (20px) with a 90% opacity `neutral` background to allow content to scroll subtly beneath it.

## Shapes
The shape language is **Sharp (0)**. To maintain a professional, architectural, and gallery-like aesthetic, all corners on buttons, images, and containers are strictly 90 degrees. This precision reinforces the "artistic and modern" personality.

## Components
- **Buttons:** Text-only or underlined. Primary buttons use a solid `#1A1A1A` background with `neutral` text, but no rounded corners. Secondary buttons use a simple 1px bottom border that expands on hover.
- **Image Containers:** High-impact, often full-width or spanning 2/3 of the grid. Images should use a subtle "fade-in" transition on scroll to emphasize the "introspective" vibe.
- **Dividers:** Horizontal rules should be 1px thick, using the `secondary` gold color or a light gray, often not spanning the full width of the container to feel more "sketched."
- **Navigation:** Understated top-right or centered text links in `label-caps`. Active states are indicated by a simple dot or a color shift to the `secondary` gold.
- **Cards:** For blog or gallery feeds, cards are borderless. The image takes priority, followed by a `label-caps` category and a `headline-sm` title.
- **Lists:** Clean, unstyled lists with generous vertical padding (24px) between items, separated by hair-line dividers.