"""
Erg Summary Card - Design B (Fresh Direction)
Editorial/artistic approach with full-bleed gradients and dynamic asymmetric layout
"""

import math
from templates.base_template import (
    setup_canvas, draw_background, draw_text, draw_gradient_rect,
    draw_rounded_rect, draw_grain_texture, draw_rowlab_branding,
    surface_to_png_bytes, hex_to_rgb,
    DARK_BG, GOLD, ROSE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED
)

DIMENSIONS = {
    '1:1': (2160, 2160),
    '9:16': (2160, 3840),
}


def format_time(seconds):
    """Format seconds to MM:SS.d"""
    mins = int(seconds // 60)
    secs = seconds % 60
    return f"{mins}:{secs:04.1f}"


def draw_wave_pattern(ctx, width, height, color, opacity=0.08):
    """Draw abstract water-inspired wave curves"""
    import cairocffi as cairo

    ctx.save()
    ctx.set_source_rgba(*color, opacity)
    ctx.set_line_width(3)

    # Multiple wave curves at different heights
    wave_count = 5
    for i in range(wave_count):
        y_base = height * 0.2 + (i * height * 0.15)
        amplitude = 80 + (i * 20)
        frequency = 0.003 + (i * 0.0005)

        ctx.move_to(0, y_base)
        for x in range(0, width, 10):
            y = y_base + math.sin(x * frequency) * amplitude
            ctx.line_to(x, y)

        ctx.stroke()

    ctx.restore()


def render_erg_summary_alt(format_key, workout_data, options):
    """
    Design B: Fresh Direction - Editorial/artistic approach

    Layout:
    - Full-bleed gradient background (dark to warm rose/gold)
    - Asymmetric metric arrangement
    - Bolder typography hierarchy (larger contrast)
    - Abstract wave pattern overlay
    - Gold/rose as primary accents instead of copper
    - More whitespace and breathing room
    - Modern editorial/magazine feel
    """
    width, height = DIMENSIONS[format_key]
    is_story = format_key == '9:16'

    # Setup canvas
    surface, ctx = setup_canvas(width, height)

    # --- FULL-BLEED GRADIENT BACKGROUND ---
    # Dark to warm tone diagonal gradient
    import cairocffi as cairo
    gradient = cairo.LinearGradient(0, 0, width, height)
    gradient.add_color_stop_rgb(0, 0.03, 0.03, 0.04)  # Dark top-left
    gradient.add_color_stop_rgb(0.5, 0.08, 0.06, 0.08)  # Mid-tone
    gradient.add_color_stop_rgb(1, 0.12, 0.08, 0.06)  # Warm bottom-right

    ctx.set_source(gradient)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()

    # --- ABSTRACT WAVE PATTERN ---
    draw_wave_pattern(ctx, width, height, GOLD, opacity=0.06)

    # --- WORKOUT TITLE (offset left for asymmetry) ---
    title_x = 120
    title_y = 140

    draw_text(
        ctx, workout_data['title'], "IBM Plex Sans", 72,
        title_x, title_y, TEXT_PRIMARY, weight='Bold', align='left'
    )

    # Date below title (smaller, more subtle)
    date_y = title_y + 100
    draw_text(
        ctx, workout_data['date'], "IBM Plex Sans", 28,
        title_x, date_y, TEXT_MUTED, weight='Regular', align='left'
    )

    # --- HERO METRIC (dramatic size contrast) ---
    hero_y = 400

    # Determine hero metric
    if '2k' in workout_data['type'].lower() or 'test' in workout_data['type'].lower():
        hero_value = workout_data['total_time']
        hero_label = "TOTAL TIME"
    else:
        hero_value = workout_data['avg_pace']
        hero_label = "AVG PACE"

    # Draw hero metric (MASSIVE size for editorial impact)
    draw_text(
        ctx, hero_value, "IBM Plex Mono", 200,
        width / 2, hero_y, TEXT_PRIMARY, weight='Bold', align='center'
    )

    # Draw hero label (small caps feel)
    label_y = hero_y + 240
    draw_text(
        ctx, hero_label, "IBM Plex Sans", 32,
        width / 2, label_y, ROSE, weight='Bold', align='center'
    )

    # --- SECONDARY METRICS (asymmetric arrangement) ---
    metrics_y = label_y + 140

    # Left column metrics
    left_x = 240
    metrics_left = [
        (f"{workout_data['avg_watts']}", "WATTS"),
        (f"{workout_data['avg_stroke_rate']}", "STROKES/MIN"),
    ]

    y_offset = metrics_y
    for value, label in metrics_left:
        # Value with gold accent
        draw_text(
            ctx, value, "IBM Plex Mono", 72,
            left_x, y_offset, GOLD, weight='Bold', align='left'
        )

        # Label
        draw_text(
            ctx, label, "IBM Plex Sans", 24,
            left_x, y_offset + 90, TEXT_MUTED, weight='SemiBold', align='left'
        )

        y_offset += 200

    # Right column metrics
    right_x = width - 240
    metrics_right = [
        (f"{workout_data['avg_heart_rate']}", "AVG HR"),
        (f"{workout_data['distance_m']:,}m", "DISTANCE"),
    ]

    y_offset = metrics_y
    for value, label in metrics_right:
        # Value
        draw_text(
            ctx, value, "IBM Plex Mono", 72,
            right_x, y_offset, ROSE, weight='Bold', align='right'
        )

        # Label
        draw_text(
            ctx, label, "IBM Plex Sans", 24,
            right_x, y_offset + 90, TEXT_MUTED, weight='SemiBold', align='right'
        )

        y_offset += 200

    # --- SPLITS TABLE (clean, spacious) ---
    splits_y = y_offset + 100

    # Section header with gold accent bar
    bar_width = 200
    bar_height = 4
    bar_x = (width - bar_width) / 2
    ctx.set_source_rgb(*GOLD)
    ctx.rectangle(bar_x, splits_y, bar_width, bar_height)
    ctx.fill()

    # "SPLITS" header
    header_y = splits_y + 60
    draw_text(
        ctx, "SPLITS", "IBM Plex Sans", 36,
        width / 2, header_y, TEXT_PRIMARY, weight='Bold', align='center'
    )

    # Determine splits to show
    splits_to_show = workout_data['splits'][:4] if not is_story else workout_data['splits']

    # Splits table (clean rows with generous spacing)
    splits_start_y = header_y + 100
    row_height = 100

    for i, split in enumerate(splits_to_show):
        row_y = splits_start_y + (i * row_height)

        # Split number (left-aligned)
        draw_text(
            ctx, f"#{split['split_number']}", "IBM Plex Mono", 40,
            280, row_y, TEXT_SECONDARY, weight='SemiBold', align='left'
        )

        # Pace (prominent)
        draw_text(
            ctx, split['pace'], "IBM Plex Mono", 48,
            width / 2, row_y, TEXT_PRIMARY, weight='Bold', align='center'
        )

        # Watts (right side)
        draw_text(
            ctx, f"{split['watts']}w", "IBM Plex Mono", 36,
            width - 520, row_y, GOLD, weight='SemiBold', align='left'
        )

        # SR (far right)
        draw_text(
            ctx, f"{split['stroke_rate']} spm", "IBM Plex Mono", 32,
            width - 200, row_y, TEXT_MUTED, weight='Regular', align='right'
        )

        # Story format: add HR data
        if is_story:
            hr_y = row_y + 60
            draw_text(
                ctx, f"HR: {split['heart_rate']}", "IBM Plex Mono", 28,
                width - 200, hr_y, ROSE, weight='Regular', align='right'
            )

    # --- ATHLETE NAME (if enabled) ---
    if options.get('showName', True):
        name_y = splits_start_y + (len(splits_to_show) * row_height) + 100
        if is_story:
            name_y += 100  # Extra space in story format

        # Name with subtle underline accent
        athlete_name = workout_data.get('athlete_name', 'Athlete')
        name_width, name_height = draw_text(
            ctx, athlete_name, "IBM Plex Sans", 44,
            width / 2, name_y, TEXT_SECONDARY, weight='SemiBold', align='center'
        )

        # Subtle gold underline
        underline_width = name_width + 40
        underline_y = name_y + name_height + 20
        ctx.set_source_rgba(*GOLD, 0.4)
        ctx.rectangle((width - underline_width) / 2, underline_y, underline_width, 3)
        ctx.fill()

    # --- CIRCULAR ACCENT ELEMENTS (decorative) ---
    # Large faded circle in bottom-right
    circle_x = width - 200
    circle_y = height - 200
    circle_radius = 300

    radial = cairo.RadialGradient(circle_x, circle_y, 0, circle_x, circle_y, circle_radius)
    radial.add_color_stop_rgba(0, *ROSE, 0.08)
    radial.add_color_stop_rgba(1, *ROSE, 0)

    ctx.set_source(radial)
    ctx.arc(circle_x, circle_y, circle_radius, 0, 2 * 3.14159)
    ctx.fill()

    # Small solid circle accent (top-right)
    small_circle_x = width - 140
    small_circle_y = 100
    ctx.set_source_rgba(*GOLD, 0.3)
    ctx.arc(small_circle_x, small_circle_y, 40, 0, 2 * 3.14159)
    ctx.fill()

    # --- GRAIN TEXTURE ---
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # --- BRANDING ---
    draw_rowlab_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)
