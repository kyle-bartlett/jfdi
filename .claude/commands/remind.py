"""
/remind command for JFDI system.
Allows users to add reminders via the chat interface.

Usage: /remind <reminder text> <due date>
Examples:
    /remind Buy groceries tomorrow
    /remind Call mom 2024-12-25
    /remind Submit report next week
"""
import sys
import os
import re

# Add parent directories to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from modules.reminders import add_reminder


def parse_reminder_input(input_str: str) -> tuple:
    """
    Parse reminder input to extract text and due date.

    Supports formats like:
    - "Buy groceries tomorrow"
    - "Call mom 2024-12-25"
    - "Submit report next week"

    Returns:
        Tuple of (reminder_text, due_date)
    """
    input_str = input_str.strip()

    # Common date keywords to look for at the end
    date_patterns = [
        r'\s+(today)$',
        r'\s+(tomorrow)$',
        r'\s+(next week)$',
        r'\s+(next month)$',
        r'\s+(\d{4}-\d{2}-\d{2})$',  # ISO format
        r'\s+(\d{1,2}/\d{1,2}/\d{4})$',  # MM/DD/YYYY
        r'\s+(in \d+ days?)$',
        r'\s+(in \d+ weeks?)$',
    ]

    for pattern in date_patterns:
        match = re.search(pattern, input_str, re.IGNORECASE)
        if match:
            due_date = match.group(1)
            reminder_text = input_str[:match.start()].strip()
            return reminder_text, due_date

    # If no date pattern found, default to tomorrow
    return input_str, 'tomorrow'


def execute(args: str) -> str:
    """
    Execute the remind command.

    Args:
        args: The command arguments (reminder text and optional due date)

    Returns:
        Confirmation message
    """
    if not args or not args.strip():
        return "Usage: /remind <reminder text> [due date]\nExample: /remind Buy groceries tomorrow"

    reminder_text, due_date = parse_reminder_input(args)

    if not reminder_text:
        return "Error: Please provide reminder text."

    try:
        reminder = add_reminder(reminder_text, due_date)
        return f"Reminder added: {reminder_text} - due {reminder['due_date']}"
    except Exception as e:
        return f"Error adding reminder: {str(e)}"


if __name__ == '__main__':
    # Test the command
    test_inputs = [
        "Buy groceries tomorrow",
        "Call mom 2024-12-25",
        "Submit report next week",
        "Finish project",
    ]

    for test in test_inputs:
        print(f"Input: {test}")
        print(f"Output: {execute(test)}")
        print()
