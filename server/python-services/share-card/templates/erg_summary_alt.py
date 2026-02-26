"""
Erg Summary Card - Design B (Fresh Direction)
Editorial/artistic approach with full-bleed gradients and dynamic asymmetric layout.

Type-aware presentation matching how rowers actually describe and think about workouts:
- Continuous pieces (JustRow, FixedTimeSplits, FixedDistanceSplits): "I rowed a 10K"
- Interval workouts (FixedTimeInterval, FixedDistanceInterval, VariableInterval): "I did 7x11'/1:00r"

Machine-aware display:
- Rower/SkiErg: pace /500m, "SPM"
- BikeErg: pace /1000m, "RPM"
"""

import math
from datetime import datetime
from templates.base_template import (
    setup_canvas, draw_text, draw_gradient_rect,
    draw_rounded_rect, draw_grain_texture, draw_oarbit_branding,
    surface_to_png_bytes, hex_to_rgb,
    DARK_BG, GOLD, ROSE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SLATE, COPPER, TEAL
)

DIMENSIONS = {
    '1:1': (2160, 2160),
    '9:16': (2160, 3840),
}

MACHINE_LABELS = {
    'rower': 'ERG',
    'slides': 'DYNAMIC',
    'dynamic': 'DYNAMIC',
    'skierg': 'SKIERG',
    'bike': 'BIKEERG',
    'bikerg': 'BIKEERG',
}

# Note: REST_COLOR imported as TEAL from base_template

# Standard test distances where TOTAL TIME is the hero
TEST_DISTANCES = {500, 1000, 2000, 5000, 6000}


# ─────────────────────────────────────────────
# Machine-Aware Helpers
# ─────────────────────────────────────────────

def _machine(data):
    return (data.get('rawMachineType') or data.get('machineType') or 'rower').lower()


def is_bike(data):
    return _machine(data) in ('bike', 'bikerg')


def pace_unit(data):
    return '/1000m' if is_bike(data) else '/500m'


def pace_unit_short(data):
    """Compact version for tight table columns"""
    return '/1Km' if is_bike(data) else '/500m'


def rate_label(data):
    return 'RPM' if is_bike(data) else 'SPM'


def machine_label(data):
    return MACHINE_LABELS.get(_machine(data), 'ERG')


# ─────────────────────────────────────────────
# Formatting
# ─────────────────────────────────────────────

def format_time_clean(seconds):
    """Format seconds, dropping unnecessary trailing .0"""
    if not seconds:
        return '--:--'
    seconds = float(seconds)
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = seconds % 60
    tenths = round((secs % 1) * 10)
    whole_secs = int(secs)

    if hrs > 0:
        if tenths == 0:
            return f"{hrs}:{mins:02d}:{whole_secs:02d}"
        return f"{hrs}:{mins:02d}:{secs:04.1f}"
    if tenths == 0:
        return f"{mins}:{whole_secs:02d}"
    return f"{mins}:{secs:04.1f}"


