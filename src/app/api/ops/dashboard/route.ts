import { NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';

export async function GET() {
  seedOpsIfEmpty();
  const db = getOpsDb();

  const projectsByStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM projects GROUP BY status"
  ).all() as { status: string; count: number }[];

  const projectsByPriority = db.prepare(
    "SELECT priority, COUNT(*) as count FROM projects GROUP BY priority ORDER BY priority"
  ).all() as { priority: string; count: number }[];

  const pipelineByStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM pipeline GROUP BY status"
  ).all() as { status: string; count: number }[];

  const ideasByStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM ideas GROUP BY status"
  ).all() as { status: string; count: number }[];

  const agentsByStatus = db.prepare(
    "SELECT status, COUNT(*) as count FROM agent_tasks GROUP BY status"
  ).all() as { status: string; count: number }[];

  const activeAgents = db.prepare(
    "SELECT * FROM agent_tasks WHERE status = 'Running' ORDER BY deployed_at DESC"
  ).all();

  const kyleQueue = db.prepare(
    "SELECT COUNT(*) as count FROM queues WHERE queue_type = 'kyle' AND status = 'Pending'"
  ).get() as { count: number };

  const knoxQueue = db.prepare(
    "SELECT COUNT(*) as count FROM queues WHERE queue_type = 'knox' AND status = 'Pending'"
  ).get() as { count: number };

  const p0Projects = db.prepare(
    "SELECT * FROM projects WHERE priority = 'P0' AND status != 'Done' ORDER BY updated_at DESC"
  ).all();

  const recentProjects = db.prepare(
    "SELECT * FROM projects ORDER BY updated_at DESC LIMIT 5"
  ).all();

  const totalProjects = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
  const totalProspects = db.prepare("SELECT COUNT(*) as count FROM pipeline").get() as { count: number };
  const totalIdeas = db.prepare("SELECT COUNT(*) as count FROM ideas").get() as { count: number };
  const totalPrompts = db.prepare("SELECT COUNT(*) as count FROM prompts").get() as { count: number };

  // New: recent activity events
  let recentActivity: unknown[] = [];
  try {
    recentActivity = db.prepare(
      "SELECT * FROM activity_log ORDER BY pinned DESC, created_at DESC LIMIT 10"
    ).all();
  } catch { /* table may not exist yet */ }

  // New: today's metrics
  const today = new Date().toISOString().split('T')[0];
  let todayMetrics = null;
  try {
    todayMetrics = db.prepare('SELECT * FROM daily_metrics WHERE metric_date = ?').get(today) || null;
  } catch { /* table may not exist yet */ }

  // Pipeline total value
  const pipelineRows = db.prepare("SELECT estimated_value FROM pipeline WHERE status NOT IN ('Lost')").all() as { estimated_value: string }[];
  const pipelineValue = pipelineRows.reduce((sum, r) => {
    const num = parseInt((r.estimated_value || '0').replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  // Completion rate (done / total projects)
  const doneProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Done'").get() as { count: number };
  const completionRate = totalProjects.count > 0 ? Math.round((doneProjects.count / totalProjects.count) * 100) : 0;

  // Weekly agent deploys
  let weeklyAgentDeploys = 0;
  try {
    const weeklyResult = db.prepare(
      "SELECT COUNT(*) as count FROM agent_tasks WHERE deployed_at >= datetime('now', '-7 days')"
    ).get() as { count: number };
    weeklyAgentDeploys = weeklyResult.count;
  } catch { /* ok */ }

  return NextResponse.json({
    projectsByStatus,
    projectsByPriority,
    pipelineByStatus,
    ideasByStatus,
    agentsByStatus,
    activeAgents,
    kyleQueuePending: kyleQueue.count,
    knoxQueuePending: knoxQueue.count,
    p0Projects,
    recentProjects,
    totals: {
      projects: totalProjects.count,
      prospects: totalProspects.count,
      ideas: totalIdeas.count,
      prompts: totalPrompts.count,
    },
    recentActivity,
    todayMetrics,
    pipelineValue,
    completionRate,
    weeklyAgentDeploys,
  });
}
