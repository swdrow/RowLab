# Phase 19-05: Gallery, CTA, and Footer Design Specification

## Overview

Comprehensive design specification for landing page gallery, call-to-action sections, and footer. This document provides detailed layout specifications for manual Penpot implementation.

**Purpose:** Complete the landing page experience with visual showcase, conversion opportunities, and navigation structure.

**Target Penpot Location:** `03-Landing-Page` page within RowLab Design System project

---

## Frame Structure

Create three frames in `03-Landing-Page`:

1. **Gallery** (1920×1400) - Image/video gallery layouts
2. **CTA-Sections** (1920×2400) - Three CTA variants
3. **Footer** (1920×600) - Navigation footer

---

## 1. Gallery Frame Specification

**Frame dimensions:** 1920×1400
**Frame name:** `Gallery`
**Location:** `03-Landing-Page/Gallery`

### Section Header

**Position:** x: 0, y: 0
**Layout:** Centered, max-width 800px

- **Eyebrow text:** "Built for the Water"
  - Style: `Label/Default` (Inter 12px medium, uppercase, tracking +0.15em)
  - Color: `Ink/Secondary` (#6B6B6B)
  - Position: centered above title

- **Title:** "See RowLab in Action"
  - Style: `Display/H2` (Fraunces 36px)
  - Color: `Ink/Primary` (#FAFAFA)
  - Margin-top: 8px from eyebrow

- **Subtitle:** "From daily practice to championship racing"
  - Style: `Body/Large` (Inter 18px)
  - Color: `Ink/Body` (#ADADAD)
  - Margin-top: 12px from title

**Header total height:** ~140px with spacing

---

### Variant A: Masonry/Bento Gallery

**Position:** x: 60, y: 180
**Layout:** 4-column grid with varying heights
**Total dimensions:** 1800×1000

#### Grid Specifications

**Gap:** 16px horizontal and vertical
**Column widths:** 430px, 430px, 430px, 430px (with 16px gaps = 1798px)

**Row 1:** (height: 287px)
- **Tile 1:** rowing-1.jpg (430×287) - Landscape
  - Position: x: 60, y: 180
  - Border-radius: 12px
  - Border: 1px solid `Ink/Border` (#262626)

- **Tile 2:** VIDEO: video-2.mp4 (430×287) - Video placeholder
  - Position: x: 506, y: 180
  - Background: `Ink/Raised` (#1A1A1A)
  - Border-radius: 12px
  - Border: 1px solid `Ink/Border` (#262626)
  - **VIDEO label:** `Metric/H1` (Geist Mono 48px), color: `Ink/Muted` (#404040), centered
  - **Filename:** "video-2.mp4" below label, `Body/Small` (Inter 14px), `Ink/Secondary`
  - **Play button overlay:**
    - Circle: 64px diameter, white with 20% opacity
    - Triangle icon: 24px, white solid
    - Position: centered on frame
    - Shadow: 0 8px 24px rgba(0,0,0,0.5)

- **Tile 3:** rowing-3.jpg (430×287) - Landscape
  - Position: x: 952, y: 180

- **Tile 4:** rowing-5.jpg (430×574) - Portrait (spans 2 rows)
  - Position: x: 1398, y: 180

**Row 2:** (height: 287px)
- **Tile 5:** rowing-6.jpg (430×287)
  - Position: x: 60, y: 483

- **Tile 6:** rowing-11.jpg (430×287)
  - Position: x: 506, y: 483

- **Tile 7:** rowing-13.jpg (430×287)
  - Position: x: 952, y: 483

**Row 3:** (height: 287px)
- **Tile 8:** rowing-14.jpg (430×287)
  - Position: x: 60, y: 786

- **Tile 9:** VIDEO: video-5.mp4 (430×287)
  - Position: x: 506, y: 786
  - Same VIDEO label styling as Tile 2

- **Tile 10:** rowing-15.jpg (430×287)
  - Position: x: 952, y: 786

- **Tile 11:** rowing-16.jpg (430×287)
  - Position: x: 1398, y: 786

**Row 4:** (height: 139px)
- **Tile 12:** rowing-7.jpg (684×139) - Ultra-wide (spans 1.5 columns)
  - Position: x: 60, y: 1089

- **Tile 13:** rowing-12.jpg (430×139) - Wide crop
  - Position: x: 760, y: 1089

- **Tile 14:** rowing-10.jpg (684×139) - Ultra-wide (spans 1.5 columns)
  - Position: x: 1206, y: 1089

#### Image Treatment (All Tiles)
- **Border-radius:** 12px
- **Border:** 1px solid `Ink/Border` (#262626)
- **Hover state:** (note for implementation)
  - Scale: 1.02
  - Border-color: `Ink/Border-Strong` (#404040)
  - Box-shadow: 0 0 40px rgba(0, 112, 243, 0.2) (using Data/Excellent glow)
  - Transition: 300ms ease

#### Video Tile Documentation Box

Below gallery grid, add documentation box:

**Position:** x: 60, y: 1260
**Dimensions:** 800×100
**Background:** `Ink/Surface` (#141414)
**Border:** 1px solid `Ink/Border` (#262626)
**Border-radius:** 8px
**Padding:** 20px

**Content:**
```
VIDEO PLAYBACK BEHAVIOR

Gallery Videos (video-2.mp4, video-5.mp4):
• Click thumbnail to open modal player
• Controls: Play/pause, mute, fullscreen
• Autoplay: No (user-initiated only)
• Fallback: Poster frame from first video frame

Implementation: Modal overlay with <video> element
```

Style: `Body/Small` (Inter 14px), `Ink/Body` (#ADADAD)

---

### Variant B: Carousel/Filmstrip Gallery

**Position:** x: 60, y: 180 (overlays Variant A - create on separate layer/page)
**Layout:** Horizontal scroll container
**Total dimensions:** 1800×420

#### Carousel Container
- **Background:** `Ink/Deep` (#0A0A0A)
- **Padding:** 24px 0
- **Overflow:** hidden (with scroll)

#### Carousel Track
- **Display:** Horizontal row with gap
- **Gap:** 16px between images
- **Padding:** 0 60px (left/right for edge fade)

#### Image Tiles (12 tiles)
Each image: 400×300 (consistent aspect ratio)

**Order:**
1. rowing-1.jpg
2. VIDEO: video-2.mp4 (with VIDEO label and play button as Variant A)
3. rowing-3.jpg
4. rowing-5.jpg
5. rowing-6.jpg
6. rowing-11.jpg
7. VIDEO: video-5.mp4
8. rowing-13.jpg
9. rowing-14.jpg
10. rowing-15.jpg
11. rowing-16.jpg
12. rowing-7.jpg

**Image treatment:**
- Border-radius: 12px
- Border: 1px solid `Ink/Border` (#262626)
- Same hover state as Variant A

#### Edge Fade Gradients
- **Left fade:** Linear gradient from `Ink/Deep` (opacity 1) to transparent over 60px
  - Position: x: 0, absolute
  - Dimensions: 60×420

- **Right fade:** Linear gradient from transparent to `Ink/Deep` (opacity 1) over 60px
  - Position: x: 1740, absolute
  - Dimensions: 60×420

#### Scroll Indicators

**Dots (centered below carousel):**
- Position: y: 440 (below carousel)
- 12 dots total (one per image)
- Dot size: 8px diameter circles
- Gap: 12px between dots
- Inactive color: `Ink/Border` (#262626)
- Active color: `Data/Excellent` (#0070F3)
- Centered horizontally

**Arrow navigation:**
- Left arrow: x: 20, y: 200 (vertically centered)
- Right arrow: x: 1840, y: 200
- Circle background: 48px diameter, `Ink/Surface` (#141414), 80% opacity
- Arrow icon: 24px, `Ink/Primary` (#FAFAFA)
- Border: 1px solid `Ink/Border` (#262626)
- Hover: Background opacity 100%, border `Ink/Border-Strong`

#### Auto-play Note
Add note below indicators:
"Auto-play: 5s interval (optional implementation)"
Style: `Body/XS` (Inter 12px), `Ink/Muted` (#404040)

---

### Mobile Gallery (Annotation Frame)

Create small annotation frame showing mobile layout:

**Frame name:** `Gallery-Mobile`
**Dimensions:** 375×600
**Position:** x: 60, y: 1380 (below main gallery)

**Layout:**
- 2-column grid (masonry variant)
- Image size: 172×115 per tile
- Gap: 8px
- Shows first 6 images: rowing-1, video-2, rowing-3, rowing-5, rowing-6, rowing-11

**Annotation:**
"Mobile: 2-column masonry OR horizontal scroll carousel"
"Touch gestures: Swipe, pinch-to-zoom on tap"

---

## 2. CTA-Sections Frame Specification

**Frame dimensions:** 1920×2400
**Frame name:** `CTA-Sections`
**Location:** `03-Landing-Page/CTA-Sections`

---

### CTA 1: Mid-Page Conversion (After Features)

**Position:** x: 0, y: 0
**Dimensions:** 1920×400
**Background:** Gradient from `Ink/Deep` (#0A0A0A) to `Ink/Base` (#121212) (top to bottom)

#### Content Container
**Max-width:** 800px
**Centered horizontally**
**Padding:** 80px 0

**Headline:**
- Text: "Ready to transform your program?"
- Style: `Display/H2` (Fraunces 36px)
- Color: `Ink/Primary` (#FAFAFA)
- Text-align: center
- Line-height: 1.2

**Subtext:**
- Text: "Join 50+ collegiate programs already using RowLab"
- Style: `Body/Large` (Inter 18px)
- Color: `Ink/Body` (#ADADAD)
- Text-align: center
- Margin-top: 16px

**Dual CTAs:**
- Position: 32px below subtext, centered
- Layout: Horizontal row, gap: 16px

**Primary CTA:**
- Text: "Start Free Trial"
- Background: white (#FFFFFF)
- Text color: black (#0A0A0A)
- Padding: 16px 32px
- Border-radius: 8px
- Height: 48px
- Font: `Label/Large` (Inter 14px medium)
- Icon: ArrowRight (20px) on right, gap: 8px
- Hover state: bg: #F5F5F5

**Secondary CTA:**
- Text: "Watch Demo"
- Background: transparent
- Text color: white (#FAFAFA)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Padding: 16px 32px
- Border-radius: 8px
- Height: 48px
- Font: `Label/Large` (Inter 14px medium)
- Hover state: border: rgba(255, 255, 255, 0.4), bg: rgba(255, 255, 255, 0.05)

**Social Proof (Optional):**
Below CTAs, 24px gap:
- Small logo strip or testimonial snippet
- Text: "Trusted by Stanford, Yale, UW, and more"
- Style: `Body/Small` (Inter 14px)
- Color: `Ink/Secondary` (#6B6B6B)

---

### CTA 2: Final Conversion (Before Footer)

**Position:** x: 0, y: 480
**Dimensions:** 1920×600
**Background:** Image `boathouse-sunset.jpg` with heavy dark overlay (70% black)

#### Background Treatment
- **Image:** boathouse-sunset.jpg (golden hour aesthetic)
- **Overlay:** Linear gradient top-to-bottom: rgba(10, 10, 10, 0.7) to rgba(10, 10, 10, 0.85)
- **Image position:** Center
- **Image size:** Cover (fills frame)

#### Content Container
**Centered vertically and horizontally**
**Max-width:** 900px

**Large Headline:**
- Text: "Start your free trial today"
- Style: `Display/Hero` (Fraunces 72px)
- Color: `Ink/Primary` (#FAFAFA)
- Text-align: center
- Line-height: 1.1
- Letter-spacing: -0.02em
- Text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) (for readability on image)

**Single Prominent CTA:**
- Position: 40px below headline, centered
- Text: "Get Started Free"
- Background: white (#FFFFFF)
- Text color: black (#0A0A0A)
- Padding: 20px 48px
- Border-radius: 8px
- Height: 64px (extra large)
- Font: `Label/Large` (Inter 14px medium, uppercase, tracking +0.05em)
- Icon: ArrowRight (24px) on right, gap: 12px
- Box-shadow: 0 8px 32px rgba(255, 255, 255, 0.2)
- Hover state: scale: 1.02, box-shadow: 0 12px 40px rgba(255, 255, 255, 0.3)

**Below Button Text:**
- Position: 16px below button
- Text: "No credit card required. 14-day trial."
- Style: `Body/Small` (Inter 14px)
- Color: `Ink/Body` (#ADADAD)
- Text-align: center

**Email Input Variant (Alternative Layout):**
Create duplicate frame showing email-first flow:

Instead of single CTA, show:
- Email input field (400px wide, 56px height)
- "Get Started" button (56px height) inline on right
- Same "No credit card" text below

---

### CTA 3: Inline Feature CTA (Compact)

**Position:** x: 0, y: 1160
**Dimensions:** 1920×120
**Background:** Transparent (sits between sections)

#### Content Container
**Centered horizontally**
**Max-width:** 600px
**Padding:** 40px 0

**Single Line Layout:**
- Display: Horizontal row, aligned center, gap: 12px

**Text:**
- "See how it works"
- Style: `Body/Default` (Inter 16px)
- Color: `Ink/Body` (#ADADAD)

**Arrow Link:**
- Arrow icon: ArrowRight (20px)
- Color: `Data/Excellent` (#0070F3)
- Hover state: Arrow animates 4px to right, color brightens to #3399FF
- Cursor: pointer

**Alternative: Ghost Button Style:**
Create variant with actual button:
- Text: "See how it works"
- Background: transparent
- Border: 1px solid `Ink/Border` (#262626)
- Padding: 12px 24px
- Border-radius: 6px
- Height: 44px
- Font: `Label/Default` (Inter 13px medium)
- Icon: ArrowRight (18px) on right, gap: 8px
- Hover state: border: `Ink/Border-Strong`, bg: `Ink/Raised`

---

### CTA Button States Reference

Create button state reference grid below CTA 3:

**Position:** x: 0, y: 1360
**Dimensions:** 1920×800

**Title:** "CTA Button States & Specifications"
Style: `Display/H3` (Fraunces 24px), `Ink/Primary`

**Grid Layout:** 3 columns × 4 rows showing:

**Column 1: Primary Button**
- Default state
- Hover state
- Active state (pressed)
- Disabled state (50% opacity)

**Column 2: Secondary/Ghost Button**
- Default state
- Hover state
- Active state
- Disabled state

**Column 3: Link/Inline Button**
- Default state
- Hover state (with arrow animation)
- Active state
- Disabled state

**Each button annotated with:**
- Background color (hex)
- Text color (hex)
- Border specs (if applicable)
- Padding values
- Height value
- Font style reference

**Touch Target Note:**
"All buttons: Minimum 48px height for touch accessibility"
Style: `Body/Small` (Inter 14px), `Ink/Secondary`

---

### Mobile CTA Layouts

Create annotation frames for mobile:

**Frame name:** `CTA-Sections-Mobile`
**Dimensions:** 375×1200
**Position:** x: 60, y: 2200

**Shows:**
1. CTA 1 mobile: Stacked buttons (full-width), reduced headline size (24px)
2. CTA 2 mobile: Larger headline (36px), full-width button
3. CTA 3 mobile: Full-width ghost button (no inline text)

---

## 3. Footer Frame Specification

**Frame dimensions:** 1920×600
**Frame name:** `Footer`
**Location:** `03-Landing-Page/Footer`

---

### Footer Background
- **Color:** `Ink/Deep` (#0A0A0A)
- **Border-top:** 1px solid `Ink/Border` (#262626)

---

### Main Footer Content

**Position:** x: 0, y: 0
**Dimensions:** 1920×480
**Max-width:** 1200px (centered)
**Padding:** 64px 60px 0 60px

#### 4-Column Grid Layout

**Column widths:** 300px each
**Gap:** 0px (evenly distributed across 1200px)
**Positions:** x: 360, 660, 960, 1260 (centered in 1920px frame)

---

#### Column 1: Brand

**Position:** x: 360, y: 64

**Logo:**
- Text: "RowLab"
- Style: `Display/H3` (Fraunces 24px)
- Color: `Ink/Primary` (#FAFAFA)
- Position: top of column

**Tagline:**
- Text: "Precision rowing analytics"
- Style: `Body/Small` (Inter 14px)
- Color: `Ink/Secondary` (#6B6B6B)
- Position: 12px below logo

**Social Links:**
- Position: 24px below tagline
- Layout: Horizontal row, gap: 16px
- Icons: GitHub, Twitter/X (24px size)
- Color: `Ink/Muted` (#404040)
- Hover: `Ink/Primary` (#FAFAFA)

---

#### Column 2: Product

**Position:** x: 660, y: 64

**Header:**
- Text: "PRODUCT"
- Style: `Label/Default` (Inter 12px medium, uppercase, tracking +0.15em)
- Color: `Ink/Primary` (#FAFAFA)
- Margin-bottom: 20px

**Links:** (vertical list, gap: 14px)
- Features
- Pricing
- Integrations
- Roadmap

**Link Style:**
- Font: `Body/Small` (Inter 14px)
- Color: `Ink/Body` (#ADADAD)
- Hover: `Ink/Primary` (#FAFAFA), underline
- Transition: 150ms ease

---

#### Column 3: Resources

**Position:** x: 960, y: 64

**Header:**
- Text: "RESOURCES"
- Style: `Label/Default` (Inter 12px medium, uppercase, tracking +0.15em)
- Color: `Ink/Primary` (#FAFAFA)
- Margin-bottom: 20px

**Links:** (vertical list, gap: 14px)
- Documentation
- API
- Blog
- Support

**Link Style:** (same as Column 2)

---

#### Column 4: Company

**Position:** x: 1260, y: 64

**Header:**
- Text: "COMPANY"
- Style: `Label/Default` (Inter 12px medium, uppercase, tracking +0.15em)
- Color: `Ink/Primary` (#FAFAFA)
- Margin-bottom: 20px

**Links:** (vertical list, gap: 14px)
- About
- Contact
- Careers
- Press

**Link Style:** (same as Column 2)

---

### Bottom Bar

**Position:** x: 0, y: 480
**Dimensions:** 1920×120
**Max-width:** 1200px (centered)
**Padding:** 24px 60px
**Border-top:** 1px solid `Ink/Border` (#262626)

#### Left: Copyright

**Position:** Left-aligned in container
**Text:** "© 2026 RowLab. All rights reserved."
**Style:** `Body/Small` (Inter 14px)
**Color:** `Ink/Secondary` (#6B6B6B)

#### Right: Legal Links

**Position:** Right-aligned in container
**Layout:** Horizontal row, gap: 24px

**Links:**
- Privacy Policy
- Terms of Service

**Link Style:**
- Font: `Body/Small` (Inter 14px)
- Color: `Ink/Secondary` (#6B6B6B)
- Hover: `Ink/Primary` (#FAFAFA), underline
- Transition: 150ms ease

---

### Mobile Footer Layout

Create annotation frame for mobile:

**Frame name:** `Footer-Mobile`
**Dimensions:** 375×900
**Position:** x: 60, y: 620

**Layout Changes:**
1. **Brand section:** Full-width, centered, at top
2. **Link columns:** 2×2 grid (Product + Resources in row 1, Company + [empty] in row 2)
3. **Column widths:** 172px each with 8px gap
4. **Accordion option noted:** "Optional: Accordion sections for link groups (tap header to expand)"
5. **Bottom bar:** Stacked layout (Copyright on top, Legal links below)

---

## Verification Checklist

Use this checklist to verify manual Penpot implementation:

### Gallery Frame
- [ ] Frame created: `03-Landing-Page/Gallery` (1920×1400)
- [ ] Section header: eyebrow, title, subtitle with correct typography styles
- [ ] Variant A: 14 image tiles in masonry grid with correct positions
- [ ] Variant A: 2 VIDEO placeholder tiles with large "VIDEO" label and play button overlay
- [ ] Variant A: All tiles have 12px border-radius and `Ink/Border` border
- [ ] Variant A: Video documentation box below grid
- [ ] Variant B: Carousel layout with 12 tiles (400×300 each)
- [ ] Variant B: Edge fade gradients (left and right)
- [ ] Variant B: Scroll indicators (dots and arrows)
- [ ] Variant B: Auto-play note annotation
- [ ] Mobile annotation frame showing 2-column layout
- [ ] All colors reference Asset Library (Ink palette)
- [ ] All typography references Asset Library styles

### CTA-Sections Frame
- [ ] Frame created: `03-Landing-Page/CTA-Sections` (1920×2400)
- [ ] CTA 1: Mid-page conversion with gradient background
- [ ] CTA 1: Headline, subtext, dual CTAs centered (max-width 800px)
- [ ] CTA 1: Primary CTA (white bg) and Secondary CTA (ghost style)
- [ ] CTA 1: Social proof text below buttons
- [ ] CTA 2: Final conversion with boathouse-sunset.jpg background
- [ ] CTA 2: Dark overlay gradient (70-85% black)
- [ ] CTA 2: Large Display/Hero headline with text-shadow
- [ ] CTA 2: Extra-large CTA button (64px height) with box-shadow
- [ ] CTA 2: "No credit card" text below button
- [ ] CTA 2: Email input variant frame created
- [ ] CTA 3: Inline compact CTA with arrow link
- [ ] CTA 3: Ghost button variant created
- [ ] Button states reference grid (3 columns × 4 rows)
- [ ] Button states annotated with specs (colors, padding, heights)
- [ ] Mobile annotation frame showing stacked/full-width layouts
- [ ] All touch targets minimum 48px height
- [ ] All colors reference Asset Library

### Footer Frame
- [ ] Frame created: `03-Landing-Page/Footer` (1920×600)
- [ ] Background: `Ink/Deep` with border-top `Ink/Border`
- [ ] 4-column grid layout (300px each) centered in 1200px max-width
- [ ] Column 1 (Brand): Logo (Fraunces 24px), tagline, social icons
- [ ] Column 2 (Product): Header + 4 links (Features, Pricing, Integrations, Roadmap)
- [ ] Column 3 (Resources): Header + 4 links (Documentation, API, Blog, Support)
- [ ] Column 4 (Company): Header + 4 links (About, Contact, Careers, Press)
- [ ] All column headers: `Label/Default` (uppercase, tracking +0.15em)
- [ ] All links: `Body/Small` with hover states (underline, color change)
- [ ] Bottom bar: 1px border-top, 24px padding
- [ ] Bottom bar left: Copyright text
- [ ] Bottom bar right: Privacy + Terms links
- [ ] Mobile annotation frame showing 2×2 grid and stacked bottom bar
- [ ] Accordion option noted for mobile
- [ ] All colors reference Asset Library
- [ ] All typography references Asset Library styles

### Overall Quality
- [ ] All frames use established color tokens (Ink palette)
- [ ] All frames use established typography styles (Display, Body, Label)
- [ ] All measurements precise (exact x,y coordinates, dimensions)
- [ ] Video placeholders prominently labeled with "VIDEO" text
- [ ] Video playback behaviors documented
- [ ] Mobile layouts considered for all sections
- [ ] Hover states documented for interactive elements
- [ ] Touch accessibility noted (48px minimum)
- [ ] Specifications align with existing LandingPage.tsx structure

**Total items:** 58

---

## Implementation Notes

1. **Manual Penpot work required:** Estimated 45-60 minutes to create all frames
2. **Asset dependencies:** Requires Design System Foundation (Plan 19-01) and Visual Assets (Plan 19-02)
3. **Images:** Use placeholder rectangles; actual rowing images can be imported later
4. **Videos:** Use labeled placeholder frames; videos cannot embed in Penpot
5. **Interactivity:** Hover states documented for code implementation reference
6. **Responsive:** Mobile annotations provided; full mobile frames optional
7. **Alignment:** Designs complement existing LandingPage.tsx implementation (lines 532-661)

---

## Design Rationale

### Gallery Design
- **Masonry vs. Carousel:** Two layout options provide flexibility for final implementation
- **Video integration:** Prominent VIDEO labels prevent confusion with static images
- **Varying heights:** Masonry grid creates visual interest and editorial feel
- **Hover effects:** Subtle interactions enhance premium perception

### CTA Strategy
- **Three touchpoints:** Mid-page (after engagement), final (before footer), inline (between sections)
- **Dual CTAs:** Offer choice (trial vs. demo) to maximize conversion paths
- **Hero image:** boathouse-sunset.jpg creates emotional connection and aspiration
- **Progressive commitment:** Inline CTA is low-commitment ("see how it works"), final CTA is high-commitment ("start trial")

### Footer Architecture
- **4-column structure:** Standard pattern for comprehensive navigation
- **Brand emphasis:** Logo and tagline in first column establish identity
- **Logical grouping:** Product (what), Resources (how), Company (who)
- **Legal compliance:** Privacy/Terms in bottom bar for visibility
- **Social presence:** GitHub and Twitter/X links for community connection

---

## Next Steps

After manual Penpot implementation:
1. Review gallery layout with stakeholder (Variant A vs. B preference)
2. Test CTA copy with user research (if applicable)
3. Verify footer links map to actual pages/sections
4. Export frames for developer handoff (Plan 19-06+)
5. Consider high-fidelity mockups with actual rowing images (Plan 19-07+)
