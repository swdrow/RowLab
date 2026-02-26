"""
oarbit Share Card Rendering Service
Flask microservice for generating share card images using Cairo+Pango
"""

import os
from flask import Flask, request, jsonify, send_file
from io import BytesIO
import traceback

# Import template modules
from templates.base_template import render_test_card
from templates.erg_summary import render_erg_summary
from templates.erg_summary_alt import render_erg_summary_alt
from templates.regatta_result import render_regatta_result
from templates.regatta_summary import render_regatta_summary
from templates.season_recap import render_season_recap
from templates.team_leaderboard import render_team_leaderboard

app = Flask(__name__)

# Supported card dimensions (width, height) at 2160px base
DIMENSIONS = {
    '1:1': (2160, 2160),      # Instagram square
    '9:16': (2160, 3840),     # Instagram/TikTok story
}

# Card renderer registry - maps cardType to renderer function
CARD_RENDERERS = {
    'test': render_test_card,
    'erg_summary': render_erg_summary,  # Design A - Evolved v5
    'erg_summary_alt': render_erg_summary_alt,  # Design B - Fresh Direction
    'regatta_result': render_regatta_result,  # Single race result
    'regatta_summary': render_regatta_summary,  # Full regatta summary
    'season_recap': render_season_recap,  # Spotify Wrapped style year-in-review
    'team_leaderboard': render_team_leaderboard,  # Team rankings snapshot
}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for container orchestration"""
    return jsonify({"status": "ok"}), 200


@app.route('/generate', methods=['POST'])
def generate_card():
    """
    Generate a share card image

    Request body:
    {
        "cardType": "workout-summary" | "interval-grid" | "splits-table" | ...,
        "format": "1:1" | "9:16",
        "workoutData": { ... },  # Workout data from Express backend
        "options": {
            "showAttribution": true,
            "teamColor": "#B87333",
            ...
        }
    }

    Returns: PNG image binary (Content-Type: image/png)
    """
    try:
        # Parse request body
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        card_type = data.get('cardType')
        format_key = data.get('format', '1:1')
        workout_data = data.get('workoutData', {})
        options = data.get('options', {})

        # Validate required fields
        if not card_type:
            return jsonify({"error": "Missing required field: cardType"}), 400

        if format_key not in DIMENSIONS:
            return jsonify({"error": f"Invalid format: {format_key}. Supported: {list(DIMENSIONS.keys())}"}), 400

        # Get renderer for card type
        renderer = CARD_RENDERERS.get(card_type)
        if not renderer:
            return jsonify({
                "error": f"Unknown card type: {card_type}",
                "supported": list(CARD_RENDERERS.keys())
            }), 400

        # Render card to PNG bytes
        # Renderers accept (format_key, workout_data, options) and return bytes
        png_bytes = renderer(format_key, workout_data, options)

        # Return PNG binary
        return send_file(
            BytesIO(png_bytes),
            mimetype='image/png',
            as_attachment=False,
            download_name=f'{card_type}-{format_key.replace(":", "x")}.png'
        )

    except Exception as e:
        # Log error with stack trace in dev mode
        error_detail = traceback.format_exc() if app.debug else str(e)
        app.logger.error(f"Card generation failed: {error_detail}")

        return jsonify({
            "error": "Card generation failed",
            "detail": str(e) if app.debug else "Internal server error"
        }), 500


if __name__ == '__main__':
    # Development server (use gunicorn in production via Dockerfile)
    app.run(host='0.0.0.0', port=5000, debug=True)
