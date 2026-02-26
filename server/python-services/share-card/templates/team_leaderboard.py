"""
Team Leaderboard Card - Team Rankings Snapshot
Shows weekly/monthly team rankings for a specific metric.

Layout:
- Team name + period header
- Leaderboard type (2K Times, Total Meters, etc.)
- Ranked list with podium treatment for top 3
- Trend indicators (up/down/new)
"""

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


def get_rank_color(rank):
    """Return color for rank position"""
    if rank == 1:
        return GOLD
    elif rank == 2:
        return (0.75, 0.75, 0.75)  # Silver
    elif rank == 3:
        return (0.80, 0.50, 0.20)  # Bronze
    else:
        return TEXT_SECONDARY


def get_trend_symbol(trend):
    """Return trend arrow/symbol"""
    if trend == 'up':
        return '↑'
    elif trend == 'down':
        return '↓'
    elif trend == 'new':
        return '★'
    else:
        return ''


def get_trend_color(trend):
    """Return color for trend indicator"""
    if trend == 'up':
        return GOLD
    elif trend == 'down':
        return ROSE
    elif trend == 'new':
        return (0.30, 0.70, 0.65)  # Teal
    else:
        return TEXT_MUTED


def draw_leaderboard_row(ctx, entry, y, width, row_height, is_podium=False):
    """Draw a single leaderboard row"""
    rank = entry.get('rank', 0)
    athlete_name = entry.get('athlete_name', '')
    metric_value = entry.get('metric_value', '')
    trend = entry.get('trend', '')

    rank_color = get_rank_color(rank)
    trend_symbol = get_trend_symbol(trend)
    trend_color = get_trend_color(trend)

    # Rank (left)
    rank_x = 180
    if is_podium:
        # Larger, bold for podium
        draw_text(ctx, str(rank), "IBM Plex Mono", 68,
                  rank_x, y, rank_color, weight='Bold', align='left')
    else:
        draw_text(ctx, str(rank), "IBM Plex Mono", 48,
                  rank_x, y, rank_color, weight='SemiBold', align='left')

    # Name (center-left)
    name_x = 320
    name_size = 56 if is_podium else 44
    name_weight = 'Bold' if is_podium else 'SemiBold'
    draw_text(ctx, athlete_name, "IBM Plex Sans", name_size,
              name_x, y, TEXT_PRIMARY, weight=name_weight, align='left')

    # Metric value (center-right)
    metric_x = width * 0.65
    metric_size = 52 if is_podium else 42
    draw_text(ctx, metric_value, "IBM Plex Mono", metric_size,
              metric_x, y, rank_color, weight='Bold', align='left')

    # Trend (right)
    if trend_symbol:
        trend_x = width - 200
        trend_size = 48 if is_podium else 40
        draw_text(ctx, trend_symbol, "IBM Plex Sans", trend_size,
                  trend_x, y, trend_color, weight='Bold', align='right')

    return y + row_height


