"""
Base template utilities for share card rendering
Provides reusable Cairo+Pango drawing functions for all card templates
"""

import os
import cairocffi as cairo
import pangocairocffi as pango
from io import BytesIO
import random

# Color constants - Canvas design system colors
DARK_BG = (0.03, 0.03, 0.04)  # #08080a
COPPER = (0.72, 0.45, 0.20)   # #B87333
GOLD = (0.83, 0.65, 0.29)     # #D4A54A
ROSE = (0.79, 0.48, 0.48)     # #C97B7B
TEXT_PRIMARY = (1.0, 1.0, 1.0)      # white
TEXT_SECONDARY = (0.62, 0.63, 0.68) # #9FA0AD
TEXT_MUTED = (0.35, 0.36, 0.42)     # #5A5B6A
TEAL = (0.30, 0.70, 0.65)           # for stroke rate column
WARM_WHITE = (0.95, 0.93, 0.88)     # for subtle warm text
AMBER = (0.85, 0.65, 0.20)          # for accent highlights
SLATE = (0.25, 0.27, 0.30)          # for subtle backgrounds
DEEP_COPPER = (0.55, 0.35, 0.15)    # for darker accents


def hex_to_rgb(hex_color):
    """Convert hex color (#RRGGBB or RRGGBB) to RGB tuple (0-1 range)"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b)


def get_font_path(font_file):
    """Get absolute path to font file in fonts/ directory"""
    script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(script_dir, 'fonts', font_file)


def setup_canvas(width, height):
    """
    Create Cairo surface and context

    Returns: (surface, ctx)
    """
    surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
    ctx = cairo.Context(surface)
    return surface, ctx


def draw_background(ctx, width, height, color=DARK_BG):
    """Fill background with solid color"""
    ctx.set_source_rgb(*color)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()


def draw_text(ctx, text, font_family, font_size, x, y, color=TEXT_PRIMARY, weight='Regular', align='left'):
    """
    Draw text using Pango with font loading and alignment

    Args:
        ctx: Cairo context
        text: Text to render
        font_family: 'IBM Plex Sans' or 'IBM Plex Mono'
        font_size: Size in pixels (at 2160px resolution)
        x, y: Position (top-left for align='left')
        color: RGB tuple (0-1 range)
        weight: 'Regular', 'SemiBold', 'Bold'
        align: 'left', 'center', 'right'

    Returns: (text_width, text_height) for layout calculations
    """
    # Create Pango layout
    layout = pango.create_layout(ctx)

    # Map font family and weight to font description
    # Pango uses point sizes, convert from pixels (assuming 96 DPI)
    font_pt = int(font_size * 0.75)

    # Build font description
    # For now, use system fonts that Pango can find
    # In Docker, fonts will be registered via fc-cache
    if font_family == 'IBM Plex Mono':
        font_desc_str = f"IBM Plex Mono {weight} {font_pt}"
    else:  # IBM Plex Sans
        font_desc_str = f"IBM Plex Sans {weight} {font_pt}"

    # Use pangocffi low-level API to create font description from string
    from pangocffi import pango as pango_lib, FontDescription
    font_desc_ptr = pango_lib.pango_font_description_from_string(font_desc_str.encode('utf-8'))
    font_desc = FontDescription(font_desc_ptr)
    layout._set_font_description(font_desc)

    # Set text
    layout._set_text(text)

    # Get text dimensions (get_size returns logical size, divide by PANGO_SCALE for pixels)
    width_units, height_units = layout.get_size()
    PANGO_SCALE = 1024  # Pango uses 1/1024th of a point
    text_width = width_units / PANGO_SCALE
    text_height = height_units / PANGO_SCALE

    # Apply alignment offset
    if align == 'center':
        x = x - text_width / 2
    elif align == 'right':
        x = x - text_width

    # Move to position and draw
    ctx.set_source_rgb(*color)
    ctx.move_to(x, y)
    pango.show_layout(ctx, layout)

    return text_width, text_height


def draw_gradient_rect(ctx, x, y, w, h, color_start, color_end, direction='vertical'):
    """
    Draw rectangle with linear gradient

    Args:
        direction: 'vertical' or 'horizontal'
    """
    if direction == 'vertical':
        gradient = cairo.LinearGradient(x, y, x, y + h)
    else:
        gradient = cairo.LinearGradient(x, y, x + w, y)

    gradient.add_color_stop_rgb(0, *color_start)
    gradient.add_color_stop_rgb(1, *color_end)

    ctx.set_source(gradient)
    ctx.rectangle(x, y, w, h)
    ctx.fill()


def draw_rounded_rect(ctx, x, y, w, h, radius):
    """
    Create rounded rectangle path (does not fill - use ctx.fill() or ctx.stroke() after)

    Args:
        radius: Corner radius in pixels
    """
    ctx.new_path()
    ctx.arc(x + radius, y + radius, radius, 3.14159, 3.14159 * 1.5)
    ctx.arc(x + w - radius, y + radius, radius, 3.14159 * 1.5, 0)
    ctx.arc(x + w - radius, y + h - radius, radius, 0, 3.14159 * 0.5)
    ctx.arc(x + radius, y + h - radius, radius, 3.14159 * 0.5, 3.14159)
    ctx.close_path()


def draw_panel(ctx, x, y, w, h, radius, bg_color, border_color=None):
    """
    Draw complete panel with optional border (Canvas design system panel style)

    Args:
        bg_color: RGB tuple for background
        border_color: RGB tuple for border (optional)
    """
    draw_rounded_rect(ctx, x, y, w, h, radius)

    # Fill background
    ctx.set_source_rgb(*bg_color)
    ctx.fill_preserve()

    # Draw border if specified
    if border_color:
        ctx.set_source_rgb(*border_color)
        ctx.set_line_width(2)
        ctx.stroke()


def draw_accent_stripe(ctx, x, y, w, h, color):
    """Draw accent stripe/highlight for team color injection"""
    ctx.set_source_rgb(*color)
    ctx.rectangle(x, y, w, h)
    ctx.fill()


def draw_grain_texture(ctx, width, height, opacity=0.03):
    """
    Draw subtle noise/grain overlay for premium feel

    Args:
        opacity: Grain opacity (0-1), default 0.03 per user decision
    """
    # Create noise pattern
    grain_surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
    grain_ctx = cairo.Context(grain_surface)

    # Generate random noise
    for i in range(0, width, 4):
        for j in range(0, height, 4):
            noise = random.random() * opacity
            grain_ctx.set_source_rgba(1, 1, 1, noise)
            grain_ctx.rectangle(i, j, 4, 4)
            grain_ctx.fill()

    # Composite onto main context
    ctx.set_source_surface(grain_surface, 0, 0)
    ctx.paint()


def draw_gradient_text(ctx, text, font_family, font_size, x, y, color_start, color_end):
    """
    Draw text with gradient fill

    Args:
        ctx: Cairo context
        text: Text to render
        font_family: 'IBM Plex Sans' or 'IBM Plex Mono'
        font_size: Size in pixels
        x, y: Position
        color_start: RGB tuple for gradient start
        color_end: RGB tuple for gradient end

    Returns: (text_width, text_height)
    """
    # Create Pango layout
    layout = pango.create_layout(ctx)
    font_pt = int(font_size * 0.75)

    if font_family == 'IBM Plex Mono':
        font_desc_str = f"IBM Plex Mono Regular {font_pt}"
    else:
        font_desc_str = f"IBM Plex Sans Regular {font_pt}"

    from pangocffi import pango as pango_lib, FontDescription
    font_desc_ptr = pango_lib.pango_font_description_from_string(font_desc_str.encode('utf-8'))
    font_desc = FontDescription(font_desc_ptr)
    layout._set_font_description(font_desc)
    layout._set_text(text)

    width_units, height_units = layout.get_size()
    PANGO_SCALE = 1024
    text_width = width_units / PANGO_SCALE
    text_height = height_units / PANGO_SCALE

    # Create gradient
    gradient = cairo.LinearGradient(x, y, x + text_width, y)
    gradient.add_color_stop_rgb(0, *color_start)
    gradient.add_color_stop_rgb(1, *color_end)

    ctx.set_source(gradient)
    ctx.move_to(x, y)
    pango.show_layout(ctx, layout)

    return text_width, text_height


def draw_horizontal_rule(ctx, x, y, width, color, thickness=2):
    """
    Draw decorative horizontal line separator

    Args:
        ctx: Cairo context
        x, y: Starting position (left edge)
        width: Line width in pixels
        color: RGB tuple
        thickness: Line thickness in pixels (default 2)
    """
    ctx.set_source_rgb(*color)
    ctx.rectangle(x, y, width, thickness)
    ctx.fill()


def draw_oarbit_branding(ctx, width, height, format_key, options):
    """
    Draw "Made with oarbit" attribution

    Args:
        format_key: '1:1' or '9:16' (determines positioning)
        options: Dict with 'showAttribution' toggle (default True)
    """
    if not options.get('showAttribution', True):
        return

    # Position based on format
    if format_key == '1:1':
        x = width / 2
        y = height - 80  # Bottom center
    else:  # 9:16
        x = width / 2
        y = height - 120  # Bottom center with more padding

    # Draw branding text
    draw_text(
        ctx,
        "Made with oarbit",
        "IBM Plex Sans",
        28,
        x, y,
        TEXT_MUTED,
        weight='Regular',
        align='center'
    )


def surface_to_png_bytes(surface):
    """Write Cairo surface to PNG bytes"""
    buffer = BytesIO()
    surface.write_to_png(buffer)
    return buffer.getvalue()


def render_test_card(format_key, workout_data=None, options=None):
    """
    Render a test card to verify the rendering pipeline

    This is called by app.py when cardType='test'
    Tests: background, panels, text rendering, gradients, branding

    Args:
        format_key: '1:1' or '9:16'
        workout_data: Ignored for test card
        options: Dict with rendering options

    Returns: PNG bytes
    """
    if options is None:
        options = {}

    # Get dimensions (defined locally to avoid circular import)
    DIMENSIONS = {
        '1:1': (2160, 2160),
        '9:16': (2160, 3840),
    }
    width, height = DIMENSIONS[format_key]

    # Setup canvas
    surface, ctx = setup_canvas(width, height)

    # Draw background
    draw_background(ctx, width, height, DARK_BG)

    # Draw main panel (warm accent panel style)
    panel_padding = 120
    panel_width = width - (panel_padding * 2)
    panel_height = 400

    # Gradient panel background (dark to slightly lighter)
    draw_gradient_rect(
        ctx,
        panel_padding, 200,
        panel_width, panel_height,
        (0.05, 0.05, 0.06),  # Slightly lighter than DARK_BG
        (0.08, 0.08, 0.10),
        direction='vertical'
    )

    # Panel border
    draw_rounded_rect(ctx, panel_padding, 200, panel_width, panel_height, 24)
    ctx.set_source_rgb(*COPPER)
    ctx.set_line_width(2)
    ctx.stroke()

    # Accent stripe at top
    draw_accent_stripe(ctx, panel_padding + 24, 200, 120, 6, COPPER)

    # Test text samples at different sizes
    draw_text(ctx, "Share Card Test", "IBM Plex Sans", 72, width / 2, 280, TEXT_PRIMARY, weight='Bold', align='center')
    draw_text(ctx, "Cairo+Pango rendering pipeline", "IBM Plex Sans", 32, width / 2, 380, TEXT_SECONDARY, weight='Regular', align='center')

    # Test monospace font for data display
    draw_text(ctx, "Split: 1:45.3", "IBM Plex Mono", 28, width / 2, 480, TEXT_PRIMARY, weight='Regular', align='center')

    # Test color palette
    color_y = 700
    colors = [
        ("Copper", COPPER),
        ("Gold", GOLD),
        ("Rose", ROSE),
        ("Primary", TEXT_PRIMARY),
        ("Secondary", TEXT_SECONDARY),
    ]

    color_x_start = (width - (len(colors) * 180)) / 2
    for i, (name, color) in enumerate(colors):
        x = color_x_start + (i * 180)
        # Color swatch
        ctx.set_source_rgb(*color)
        ctx.rectangle(x, color_y, 120, 80)
        ctx.fill()
        # Label
        draw_text(ctx, name, "IBM Plex Sans", 20, x + 60, color_y + 100, TEXT_MUTED, align='center')

    # Add subtle grain texture
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # Add branding
    draw_oarbit_branding(ctx, width, height, format_key, options)

    # Convert to PNG bytes
    return surface_to_png_bytes(surface)
