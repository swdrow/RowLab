"""
Regatta Result Card - Single Race Result
Shows placement, time, margin, crew list for a single regatta event.

Placement badge styling:
- 1st: Gold treatment (copper/gold gradient)
- 2nd: Silver treatment (light gray gradient)
- 3rd: Bronze treatment (warm brown)
- 4th+: Standard text, muted
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
    """Return color tuple for placement badge"""
    if placement == 1:
        return GOLD
    elif placement == 2:
        return (0.75, 0.75, 0.75)  # Silver
    elif placement == 3:
        return (0.80, 0.50, 0.20)  # Bronze
    else:
        return TEXT_MUTED


def get_placement_suffix(placement):
    """Return ordinal suffix for placement number"""
    if placement % 10 == 1 and placement % 100 != 11:
        return 'st'
    elif placement % 10 == 2 and placement % 100 != 12:
        return 'nd'
    elif placement % 10 == 3 and placement % 100 != 13:
        return 'rd'
    else:
        return 'th'


def draw_placement_badge(ctx, placement, width, y):
    """Draw centered placement badge with appropriate styling"""
    placement_str = f"{placement}{get_placement_suffix(placement)}"
    color = get_placement_color(placement)

    # Draw placement with appropriate size
    if placement <= 3:
        # Podium placements - larger, bold
        draw_text(ctx, placement_str, "IBM Plex Sans", 280,
                  width / 2, y, color, weight='Bold', align='center')
    else:
        # 4th+ placements - smaller, muted
        draw_text(ctx, placement_str, "IBM Plex Sans", 200,
                  width / 2, y, TEXT_MUTED, weight='Bold', align='center')

    return y + 320


def render_regatta_result(format_key, workout_data, options):
    """
    Render single regatta result card

    Data expected:
    {
        'regatta_name': str,
        'location': str,
        'date': str (ISO),
        'event_name': str,
        'placement': int,
        'total_entries': int,
        'time': str (formatted),
        'margin_ahead': float | None (seconds behind leader),
        'margin_behind': float | None (seconds ahead of next),
        'crew_list': [str],  # List of athlete names
        'event_type': str  # "Head Race" | "Sprint" | "2K"
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
    event_name = workout_data.get('event_name', '')
    placement = workout_data.get('placement', 1)
    total_entries = workout_data.get('total_entries', 0)
    time = workout_data.get('time', '--:--')
    margin_ahead = workout_data.get('margin_ahead')
    margin_behind = workout_data.get('margin_behind')
    crew_list = workout_data.get('crew_list', [])
    event_type = workout_data.get('event_type', '')

    # ── Header Section ──
    y = 120

    # Regatta name
    draw_text(ctx, regatta_name, "IBM Plex Sans", 52,
              width / 2, y, TEXT_PRIMARY, weight='Bold', align='center')
    y += 80

    # Location + Date
    location_date = f"{location} • {format_date(date)}"
    draw_text(ctx, location_date, "IBM Plex Sans", 36,
              width / 2, y, TEXT_SECONDARY, weight='Regular', align='center')
    y += 100

    # Event name
    draw_text(ctx, event_name, "IBM Plex Sans", 44,
              width / 2, y, TEXT_MUTED, weight='SemiBold', align='center')
    y += 120

    # ── Placement Badge ──
    y = draw_placement_badge(ctx, placement, width, y)

    # Total entries context
    if total_entries > 0:
        entries_text = f"out of {total_entries} {'entries' if total_entries != 1 else 'entry'}"
        draw_text(ctx, entries_text, "IBM Plex Sans", 36,
                  width / 2, y, TEXT_MUTED, weight='Regular', align='center')
        y += 100

    # ── Time Panel ──
    panel_padding = 160
    panel_width = width - (panel_padding * 2)
    panel_height = 280

    draw_rounded_rect(ctx, panel_padding, y, panel_width, panel_height, 24)
    ctx.set_source_rgba(*SLATE, 0.4)
    ctx.fill()

    # Time value
    draw_text(ctx, time, "IBM Plex Mono", 120,
              width / 2, y + 60, GOLD, weight='Bold', align='center')

    # Time label
    draw_text(ctx, "FINISH TIME", "IBM Plex Sans", 40,
              width / 2, y + 200, TEXT_SECONDARY, weight='SemiBold', align='center')

    y += panel_height + 80

    # ── Margin Information ──
    if margin_behind is not None or margin_ahead is not None:
        if placement == 1 and margin_behind is not None:
            # Winner - show margin of victory
            margin_text = f"Won by {margin_behind:.1f}s"
            margin_color = GOLD
        elif margin_ahead is not None:
            # Not winner - show how far behind leader
            margin_text = f"{margin_ahead:.1f}s behind leader"
            margin_color = TEXT_SECONDARY
        else:
            margin_text = ""
            margin_color = TEXT_SECONDARY

        if margin_text:
            draw_text(ctx, margin_text, "IBM Plex Sans", 48,
                      width / 2, y, margin_color, weight='SemiBold', align='center')
            y += 120

    # ── Crew List (9:16 format only or if space allows) ──
    if crew_list and (is_story or y < height - 600):
        y += 60
        draw_text(ctx, "CREW", "IBM Plex Sans", 40,
                  width / 2, y, TEXT_MUTED, weight='Bold', align='center')
        y += 70

        # Draw crew members in compact format
        crew_text = " • ".join(crew_list)

        # Wrap text if needed (approximate character limit)
        max_chars_per_line = 60 if is_story else 50
        words = crew_text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            if current_length + len(word) + 1 <= max_chars_per_line:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
                current_length = len(word)

        if current_line:
            lines.append(" ".join(current_line))

        for line in lines[:6]:  # Max 6 lines
            draw_text(ctx, line, "IBM Plex Sans", 32,
                      width / 2, y, TEXT_SECONDARY, weight='Regular', align='center')
            y += 50

    # ── Event Type Badge (bottom) ──
    if event_type:
        badge_y = height - 280
        draw_text(ctx, event_type.upper(), "IBM Plex Sans", 32,
                  width / 2, badge_y, TEXT_MUTED, weight='SemiBold', align='center')

    # Add grain texture
    draw_grain_texture(ctx, width, height, opacity=0.03)

    # Branding
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)


# Sample data for testing
SAMPLE_REGATTA_RESULT = {
    'regatta_name': 'Head of the Charles',
    'location': 'Boston, MA',
    'date': '2026-10-18',
    'event_name': "Men's Championship 8+",
    'placement': 1,
    'total_entries': 24,
    'time': '14:42.3',
    'margin_ahead': None,
    'margin_behind': 3.1,
    'crew_list': ['Chen (8)', 'Lopez (7)', 'Park (6)', 'Williams (5)', 'Davis (4)', 'Thompson (3)', 'Garcia (2)', 'Martinez (1)', 'Cox: Miller'],
    'event_type': 'Head Race',
}
