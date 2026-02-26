"""
Regatta Summary Card - Full Regatta Results
Shows all race results from a regatta in compact list format.

Displays:
- Regatta header (name, location, date)
- Compact results table with placement color coding
- Summary stats (total events, medals, best result)
"""

from templates.base_template import (
    setup_canvas, draw_text, draw_gradient_rect, draw_rounded_rect,
    draw_grain_texture, draw_oarbit_branding, surface_to_png_bytes,
    DARK_BG, GOLD, COPPER, ROSE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SLATE
)
from datetime import datetime
import cairocffi as cairo

DIMENSIONS = {
    '1:1': (2160, 2160),
    '9:16': (2160, 3840),
}


def format_date(iso_date):
    """Format ISO date string to readable format"""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        return dt.strftime('%b %d, %Y')
    except (ValueError, AttributeError):
        return iso_date or ''


def get_placement_color(placement):
    """Return color tuple for placement"""
    if placement == 1:
        return GOLD
    elif placement == 2:
        return (0.75, 0.75, 0.75)  # Silver
    elif placement == 3:
        return (0.80, 0.50, 0.20)  # Bronze
    else:
        return TEXT_SECONDARY


def get_placement_suffix(placement):
    """Return ordinal suffix"""
    if placement % 10 == 1 and placement % 100 != 11:
        return 'st'
    elif placement % 10 == 2 and placement % 100 != 12:
        return 'nd'
    elif placement % 10 == 3 and placement % 100 != 13:
        return 'rd'
    else:
        return 'th'


def draw_result_row(ctx, race, y, width, row_height, is_alt_row):
    """Draw a single result row with alternating background"""
    # Alternating row background
    if is_alt_row:
        ctx.set_source_rgba(*SLATE, 0.2)
        ctx.rectangle(80, y - 10, width - 160, row_height)
        ctx.fill()

    event_name = race.get('event_name', '')
    placement = race.get('placement', 0)
    time = race.get('time', '')
    margin = race.get('margin', '')

    # Event name (left)
    draw_text(ctx, event_name, "IBM Plex Sans", 38,
              140, y, TEXT_PRIMARY, weight='SemiBold', align='left')

    # Placement (center-left with color)
    placement_str = f"{placement}{get_placement_suffix(placement)}"
    placement_color = get_placement_color(placement)
    draw_text(ctx, placement_str, "IBM Plex Mono", 42,
              width * 0.55, y, placement_color, weight='Bold', align='left')

    # Time (center-right)
    draw_text(ctx, time, "IBM Plex Mono", 38,
              width * 0.70, y, TEXT_SECONDARY, weight='Regular', align='left')

    # Margin (right)
    if margin:
        draw_text(ctx, margin, "IBM Plex Sans", 32,
                  width - 140, y, TEXT_MUTED, weight='Regular', align='right')

    return y + row_height


