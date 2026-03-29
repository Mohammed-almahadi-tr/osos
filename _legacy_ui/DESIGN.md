# Design System Strategy: The Administrative Luminary

## 1. Overview & Creative North Star
This design system is anchored by the Creative North Star: **"The Digital Curator."** 

In the context of a Saudi Training Institute, the interface must transition from a "tool" to an "authority." We reject the common, cluttered dashboard aesthetic in favor of high-end editorial layouts. By utilizing intentional asymmetry—such as shifting heavy data modules to one side and balancing them with generous whitespace and "Display" typography—we create an experience that feels curated and premium. The layout doesn't just manage attendance; it narrates the institute's operational excellence through sophisticated tonal depth and a calm, spacious RTL (Right-to-Left) flow.

---

## 2. Colors: Gold, Depth, and the "No-Line" Rule
The palette is driven by the prestige of Gold (`primary: #735c00`) and the authority of Deep Tonals. 

### The "No-Line" Rule
To achieve a signature, high-end look, **1px solid borders are strictly prohibited for sectioning.** We do not draw boxes; we define space. Structural boundaries must be created through:
*   **Background Color Shifts:** Placing a `surface-container-low` component against a `surface` background.
*   **Tonal Transitions:** Using the hierarchy of grays to signal the end of one thought and the start of another.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of luxury materials. 
*   **Base:** `surface` (#f9f9f9).
*   **Elevated Modules:** Use `surface-container-lowest` (#ffffff) for primary cards to create a "lifted" feel.
*   **Recessed Modules:** Use `surface-container-high` (#e8e8e8) for search bars or secondary utility panels to imply they are "carved" into the surface.

### The "Glass & Gradient" Rule
For floating elements like dropdown menus or active sidebar states, utilize **Glassmorphism**. Apply `surface_container_lowest` at 80% opacity with a `20px` backdrop-blur. This allows the primary gold accents to bleed through softly.

### Signature Textures
Main CTAs and high-level metric cards should use a subtle linear gradient: 
*   **Direction:** 135deg (adjusted for RTL) 
*   **From:** `primary` (#735c00) 
*   **To:** `primary_container` (#d4af37)
This adds a metallic, "soulful" polish that flat colors lack.

---

## 3. Typography: Editorial Authority
Our typography uses a dual-font strategy to balance modernity with readability. 

*   **Display & Headlines (Plus Jakarta Sans):** These are the "Editorial" voice. Used for large numbers (attendance percentages) and page titles. The wide apertures of Plus Jakarta Sans provide a high-tech, global feel.
*   **Body & Labels (Inter / IBM Plex Sans Arabic):** For the Arabic-first experience, IBM Plex Sans Arabic provides the necessary technical precision. It is legible at small scales (`label-sm: 0.6875rem`) without losing its professional character.

The hierarchy conveys identity: **Large, bold display values** for "Trust" (e.g., 98% Attendance) and **tight, disciplined labels** for "Efficiency."

---

## 4. Elevation & Depth: Tonal Layering
We move away from traditional shadows to "Ambient Light" principles.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container-low` section. The delta in hex value creates a soft, natural edge that feels more "designed" than a drop shadow.
*   **Ambient Shadows:** If a card must float, use an extra-diffused shadow: `Y: 8px, Blur: 24px, Color: rgba(26, 28, 28, 0.06)`. This mimics soft overhead gallery lighting.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#d0c5af) at **15% opacity**. It should be felt, not seen.
*   **RTL Depth:** Ensure shadows and blurs respect the RTL light source (top-right for Saudi contexts), ensuring the visual "weight" aligns with the reading direction.

---

## 5. Components: The Primitive Set

### Buttons
*   **Primary:** Gradient of `primary` to `primary_container`. Roundedness `md` (0.75rem). No border.
*   **Secondary:** `surface-container-lowest` with a `Ghost Border`. Text color: `primary`.
*   **Tertiary:** Transparent background. `label-md` uppercase styling.

### Cards & Lists
*   **Rule:** **Forbid divider lines.** 
*   **The Strategy:** Use `spacing-5` (1.7rem) of vertical white space to separate list items, or alternating backgrounds using `surface-container-low` and `surface-container-lowest`.

### Input Fields
*   **Default State:** `surface-container-highest` background, no border, `sm` (0.25rem) roundedness.
*   **Focus State:** `Ghost Border` at 40% opacity with a `primary` subtle glow.

### Attendance Chips
*   **Present:** `surface-container-lowest` with a `tertiary` (Blue) soft glow.
*   **Absent:** `error_container` background with `on_error_container` text.
*   **Shape:** `full` (pill-shaped) to contrast against the `md` roundedness of cards.

### Navigation (The Sidebar)
The sidebar should utilize `inverse_surface` (#2f3131) to provide a heavy "anchor" to the left (or right in RTL). Active states should not use a box, but a "Gold Light" indicator—a vertical 4px line of `primary` and a subtle text color shift to `primary_fixed`.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. If the right sidebar (RTL) is 280px, allow the left margin of the content to be 320px to create "Breathing Room."
*   **Do** use `display-lg` for single, impactful data points.
*   **Do** use "Optical Centering." Icons inside buttons should be nudged 1px to compensate for Arabic font descenders.

### Don't:
*   **Don't** use 100% black (#000000). Use `on_surface` (#1a1c1c) for text to maintain a premium, ink-on-paper feel.
*   **Don't** use "Default" shadows. If it looks like a standard Material Design shadow, it's too heavy. Soften it.
*   **Don't** cram data. If a table has more than 8 columns, move secondary data into a "Details" drawer using `surface-container-lowest`.
*   **Don't** use harsh status colors. Instead of pure red, use the sophisticated `error` (#ba1a1a) which has a slightly muted, professional tone.