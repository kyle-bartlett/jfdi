"""
Chat Interface module for JFDI system.
Provides a command-line interface for interacting with Claude Code and the JFDI system.
"""
import os
import sys
import importlib.util
from typing import Optional, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

# Session storage for conversation history
_sessions: Dict[str, List[Dict]] = {}


def _get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create a new one."""
    if session_id is None:
        session_id = 'default'

    if session_id not in _sessions:
        _sessions[session_id] = []

    return session_id


def _execute_command(command_name: str, args: str) -> str:
    """
    Execute a Claude Code command from .claude/commands directory.

    Args:
        command_name: Name of the command (without .py extension)
        args: Arguments to pass to the command

    Returns:
        Command output or error message
    """
    commands_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.claude', 'commands')
    command_file = os.path.join(commands_dir, f"{command_name}.py")

    if not os.path.exists(command_file):
        return f"Command not found: {command_name}"

    try:
        spec = importlib.util.spec_from_file_location(command_name, command_file)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if hasattr(module, 'execute'):
            return module.execute(args)
        else:
            return f"Command {command_name} does not have an execute function"
    except Exception as e:
        return f"Error executing command {command_name}: {str(e)}"


def _call_claude(message: str, session_id: str) -> str:
    """
    Send a message to Claude and get a response.

    Args:
        message: The user's message
        session_id: The session ID for conversation history

    Returns:
        Claude's response
    """
    if not ANTHROPIC_AVAILABLE:
        return "Anthropic library not available. Please install with: pip install anthropic"

    api_key = Config.CLAUDE_API_KEY
    if not api_key or api_key == "YOUR_CLAUDE_API_KEY":
        return "Claude API key not configured. Please set CLAUDE_API_KEY in .env file."

    client = anthropic.Anthropic(api_key=api_key)

    # Add user message to session history
    _sessions[session_id].append({
        "role": "user",
        "content": message
    })

    # Build messages for API call
    messages = _sessions[session_id]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system="You are a helpful assistant integrated with the JFDI productivity system. Help the user manage their tasks, projects, and reminders effectively.",
            messages=messages
        )

        assistant_message = response.content[0].text

        # Add assistant response to session history
        _sessions[session_id].append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message
    except Exception as e:
        return f"Error calling Claude API: {str(e)}"


def chat(user_input: str, session_id: Optional[str] = None) -> str:
    """
    Process user input and return a response.

    Handles both Claude Code commands (starting with /) and regular chat.

    Args:
        user_input: The user's input
        session_id: Optional session ID for conversation tracking

    Returns:
        Response string
    """
    session_id = _get_or_create_session(session_id)
    user_input = user_input.strip()

    if not user_input:
        return "Please enter a message or command."

    # Check if input is a command
    if user_input.startswith('/'):
        parts = user_input[1:].split(' ', 1)
        command_name = parts[0]
        args = parts[1] if len(parts) > 1 else ''
        return _execute_command(command_name, args)

    # Otherwise, pass to Claude
    return _call_claude(user_input, session_id)


def clear_session(session_id: Optional[str] = None) -> None:
    """Clear a session's conversation history."""
    if session_id is None:
        session_id = 'default'

    if session_id in _sessions:
        _sessions[session_id] = []


def get_session_history(session_id: Optional[str] = None) -> List[Dict]:
    """Get a session's conversation history."""
    if session_id is None:
        session_id = 'default'

    return _sessions.get(session_id, [])


if __name__ == '__main__':
    # Interactive test mode
    print("JFDI Chat Interface")
    print("Type /command for commands, or chat directly with Claude")
    print("Type 'quit' to exit")
    print("-" * 50)

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if user_input.lower() == 'quit':
                break

            response = chat(user_input)
            print(f"\nAssistant: {response}")
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