def render_regatta_summary(format_key, workout_data, options):
    """
    Render regatta summary card with all race results

    Data expected:
    {
        'regatta_name': str,
        'location': str,
        'date': str (ISO),
        'races': [
            {
                'event_name': str,
                'placement': int,
                'time': str,
                'margin': str  # "Won by 3.1s" | "2.4s behind"
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

    # Background - dark with subtle gradient
    gradient = cairo.LinearGradient(0, 0, width, height)
    gradient.add_color_stop_rgb(0, 0.03, 0.03, 0.04)
    gradient.add_color_stop_rgb(0.5, 0.08, 0.06, 0.08)
    gradient.add_color_stop_rgb(1, 0.12, 0.08, 0.06)
    ctx.set_source(gradient)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()

    # Extract data
    regatta_name = workout_data.get('regatta_name', 'Regatta')
    location = workout_data.get('location', '')
    date = workout_data.get('date', '')
    races = workout_data.get('races', [])

    # ── Header Section (Editorial style) ──
    y = 140

    # Regatta name - large, editorial
    draw_text(ctx, regatta_name, "IBM Plex Sans", 72,
              width / 2, y, TEXT_PRIMARY, weight='Bold', align='center')
    y += 100

    # Location + Date
    location_date = f"{location} • {format_date(date)}"
    draw_text(ctx, location_date, "IBM Plex Sans", 40,
              width / 2, y, TEXT_SECONDARY, weight='Regular', align='center')
    y += 120

    # Decorative separator
    separator_width = 600
    ctx.set_source_rgba(*COPPER, 0.5)
    ctx.rectangle((width - separator_width) / 2, y, separator_width, 3)
    ctx.fill()
    y += 80

    # ── Results Section ──
    # Column headers
    draw_text(ctx, "EVENT", "IBM Plex Sans", 32,
              140, y, TEXT_MUTED, weight='Bold', align='left')
    draw_text(ctx, "PLACE", "IBM Plex Sans", 32,
              width * 0.55, y, TEXT_MUTED, weight='Bold', align='left')
    draw_text(ctx, "TIME", "IBM Plex Sans", 32,
              width * 0.70, y, TEXT_MUTED, weight='Bold', align='left')
    draw_text(ctx, "MARGIN", "IBM Plex Sans", 32,
              width - 140, y, TEXT_MUTED, weight='Bold', align='right')
    y += 60

    # Determine how many rows fit
    row_height = 90
    available_height = height - y - 400  # Reserve space for stats + branding
    max_rows = int(available_height / row_height)

    # For 1:1 format, show top 5-6 results
    # For 9:16 format, show all results (or up to max_rows)
    if not is_story and len(races) > 6:
        show_races = races[:6]
        truncated = True
    else:
        show_races = races[:max_rows]
        truncated = len(races) > max_rows

    # Draw result rows
    for i, race in enumerate(show_races):
        is_alt_row = i % 2 == 1
        y = draw_result_row(ctx, race, y, width, row_height, is_alt_row)

    # Truncation indicator
    if truncated:
        remaining = len(races) - len(show_races)
        draw_text(ctx, f"+ {remaining} more {'events' if remaining != 1 else 'event'}",
                  "IBM Plex Sans", 36,
                  width / 2, y + 20, TEXT_MUTED, weight='Regular', align='center')
        y += 80

    # ── Summary Stats ──
    y += 100

    # Calculate stats
    total_events = len(races)
    medals = {
        'gold': sum(1 for r in races if r.get('placement') == 1),
        'silver': sum(1 for r in races if r.get('placement') == 2),
        'bronze': sum(1 for r in races if r.get('placement') == 3),
    }
    best_placement = min((r.get('placement', 999) for r in races), default=0)

    # Stats panel
    panel_padding = 140
    panel_width = width - (panel_padding * 2)
    panel_height = 280

    draw_rounded_rect(ctx, panel_padding, y, panel_width, panel_height, 24)
    ctx.set_source_rgba(*SLATE, 0.3)
    ctx.fill()

    # Stats in 3-column grid
    stat_y = y + 60

    # Total events
    draw_text(ctx, str(total_events), "IBM Plex Mono", 72,
              width * 0.25, stat_y, GOLD, weight='Bold', align='center')
    draw_text(ctx, "EVENTS", "IBM Plex Sans", 32,
              width * 0.25, stat_y + 90, TEXT_MUTED, weight='SemiBold', align='center')

    # Medals (show count for each)
    medals_str = f"{medals['gold']}🥇 {medals['silver']}🥈 {medals['bronze']}🥉"
    draw_text(ctx, medals_str, "IBM Plex Sans", 48,
              width * 0.50, stat_y + 20, TEXT_PRIMARY, weight='Bold', align='center')
    draw_text(ctx, "MEDALS", "IBM Plex Sans", 32,
              width * 0.50, stat_y + 90, TEXT_MUTED, weight='SemiBold', align='center')

    # Best result
    if best_placement > 0:
        best_str = f"{best_placement}{get_placement_suffix(best_placement)}"
        best_color = get_placement_color(best_placement)
        draw_text(ctx, best_str, "IBM Plex Mono", 72,
                  width * 0.75, stat_y, best_color, weight='Bold', align='center')
        draw_text(ctx, "BEST", "IBM Plex Sans", 32,
                  width * 0.75, stat_y + 90, TEXT_MUTED, weight='SemiBold', align='center')

    # Add grain texture
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # Branding
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)


# Sample data for testing
SAMPLE_REGATTA_SUMMARY = {
    'regatta_name': 'Head of the Charles',
    'location': 'Boston, MA',
    'date': '2026-10-18',
    'races': [
        {'event_name': "M Championship 8+", 'placement': 1, 'time': '14:42.3', 'margin': 'Won by 3.1s'},
        {'event_name': "M Championship 4+", 'placement': 3, 'time': '15:21.7', 'margin': '2.4s behind'},
        {'event_name': "M Championship 2x", 'placement': 7, 'time': '16:05.2', 'margin': '12.8s behind'},
        {'event_name': "W Championship 8+", 'placement': 2, 'time': '15:58.1', 'margin': '1.2s behind'},
        {'event_name': "M Club 8+", 'placement': 4, 'time': '15:12.5', 'margin': '8.3s behind'},
        {'event_name': "W Club 4+", 'placement': 1, 'time': '16:22.0', 'margin': 'Won by 5.2s'},
    ],
}
