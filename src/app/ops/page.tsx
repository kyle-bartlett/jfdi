'use client';

import { useState, useEffect } from 'react';
import { CommandCenter } from '@/components/ops/CommandCenter';
import { ProjectsBoard } from '@/components/ops/ProjectsBoard';
import { IdeasBoard } from '@/components/ops/IdeasBoard';
import { PipelineBoard } from '@/components/ops/PipelineBoard';
import { PromptLibrary } from '@/components/ops/PromptLibrary';
import { QueueBoard } from '@/components/ops/QueueBoard';
import { AgentTasks } from '@/components/ops/AgentTasks';
import { ActivityTimeline } from '@/components/ops/ActivityTimeline';
import { StreakTracker } from '@/components/ops/StreakTracker';

const TABS = [
  { id: 'command', label: '🏠 Command Center' },
  { id: 'timeline', label: '⏱️ Activity' },
  { id: 'streaks', label: '🔥 Streaks' },
  { id: 'projects', label: '📋 Projects' },
  { id: 'ideas', label: '💡 Ideas' },
  { id: 'pipeline', label: '🎯 Pipeline' },
  { id: 'prompts', label: '📝 Prompts' },
  { id: 'kyle', label: "👤 Kyle's Queue" },
  { id: 'knox', label: "🔒 Knox's Queue" },
  { id: 'agents', label: '🤖 Sub-Agents' },
];

export default function OpsPage() {
  const [activeTab, setActiveTab] = useState('command');

  useEffect(() => {
    const handleTabSwitch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && TABS.some(t => t.id === customEvent.detail)) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('switch-tab', handleTabSwitch);
    return () => window.removeEventListener('switch-tab', handleTabSwitch);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Operations Center</h1>
        <p className="text-muted-foreground mt-1">Bartlett Labs operational dashboard</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'text-primary bg-secondary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'command' && <CommandCenter />}
        {activeTab === 'timeline' && <ActivityTimeline />}
        {activeTab === 'streaks' && <StreakTracker />}
        {activeTab === 'projects' && <ProjectsBoard />}
        {activeTab === 'ideas' && <IdeasBoard />}
        {activeTab === 'pipeline' && <PipelineBoard />}
        {activeTab === 'prompts' && <PromptLibrary />}
        {activeTab === 'kyle' && <QueueBoard queueType="kyle" title="Kyle&apos;s Queue" icon="👤" />}
        {activeTab === 'knox' && <QueueBoard queueType="knox" title="Knox&apos;s Queue" icon="🔒" />}
        {activeTab === 'agents' && <AgentTasks />}
      </div>
    </div>
  );
}
