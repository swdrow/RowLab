"""
Erg Summary Card - Design A (Evolved v5)
Data-forward layout with warm copper accents and geometric precision
"""

from templates.base_template import (
    setup_canvas, draw_background, draw_text, draw_gradient_rect,
    draw_rounded_rect, draw_panel, draw_accent_stripe, draw_grain_texture,
    draw_oarbit_branding, surface_to_png_bytes,
    DARK_BG, COPPER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED
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


def format_pace(seconds_per_500m):
    """Format pace to M:SS.d per 500m"""
    pace_parts = seconds_per_500m.split(':')
    mins = int(pace_parts[0])
    secs = float(pace_parts[1])
    return f"{mins}:{secs:04.1f}"


def render_erg_summary(format_key, workout_data, options):
    """
    Design A: Evolved v5 - Data-forward precision instrument

    Layout:
    - Warm copper panel at top with gradient fade
    - Large hero metric centered (time for 2K, avg pace for steady-state)
    - Copper accent stripe separating sections
    - Metric grid below (watts, HR, SR, distance, duration)
    - Splits table (abbreviated for square, full for story)
    - Geometric shapes as decorative elements
    - Clean, structured dashboard feel
    """
    width, height = DIMENSIONS[format_key]
    is_story = format_key == '9:16'

    # Setup canvas
    surface, ctx = setup_canvas(width, height)
    draw_background(ctx, width, height, DARK_BG)

    # --- TOP SECTION: Copper gradient panel ---
    header_height = 480
    draw_gradient_rect(
        ctx, 0, 0, width, header_height,
        (0.72, 0.45, 0.20),  # Copper
        (0.08, 0.08, 0.10),  # Fade to dark
        direction='vertical'
    )

    # Workout title at top
    title_y = 100
    draw_text(
        ctx, workout_data['title'], "IBM Plex Sans", 64,
        width / 2, title_y, TEXT_PRIMARY, weight='Bold', align='center'
    )

    # Date below title
    date_y = title_y + 90
    draw_text(
        ctx, workout_data['date'], "IBM Plex Sans", 32,
        width / 2, date_y, TEXT_SECONDARY, weight='Regular', align='center'
    )

    # --- HERO METRIC (adaptive based on workout type) ---
    hero_y = 280

    # Determine hero metric based on workout type
    if '2k' in workout_data['type'].lower() or 'test' in workout_data['type'].lower():
        # For test pieces: show total time as hero
        hero_value = workout_data['total_time']
        hero_label = "Total Time"
    else:
        # For steady-state: show avg pace as hero
        hero_value = workout_data['avg_pace']
        hero_label = "Avg Pace"

    # Draw hero metric (large)
    draw_text(
        ctx, hero_value, "IBM Plex Mono", 140,
        width / 2, hero_y, TEXT_PRIMARY, weight='Bold', align='center'
    )

    # Draw hero label
    label_y = hero_y + 170
    draw_text(
        ctx, hero_label, "IBM Plex Sans", 36,
        width / 2, label_y, TEXT_SECONDARY, weight='Regular', align='center'
    )

    # --- COPPER ACCENT STRIPE (separator) ---
    stripe_y = header_height
    draw_accent_stripe(ctx, 0, stripe_y, width, 6, COPPER)

    # --- SECONDARY METRICS GRID ---
    grid_y = stripe_y + 100
    grid_spacing = 380

    # Row 1: Watts, HR, Stroke Rate
    metrics_row1 = [
        (f"{workout_data['avg_watts']}w", "Avg Power"),
        (f"{workout_data['avg_heart_rate']} bpm", "Avg HR"),
        (f"{workout_data['avg_stroke_rate']} spm", "Avg SR"),
    ]

    row1_start_x = (width - (len(metrics_row1) * grid_spacing)) / 2 + (grid_spacing / 2)

    for i, (value, label) in enumerate(metrics_row1):
        x = row1_start_x + (i * grid_spacing)

        # Value
        draw_text(
            ctx, value, "IBM Plex Mono", 52,
            x, grid_y, TEXT_PRIMARY, weight='SemiBold', align='center'
        )

        # Label
        draw_text(
            ctx, label, "IBM Plex Sans", 28,
            x, grid_y + 70, TEXT_MUTED, weight='Regular', align='center'
        )

    # Row 2: Distance, Duration
    grid_y2 = grid_y + 200
    metrics_row2 = [
        (f"{workout_data['distance_m']:,}m", "Distance"),
        (format_time(workout_data['duration_seconds']), "Duration"),
    ]

    row2_start_x = (width - (len(metrics_row2) * grid_spacing * 1.2)) / 2 + (grid_spacing * 0.6)

    for i, (value, label) in enumerate(metrics_row2):
        x = row2_start_x + (i * grid_spacing * 1.2)

        # Value
        draw_text(
            ctx, value, "IBM Plex Mono", 52,
            x, grid_y2, TEXT_PRIMARY, weight='SemiBold', align='center'
        )

        # Label
        draw_text(
            ctx, label, "IBM Plex Sans", 28,
            x, grid_y2 + 70, TEXT_MUTED, weight='Regular', align='center'
        )

    # --- SPLITS TABLE ---
    splits_y = grid_y2 + 220

    # Panel for splits
    panel_padding = 120
    panel_width = width - (panel_padding * 2)

    # Determine number of splits to show
    splits_to_show = workout_data['splits'][:4] if not is_story else workout_data['splits']

    # Calculate panel height based on splits
    splits_row_height = 80
    splits_header_height = 100
    panel_height = splits_header_height + (len(splits_to_show) * splits_row_height) + 80

    # Draw panel
    draw_panel(
        ctx, panel_padding, splits_y, panel_width, panel_height,
        radius=24, bg_color=(0.05, 0.05, 0.06), border_color=COPPER
    )

    # Splits table header
    header_y = splits_y + 70
    draw_text(
        ctx, "Splits", "IBM Plex Sans", 40,
        width / 2, header_y, TEXT_PRIMARY, weight='Bold', align='center'
    )

    # Column headers
    col_header_y = header_y + 80
    col_positions = [
        (panel_padding + 120, "Split"),
        (panel_padding + panel_width * 0.35, "Pace"),
        (panel_padding + panel_width * 0.55, "Watts"),
        (panel_padding + panel_width * 0.75, "SR"),
    ]

    if is_story:
        col_positions.append((panel_padding + panel_width * 0.88, "HR"))

    for x, label in col_positions:
        draw_text(
            ctx, label, "IBM Plex Sans", 28,
            x, col_header_y, TEXT_MUTED, weight='SemiBold', align='left'
        )

    # Splits rows
    row_y = col_header_y + 60
    for split in splits_to_show:
        row_data = [
            (panel_padding + 120, f"#{split['split_number']}"),
            (panel_padding + panel_width * 0.35, split['pace']),
            (panel_padding + panel_width * 0.55, f"{split['watts']}"),
            (panel_padding + panel_width * 0.75, f"{split['stroke_rate']}"),
        ]

        if is_story:
            row_data.append((panel_padding + panel_width * 0.88, f"{split['heart_rate']}"))

        for x, value in row_data:
            draw_text(
                ctx, str(value), "IBM Plex Mono", 32,
                x, row_y, TEXT_PRIMARY, weight='Regular', align='left'
            )

        row_y += splits_row_height

    # --- ATHLETE NAME (if enabled) ---
    if options.get('showName', True):
        name_y = row_y + 120 if not is_story else row_y + 80
        draw_text(
            ctx, workout_data.get('athlete_name', 'Athlete'), "IBM Plex Sans", 36,
            width / 2, name_y, TEXT_SECONDARY, weight='SemiBold', align='center'
        )

    # --- GEOMETRIC DECORATIVE ELEMENTS ---
    # Chamfered corner accent (top right)
    accent_size = 80
    ctx.set_source_rgb(*COPPER)
    ctx.move_to(width - accent_size, 0)
    ctx.line_to(width, 0)
    ctx.line_to(width, accent_size)
    ctx.close_path()
    ctx.fill()

    # Bottom left chamfered corner
    ctx.set_source_rgb(*COPPER)
    ctx.move_to(0, height - accent_size)
    ctx.line_to(0, height)
    ctx.line_to(accent_size, height)
    ctx.close_path()
    ctx.fill()

    # Subtle ruled lines as texture
    ctx.set_source_rgba(0.72, 0.45, 0.20, 0.15)  # Copper with low opacity
    ctx.set_line_width(2)
    for i in range(3):
        y_pos = 40 + (i * 12)
        ctx.move_to(width - 300, y_pos)
        ctx.line_to(width - 120, y_pos)
        ctx.stroke()

    # --- GRAIN TEXTURE ---
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # --- BRANDING ---
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)
