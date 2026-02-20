import { getOpsDb } from './db';
import { v4 as uuid } from 'uuid';

export function seedOpsIfEmpty() {
  const db = getOpsDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  const projects = [
    { title: 'ZipWise', priority: 'P0', status: 'In Progress', description: 'AI-powered zip code intelligence platform' },
    { title: 'Bartlett Labs Website', priority: 'P0', status: 'In Progress', description: 'Company website — needs finished' },
    { title: 'LinkedIn Business Page', priority: 'P0', status: 'In Progress', description: 'Professional LinkedIn presence — needs finished' },
    { title: 'Tuneup Automation', priority: 'P0', status: 'In Progress', description: 'Automated tuneup workflow system' },
    { title: 'KDP Book Studio', priority: 'P2', status: 'In Progress', description: 'Kindle Direct Publishing automation studio' },
    { title: 'Commerce Shopify', priority: 'P1', status: 'Backlog', description: 'E-commerce Shopify store — needs built' },
    { title: 'LarkAgentX', priority: 'P2', status: 'In Progress', description: 'Lark/Feishu agent integration — needs finished' },
    { title: 'Gmail Brain', priority: 'P2', status: 'In Progress', description: 'Intelligent Gmail processing — needs finished' },
    { title: 'AI LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Automated LinkedIn content & outreach' },
    { title: 'Job Ops', priority: 'P3', status: 'In Progress', description: 'Job operations tracker — needs finished' },
    { title: 'Portfolio Dashboard', priority: 'P3', status: 'In Progress', description: 'Investment portfolio tracking dashboard' },
    { title: 'Ops Dashboard', priority: 'P2', status: 'In Progress', description: 'Central operations dashboard' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id, title, priority, status, description) VALUES (?, ?, ?, ?, ?)');
  for (const p of projects) {
    insertProject.run(uuid(), p.title, p.priority, p.status, p.description);
  }

  const prospects = [
    { business_name: 'Summit Roofing Co', industry: 'Roofing', location: 'Dallas, TX', estimated_value: '$2,500', status: 'Lead' },
    { business_name: 'Precision Plumbing', industry: 'Plumbing', location: 'Austin, TX', estimated_value: '$3,000', status: 'Lead' },
    { business_name: 'GreenScape Lawns', industry: 'Landscaping', location: 'Fort Worth, TX', estimated_value: '$1,800', status: 'Lead' },
    { business_name: 'Elite Auto Detailing', industry: 'Auto Services', location: 'Houston, TX', estimated_value: '$2,200', status: 'Contacted' },
    { business_name: 'BrightSmile Dental', industry: 'Healthcare', location: 'San Antonio, TX', estimated_value: '$5,000', status: 'Lead' },
  ];

  const insertProspect = db.prepare('INSERT INTO pipeline (id, business_name, industry, location, estimated_value, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of prospects) {
    insertProspect.run(uuid(), p.business_name, p.industry, p.location, p.estimated_value, p.status);
  }

  const prompts = [
    { title: 'Cold Outreach Email', category: 'Outreach', prompt_text: 'Write a personalized cold outreach email for {business_name}...', tags: 'email,cold,prospect' },
    { title: 'Code Review Checklist', category: 'Development', prompt_text: 'Review this code for: security vulnerabilities, performance issues...', tags: 'code,review,quality' },
  ];

  const insertPrompt = db.prepare('INSERT INTO prompts (id, title, prompt_text, category, tags) VALUES (?, ?, ?, ?, ?)');
  for (const p of prompts) {
    insertPrompt.run(uuid(), p.title, p.prompt_text, p.category, p.tags);
  }

  const queueItems = [
    { queue_type: 'kyle', title: 'Review ZipWise landing page copy', priority: 'P0', requested_by: 'Pulse' },
    { queue_type: 'kyle', title: 'Approve prospect outreach batch #4', priority: 'P1', requested_by: 'Reach' },
    { queue_type: 'knox', title: 'Deploy Scout for market research', priority: 'P1', requested_by: 'Knox' },
  ];

  const insertQueue = db.prepare('INSERT INTO queues (id, queue_type, title, priority, requested_by) VALUES (?, ?, ?, ?, ?)');
  for (const q of queueItems) {
    insertQueue.run(uuid(), q.queue_type, q.title, q.priority, q.requested_by);
  }

  const agentTasks = [
    { agent_name: 'Stack', task_description: 'Build merged dashboard', status: 'Running', result_summary: '' },
    { agent_name: 'Scout', task_description: 'Research DFW HVAC market', status: 'Completed', result_summary: 'Found 23 prospects' },
  ];

  const insertAgent = db.prepare('INSERT INTO agent_tasks (id, agent_name, task_description, status, result_summary) VALUES (?, ?, ?, ?, ?)');
  for (const a of agentTasks) {
    insertAgent.run(uuid(), a.agent_name, a.task_description, a.status, a.result_summary);
  }

  const activityEvents = [
    { event_type: 'system', title: 'Ops Dashboard initialized', description: 'All systems online.', source: 'System', icon: '🟢' },
    { event_type: 'milestone', title: 'Dashboard merge complete', description: 'JFDI + Ops merged into unified command center', source: 'Stack', icon: '🏆' },
  ];

  const insertActivity = db.prepare("INSERT INTO activity_log (id, event_type, title, description, source, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  activityEvents.forEach((evt, i) => {
    const minutesAgo = `-${(activityEvents.length - i) * 30} minutes`;
    insertActivity.run(uuid(), evt.event_type, evt.title, evt.description, evt.source, evt.icon, minutesAgo);
  });

  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, mood) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(uuid(), today, 2, 1, 0, 0, 1, 'grinding');
}
