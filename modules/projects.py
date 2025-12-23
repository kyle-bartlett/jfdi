"""
Projects module for JFDI system.
Handles creating, reading, updating, and deleting projects and tasks.
"""
import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Literal

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def _get_project_path(project_id: str) -> str:
    """Get the file path for a project."""
    return os.path.join(Config.PROJECTS_DIR, f"{project_id}.json")


def _load_project(project_id: str) -> Optional[Dict]:
    """Load a project from its JSON file."""
    path = _get_project_path(project_id)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return None


def _save_project(project: Dict) -> None:
    """Save a project to its JSON file."""
    os.makedirs(Config.PROJECTS_DIR, exist_ok=True)
    path = _get_project_path(project['id'])
    with open(path, 'w') as f:
        json.dump(project, f, indent=2, default=str)


def _list_all_projects() -> List[Dict]:
    """List all projects from the projects directory."""
    projects = []
    if not os.path.exists(Config.PROJECTS_DIR):
        return projects

    for filename in os.listdir(Config.PROJECTS_DIR):
        if filename.endswith('.json'):
            project_id = filename[:-5]
            project = _load_project(project_id)
            if project:
                projects.append(project)

    return projects


def create_project(
    project_name: str,
    space: str,
    description: Optional[str] = None,
    deadline: Optional[str] = None
) -> Dict:
    """
    Create a new project.

    Args:
        project_name: Name of the project
        space: The space/category (e.g., 'Indy Hall', 'Personal', 'Partnerships')
        description: Optional project description
        deadline: Optional deadline in ISO format

    Returns:
        The created project dict
    """
    project = {
        'id': str(uuid.uuid4()),
        'name': project_name,
        'space': space,
        'description': description,
        'deadline': deadline,
        'status': 'active',
        'tasks': [],
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'last_touched': datetime.now().isoformat()
    }

    _save_project(project)
    return project


def read_project(project_id: str) -> Optional[Dict]:
    """
    Read a project by ID.

    Returns:
        Project dict or None if not found
    """
    return _load_project(project_id)


def update_project(project_id: str, updates: Dict) -> Optional[Dict]:
    """
    Update a project with the given updates.

    Args:
        project_id: The project ID
        updates: Dictionary of fields to update

    Returns:
        Updated project or None if not found
    """
    project = _load_project(project_id)
    if not project:
        return None

    # Don't allow updating certain fields
    protected_fields = ['id', 'created_at']
    for field in protected_fields:
        updates.pop(field, None)

    project.update(updates)
    project['updated_at'] = datetime.now().isoformat()
    project['last_touched'] = datetime.now().isoformat()

    _save_project(project)
    return project


def delete_project(project_id: str) -> bool:
    """
    Delete a project by ID.

    Returns:
        True if deleted, False if not found
    """
    path = _get_project_path(project_id)
    if os.path.exists(path):
        os.remove(path)
        return True
    return False


def create_task(
    project_id: str,
    task_name: str,
    description: Optional[str] = None,
    due_date: Optional[str] = None,
    energy_type: Optional[str] = None
) -> Optional[Dict]:
    """
    Create a new task within a project.

    Args:
        project_id: The parent project ID
        task_name: Name of the task
        description: Optional task description
        due_date: Optional due date in ISO format
        energy_type: Optional energy type (e.g., 'high', 'low', 'creative')

    Returns:
        The created task dict or None if project not found
    """
    project = _load_project(project_id)
    if not project:
        return None

    task = {
        'id': str(uuid.uuid4()),
        'name': task_name,
        'description': description,
        'due_date': due_date,
        'energy_type': energy_type,
        'status': 'pending',
        'completed': False,
        'created_at': datetime.now().isoformat()
    }

    project['tasks'].append(task)
    project['updated_at'] = datetime.now().isoformat()
    project['last_touched'] = datetime.now().isoformat()

    _save_project(project)
    return task


def read_task(task_id: str) -> Optional[Dict]:
    """
    Read a task by ID (searches all projects).

    Returns:
        Tuple of (task, project_id) or None if not found
    """
    for project in _list_all_projects():
        for task in project.get('tasks', []):
            if task['id'] == task_id:
                return {'task': task, 'project_id': project['id']}
    return None


def update_task(task_id: str, updates: Dict) -> Optional[Dict]:
    """
    Update a task with the given updates.

    Args:
        task_id: The task ID
        updates: Dictionary of fields to update

    Returns:
        Updated task or None if not found
    """
    for project in _list_all_projects():
        for i, task in enumerate(project.get('tasks', [])):
            if task['id'] == task_id:
                # Don't allow updating certain fields
                protected_fields = ['id', 'created_at']
                for field in protected_fields:
                    updates.pop(field, None)

                task.update(updates)
                task['updated_at'] = datetime.now().isoformat()
                project['tasks'][i] = task
                project['last_touched'] = datetime.now().isoformat()

                _save_project(project)
                return task
    return None


def delete_task(task_id: str) -> bool:
    """
    Delete a task by ID.

    Returns:
        True if deleted, False if not found
    """
    for project in _list_all_projects():
        original_count = len(project.get('tasks', []))
        project['tasks'] = [t for t in project.get('tasks', []) if t['id'] != task_id]

        if len(project['tasks']) < original_count:
            project['last_touched'] = datetime.now().isoformat()
            _save_project(project)
            return True
    return False


def list_projects(
    sort_by: Literal['next_action', 'alphabetical', 'deadline', 'recently_touched'] = 'next_action'
) -> List[Dict]:
    """
    List all projects with optional sorting.

    Args:
        sort_by: Sorting method
            - 'next_action': Sort by earliest task due date
            - 'alphabetical': Sort by project name
            - 'deadline': Sort by project deadline
            - 'recently_touched': Sort by last touched date

    Returns:
        Sorted list of projects
    """
    projects = _list_all_projects()

    if sort_by == 'alphabetical':
        projects.sort(key=lambda p: p.get('name', '').lower())
    elif sort_by == 'deadline':
        projects.sort(key=lambda p: p.get('deadline') or '9999-12-31')
    elif sort_by == 'recently_touched':
        projects.sort(key=lambda p: p.get('last_touched', ''), reverse=True)
    elif sort_by == 'next_action':
        def get_next_action_date(project):
            pending_tasks = [t for t in project.get('tasks', []) if not t.get('completed')]
            if not pending_tasks:
                return '9999-12-31'
            dated_tasks = [t for t in pending_tasks if t.get('due_date')]
            if dated_tasks:
                return min(t['due_date'] for t in dated_tasks)
            return '9999-12-30'  # Projects with undated tasks come before projects with no tasks

        projects.sort(key=get_next_action_date)

    return projects


if __name__ == '__main__':
    # Test the module
    print("Testing projects module...")
    p = create_project("Test Project", "Personal", "A test project")
    print(f"Created project: {p['name']} ({p['id']})")

    t = create_task(p['id'], "Test Task", "A test task", "2024-12-31")
    print(f"Created task: {t['name']} ({t['id']})")

    print(f"All projects: {[p['name'] for p in list_projects()]}")
