#!/usr/bin/env python3
"""
Test script to generate sample erg summary cards for both design variants
"""

import requests
import json

# Sample workout data
SAMPLE_WORKOUT = {
    'title': '2000m Erg Test',
    'type': '2k_test',
    'total_time': '6:22.1',
    'avg_pace': '1:35.5',
    'avg_watts': 312,
    'avg_heart_rate': 185,
    'avg_stroke_rate': 32,
    'distance_m': 2000,
    'duration_seconds': 382.1,
    'machine_type': 'rower',
    'date': '2026-02-10',
    'athlete_name': 'Marcus Chen',
    'splits': [
        {'split_number': 1, 'distance_m': 500, 'time_seconds': 94.2, 'pace': '1:34.2', 'watts': 322, 'stroke_rate': 34, 'heart_rate': 172},
        {'split_number': 2, 'distance_m': 500, 'time_seconds': 95.8, 'pace': '1:35.8', 'watts': 308, 'stroke_rate': 32, 'heart_rate': 182},
        {'split_number': 3, 'distance_m': 500, 'time_seconds': 96.1, 'pace': '1:36.1', 'watts': 305, 'stroke_rate': 31, 'heart_rate': 188},
        {'split_number': 4, 'distance_m': 500, 'time_seconds': 96.0, 'pace': '1:36.0', 'watts': 306, 'stroke_rate': 33, 'heart_rate': 192},
    ]
}

OPTIONS = {
    'showAttribution': True,
    'showName': True,
}

BASE_URL = 'http://localhost:5000'

def generate_card(card_type, format_key, output_path):
    """Generate a card and save to file"""
    payload = {
        'cardType': card_type,
        'format': format_key,
        'workoutData': SAMPLE_WORKOUT,
        'options': OPTIONS,
    }

    print(f"Generating {card_type} ({format_key})...")
    response = requests.post(f'{BASE_URL}/generate', json=payload)

    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        print(f"  ✓ Saved to {output_path}")
    else:
        print(f"  ✗ Error: {response.status_code}")
        print(f"    {response.text}")

def main():
    # Check if server is running
    try:
        response = requests.get(f'{BASE_URL}/health')
        if response.status_code != 200:
            print("Flask server not responding correctly")
            return
    except requests.exceptions.ConnectionError:
        print("Flask server not running. Start it with: python app.py")
        return

    print("Generating all 4 card variants...\n")

    # Design A - Square
    generate_card('erg_summary', '1:1', '/tmp/share-card-design-a-square.png')

    # Design A - Story
    generate_card('erg_summary', '9:16', '/tmp/share-card-design-a-story.png')

    # Design B - Square
    generate_card('erg_summary_alt', '1:1', '/tmp/share-card-design-b-square.png')

    # Design B - Story
    generate_card('erg_summary_alt', '9:16', '/tmp/share-card-design-b-story.png')

    print("\n✓ All cards generated successfully!")
    print("\nView cards:")
    print("  Design A (Evolved v5): /tmp/share-card-design-a-square.png")
    print("  Design A (Evolved v5): /tmp/share-card-design-a-story.png")
    print("  Design B (Fresh Direction): /tmp/share-card-design-b-square.png")
    print("  Design B (Fresh Direction): /tmp/share-card-design-b-story.png")

if __name__ == '__main__':
    main()
