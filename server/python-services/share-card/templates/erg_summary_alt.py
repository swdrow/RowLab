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
    draw_rounded_rect, draw_grain_texture, draw_rowlab_branding,
    surface_to_png_bytes, hex_to_rgb,
    DARK_BG, GOLD, ROSE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED
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

# Muted teal for rest rows
REST_COLOR = (0.4, 0.6, 0.65)

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


def format_distance(meters):
    """Format distance: 10,000 → '10K', 2000 → '2,000m'"""
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
    """Build title in rower language: '7x11:00/1:00r BIKEERG', '10K DYNAMIC', etc."""
    wtype = data.get('workoutType', '')
    mlabel = machine_label(data)
    splits = data.get('splits', [])
    distance = data.get('distanceM')
    duration = data.get('durationSeconds')

    # ── Interval workouts ──
    if is_interval(data) and splits:
        n = len(splits)

        # Fixed-distance intervals: "5x2000m/1:00r ERG"
        if wtype == 'FixedDistanceInterval':
            distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
            if distances and len(set(distances)) == 1:
                d = distances[0]
                rest = _rest_label(splits)
                return f"{n}x{format_distance(d)}{rest} {mlabel}"

        # Fixed-time intervals: "7x11:00/1:00r BIKEERG"
        if wtype == 'FixedTimeInterval':
            times = [s.get('timeSeconds') for s in splits if s.get('timeSeconds')]
            if times and len(set(int(t) for t in times)) == 1:
                t = format_time_clean(times[0])
                rest = _rest_label(splits)
                return f"{n}x{t}{rest} {mlabel}"

        # Variable intervals with same distance: "5x2000m/~1:00r DYNAMIC"
        if wtype in ('VariableInterval', 'VariableIntervalUndefinedRest'):
            distances = [s.get('distanceM') for s in splits if s.get('distanceM')]
            if distances and len(set(distances)) == 1:
                d = distances[0]
                rest = _rest_label(splits, approx=True)
                return f"{n}x{format_distance(d)}{rest} {mlabel}"
            # Mixed distances
            return f"{n} pieces {mlabel}"

        # Fallback for unknown interval type
        rest = _rest_label(splits)
        return f"{n} intervals{rest} {mlabel}"

    # ── Continuous pieces ──

    # FixedTimeSplits: show total time "10:00 DYNAMIC"
    if wtype == 'FixedTimeSplits':
        return f"{format_time_clean(duration)} {mlabel}"

    # FixedDistanceSplits: show total distance "6K ERG"
    if wtype == 'FixedDistanceSplits':
        return f"{format_distance(distance)} {mlabel}"

    # JustRow: show distance
    if distance:
        return f"{format_distance(distance)} {mlabel}"

    # Fallback
    if duration:
        return f"{format_time_clean(duration)} {mlabel}"
    return mlabel


