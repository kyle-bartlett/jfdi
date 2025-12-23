"""
Reminders module for JFDI system.
Handles adding, deleting, snoozing, completing, and listing reminders.
"""
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Literal

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def _load_reminders() -> List[Dict]:
    """Load reminders from JSON file."""
    if not os.path.exists(Config.REMINDERS_FILE):
        return []
    try:
        with open(Config.REMINDERS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def _save_reminders(reminders: List[Dict]) -> None:
    """Save reminders to JSON file."""
    os.makedirs(os.path.dirname(Config.REMINDERS_FILE), exist_ok=True)
    with open(Config.REMINDERS_FILE, 'w') as f:
        json.dump(reminders, f, indent=2, default=str)


def add_reminder(text: str, due_date: str) -> Dict:
    """
    Add a new reminder.

    Args:
        text: The reminder text
        due_date: Due date in ISO format (YYYY-MM-DD) or relative like 'tomorrow', 'next week'

    Returns:
        The created reminder dict
    """
    reminders = _load_reminders()

    # Parse relative dates
    parsed_date = _parse_date(due_date)

    reminder = {
        'id': str(uuid.uuid4()),
        'text': text,
        'due_date': parsed_date.isoformat(),
        'completed': False,
        'snoozed_until': None,
        'created_at': datetime.now().isoformat()
    }

    reminders.append(reminder)
    _save_reminders(reminders)
    return reminder


def _parse_date(date_str: str) -> datetime:
    """Parse date string to datetime object."""
    date_str = date_str.lower().strip()
    today = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)

    if date_str == 'today':
        return today
    elif date_str == 'tomorrow':
        return today + timedelta(days=1)
    elif date_str == 'next week':
        return today + timedelta(weeks=1)
    elif date_str == 'next month':
        return today + timedelta(days=30)
    else:
        try:
            return datetime.fromisoformat(date_str)
        except ValueError:
            # Try common formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                try:
                    return datetime.strptime(date_str, fmt)
                except ValueError:
                    continue
            # Default to tomorrow if can't parse
            return today + timedelta(days=1)


def delete_reminder(reminder_id: str) -> bool:
    """
    Delete a reminder by ID.

    Returns:
        True if deleted, False if not found
    """
    reminders = _load_reminders()
    original_length = len(reminders)
    reminders = [r for r in reminders if r['id'] != reminder_id]

    if len(reminders) < original_length:
        _save_reminders(reminders)
        return True
    return False


def snooze_reminder(reminder_id: str, snooze_until: str) -> Optional[Dict]:
    """
    Snooze a reminder until a specified date.

    Args:
        reminder_id: The reminder ID
        snooze_until: Date to snooze until

    Returns:
        Updated reminder or None if not found
    """
    reminders = _load_reminders()
    parsed_date = _parse_date(snooze_until)

    for reminder in reminders:
        if reminder['id'] == reminder_id:
            reminder['snoozed_until'] = parsed_date.isoformat()
            _save_reminders(reminders)
            return reminder

    return None


def complete_reminder(reminder_id: str) -> Optional[Dict]:
    """
    Mark a reminder as completed.

    Returns:
        Updated reminder or None if not found
    """
    reminders = _load_reminders()

    for reminder in reminders:
        if reminder['id'] == reminder_id:
            reminder['completed'] = True
            reminder['completed_at'] = datetime.now().isoformat()
            _save_reminders(reminders)
            return reminder

    return None


def list_reminders(filter_type: Literal['overdue', 'today', 'next_3_days', 'anytime', 'all'] = 'all') -> List[Dict]:
    """
    List reminders with optional filtering.

    Args:
        filter_type: Type of filter to apply
            - 'overdue': Past due reminders
            - 'today': Due today
            - 'next_3_days': Due in next 3 days
            - 'anytime': No specific due date (or far future)
            - 'all': All reminders

    Returns:
        List of matching reminders
    """
    reminders = _load_reminders()
    now = datetime.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Filter out snoozed reminders that haven't reached their snooze date
    active_reminders = []
    for r in reminders:
        if r.get('snoozed_until'):
            snooze_date = datetime.fromisoformat(r['snoozed_until'])
            if snooze_date > now:
                continue
        active_reminders.append(r)

    if filter_type == 'all':
        return active_reminders

    filtered = []
    for r in active_reminders:
        if r.get('completed'):
            continue

        due_date = datetime.fromisoformat(r['due_date'])

        if filter_type == 'overdue':
            if due_date < now:
                filtered.append(r)
        elif filter_type == 'today':
            if due_date.date() == today.date():
                filtered.append(r)
        elif filter_type == 'next_3_days':
            if today <= due_date <= today + timedelta(days=3):
                filtered.append(r)
        elif filter_type == 'anytime':
            if due_date > today + timedelta(days=30):
                filtered.append(r)

    return filtered


if __name__ == '__main__':
    # Test the module
    print("Testing reminders module...")
    r = add_reminder("Test reminder", "tomorrow")
    print(f"Added: {r}")
    print(f"All reminders: {list_reminders()}")
