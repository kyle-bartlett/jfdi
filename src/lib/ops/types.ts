export interface OpsProject {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  owner: string;
  due_date: string;
  linked_files: string;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  potential_revenue: string;
  effort: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  business_name: string;
  contact: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  location: string;
  estimated_value: string;
  notes: string;
  last_contact_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  title: string;
  prompt_text: string;
  category: string;
  tags: string;
  usage_count: number;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export interface QueueItem {
  id: string;
  queue_type: string;
  title: string;
  description: string;
  priority: string;
  requested_by: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AgentTask {
  id: string;
  agent_name: string;
  task_description: string;
  status: string;
  deployed_at: string;
  completed_at: string;
  result_summary: string;
  performance_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  source: string;
  icon: string;
  starred: number;
  pinned: number;
  metadata: string;
  created_at: string;
}

export interface DailyMetrics {
  id: string;
  metric_date: string;
  agents_deployed: number;
  tasks_completed: number;
  prospects_contacted: number;
  ideas_logged: number;
  revenue_closed: number;
  active_streak: number;
  mood: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OpsDashboardData {
  projectsByStatus: { status: string; count: number }[];
  projectsByPriority: { priority: string; count: number }[];
  pipelineByStatus: { status: string; count: number }[];
  ideasByStatus: { status: string; count: number }[];
  agentsByStatus: { status: string; count: number }[];
  activeAgents: AgentTask[];
  kyleQueuePending: number;
  knoxQueuePending: number;
  p0Projects: OpsProject[];
  recentProjects: OpsProject[];
  totals: {
    projects: number;
    prospects: number;
    ideas: number;
    prompts: number;
  };
  recentActivity: ActivityEvent[];
  todayMetrics: DailyMetrics | null;
  pipelineValue: number;
  completionRate: number;
  weeklyAgentDeploys: number;
}

export interface ActionQueueItem {
  id: string;
  title: string;
  description: string;
  source: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  status: 'fully_automated' | 'semi_automated' | 'pending';
  frequency: string;
  cron_expression: string;
  category: string;
  last_run: string | null;
  next_run: string | null;
  days_of_week: number[];
  hour_start: number;
  hour_end: number;
  requires_approval: boolean;
}
