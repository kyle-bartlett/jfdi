"""
Dashboard Agent for JFDI system.
Generates daily dashboard with calendar events, emails, reminders, and goal progress.
"""
import os
import sys
import json
import random
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config
from modules.reminders import list_reminders
from modules.projects import list_projects

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# Goal weights for progress tracking
GOALS = {
    'Indy Hall growth': 0.40,
    'Partnerships': 0.35,
    'Relationships': 0.25
}


def _fetch_calendar_events() -> List[Dict]:
    """
    Fetch upcoming calendar events from Google Calendar.

    Note: This is a placeholder. Full implementation requires OAuth setup.
    Returns mock data for now.
    """
    # TODO: Implement actual Google Calendar API integration
    # For now, return placeholder events
    today = datetime.now()
    return [
        {
            'summary': 'Morning standup',
            'start': (today.replace(hour=9, minute=0)).isoformat(),
            'end': (today.replace(hour=9, minute=30)).isoformat(),
            'requires_action': False
        },
        {
            'summary': 'Review Luma sync',
            'start': (today.replace(hour=14, minute=0)).isoformat(),
            'end': (today.replace(hour=14, minute=30)).isoformat(),
            'requires_action': True,
            'action_type': 'luma_sync'
        }
    ]


def _fetch_actionable_emails() -> List[Dict]:
    """
    Fetch emails that require action.

    Note: This is a placeholder. Full implementation requires Gmail API.
    """
    # TODO: Implement actual email fetching and filtering
    return [
        {
            'subject': '[TIME SENSITIVE] Partnership proposal',
            'from': 'partner@example.com',
            'received': datetime.now().isoformat(),
            'flags': ['time_sensitive', 'action_necessary']
        }
    ]


def _calculate_goal_progress() -> Dict[str, float]:
    """
    Calculate progress towards goals based on tasks and activities.

    Note: This is a placeholder that returns random values.
    Full implementation will track actual task completion.
    """
    # TODO: Connect to actual task/activity data
    return {
        goal: round(random.uniform(20, 80), 1)
        for goal in GOALS.keys()
    }


def _get_overdue_reminders() -> List[Dict]:
    """Get all overdue reminders."""
    return list_reminders('overdue')


def _get_today_reminders() -> List[Dict]:
    """Get reminders due today."""
    return list_reminders('today')


def _get_stalled_projects() -> List[Dict]:
    """Get projects that haven't been touched recently."""
    projects = list_projects('recently_touched')
    stale_threshold = datetime.now() - timedelta(days=7)

    stalled = []
    for project in projects:
        last_touched = project.get('last_touched')
        if last_touched:
            if datetime.fromisoformat(last_touched) < stale_threshold:
                stalled.append(project)

    return stalled


def _get_recommended_tasks(goal_progress: Dict[str, float]) -> List[str]:
    """
    Get recommended tasks based on goal progress.
    Recommends tasks for goals that are behind.
    """
    recommendations = []

    # Find the goal with lowest progress
    lowest_goal = min(goal_progress, key=goal_progress.get)
    lowest_progress = goal_progress[lowest_goal]

    if lowest_progress < 50:
        recommendations.append(f"Focus on {lowest_goal} - currently at {lowest_progress}%")

    # Get projects related to low-progress goals
    projects = list_projects()
    for project in projects[:3]:  # Top 3 by next action
        pending_tasks = [t for t in project.get('tasks', []) if not t.get('completed')]
        if pending_tasks:
            recommendations.append(f"Next action for '{project['name']}': {pending_tasks[0]['name']}")

    return recommendations


def _summarize_with_claude(data: Dict) -> str:
    """Use Claude to generate a summary and recommendations."""
    if not ANTHROPIC_AVAILABLE:
        return "Claude summarization unavailable - anthropic library not installed."

    api_key = Config.CLAUDE_API_KEY
    if not api_key or api_key == "YOUR_CLAUDE_API_KEY":
        return "Claude API key not configured."

    try:
        client = anthropic.Anthropic(api_key=api_key)

        prompt = f"""Based on this daily dashboard data, provide a brief 2-3 sentence executive summary and 2-3 specific action recommendations:

Dashboard Data:
- Overdue reminders: {len(data['overdue_reminders'])}
- Today's reminders: {len(data['today_reminders'])}
- Stalled projects: {len(data['stalled_projects'])}
- Goal progress: {data['goal_progress']}
- Actionable emails: {len(data['actionable_emails'])}

Provide actionable, specific recommendations."""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text
    except Exception as e:
        return f"Error generating summary: {str(e)}"


