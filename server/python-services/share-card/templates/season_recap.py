"""
Season Recap Card - "Spotify Wrapped for Rowing"
Celebratory year-in-review card with both volume and improvement stats.

Layout:
- Title + season name + date range (editorial header)
- Volume section (top half): total meters, workouts, time, calories, avg/week, favorite machine
- Improvement section (bottom half): PRs set, biggest improvement, top 3 improvements listed
- Visual: More decorative than data cards - celebration aesthetic
"""

import math
from templates.base_template import (
    setup_canvas, draw_text, draw_gradient_rect, draw_rounded_rect,
    draw_grain_texture, draw_oarbit_branding, surface_to_png_bytes,
    DARK_BG, GOLD, COPPER, ROSE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SLATE
)
import cairocffi as cairo

DIMENSIONS = {
    '1:1': (2160, 2160),
    '9:16': (2160, 3840),
}


def format_meters(meters):
    """Format meters with comma separators and unit"""
    if meters >= 1_000_000:
        return f"{meters / 1_000_000:.2f}M m"
    elif meters >= 1_000:
        return f"{meters:,} m"
    else:
        return f"{meters} m"


def format_time_hours(minutes):
    """Format minutes to hours + minutes"""
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"


def format_calories(cals):
    """Format calories with comma separators"""
    return f"{cals:,}"


def draw_celebration_background(ctx, width, height):
    """Draw decorative background with abstract wave patterns and radial glows"""
    # Base gradient
    gradient = cairo.LinearGradient(0, 0, width, height)
    gradient.add_color_stop_rgb(0, 0.05, 0.04, 0.06)
    gradient.add_color_stop_rgb(0.5, 0.10, 0.08, 0.10)
    gradient.add_color_stop_rgb(1, 0.12, 0.10, 0.08)
    ctx.set_source(gradient)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()

    # Radial glows
    radial1 = cairo.RadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.5)
    radial1.add_color_stop_rgba(0, *GOLD, 0.15)
    radial1.add_color_stop_rgba(1, *GOLD, 0)
    ctx.set_source(radial1)
    ctx.paint()

    radial2 = cairo.RadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.5)
    radial2.add_color_stop_rgba(0, *ROSE, 0.12)
    radial2.add_color_stop_rgba(1, *ROSE, 0)
    ctx.set_source(radial2)
    ctx.paint()

    # Abstract wave patterns
    ctx.save()
    ctx.set_source_rgba(*COPPER, 0.08)
    ctx.set_line_width(4)
    for i in range(6):
        y_base = height * 0.15 + (i * height * 0.14)
        amp = 100 + (i * 15)
        freq = 0.004 + (i * 0.0004)
        ctx.move_to(0, y_base)
        for x in range(0, width, 12):
            ctx.line_to(x, y_base + math.sin(x * freq) * amp)
        ctx.stroke()
    ctx.restore()


def draw_stat_badge(ctx, value, label, x, y, color, align='center'):
    """Draw a stat with large value and label below"""
    draw_text(ctx, value, "IBM Plex Mono", 96,
              x, y, color, weight='Bold', align=align)
    draw_text(ctx, label, "IBM Plex Sans", 36,
              x, y + 120, TEXT_MUTED, weight='SemiBold', align=align)


def draw_improvement_row(ctx, improvement, x, y, width):
    """Draw a single improvement row (test type, old→new, delta)"""
    test_type = improvement.get('test_type', '')
    old_time = improvement.get('old_time', '')
    new_time = improvement.get('new_time', '')
    delta = improvement.get('delta', '')

    # Test type (left)
    draw_text(ctx, test_type, "IBM Plex Sans", 42,
              x, y, TEXT_PRIMARY, weight='Bold', align='left')

    # Old → New (center)
    transition = f"{old_time} → {new_time}"
    draw_text(ctx, transition, "IBM Plex Mono", 38,
              x + 280, y, TEXT_SECONDARY, weight='Regular', align='left')

    # Delta (right, with color coding)
    delta_color = GOLD  # Improvements are always gold (negative delta)
    draw_text(ctx, delta, "IBM Plex Mono", 42,
              width - x, y, delta_color, weight='Bold', align='right')

    return y + 80