def render_team_leaderboard(format_key, workout_data, options):
    """
    Render team leaderboard card

    Data expected:
    {
        'team_name': str,
        'period': str,  # "January 2026" | "Week of Feb 3"
        'leaderboard_type': str,  # "2K Times" | "Total Meters" | "Most Workouts"
        'entries': [
            {
                'rank': int,
                'athlete_name': str,
                'metric_value': str,  # Pre-formatted value
                'trend': 'up' | 'down' | 'new' | 'same'
            },
            ...
        ]
    }
    """
    if options is None:
        options = {}

    width, height = DIMENSIONS[format_key]
    is_story = format_key == '9:16'

    surface, ctx = setup_canvas(width, height)

    # Background - dark with team pride gradient
    gradient = cairo.LinearGradient(0, 0, width, height)
    gradient.add_color_stop_rgb(0, 0.03, 0.03, 0.04)
    gradient.add_color_stop_rgb(0.5, 0.08, 0.06, 0.08)
    gradient.add_color_stop_rgb(1, 0.12, 0.08, 0.06)
    ctx.set_source(gradient)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()

    # Warm glow behind leaderboard
    radial_bg = cairo.RadialGradient(width / 2, height * 0.5, 0, width / 2, height * 0.5, width * 0.6)
    radial_bg.add_color_stop_rgba(0, *COPPER, 0.12)
    radial_bg.add_color_stop_rgba(1, *COPPER, 0)
    ctx.set_source(radial_bg)
    ctx.paint()

    # Extract data
    team_name = workout_data.get('team_name', 'Team')
    period = workout_data.get('period', '')
    leaderboard_type = workout_data.get('leaderboard_type', 'Leaderboard')
    entries = workout_data.get('entries', [])

    # Team color accent (use option if provided, else default copper)
    team_color_hex = options.get('teamColor')
    if team_color_hex:
        from templates.base_template import hex_to_rgb
        team_color = hex_to_rgb(team_color_hex)
    else:
        team_color = COPPER

    # ── Header Section ──
    y = 120

    # Team name
    draw_text(ctx, team_name, "IBM Plex Sans", 64,
              width / 2, y, TEXT_PRIMARY, weight='Bold', align='center')
    y += 100

    # Period
    draw_text(ctx, period, "IBM Plex Sans", 40,
              width / 2, y, TEXT_SECONDARY, weight='Regular', align='center')
    y += 100

    # Leaderboard type
    draw_text(ctx, leaderboard_type.upper(), "IBM Plex Sans", 48,
              width / 2, y, team_color, weight='Bold', align='center')
    y += 100

    # Decorative separator with team color
    separator_width = 700
    draw_gradient_rect(ctx, (width - separator_width) / 2, y, separator_width, 4,
                       team_color, GOLD, direction='horizontal')
    y += 80

    # ── Leaderboard Rows ──
    # Determine row count based on format
    if is_story:
        max_rows = min(15, len(entries))
        row_height_podium = 110
        row_height_regular = 80
    else:
        max_rows = min(8, len(entries))
        row_height_podium = 120
        row_height_regular = 90

    # Draw podium entries (top 3) with special treatment
    podium_entries = entries[:3]
    for entry in podium_entries:
        y = draw_leaderboard_row(ctx, entry, y, width, row_height_podium, is_podium=True)
        y += 20  # Extra spacing after podium

    # Draw remaining entries
    remaining_entries = entries[3:max_rows]
    for entry in remaining_entries:
        y = draw_leaderboard_row(ctx, entry, y, width, row_height_regular, is_podium=False)

    # Truncation indicator
    if len(entries) > max_rows:
        remaining = len(entries) - max_rows
        y += 40
        draw_text(ctx, f"+ {remaining} more {'athletes' if remaining != 1 else 'athlete'}",
                  "IBM Plex Sans", 36,
                  width / 2, y, TEXT_MUTED, weight='Regular', align='center')

    # ── Legend (bottom) ──
    legend_y = height - 300
    draw_text(ctx, "↑ Improving  ↓ Dropped  ★ New", "IBM Plex Sans", 32,
              width / 2, legend_y, TEXT_MUTED, weight='Regular', align='center')

    # Add grain texture
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # Branding
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)


# Sample data for testing
SAMPLE_LEADERBOARD = {
    'team_name': 'Varsity Men',
    'period': 'January 2026',
    'leaderboard_type': '2K Times',
    'entries': [
        {'rank': 1, 'athlete_name': 'Chen', 'metric_value': '6:22.1', 'trend': 'up'},
        {'rank': 2, 'athlete_name': 'Lopez', 'metric_value': '6:28.4', 'trend': 'up'},
        {'rank': 3, 'athlete_name': 'Park', 'metric_value': '6:31.0', 'trend': 'same'},
        {'rank': 4, 'athlete_name': 'Williams', 'metric_value': '6:35.2', 'trend': 'down'},
        {'rank': 5, 'athlete_name': 'Davis', 'metric_value': '6:38.7', 'trend': 'new'},
        {'rank': 6, 'athlete_name': 'Thompson', 'metric_value': '6:42.3', 'trend': 'up'},
        {'rank': 7, 'athlete_name': 'Garcia', 'metric_value': '6:45.1', 'trend': 'same'},
        {'rank': 8, 'athlete_name': 'Martinez', 'metric_value': '6:48.9', 'trend': 'down'},
    ],
}