def _rest_label(splits, approx=False):
    """Build rest portion of title like '/1:00r' or '/~1:00r'.
    Excludes last interval's rest (PM5 records cooldown, not a real rest).
    """
    # Exclude last interval's rest — there's no rest after the final piece
    work_splits = splits[:-1] if len(splits) > 1 else splits
    rest_times = [s.get('restTime') for s in work_splits if s.get('restTime')]
    if not rest_times:
        return ''
    if len(set(rest_times)) == 1:
        prefix = '/~' if approx else '/'
        return f"{prefix}{format_rest_tenths(rest_times[0])}r"
    # Variable rest — show approximate average
    avg_rest = sum(rest_times) / len(rest_times)
    return f"/~{format_rest_tenths(avg_rest)}r"


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

    pace_header = f'PACE {pu}'

    if is_fixed_time_type(data):
        # Time is fixed → distance varies, no time column
        return [
            ('dist', 'DIST', fmt_dist, 'left'),
            ('pace', pace_header, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    elif is_fixed_dist_type(data):
        # Distance is fixed → time varies, no distance column
        return [
            ('time', 'TIME', fmt_time, 'left'),
            ('pace', pace_header, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    elif wtype in ('VariableInterval', 'VariableIntervalUndefinedRest'):
        # Everything varies
        return [
            ('dist', 'DIST', fmt_dist, 'left'),
            ('time', 'TIME', fmt_time, 'left'),
            ('pace', pace_header, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]
    else:
        # JustRow — pace is primary, show all
        return [
            ('pace', pace_header, fmt_pace, 'left'),
            ('watts', 'WATTS', fmt_watts, 'right'),
            ('rate', rl.upper(), fmt_rate, 'right'),
            ('hr', 'HR', fmt_hr, 'right'),
        ]


def draw_table_header(ctx, columns, col_positions, y, width):
    """Draw column headers for the data table."""
    # #N header
    draw_text(ctx, "#", "IBM Plex Sans", 24,
              col_positions[0][0] - 80, y, TEXT_MUTED, weight='SemiBold', align='left')

    for i, (key, header, fmt_fn, align) in enumerate(columns):
        x = col_positions[i][0]
        draw_text(ctx, header, "IBM Plex Sans", 24,
                  x, y, TEXT_MUTED, weight='SemiBold', align=align)

    # Subtle divider line below headers
    ctx.set_source_rgba(*TEXT_MUTED, 0.2)
    ctx.rectangle(col_positions[0][0] - 90, y + 38, width - 2 * (col_positions[0][0] - 90), 1)
    ctx.fill()

    return y + 52


def draw_data_row(ctx, split, i, data, columns, col_positions, pace_devs, y):
    """Draw a single data row (interval or split). Returns new y position."""
    split_num = split.get('splitNumber', i + 1)
    FONT_SIZE = 30

    # Pace dot
    dev = pace_devs.get(i)
    if dev is not None:
        draw_pace_dot(ctx, col_positions[0][0] - 100, y + 14, dev)

    # #N
    draw_text(ctx, f"{split_num}", "IBM Plex Mono", FONT_SIZE,
              col_positions[0][0] - 80, y, TEXT_SECONDARY, weight='SemiBold', align='left')

    # Data columns
    for ci, (key, header, fmt_fn, align) in enumerate(columns):
        x = col_positions[ci][0]
        val = fmt_fn(split)
        # First column is bold primary, rest are secondary
        if ci == 0:
            draw_text(ctx, val, "IBM Plex Mono", FONT_SIZE + 2,
                      x, y, TEXT_PRIMARY, weight='Bold', align=align)
        elif key == 'watts':
            draw_text(ctx, val, "IBM Plex Mono", FONT_SIZE,
                      x, y, GOLD, weight='SemiBold', align=align)
        else:
            draw_text(ctx, val, "IBM Plex Mono", FONT_SIZE,
                      x, y, TEXT_SECONDARY, weight='Regular', align=align)

    return y + 66


def draw_rest_row(ctx, split, col_positions, width, y):
    """Draw a rest row with recovery data. Returns new y position."""
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
    draw_text(ctx, "  ".join(parts), "IBM Plex Sans", 22,
              left_edge, y, REST_COLOR, weight='Regular', align='left')
    return y + 36


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

    title = build_title(workout_data)
    date_str = format_date(workout_data.get('date', ''))
    rl = rate_label(workout_data)

    if intervals and splits:
        # ═══════════════════════════════════════════
        # INTERVAL LAYOUT: Title IS the hero → summary → table
        # ═══════════════════════════════════════════

        # Big title — the workout description is what matters
        title_x = 120
        title_y = 120
        draw_text(ctx, title, "IBM Plex Sans", 90,
                  title_x, title_y, TEXT_PRIMARY, weight='Bold', align='left')
        draw_text(ctx, date_str, "IBM Plex Sans", 28,
                  title_x, title_y + 120, TEXT_MUTED, weight='Regular', align='left')

        # Summary row — like PM5's totals line
        summary_y = title_y + 200
        summary_parts = []
        if duration_sec:
            summary_parts.append((format_time_clean(duration_sec), "TIME"))
        if distance_m:
            summary_parts.append((f"{distance_m:,}m", "DIST"))
        if avg_pace_tenths:
            summary_parts.append((format_pace(avg_pace_tenths, workout_data), f"PACE {pace_unit(workout_data)}"))
        if avg_watts:
            summary_parts.append((str(avg_watts), "WATTS"))
        if stroke_rate is not None:
            summary_parts.append((str(stroke_rate), rl))
        if avg_hr:
            summary_parts.append((str(avg_hr), "HR"))

        # Draw summary as evenly-spaced horizontal row
        n_parts = min(len(summary_parts), 6)
        if n_parts > 0:
            margin_s = 120
            spacing = (width - 2 * margin_s) / n_parts
            for si, (val, lbl) in enumerate(summary_parts[:n_parts]):
                sx = margin_s + si * spacing + spacing / 2
                draw_text(ctx, val, "IBM Plex Mono", 48,
                          sx, summary_y, GOLD, weight='Bold', align='center')
                draw_text(ctx, lbl, "IBM Plex Sans", 20,
                          sx, summary_y + 60, TEXT_MUTED, weight='SemiBold', align='center')

        # Gold divider
        divider_y = summary_y + 110
        ctx.set_source_rgba(*GOLD, 0.3)
        ctx.rectangle(120, divider_y, width - 240, 2)
        ctx.fill()

        table_y = divider_y + 10

    else:
        # ═══════════════════════════════════════════
        # CONTINUOUS LAYOUT: Title + Hero pace + secondary stats
        # ═══════════════════════════════════════════

        title_x = 120
        title_y = 140
        draw_text(ctx, title, "IBM Plex Sans", 72,
                  title_x, title_y, TEXT_PRIMARY, weight='Bold', align='left')
        draw_text(ctx, date_str, "IBM Plex Sans", 28,
                  title_x, title_y + 100, TEXT_MUTED, weight='Regular', align='left')

        # Hero metric (pace)
        hero_y = 380
        hero_value, hero_label = get_hero(workout_data)
        draw_text(ctx, hero_value, "IBM Plex Mono", 160,
                  width / 2, hero_y, TEXT_PRIMARY, weight='Bold', align='center')
        draw_text(ctx, hero_label, "IBM Plex Sans", 30,
                  width / 2, hero_y + 195, ROSE, weight='Bold', align='center')

        # Secondary metrics — 2x2 grid
        metrics_y = hero_y + 280
        stats = []
        if avg_watts is not None:
            stats.append((str(avg_watts), "WATTS"))
        elif duration_sec:
            stats.append((format_time_clean(duration_sec), "TOTAL TIME"))
        if stroke_rate is not None:
            stats.append((str(stroke_rate), rl))
        if avg_hr is not None:
            stats.append((str(avg_hr), "AVG HR"))
        if distance_m is not None:
            stats.append((f"{distance_m:,}m", "DISTANCE"))

        if len(stats) >= 4:
            positions = [
                (240, metrics_y, 'left'),
                (width - 240, metrics_y, 'right'),
                (240, metrics_y + 120, 'left'),
                (width - 240, metrics_y + 120, 'right'),
            ]
        else:
            positions = [(240 + i * 480, metrics_y, 'left') for i in range(len(stats))]

        for i, (val, lbl) in enumerate(stats[:4]):
            if i < len(positions):
                x, y, align = positions[i]
                color = GOLD if i % 2 == 0 else ROSE
                draw_text(ctx, val, "IBM Plex Mono", 56,
                          x, y, color, weight='Bold', align=align)
                draw_text(ctx, lbl, "IBM Plex Sans", 22,
                          x, y + 70, TEXT_MUTED, weight='SemiBold', align=align)

        table_y = metrics_y + 280

    # ── Splits / Intervals Table ──
    if splits:

        # Gold accent bar
        bar_w = 200
        ctx.set_source_rgb(*GOLD)
        ctx.rectangle((width - bar_w) / 2, table_y, bar_w, 3)
        ctx.fill()

        # Section header with pattern description
        header_text = build_table_header(workout_data, splits)
        header_y = table_y + 50
        draw_text(ctx, header_text, "IBM Plex Sans", 30,
                  width / 2, header_y, TEXT_PRIMARY, weight='Bold', align='center')

        # Decide rest row strategy for intervals
        uniform_rest, uniform_rest_val = has_uniform_rest(splits)
        show_rest_rows = intervals and (not uniform_rest or has_valuable_rest_data(splits))

        # Set up column positions
        columns = get_table_columns(workout_data)
        margin = 180
        table_width = width - 2 * margin
        n_cols = len(columns)

        # Distribute columns: first col gets more space, rest equal
        if n_cols <= 4:
            col_widths = [table_width * 0.32] + [table_width * 0.68 / (n_cols - 1)] * (n_cols - 1)
        else:
            col_widths = [table_width * 0.22, table_width * 0.18] + \
                         [table_width * 0.60 / (n_cols - 2)] * (n_cols - 2)

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

        # Calculate available space and max rows
        avail = height - cy - 180
        if intervals and show_rest_rows:
            row_h = 66 + 36  # data + rest
        elif intervals:
            row_h = 66 + 8
        else:
            row_h = 66 + 8
        max_rows = max(1, int(avail / row_h))
        show = splits[:max_rows]
        truncated = len(splits) > max_rows

        is_last_interval_in_workout = lambda idx: idx == len(splits) - 1
        for i, s in enumerate(show):
            cy = draw_data_row(ctx, s, i, workout_data, columns, col_positions, pace_devs, cy)
            # Rest rows for intervals (skip last interval's rest)
            if intervals and show_rest_rows and not is_last_interval_in_workout(i):
                cy = draw_rest_row(ctx, s, col_positions, width, cy)
            elif intervals:
                cy += 8

        if truncated:
            remaining = len(splits) - max_rows
            word = "interval" if intervals else "split"
            draw_text(ctx, f"+ {remaining} more {word}{'s' if remaining != 1 else ''}",
                      "IBM Plex Sans", 26,
                      width / 2, cy + 10, TEXT_MUTED, weight='Regular', align='center')

    # ── Athlete Name ──
    if options.get('showName', True):
        athlete = workout_data.get('athlete')
        if athlete:
            name = f"{athlete.get('firstName', '')} {athlete.get('lastName', '')}".strip()
        else:
            name = options.get('athleteName', 'Athlete')

        name_y = height - 200
        nw, nh = draw_text(ctx, name, "IBM Plex Sans", 44,
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
    draw_rowlab_branding(ctx, width, height, format_key, options)

    return surface_to_png_bytes(surface)
