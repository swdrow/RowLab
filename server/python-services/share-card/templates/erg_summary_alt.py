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

def draw_interval_row(ctx, split, i, data, pace_devs, width, y):
    """Draw a single interval work row. Returns new y position."""
    wtype = data.get('workoutType', '')
    split_num = split.get('splitNumber', i + 1)

    # Pace dot
    dev = pace_devs.get(i)
    if dev is not None:
        draw_pace_dot(ctx, 160, y + 18, dev)

    # #N
    draw_text(ctx, f"#{split_num}", "IBM Plex Mono", 36,
              190, y, TEXT_SECONDARY, weight='SemiBold', align='left')

    # Primary variable metric (what varies for this interval type)
    col_x = 320
    if is_fixed_time_type(data):
        # Time is fixed → show DISTANCE as primary
        dist = split.get('distanceM')
        draw_text(ctx, f"{dist:,}m" if dist else '--', "IBM Plex Mono", 38,
                  col_x, y, TEXT_PRIMARY, weight='Bold', align='left')
    elif is_fixed_dist_type(data):
        # Distance is fixed → show TIME as primary
        t = split.get('timeSeconds')
        draw_text(ctx, format_time_clean(t), "IBM Plex Mono", 38,
                  col_x, y, TEXT_PRIMARY, weight='Bold', align='left')
    else:
        # Variable: show both distance and time
        dist = split.get('distanceM')
        t = split.get('timeSeconds')
        draw_text(ctx, f"{dist:,}m" if dist else '--', "IBM Plex Mono", 34,
                  col_x, y, TEXT_PRIMARY, weight='Bold', align='left')
        draw_text(ctx, format_time_clean(t), "IBM Plex Mono", 26,
                  col_x + 240, y + 4, TEXT_MUTED, weight='Regular', align='left')

    # Pace
    pace_str = format_pace(split.get('paceTenths'), data)
    pu = pace_unit_short(data)
    draw_text(ctx, f"{pace_str}{pu}", "IBM Plex Mono", 30,
              width / 2 + 80, y, TEXT_SECONDARY, weight='SemiBold', align='left')

    # Watts (if available)
    w = split.get('watts')
    if w:
        draw_text(ctx, f"{w}w", "IBM Plex Mono", 30,
                  width - 420, y, GOLD, weight='SemiBold', align='right')

    # Rate + HR (right)
    sr = split.get('strokeRate')
    hr = split.get('heartRate')
    right_parts = []
    if sr is not None:
        right_parts.append(f"{sr}{rate_label(data).lower()}")
    if hr is not None:
        right_parts.append(f"{hr}bpm")
    if right_parts:
        draw_text(ctx, " / ".join(right_parts), "IBM Plex Mono", 24,
                  width - 160, y, TEXT_MUTED, weight='Regular', align='right')

    return y + 78


def draw_rest_row(ctx, split, width, y):
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
        return y + 10

    # Subtle separator line
    ctx.set_source_rgba(*REST_COLOR, 0.15)
    ctx.rectangle(220, y - 5, width - 440, 1)
    ctx.fill()

    draw_text(ctx, "  ".join(parts), "IBM Plex Sans", 22,
              width / 2, y, REST_COLOR, weight='Regular', align='center')
    return y + 42


