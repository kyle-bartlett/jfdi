#!/usr/bin/env python3
"""
JFDI System - Just F***ing Do It
Main execution script for the productivity system.

This script:
1. Loads configuration
2. Initializes modules
3. Schedules the dashboard to run every weekday at 8:30 AM
4. Provides an interactive chat interface
"""
import os
import sys
import signal
import threading

# Ensure we're in the correct directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

import schedule
import time
from datetime import datetime

from config import Config
from modules import chat_interface
from modules.reminders import list_reminders, add_reminder
from modules.projects import list_projects, create_project
from agents import dashboard_agent


def run_dashboard():
    """Generate and distribute the daily dashboard."""
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Running scheduled dashboard...")
    try:
        dashboard_agent.generate_dashboard()
        print("Dashboard generated successfully!")
    except Exception as e:
        print(f"Error generating dashboard: {e}")


def setup_scheduler():
    """Set up the scheduled tasks."""
    # Run dashboard every weekday at 8:30 AM
    schedule.every().monday.at("08:30").do(run_dashboard)
    schedule.every().tuesday.at("08:30").do(run_dashboard)
    schedule.every().wednesday.at("08:30").do(run_dashboard)
    schedule.every().thursday.at("08:30").do(run_dashboard)
    schedule.every().friday.at("08:30").do(run_dashboard)

    print("Scheduled: Dashboard generation at 8:30 AM on weekdays")


def scheduler_thread():
    """Background thread for running scheduled tasks."""
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


def print_welcome():
    """Print welcome message and available commands."""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║                     JFDI SYSTEM                           ║
    ║              Just F***ing Do It Productivity              ║
    ╠═══════════════════════════════════════════════════════════╣
    ║  Commands:                                                 ║
    ║    /remind <text> [date]  - Add a reminder                 ║
    ║    /dashboard             - Generate dashboard now         ║
    ║    /projects              - List all projects              ║
    ║    /reminders             - List all reminders             ║
    ║    /help                  - Show this help message         ║
    ║    /quit or /exit         - Exit the system                ║
    ║                                                            ║
    ║  Or just type naturally to chat with Claude!               ║
    ╚═══════════════════════════════════════════════════════════╝
    """)


def handle_builtin_command(command: str, args: str) -> tuple:
    """
    Handle built-in commands that don't need external files.

    Returns:
        Tuple of (handled: bool, response: str)
    """
    if command == 'dashboard':
        print("Generating dashboard...")
        report = dashboard_agent.generate_dashboard()
        return True, "Dashboard generated! Check data/dashboard.md"

    elif command == 'projects':
        projects = list_projects()
        if not projects:
            return True, "No projects yet. Create one with: /newproject <name> <space>"

        response = "Projects:\n"
        for p in projects:
            pending = len([t for t in p.get('tasks', []) if not t.get('completed')])
            response += f"  - {p['name']} ({p['space']}) - {pending} pending tasks\n"
        return True, response

    elif command == 'reminders':
        reminders = list_reminders()
        if not reminders:
            return True, "No reminders yet. Add one with: /remind <text> <date>"

        response = "Reminders:\n"
        for r in reminders:
            status = "completed" if r.get('completed') else r['due_date']
            response += f"  - {r['text']} ({status})\n"
        return True, response

    elif command == 'help':
        print_welcome()
        return True, ""

    elif command in ('quit', 'exit'):
        return True, "EXIT"

    elif command == 'newproject':
        if not args:
            return True, "Usage: /newproject <name> <space>\nExample: /newproject 'New Website' 'Indy Hall'"

        parts = args.split(' ', 1)
        name = parts[0].strip("'\"")
        space = parts[1].strip("'\"") if len(parts) > 1 else "Personal"

        project = create_project(name, space)
        return True, f"Project created: {name} in {space} (ID: {project['id'][:8]}...)"

    return False, ""


def interactive_loop():
    """Main interactive loop for user input."""
    while True:
        try:
            user_input = input("\nYou: ").strip()

            if not user_input:
                continue

            # Check for built-in commands first
            if user_input.startswith('/'):
                parts = user_input[1:].split(' ', 1)
                command = parts[0].lower()
                args = parts[1] if len(parts) > 1 else ''

                handled, response = handle_builtin_command(command, args)
                if handled:
                    if response == "EXIT":
                        print("Goodbye! Keep JFDIing!")
                        break
                    elif response:
                        print(f"\n{response}")
                    continue

            # Use the chat interface for everything else
            response = chat_interface.chat(user_input)
            print(f"\nAssistant: {response}")

        except KeyboardInterrupt:
            print("\n\nGoodbye! Keep JFDIing!")
            break
        except EOFError:
            print("\nGoodbye!")
            break


def main():
    """Main entry point."""
    print("Starting JFDI System...")

    # Ensure data directories exist
    os.makedirs(Config.BASE_DATA_DIR, exist_ok=True)
    os.makedirs(Config.PROJECTS_DIR, exist_ok=True)
    os.makedirs(Config.DASHBOARD_DATA_DIR, exist_ok=True)

    # Set up scheduled tasks
    setup_scheduler()

    # Start scheduler in background thread
    scheduler = threading.Thread(target=scheduler_thread, daemon=True)
    scheduler.start()

    # Run initial dashboard
    print("\nGenerating initial dashboard...")
    try:
        run_dashboard()
    except Exception as e:
        print(f"Note: Initial dashboard generation encountered an issue: {e}")
        print("The system will continue running.")

    # Print welcome and start interactive loop
    print_welcome()
    interactive_loop()


if __name__ == "__main__":
    main()