def _post_to_discord(content: str) -> bool:
    """Post the dashboard to Discord webhook."""
    webhook_url = Config.DISCORD_WEBHOOK_URL

    if not webhook_url or webhook_url == "YOUR_DISCORD_WEBHOOK_URL":
        print("Discord webhook not configured.")
        return False

    try:
        # Split content if too long for Discord (2000 char limit)
        if len(content) > 2000:
            content = content[:1997] + "..."

        response = requests.post(
            webhook_url,
            json={"content": content},
            headers={"Content-Type": "application/json"}
        )
        return response.status_code == 204
    except Exception as e:
        print(f"Error posting to Discord: {e}")
        return False


def generate_dashboard() -> str:
    """
    Generate the daily dashboard.

    Returns:
        Markdown-formatted dashboard string
    """
    now = datetime.now()

    # Gather all data
    data = {
        'timestamp': now.isoformat(),
        'calendar_events': _fetch_calendar_events(),
        'actionable_emails': _fetch_actionable_emails(),
        'overdue_reminders': _get_overdue_reminders(),
        'today_reminders': _get_today_reminders(),
        'stalled_projects': _get_stalled_projects(),
        'goal_progress': _calculate_goal_progress(),
    }

    # Get AI-generated recommendations
    data['recommendations'] = _get_recommended_tasks(data['goal_progress'])
    data['ai_summary'] = _summarize_with_claude(data)

    # Generate markdown report
    report = f"""# JFDI Daily Dashboard
**Generated:** {now.strftime('%Y-%m-%d %H:%M')}

## Executive Summary
{data['ai_summary']}

## Goal Progress
"""

    for goal, progress in data['goal_progress'].items():
        bar_length = int(progress / 5)
        bar = '=' * bar_length + '-' * (20 - bar_length)
        report += f"- **{goal}**: [{bar}] {progress}%\n"

    report += "\n## Overdue Items\n"
    if data['overdue_reminders']:
        for r in data['overdue_reminders']:
            report += f"- {r['text']} (due: {r['due_date']})\n"
    else:
        report += "- None! Great job staying on top of things.\n"

    report += "\n## Today's Reminders\n"
    if data['today_reminders']:
        for r in data['today_reminders']:
            report += f"- {r['text']}\n"
    else:
        report += "- No reminders due today.\n"

    report += "\n## Actionable Emails\n"
    if data['actionable_emails']:
        for email in data['actionable_emails']:
            flags = ', '.join(email.get('flags', []))
            report += f"- **{email['subject']}** from {email['from']} [{flags}]\n"
    else:
        report += "- No actionable emails.\n"

    report += "\n## Calendar (Needs Action)\n"
    action_events = [e for e in data['calendar_events'] if e.get('requires_action')]
    if action_events:
        for event in action_events:
            report += f"- {event['summary']} - {event.get('action_type', 'review')}\n"
    else:
        report += "- No calendar items need action.\n"

    report += "\n## Stalled Projects (7+ days)\n"
    if data['stalled_projects']:
        for p in data['stalled_projects'][:5]:
            report += f"- {p['name']} (last touched: {p.get('last_touched', 'unknown')})\n"
    else:
        report += "- No stalled projects.\n"

    report += "\n## Recommended Actions\n"
    for rec in data['recommendations'][:5]:
        report += f"- {rec}\n"

    # Save the report
    os.makedirs(Config.BASE_DATA_DIR, exist_ok=True)
    dashboard_path = os.path.join(Config.BASE_DATA_DIR, 'dashboard.md')
    with open(dashboard_path, 'w') as f:
        f.write(report)

    # Save raw data
    os.makedirs(Config.DASHBOARD_DATA_DIR, exist_ok=True)
    data_filename = f"dashboard_{now.strftime('%Y%m%d_%H%M%S')}.json"
    data_path = os.path.join(Config.DASHBOARD_DATA_DIR, data_filename)
    with open(data_path, 'w') as f:
        json.dump(data, f, indent=2, default=str)

    # Post to Discord
    discord_content = f"**JFDI Daily Dashboard - {now.strftime('%Y-%m-%d')}**\n\n{data['ai_summary']}\n\nFull dashboard saved to: {dashboard_path}"
    _post_to_discord(discord_content)

    print(f"Dashboard generated: {dashboard_path}")
    print(f"Raw data saved: {data_path}")

    return report


if __name__ == '__main__':
    print("Generating dashboard...")
    report = generate_dashboard()
    print("\n" + report)