def draw_split_row(ctx, split, i, data, pace_devs, width, y, is_story):
    """Draw a single continuous-piece split row. Returns new y position."""
    wtype = data.get('workoutType', '')
    split_num = split.get('splitNumber', i + 1)

    # Pace dot
    dev = pace_devs.get(i)
    if dev is not None:
        draw_pace_dot(ctx, 160, y + 18, dev)

    # #N
    draw_text(ctx, f"#{split_num}", "IBM Plex Mono", 36,
              190, y, TEXT_SECONDARY, weight='SemiBold', align='left')

    col_x = 320

    if is_fixed_time_type(data):
        # Time is fixed → show DISTANCE as the variable
        dist = split.get('distanceM')
        draw_text(ctx, f"{dist:,}m" if dist else '--', "IBM Plex Mono", 38,
                  col_x, y, TEXT_PRIMARY, weight='Bold', align='left')
    elif is_fixed_dist_type(data):
        # Distance is fixed → show TIME as the variable
        t = split.get('timeSeconds')
        draw_text(ctx, format_time_clean(t), "IBM Plex Mono", 38,
                  col_x, y, TEXT_PRIMARY, weight='Bold', align='left')
    else:
        # JustRow: pace is the primary metric — it's what rowers care about
        pass  # Pace shown below covers it

    # Pace with unit
    pace_str = format_pace(split.get('paceTenths'), data)
    pu = pace_unit_short(data)
    pace_x = width / 2 + 40 if is_fixed_time_type(data) or is_fixed_dist_type(data) else col_x
    pace_size = 30 if is_fixed_time_type(data) or is_fixed_dist_type(data) else 42
    pace_color = TEXT_SECONDARY if is_fixed_time_type(data) or is_fixed_dist_type(data) else TEXT_PRIMARY
    pace_weight = 'SemiBold' if is_fixed_time_type(data) or is_fixed_dist_type(data) else 'Bold'

    draw_text(ctx, f"{pace_str}{pu}", "IBM Plex Mono", pace_size,
              pace_x, y, pace_color, weight=pace_weight, align='left')

    # Watts
    w = split.get('watts')
    if w:
        draw_text(ctx, f"{w}w", "IBM Plex Mono", 30,
                  width - 420, y, GOLD, weight='SemiBold', align='right')

    # Rate + HR
    sr = split.get('strokeRate')
    hr = split.get('heartRate')
    right_parts = []
    if sr is not None:
        right_parts.append(f"{sr}{rate_label(data).lower()}")
    if hr is not None:
        right_parts.append(f"{hr}bpm")
    if right_parts:
        draw_text(ctx, " / ".join(right_parts), "IBM Plex Mono", 24,
                  width - 160, y, TEXT_MUTED, weight='Regular', align='right')

    return y + (85 if is_story else 88)


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

    # ── Title ──
    title_x = 120
    title_y = 140
    title = build_title(workout_data)
    draw_text(ctx, title, "IBM Plex Sans", 72,
              title_x, title_y, TEXT_PRIMARY, weight='Bold', align='left')

    date_str = format_date(workout_data.get('date', ''))
    draw_text(ctx, date_str, "IBM Plex Sans", 28,
              title_x, title_y + 100, TEXT_MUTED, weight='Regular', align='left')

    # ── Hero Metric ──
    hero_y = 400
    hero_value, hero_label = get_hero(workout_data)

    draw_text(ctx, hero_value, "IBM Plex Mono", 200,
              width / 2, hero_y, TEXT_PRIMARY, weight='Bold', align='center')
    draw_text(ctx, hero_label, "IBM Plex Sans", 32,
              width / 2, hero_y + 240, ROSE, weight='Bold', align='center')

    # ── Secondary Metrics ──
    metrics_y = hero_y + 240 + 140
    left_metrics = []
    right_metrics = []

    rl = rate_label(workout_data)

    # When hero is watts (bike time intervals), don't duplicate watts — show pace + rate instead
    hero_is_watts = (workout_data.get('workoutType') == 'FixedTimeInterval'
                     and is_bike(workout_data) and avg_watts)
    if hero_is_watts:
        left_metrics.append((format_pace(avg_pace_tenths, workout_data), f"AVG PACE {pace_unit(workout_data)}"))
        if stroke_rate is not None:
            left_metrics.append((str(stroke_rate), rl))
    elif avg_watts is not None:
        left_metrics.append((str(avg_watts), "WATTS"))
        if stroke_rate is not None:
            left_metrics.append((str(stroke_rate), rl))
    else:
        if stroke_rate is not None:
            left_metrics.append((str(stroke_rate), rl))
    if calories is not None and not left_metrics:
        left_metrics.append((str(calories), "CALORIES"))

    if avg_hr is not None:
        right_metrics.append((str(avg_hr), "AVG HR"))
    if distance_m is not None:
        right_metrics.append((f"{distance_m:,}m", "DISTANCE"))
    if drag_factor is not None and len(right_metrics) < 2:
        right_metrics.append((str(drag_factor), "DRAG FACTOR"))

    # Fallback if no watts (some short JustRows)
    if not left_metrics:
        left_metrics.append((format_time_clean(duration_sec) or '--:--', "TOTAL TIME"))
        if calories is not None:
            left_metrics.append((str(calories), "CALORIES"))

    left_x, right_x = 240, width - 240
    y_off = metrics_y
    for val, lbl in left_metrics:
        draw_text(ctx, val, "IBM Plex Mono", 72,
                  left_x, y_off, GOLD, weight='Bold', align='left')
        draw_text(ctx, lbl, "IBM Plex Sans", 24,
                  left_x, y_off + 90, TEXT_MUTED, weight='SemiBold', align='left')
        y_off += 200

    y_off = metrics_y
    for val, lbl in right_metrics:
        draw_text(ctx, val, "IBM Plex Mono", 72,
                  right_x, y_off, ROSE, weight='Bold', align='right')
        draw_text(ctx, lbl, "IBM Plex Sans", 24,
                  right_x, y_off + 90, TEXT_MUTED, weight='SemiBold', align='right')
        y_off += 200

    # ── Splits / Intervals Table ──
    if splits:
        table_y = max(y_off, metrics_y + 400) + 60

        # Gold accent bar
        bar_w = 200
        ctx.set_source_rgb(*GOLD)
        ctx.rectangle((width - bar_w) / 2, table_y, bar_w, 4)
        ctx.fill()

        # Section header with pattern description
        header_text = build_table_header(workout_data, splits)
        header_y = table_y + 60
        draw_text(ctx, header_text, "IBM Plex Sans", 32,
                  width / 2, header_y, TEXT_PRIMARY, weight='Bold', align='center')

        # Decide rest row strategy for intervals
        uniform_rest, uniform_rest_val = has_uniform_rest(splits)
        show_rest_rows = intervals and (not uniform_rest or has_valuable_rest_data(splits))

        # Calculate available space and max rows
        start_y = header_y + 90
        avail = height - start_y - 200
        if intervals and show_rest_rows:
            row_h = 78 + 42  # work + rest
        elif intervals:
            row_h = 78 + 12  # work + small gap
        else:
            row_h = 85 if is_story else 88
        max_rows = max(1, int(avail / row_h))
        show = splits[:max_rows]
        truncated = len(splits) > max_rows

        cy = start_y
        is_last_interval_in_workout = lambda idx: idx == len(splits) - 1
        for i, s in enumerate(show):
            if intervals:
                cy = draw_interval_row(ctx, s, i, workout_data, pace_devs, width, cy)
                # Skip rest row for the last interval (no real rest after final piece)
                if show_rest_rows and not is_last_interval_in_workout(i):
                    cy = draw_rest_row(ctx, s, width, cy)
                else:
                    cy += 12
            else:
                cy = draw_split_row(ctx, s, i, workout_data, pace_devs, width, cy, is_story)

        if truncated:
            remaining = len(splits) - max_rows
            word = "interval" if intervals else "split"
            draw_text(ctx, f"+ {remaining} more {word}{'s' if remaining != 1 else ''}",
                      "IBM Plex Sans", 28,
                      width / 2, cy + 20, TEXT_MUTED, weight='Regular', align='center')

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