def render_season_recap(format_key, workout_data, options):
    """
    Render season recap card - Spotify Wrapped style for rowing

    Data expected:
    {
        'season_name': str,  # "Fall 2025"
        'date_range': str,  # "Sep 1 - Dec 15, 2025"
        'total_meters': int,
        'total_minutes': int,
        'workout_count': int,
        'prs_set': int,
        'total_calories': int,
        'avg_weekly_meters': int,
        'favorite_machine': str,  # "RowErg" | "BikeErg" | "SkiErg"
        'biggest_improvement': {
            'test_type': str,  # "2K"
            'delta_seconds': float  # 12.3 (always positive)
        },
        'improvements': [
            {
                'test_type': str,
                'old_time': str,  # "6:34.4"
                'new_time': str,  # "6:22.1"
                'delta': str  # "-12.3s"
            },
            ...
        ],
        'athlete_name': str  # Optional
    }
    """
    if options is None:
        options = {}

    width, height = DIMENSIONS[format_key]
    is_story = format_key == '9:16'

    surface, ctx = setup_canvas(width, height)

    # Celebration background
    draw_celebration_background(ctx, width, height)

    # Extract data
    season_name = workout_data.get('season_name', 'Season')
    date_range = workout_data.get('date_range', '')
    total_meters = workout_data.get('total_meters', 0)
    total_minutes = workout_data.get('total_minutes', 0)
    workout_count = workout_data.get('workout_count', 0)
    prs_set = workout_data.get('prs_set', 0)
    total_calories = workout_data.get('total_calories', 0)
    avg_weekly_meters = workout_data.get('avg_weekly_meters', 0)
    favorite_machine = workout_data.get('favorite_machine', 'RowErg')
    biggest_improvement = workout_data.get('biggest_improvement', {})
    improvements = workout_data.get('improvements', [])
    athlete_name = workout_data.get('athlete_name', '')

    # ── Title Section ──
    y = 120

    # "SEASON RECAP" header
    draw_text(ctx, "SEASON RECAP", "IBM Plex Sans", 56,
              width / 2, y, COPPER, weight='Bold', align='center')
    y += 90

    # Season name - large, celebratory
    draw_text(ctx, season_name, "IBM Plex Sans", 88,
              width / 2, y, TEXT_PRIMARY, weight='Bold', align='center')
    y += 110

    # Date range
    draw_text(ctx, date_range, "IBM Plex Sans", 38,
              width / 2, y, TEXT_SECONDARY, weight='Regular', align='center')
    y += 100

    # Decorative separator
    separator_width = 800
    draw_gradient_rect(ctx, (width - separator_width) / 2, y, separator_width, 4,
                       GOLD, COPPER, direction='horizontal')
    y += 80

    # ── VOLUME SECTION ──
    # Section header
    draw_text(ctx, "YOUR YEAR IN NUMBERS", "IBM Plex Sans", 44,
              width / 2, y, TEXT_MUTED, weight='Bold', align='center')
    y += 100

    # Volume stats in grid (2x3 for 1:1, 2x3 for 9:16)
    stat_gap = 200
    row1_y = y
    row2_y = y + stat_gap

    if is_story:
        # 9:16 format - more vertical space, show all stats
        # Row 1: Total Meters, Workouts, Time
        draw_stat_badge(ctx, format_meters(total_meters), "TOTAL DISTANCE",
                        width / 2, row1_y, GOLD, align='center')

        row1_y += stat_gap
        # Row 2: Workouts, Time
        draw_stat_badge(ctx, str(workout_count), "WORKOUTS",
                        width * 0.33, row1_y, ROSE, align='center')
        draw_stat_badge(ctx, format_time_hours(total_minutes), "TIME",
                        width * 0.67, row1_y, ROSE, align='center')

        row1_y += stat_gap
        # Row 3: Calories, Avg/week, Favorite machine
        draw_stat_badge(ctx, format_calories(total_calories), "CALORIES",
                        width * 0.33, row1_y, COPPER, align='center')
        draw_stat_badge(ctx, format_meters(avg_weekly_meters), "AVG/WEEK",
                        width * 0.67, row1_y, COPPER, align='center')

        y = row1_y + stat_gap + 60

        # Favorite machine callout
        draw_text(ctx, f"Favorite: {favorite_machine}", "IBM Plex Sans", 40,
                  width / 2, y, TEXT_SECONDARY, weight='SemiBold', align='center')
        y += 120
    else:
        # 1:1 format - compact, key stats only
        # Row 1: Total Meters, Workouts
        draw_stat_badge(ctx, format_meters(total_meters), "TOTAL DISTANCE",
                        width * 0.33, row1_y, GOLD, align='center')
        draw_stat_badge(ctx, str(workout_count), "WORKOUTS",
                        width * 0.67, row1_y, ROSE, align='center')

        # Row 2: Time, Calories
        draw_stat_badge(ctx, format_time_hours(total_minutes), "TIME",
                        width * 0.33, row2_y, COPPER, align='center')
        draw_stat_badge(ctx, format_calories(total_calories), "CALORIES",
                        width * 0.67, row2_y, COPPER, align='center')

        y = row2_y + 200

    # ── IMPROVEMENT SECTION ──
    # Section header
    draw_text(ctx, "YOUR PROGRESS", "IBM Plex Sans", 44,
              width / 2, y, TEXT_MUTED, weight='Bold', align='center')
    y += 100

    # PRs badge (large, gold)
    if prs_set > 0:
        # Panel background for PRs
        panel_width = 600
        panel_height = 180
        panel_x = (width - panel_width) / 2

        draw_rounded_rect(ctx, panel_x, y, panel_width, panel_height, 24)
        ctx.set_source_rgba(*GOLD, 0.15)
        ctx.fill()

        # PRs count with badge
        draw_text(ctx, str(prs_set), "IBM Plex Mono", 100,
                  width / 2, y + 40, GOLD, weight='Bold', align='center')
        draw_text(ctx, "PERSONAL RECORDS SET", "IBM Plex Sans", 36,
                  width / 2, y + 160, TEXT_PRIMARY, weight='SemiBold', align='center')

        y += panel_height + 80

    # Biggest improvement callout
    if biggest_improvement:
        test_type = biggest_improvement.get('test_type', '')
        delta_seconds = biggest_improvement.get('delta_seconds', 0)
        if test_type and delta_seconds:
            biggest_text = f"Biggest gain: {test_type} (-{delta_seconds:.1f}s)"
            draw_text(ctx, biggest_text, "IBM Plex Sans", 48,
                      width / 2, y, ROSE, weight='Bold', align='center')
            y += 100

    # Top 3 improvements (9:16 only, or if space allows)
    if improvements and (is_story or y < height - 700):
        y += 40
        draw_text(ctx, "TOP IMPROVEMENTS", "IBM Plex Sans", 36,
                  width / 2, y, TEXT_MUTED, weight='Bold', align='center')
        y += 80

        # Draw improvements
        improvement_x = 200
        for improvement in improvements[:3]:
            y = draw_improvement_row(ctx, improvement, improvement_x, y, width)

    # ── Athlete Name (if provided) ──
    if athlete_name:
        name_y = height - 220
        draw_text(ctx, athlete_name, "IBM Plex Sans", 52,
                  width / 2, name_y, TEXT_SECONDARY, weight='SemiBold', align='center')

    # Add grain texture
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # Branding
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)


# Sample data for testing
SAMPLE_SEASON_RECAP = {
    'season_name': 'Fall 2025',
    'date_range': 'Sep 1 - Dec 15, 2025',
    'total_meters': 2847500,
    'total_minutes': 14280,
    'workout_count': 156,
    'prs_set': 8,
    'total_calories': 285000,
    'avg_weekly_meters': 189833,
    'favorite_machine': 'RowErg',
    'biggest_improvement': {'test_type': '2K', 'delta_seconds': 12.3},
    'improvements': [
        {'test_type': '2K', 'old_time': '6:34.4', 'new_time': '6:22.1', 'delta': '-12.3s'},
        {'test_type': '6K', 'old_time': '21:15.0', 'new_time': '20:48.7', 'delta': '-26.3s'},
        {'test_type': '500m', 'old_time': '1:28.2', 'new_time': '1:26.8', 'delta': '-1.4s'},
    ],
    'athlete_name': 'Marcus Chen',
}