def format_pace(pace_tenths_per_500m, data):
    """Format pace for display, adjusting for machine type.
    DB stores tenths-per-500m for all machines.
    Bike displays per 1000m (multiply by 2).
    """
    if not pace_tenths_per_500m:
        return '--:--'
    tenths = pace_tenths_per_500m * 2 if is_bike(data) else pace_tenths_per_500m
    total_seconds = tenths / 10
    mins = int(total_seconds // 60)
    secs = total_seconds % 60
    return f"{mins}:{secs:04.1f}"


def format_rest_tenths(tenths):
    """Format rest time from tenths-of-seconds to clean string"""
    if not tenths:
        return None
    total_seconds = tenths / 10
    mins = int(total_seconds // 60)
    secs = int(total_seconds % 60)
    if mins > 0:
        return f"{mins}:{secs:02d}"
    return f":{secs:02d}"


def format_time_coach(seconds):
    """Format time in coach whiteboard style: 11:00→11', 1:30→1'30\", 0:45→45\".
    Used for titles — how coaches actually write intervals.
    """
    if not seconds:
        return '--'
    seconds = float(seconds)
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    if mins > 0 and secs == 0:
        return f"{mins}'"
    if mins > 0:
        return f"{mins}'{secs:02d}\""
    return f"{secs}\""


def format_rest_coach(tenths):
    """Format rest tenths in coach style: 600→1'r, 300→30\"r, 900→1'30\"r"""
    if not tenths:
        return None
    total_seconds = tenths / 10
    mins = int(total_seconds // 60)
    secs = int(total_seconds % 60)
    if mins > 0 and secs == 0:
        return f"{mins}'r"
    if mins > 0:
        return f"{mins}'{secs:02d}\"r"
    return f"{secs}\"r"


def format_distance(meters):
    """Format distance: 10,000 → '10K', 2000 → '2K', 500 → '500m'"""
    if not meters:
        return '--'
    if meters >= 1000 and meters % 1000 == 0:
        return f"{meters // 1000}K"
    return f"{meters:,}m"


def format_date(iso_date):
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        return dt.strftime('%b %d, %Y')
    except (ValueError, AttributeError):
        return iso_date or ''


# ─────────────────────────────────────────────
# Workout Classification
# ─────────────────────────────────────────────

def is_interval(data):
    return data.get('isInterval', False) or 'interval' in (data.get('workoutType') or '').lower()


def is_fixed_time_type(data):
    """Splits/intervals where TIME is the fixed dimension (distance varies)"""
    wt = data.get('workoutType', '')
    return wt in ('FixedTimeSplits', 'FixedTimeInterval')


def is_fixed_dist_type(data):
    """Splits/intervals where DISTANCE is the fixed dimension (time varies)"""
    wt = data.get('workoutType', '')
    return wt in ('FixedDistanceSplits', 'FixedDistanceInterval')


def has_uniform_rest(splits):
    """Check if all intervals have the same rest time.
    Excludes last interval's rest (PM5 records cooldown, not a real rest).
    """
    work_splits = splits[:-1] if len(splits) > 1 else splits
    rest_times = [s.get('restTime') for s in work_splits if s.get('restTime')]
    if not rest_times:
        return True, None
    if len(set(rest_times)) == 1:
        return True, rest_times[0]
    return False, None


def has_valuable_rest_data(splits):
    """Check if any interval has recovery HR worth showing"""
    return any(s.get('heartRateRest') for s in splits)


# ─────────────────────────────────────────────
# Title Builder
# ─────────────────────────────────────────────

def build_title(data):
    """Build concise workout title in coach whiteboard style.
    Machine type is shown separately on the card.
    Examples: "7x11' / 1'r", "1,169m", "5x2K / ~56\"r", "10'"
    """
    wtype = data.get('workoutType', '')
    splits = data.get('splits', [])
    distance = data.get('distanceM')
    duration = data.get('durationSeconds')

    # Check for inferred title from JustRow workouts
    is_just_row = wtype == 'JustRow' or wtype == 0
    inferred_pattern = data.get('inferredPattern', {})
    if is_just_row and inferred_pattern.get('inferredTitle'):
        return inferred_pattern['inferredTitle']

    # ── Interval workouts ──
    if is_interval(data) and splits:
        n = len(splits)

        if wtype == 'FixedDistanceInterval':
            distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
            if distances and len(set(distances)) == 1:
                d = distances[0]
                rest = _rest_label(splits)
                return f"{n}x{format_distance(d)}{rest}"

        if wtype == 'FixedTimeInterval':
            times = [s.get('timeSeconds') for s in splits if s.get('timeSeconds')]
            if times and len(set(int(t) for t in times)) == 1:
                t = format_time_coach(times[0])
                rest = _rest_label(splits)
                return f"{n}x{t}{rest}"

        if wtype in ('VariableInterval', 'VariableIntervalUndefinedRest'):
            distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
            if distances and len(set(distances)) == 1:
                d = distances[0]
                rest = _rest_label(splits, approx=True)
                return f"{n}x{format_distance(d)}{rest}"
            return f"{n} pieces"

        rest = _rest_label(splits)
        return f"{n} intervals{rest}"

    # ── Continuous pieces ──
    if wtype == 'FixedTimeSplits':
        return format_time_coach(duration)
    if wtype == 'FixedDistanceSplits':
        return format_distance(distance)
    if distance:
        return format_distance(distance)
    if duration:
        return format_time_coach(duration)
    return machine_label(data)


def _rest_label(splits, approx=False):
    """Build rest portion of title in coach style: ' / 1'r' or ' / ~56\"r'.
    Excludes last interval's rest (PM5 records cooldown, not a real rest).
    """
    work_splits = splits[:-1] if len(splits) > 1 else splits
    rest_times = [s.get('restTime') for s in work_splits if s.get('restTime')]
    if not rest_times:
        return ''
    if len(set(rest_times)) == 1:
        formatted = format_rest_coach(rest_times[0])
        if approx:
            return f" / ~{formatted}"
        return f" / {formatted}"
    # Variable rest — show approximate average
    avg_rest = sum(rest_times) / len(rest_times)
    return f" / ~{format_rest_coach(avg_rest)}"


# ─────────────────────────────────────────────
# Hero Metric Selection
# ─────────────────────────────────────────────

def get_hero(data):
    """Return (value_string, label_string) for the hero metric."""
    distance = data.get('distanceM')
    duration = data.get('durationSeconds')
    avg_pace_tenths = data.get('avgPaceTenths')
    avg_watts = data.get('avgWatts')
    wtype = data.get('workoutType', '')

    # Test distances: TOTAL TIME is king (only for continuous pieces, not intervals)
    if distance and distance in TEST_DISTANCES and not is_interval(data):
        return format_time_clean(duration), "TOTAL TIME"

    # Fixed-time intervals on bike: AVG WATTS (what bike athletes care about)
    if wtype == 'FixedTimeInterval' and is_bike(data) and avg_watts:
        return str(avg_watts), "AVG WATTS"

    # All other intervals: AVG SPLIT pace
    if is_interval(data):
        return format_pace(avg_pace_tenths, data), f"AVG SPLIT {pace_unit(data)}"

    # Continuous pieces: AVG PACE
    return format_pace(avg_pace_tenths, data), f"AVG PACE {pace_unit(data)}"


# ─────────────────────────────────────────────
# Splits / Intervals Table Header
# ─────────────────────────────────────────────

def build_table_header(data, splits):
    """Build descriptive section header like 'SPLITS (9 x 5:00)' or 'INTERVALS (7 x 11:00 / 1:00r)'"""
    n = len(splits)
    wtype = data.get('workoutType', '')

    if is_interval(data):
        # Fixed time intervals
        if wtype == 'FixedTimeInterval':
            times = [s.get('timeSeconds') for s in splits if s.get('timeSeconds')]
            if times and len(set(int(t) for t in times)) == 1:
                uniform, rest = has_uniform_rest(splits)
                rest_str = f" / {format_rest_tenths(rest)}r" if rest else ""
                return f"INTERVALS ({n} x {format_time_clean(times[0])}{rest_str})"

        # Fixed distance intervals
        if wtype == 'FixedDistanceInterval':
            distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
            if distances and len(set(distances)) == 1:
                uniform, rest = has_uniform_rest(splits)
                rest_str = f" / {format_rest_tenths(rest)}r" if rest else ""
                return f"INTERVALS ({n} x {format_distance(distances[0])}{rest_str})"

        # Variable
        return f"INTERVALS ({n} pieces)"

    # Continuous splits
    # Fixed time splits — show split duration
    if wtype in ('FixedTimeSplits', 'JustRow'):
        times = [s.get('timeSeconds') for s in splits if s.get('timeSeconds')]
        if times and len(set(int(t) for t in times)) == 1:
            return f"SPLITS ({n} x {format_time_clean(times[0])})"

    # Fixed distance splits
    if wtype == 'FixedDistanceSplits':
        distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
        if distances and len(set(distances)) == 1:
            return f"SPLITS ({n} x {format_distance(distances[0])})"

    return f"SPLITS ({n})"


# ─────────────────────────────────────────────
# Visual Helpers
# ─────────────────────────────────────────────

def compute_pace_stats(splits):
    paces = [s.get('paceTenths') for s in splits if s.get('paceTenths')]
    if not paces:
        return None, {}
    avg = sum(paces) / len(paces)
    devs = {}
    for i, s in enumerate(splits):
        p = s.get('paceTenths')
        if p and avg > 0:
            devs[i] = (p - avg) / avg
    return avg, devs


def draw_wave_pattern(ctx, width, height, color, opacity=0.08):
    ctx.save()
    ctx.set_source_rgba(*color, opacity)
    ctx.set_line_width(3)
    for i in range(5):
        y_base = height * 0.2 + (i * height * 0.15)
        amp = 80 + (i * 20)
        freq = 0.003 + (i * 0.0005)
        ctx.move_to(0, y_base)
        for x in range(0, width, 10):
            ctx.line_to(x, y_base + math.sin(x * freq) * amp)
        ctx.stroke()
    ctx.restore()


def draw_pace_dot(ctx, x, y, deviation, radius=8):
    if deviation is None:
        return
    if deviation < -0.005:
        ctx.set_source_rgba(*GOLD, 0.8)
    elif deviation > 0.005:
        ctx.set_source_rgba(*ROSE, 0.5)
    else:
        ctx.set_source_rgba(*TEXT_MUTED, 0.4)
    ctx.arc(x, y, radius, 0, 2 * math.pi)
    ctx.fill()


# ─────────────────────────────────────────────
# Table Row Renderers
# ─────────────────────────────────────────────

def get_table_columns(data):
    """Return column definitions based on workout type.
    Each column: (key, header_label, width_weight, align, format_fn)
    Columns are laid out proportionally across the available width.
    """
    wtype = data.get('workoutType', '')
    pu = pace_unit_short(data)
    rl = rate_label(data).lower()
    bike = is_bike(data)

    # Column key → (header, format_fn)
    def fmt_dist(s):
        d = s.get('distanceM')
        return f"{d:,}m" if d else '--'
    def fmt_time(s):
        return format_time_clean(s.get('timeSeconds'))
    def fmt_pace(s):
        return format_pace(s.get('paceTenths'), data)
    def fmt_watts(s):
        w = s.get('watts')
        return f"{w}" if w else '--'
    def fmt_rate(s):
        sr = s.get('strokeRate')
        return f"{sr}" if sr is not None else '--'
    def fmt_hr(s):
        hr = s.get('heartRate')
        return f"{hr}" if hr is not None else '--'

    pace_hdr = f'PACE ({pu})'

    if is_fixed_time_type(data):
        # Time is fixed → distance varies, no time column
        return [
            ('dist', 'DIST', fmt_dist, 'left'),
            ('pace', pace_hdr, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    elif is_fixed_dist_type(data):
        # Distance is fixed → time varies, no distance column
        return [
            ('time', 'TIME', fmt_time, 'left'),
            ('pace', pace_hdr, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    elif wtype in ('VariableInterval', 'VariableIntervalUndefinedRest'):
        # Everything varies
        return [
            ('dist', 'DIST', fmt_dist, 'left'),
            ('time', 'TIME', fmt_time, 'left'),
            ('pace', pace_hdr, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    else:
        # JustRow — pace is primary, show all
        return [
            ('pace', pace_hdr, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]


def draw_table_header(ctx, columns, col_positions, y, width):
    """Draw column headers for the data table (raised from 24px to 40px)."""
    # #N header
    draw_text(ctx, "#", "IBM Plex Sans", 40,
              col_positions[0][0] - 80, y, TEXT_MUTED, weight='SemiBold', align='left')

    for i, (key, header, fmt_fn, align) in enumerate(columns):
        x = col_positions[i][0]
        draw_text(ctx, header, "IBM Plex Sans", 40,
                  x, y, TEXT_MUTED, weight='SemiBold', align=align)

    # Subtle divider line below headers
    ctx.set_source_rgba(*TEXT_MUTED, 0.2)
    ctx.rectangle(col_positions[0][0] - 90, y + 38, width - 2 * (col_positions[0][0] - 90), 1)
    ctx.fill()

    return y + 52


def draw_data_row(ctx, split, i, data, columns, col_positions, pace_devs, y):
    """Draw a single data row (interval or split). Returns new y position."""
    return draw_data_row_dynamic(ctx, split, i, data, columns, col_positions, pace_devs, y, 30, 66)


def draw_data_row_dynamic(ctx, split, i, data, columns, col_positions, pace_devs, y, font_size, row_h):
    """Draw a single data row with dynamic font size, row height, and column-specific colors."""
    split_num = split.get('splitNumber', i + 1)

    # Pace dot
    dev = pace_devs.get(i)
    if dev is not None:
        draw_pace_dot(ctx, col_positions[0][0] - 100, y + font_size * 0.5, dev)

    # #N
    draw_text(ctx, f"{split_num}", "IBM Plex Mono", font_size,
              col_positions[0][0] - 80, y, TEXT_SECONDARY, weight='SemiBold', align='left')

    # Data columns with color coding
    for ci, (key, header, fmt_fn, align) in enumerate(columns):
        x = col_positions[ci][0]
        val = fmt_fn(split)

        # Determine color based on column type
        if ci == 0:
            # First column always white bold
            color = TEXT_PRIMARY
            weight = 'Bold'
            size_adjust = 2
        elif key == 'watts':
            color = GOLD
            weight = 'SemiBold'
            size_adjust = 0
        elif key == 'hr':
            color = ROSE
            weight = 'SemiBold'
            size_adjust = 0
        elif key == 'rate':
            color = TEAL
            weight = 'SemiBold'
            size_adjust = 0
        elif key == 'pace':
            color = TEXT_PRIMARY
            weight = 'Regular'
            size_adjust = 0
        else:
            color = TEXT_SECONDARY
            weight = 'Regular'
            size_adjust = 0

        draw_text(ctx, val, "IBM Plex Mono", font_size + size_adjust,
                  x, y, color, weight=weight, align=align)

    return y + row_h


def draw_rest_row(ctx, split, col_positions, width, y):
    """Draw a rest row with recovery data (raised font from 22px to 32px, TEAL color). Returns new y position."""
    rest_time = split.get('restTime')
    rest_hr = split.get('heartRateRest')
    rest_dist = split.get('restDistance')

    parts = []
    if rest_time:
        parts.append(f"rest {format_rest_tenths(rest_time)}")
    if rest_dist:
        parts.append(f"{rest_dist}m")
    if rest_hr:
        parts.append(f"HR {rest_hr}")
        hr_ending = split.get('heartRateEnding')
        if hr_ending and rest_hr:
            delta = hr_ending - rest_hr
            if delta > 0:
                parts.append(f"(\u2193{delta})")

    if not parts:
        return y + 8

    left_edge = col_positions[0][0] - 80
    draw_text(ctx, "  ".join(parts), "IBM Plex Sans", 32,
              left_edge, y, TEAL, weight='Regular', align='left')
    return y + 44


# ─────────────────────────────────────────────
# Main Renderer
# ─────────────────────────────────────────────

def render_erg_summary_alt(format_key, workout_data, options):
    width, height = DIMENSIONS[format_key]
    is_story = format_key == '9:16'

    surface, ctx = setup_canvas(width, height)

    # ── Background ──
    import cairocffi as cairo
    gradient = cairo.LinearGradient(0, 0, width, height)
    gradient.add_color_stop_rgb(0, 0.03, 0.03, 0.04)
    gradient.add_color_stop_rgb(0.5, 0.08, 0.06, 0.08)
    gradient.add_color_stop_rgb(1, 0.12, 0.08, 0.06)
    ctx.set_source(gradient)
    ctx.rectangle(0, 0, width, height)
    ctx.fill()

    # Warmer background glow behind data area
    radial_bg = cairo.RadialGradient(width / 2, height * 0.4, 0, width / 2, height * 0.4, width * 0.6)
    radial_bg.add_color_stop_rgba(0, 0.12, 0.09, 0.07, 0.15)  # Warmer center
    radial_bg.add_color_stop_rgba(1, 0.03, 0.03, 0.04, 0)     # Fade to edges
    ctx.set_source(radial_bg)
    ctx.paint()

    draw_wave_pattern(ctx, width, height, GOLD, opacity=0.06)

    # ── Extract data ──
    splits = workout_data.get('splits', [])
    distance_m = workout_data.get('distanceM')
    duration_sec = workout_data.get('durationSeconds')
    avg_watts = workout_data.get('avgWatts')
    avg_hr = workout_data.get('avgHeartRate')
    stroke_rate = workout_data.get('strokeRate')
    calories = workout_data.get('calories')
    drag_factor = workout_data.get('dragFactor')
    intervals = is_interval(workout_data)
    avg_pace_tenths = workout_data.get('avgPaceTenths')

    _, pace_devs = compute_pace_stats(splits)

    # ── Date + Machine Label ──
    date_str = format_date(workout_data.get('date', ''))
    mlabel = machine_label(workout_data)
    draw_text(ctx, date_str, "IBM Plex Sans", 36,
              120, 140, TEXT_MUTED, weight='Regular', align='left')
    draw_text(ctx, mlabel, "IBM Plex Sans", 36,
              width - 120, 140, TEXT_MUTED, weight='SemiBold', align='right')

    # ── Hero: Workout Title (no machine type) ──
    title = build_title(workout_data)

    # Auto-size based on title length (raised minimum from 80px to 100px)
    title_len = len(title)
    if title_len <= 12:
        hero_font_size = 200
    elif title_len <= 18:
        hero_font_size = 160
    elif title_len <= 24:
        hero_font_size = 120
    else:
        hero_font_size = 100

    # Calculate hero section dimensions for panel background
    hero_y = 300
    metrics_y = hero_y + int(hero_font_size * 1.5)

    # Draw subtle panel background behind hero section
    panel_padding = 80
    panel_y = hero_y - 60
    panel_height = metrics_y - panel_y + 320  # Covers hero + summary stats
    draw_rounded_rect(ctx, panel_padding, panel_y, width - 2 * panel_padding, panel_height, 24)
    ctx.set_source_rgba(*SLATE, 0.3)
    ctx.fill()

    # Draw hero title
    draw_text(ctx, title, "IBM Plex Sans", hero_font_size,
              width / 2, hero_y, TEXT_PRIMARY, weight='Bold', align='center')

    # ── Secondary Metrics — 2x2 grid ──
    rl = rate_label(workout_data)

    # Build 4 summary stats — hero metric first, then complementary stats
    stats = []
    hero_value, hero_label = get_hero(workout_data)
    hero_is_watts = 'WATTS' in hero_label.upper()
    stats.append((hero_value, hero_label))

    if not hero_is_watts and avg_watts is not None:
        stats.append((str(avg_watts), "WATTS"))
    elif hero_is_watts and avg_pace_tenths:
        stats.append((format_pace(avg_pace_tenths, workout_data), f"AVG PACE {pace_unit(workout_data)}"))
    elif duration_sec:
        stats.append((format_time_clean(duration_sec), "TOTAL TIME"))

    if stroke_rate is not None:
        stats.append((str(stroke_rate), rl))
    if avg_hr is not None:
        stats.append((str(avg_hr), "AVG HR"))

    # Draw as 2x2 grid (raised stat values to 72px, labels to 36px)
    stat_font = 72
    stat_gap = 140
    if len(stats) >= 4:
        positions = [
            (240, metrics_y, 'left'),
            (width - 240, metrics_y, 'right'),
            (240, metrics_y + stat_gap, 'left'),
            (width - 240, metrics_y + stat_gap, 'right'),
        ]
    else:
        positions = [(240 + i * 480, metrics_y, 'left') for i in range(len(stats))]

    for i, (val, lbl) in enumerate(stats[:4]):
        if i < len(positions):
            x, y, align = positions[i]
            color = GOLD if i % 2 == 0 else ROSE
            draw_text(ctx, val, "IBM Plex Mono", stat_font,
                      x, y, color, weight='Bold', align=align)
            draw_text(ctx, lbl, "IBM Plex Sans", 36,
                      x, y + 90, TEXT_MUTED, weight='SemiBold', align=align)

    # ── Splits / Intervals Table or Extended Summary ──
    if splits:
        # Determine how much vertical space the header section used
        stats_rows = 2 if len(stats) >= 4 else 1
        table_start_y = metrics_y + stats_rows * stat_gap + 100

        # Enhanced gradient accent bar (wider, thicker, GOLD→COPPER gradient)
        bar_w = int(width * 0.8)  # 80% of card width
        bar_h = 6  # 6px height
        draw_gradient_rect(ctx, (width - bar_w) / 2, table_start_y, bar_w, bar_h, GOLD, COPPER, direction='horizontal')

        # Detect short workouts (1-3 splits, JustRow or FixedTimeSplits)
        wtype = workout_data.get('workoutType', '')
        is_short_workout = len(splits) <= 3 and wtype in ('JustRow', 'FixedTimeSplits')

        if is_short_workout:
            # Extended summary layout for short workouts (no table)
            summary_y = table_start_y + 80
            draw_text(ctx, "WORKOUT SUMMARY", "IBM Plex Sans", 40,
                      width / 2, summary_y, TEXT_PRIMARY, weight='Bold', align='center')

            # 6-8 stat summary in 2-column grid
            extended_stats = []
            if distance_m:
                extended_stats.append(("Total Distance", f"{distance_m:,}m"))
            if duration_sec:
                extended_stats.append(("Total Time", format_time_clean(duration_sec)))
            if avg_pace_tenths:
                extended_stats.append(("Avg Pace", f"{format_pace(avg_pace_tenths, workout_data)} {pace_unit(workout_data)}"))
            if avg_watts:
                extended_stats.append(("Avg Watts", str(avg_watts)))
            if stroke_rate:
                extended_stats.append(("Avg " + rate_label(workout_data), str(stroke_rate)))
            if avg_hr:
                extended_stats.append(("Avg Heart Rate", str(avg_hr)))
            if calories:
                extended_stats.append(("Calories", str(calories)))
            if drag_factor:
                extended_stats.append(("Drag Factor", str(drag_factor)))

            # Draw in 2-column layout
            col_y = summary_y + 80
            col_gap = 180
            row_height = 120
            left_x = 300
            right_x = width - 300

            for i, (label, value) in enumerate(extended_stats):
                if i % 2 == 0:
                    x, align = left_x, 'left'
                else:
                    x, align = right_x, 'right'

                draw_text(ctx, value, "IBM Plex Mono", 64,
                          x, col_y, GOLD if i % 4 < 2 else ROSE, weight='Bold', align=align)
                draw_text(ctx, label, "IBM Plex Sans", 36,
                          x, col_y + 80, TEXT_SECONDARY, weight='SemiBold', align=align)

                if i % 2 == 1:
                    col_y += row_height

            # Optional: inline splits as descriptive line
            if len(splits) > 1:
                splits_text = "Splits: " + " | ".join([format_pace(s.get('paceTenths'), workout_data) for s in splits if s.get('paceTenths')])
                col_y += 60
                draw_text(ctx, splits_text, "IBM Plex Mono", 40,
                          width / 2, col_y, TEXT_MUTED, weight='Regular', align='center')

        else:
            # Standard table layout for longer workouts
            # Section header with pattern description (raised from 30px to 40px)
            header_text = build_table_header(workout_data, splits)
            header_y = table_start_y + 50
            draw_text(ctx, header_text, "IBM Plex Sans", 40,
                      width / 2, header_y, TEXT_PRIMARY, weight='Bold', align='center')

            # Decide rest row strategy for intervals
            uniform_rest, uniform_rest_val = has_uniform_rest(splits)
            show_rest_rows = intervals and (not uniform_rest or has_valuable_rest_data(splits))

            # Set up column positions with symmetric margins and near-equal widths
            columns = get_table_columns(workout_data)
            margin = 160  # Symmetric margins (was asymmetric 140)
            table_width = width - 2 * margin
            n_cols = len(columns)

            # Near-equal width distribution: first column gets 1.3x weight, others get 1x
            weights = [1.3] + [1.0] * (n_cols - 1)
            total_weight = sum(weights)
            col_widths = [(table_width / total_weight) * w for w in weights]

            col_positions = []
            cx = margin
            for ci, (key, header, fmt_fn, align) in enumerate(columns):
                if align == 'right':
                    col_positions.append((cx + col_widths[ci] - 10,))
                else:
                    col_positions.append((cx,))
                cx += col_widths[ci]

            # Column headers
            col_header_y = header_y + 60
            cy = draw_table_header(ctx, columns, col_positions, col_header_y, width)

            # ── Dynamic sizing: scale row height to fill available space ──
            branding_reserve = 220  # athlete name + branding at bottom
            avail_height = height - cy - branding_reserve

            # Estimate total rows needed (data rows + rest rows)
            n_data_rows = len(splits)
            n_rest_rows = 0
            if intervals and show_rest_rows:
                n_rest_rows = max(0, n_data_rows - 1)  # no rest after last

            # Calculate ideal row height to fill space
            total_content_units = n_data_rows + n_rest_rows * 0.5  # rest rows are ~half height
            if total_content_units > 0:
                ideal_row_h = avail_height / total_content_units
            else:
                ideal_row_h = 80

            # Clamp row height between reasonable bounds (raised minimums)
            data_row_h = max(75, min(120, int(ideal_row_h)))
            rest_row_h = max(40, min(60, int(ideal_row_h * 0.5)))

            # Scale font size with row height (raised minimum from 28px to 44px, max from 42px to 52px)
            data_font = max(44, min(52, int(data_row_h * 0.42)))

            # Check if all splits fit
            total_h = n_data_rows * data_row_h + n_rest_rows * rest_row_h
            if total_h > avail_height:
                # Too many rows — shrink to fit or truncate (raised minimums)
                scale = avail_height / total_h
                data_row_h = max(60, int(data_row_h * scale))
                rest_row_h = max(32, int(rest_row_h * scale))
                data_font = max(44, int(data_font * scale))

            max_rows = max(1, int(avail_height / (data_row_h + (rest_row_h if show_rest_rows else 8))))
            show = splits[:max_rows]
            truncated = len(splits) > max_rows

            is_last_interval_in_workout = lambda idx: idx == len(splits) - 1
            for i, s in enumerate(show):
                cy = draw_data_row_dynamic(ctx, s, i, workout_data, columns, col_positions,
                                           pace_devs, cy, data_font, data_row_h)
                if intervals and show_rest_rows and not is_last_interval_in_workout(i):
                    cy = draw_rest_row(ctx, s, col_positions, width, cy)
                    cy += rest_row_h - 44  # adjust for rest_row's own 44px
                elif intervals:
                    cy += max(4, data_row_h - data_font * 2)

            if truncated:
                remaining = len(splits) - max_rows
                word = "interval" if intervals else "split"
                draw_text(ctx, f"+ {remaining} more {word}{'s' if remaining != 1 else ''}",
                          "IBM Plex Sans", 36,
                          width / 2, cy + 10, TEXT_MUTED, weight='Regular', align='center')

    # ── Athlete Name (raised from 44px to 54px) ──
    if options.get('showName', True):
        athlete = workout_data.get('athlete')
        if athlete:
            name = f"{athlete.get('firstName', '')} {athlete.get('lastName', '')}".strip()
        else:
            name = options.get('athleteName', 'Athlete')

        name_y = height - 200
        nw, nh = draw_text(ctx, name, "IBM Plex Sans", 54,
                           width / 2, name_y, TEXT_SECONDARY, weight='SemiBold', align='center')
        ctx.set_source_rgba(*GOLD, 0.4)
        ctx.rectangle((width - nw - 40) / 2, name_y + nh + 20, nw + 40, 3)
        ctx.fill()

    # ── Decorative Elements ──
    radial = cairo.RadialGradient(width - 200, height - 200, 0, width - 200, height - 200, 300)
    radial.add_color_stop_rgba(0, *ROSE, 0.08)
    radial.add_color_stop_rgba(1, *ROSE, 0)
    ctx.set_source(radial)
    ctx.arc(width - 200, height - 200, 300, 0, 2 * math.pi)
    ctx.fill()

    ctx.set_source_rgba(*GOLD, 0.3)
    ctx.arc(width - 140, 100, 40, 0, 2 * math.pi)
    ctx.fill()

    draw_grain_texture(ctx, width, height, opacity=0.03)
    draw_oarbit_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)
