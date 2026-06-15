import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Head from '@docusaurus/Head';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React from 'react';

import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import styles from './index.module.css';

const IntegrationsLive = [
  {label: 'CrewAI', to: '/getting-started/crewai'},
  {label: 'CopilotKit', to: '/getting-started/copilotkit'},
  {label: 'Deep Agents', to: '/getting-started/deep-agents'},
  {label: 'LangChain', to: '/getting-started/langchain'},
  {label: 'LangGraph', to: '/getting-started/langgraph'},
  {label: 'Mastra', to: '/getting-started/mastra'},
  {label: 'Temporal', to: '/getting-started/temporal'},
];

const IntegrationsSoon = [
  {label: 'Cursor', to: '/getting-started/cursor'},
  {label: 'n8n', to: '/getting-started/n8n'},
  {label: 'OpenClaw', to: '/getting-started/openclaw'},
];

const CrewAISnippet = `from crewai import Crew, Process
from openbox import OpenBoxAgent, OpenBoxTask, create_openbox_engine

researcher = OpenBoxAgent(
    role="Researcher",
    goal="Find information",
    # Reads OPENBOX_RESEARCHER_API_KEY, _DID, _PRIVATE_KEY
    env_prefix="OPENBOX_RESEARCHER",
)

task = OpenBoxTask(
    description="Research AI governance patterns.",
    expected_output="A short summary.",
    agent=researcher,
    activity_type="research",
)

crew = Crew(
    agents=[researcher],
    tasks=[task],
    process=Process.sequential,
)

with create_openbox_engine() as engine:
    result = engine.govern(crew).kickoff()`;

const CopilotKitSnippet = `import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import {
  createOpenBoxCopilotKitAdapter,
  createOpenBoxCopilotRuntime,
} from "openbox-sdk/copilotkit";

const runner = new InMemoryAgentRunner();
const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphAgent({
      deploymentUrl: process.env.AGENT_URL ?? "http://localhost:8123",
      graphId: "openbox_copilotkit_agent",
      langsmithApiKey: process.env.LANGSMITH_API_KEY ?? "",
    }),
  },
  runner,
});

const openboxRuntime = createOpenBoxCopilotRuntime({
  runtime,
  runner,
  agents: ["default"],
  adapter: createOpenBoxCopilotKitAdapter({
    agentWorkflowType: "CopilotKitRuntime",
    taskQueue: "copilotkit-runtime",
  }),
});

const handler = createCopilotRuntimeHandler({
  runtime: openboxRuntime.runtime,
  basePath: "/api/copilotkit",
  hooks: openboxRuntime.hooks,
});

export const GET = handler;
export const POST = handler;`;

const DeepAgentsSnippet = `import os
from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model
from openbox_deepagent import create_openbox_middleware  # Added import

# Create OpenBox middleware
middleware = create_openbox_middleware(
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="ResearchBot",
    known_subagents=["researcher", "writer", "general-purpose"],
)

agent = create_deep_agent(
    model=init_chat_model("openai:gpt-4o-mini"),
    tools=[search_web, write_report, export_data],
    subagents=[
        {"name": "researcher", "tools": [search_web]},
        {"name": "writer", "tools": [write_report]},
    ],
    middleware=[middleware],  # Added middleware
)

result = await agent.ainvoke(
    {"messages": [{"role": "user", "content": "Research AI safety"}]},
    config={"configurable": {"thread_id": "session-001"}},
)`;

const LangChainSnippet = `import os

from langchain.agents import create_agent
from openbox_langchain import create_openbox_langchain_middleware

middleware = create_openbox_langchain_middleware(
    api_url=os.environ["OPENBOX_URL"],
    api_key=os.environ["OPENBOX_API_KEY"],
    agent_did=os.environ["OPENBOX_AGENT_DID"],
    agent_private_key=os.environ["OPENBOX_AGENT_PRIVATE_KEY"],
    agent_name="SupportAgent",
)

agent = create_agent(
    model="openai:gpt-4o",
    tools=[search_web, lookup_customer],
    middleware=[middleware],
)

result = agent.invoke({"messages": [("user", "Check this customer issue")]})`;

const LangGraphSnippet = `import os
from langgraph.graph import StateGraph, START, END, MessagesState
from openbox_langgraph import create_openbox_graph_handler  # Added import

graph = StateGraph(MessagesState)
graph.add_node("agent", call_model)
graph.add_node("tools", tool_node)
graph.add_edge(START, "agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile()

# Wrap with OpenBox governance
governed = create_openbox_graph_handler(
    graph=app,
    api_url=os.getenv("OPENBOX_URL"),
    api_key=os.getenv("OPENBOX_API_KEY"),
    agent_did=os.getenv("OPENBOX_AGENT_DID"),
    agent_private_key=os.getenv("OPENBOX_AGENT_PRIVATE_KEY"),
    agent_name="MyAgent",
)

result = await governed.ainvoke({"messages": [("user", "Hello")]})`;

const MastraSnippet = `import { Mastra } from "@mastra/core/mastra";
import { getOpenBoxRuntime, withOpenBox } from "@openbox-ai/openbox-mastra-sdk";
import { myAgent } from "./agents/my-agent";
import { myWorkflow } from "./workflows/my-workflow";
import { myTool } from "./tools/my-tool";

const mastra = new Mastra({
  agents: { myAgent },
  workflows: { myWorkflow },
  tools: { myTool }
});

export const governedMastra = await withOpenBox(mastra, {
  apiKey: process.env.OPENBOX_API_KEY,
  apiUrl: process.env.OPENBOX_URL,
  agentDid: process.env.OPENBOX_AGENT_DID,
  agentPrivateKey: process.env.OPENBOX_AGENT_PRIVATE_KEY
});

process.on("SIGTERM", async () => {
  await getOpenBoxRuntime(governedMastra)?.shutdown();
});`;

const TemporalSnippet = `import os
import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from openbox.plugin import OpenBoxPlugin  # Add OpenBox
from your_workflows import YourWorkflow
from your_activities import your_activity

async def main():
    client = await Client.connect("localhost:7233")

    worker = Worker(
        client,
        task_queue="agent-task-queue",
        workflows=[YourWorkflow],
        activities=[your_activity],
        # Add OpenBox plugin
        plugins=[OpenBoxPlugin(
            openbox_url=os.getenv("OPENBOX_URL"),
            openbox_api_key=os.getenv("OPENBOX_API_KEY"),
        )],
    )

    await worker.run()

asyncio.run(main())`;

const LifecyclePhases = [
  {
    num: '01',
    title: 'Assess',
    body: 'Baseline risk across 14 parameters → Trust Tier 1–4.',
    to: '/trust-lifecycle/assess',
  },
  {
    num: '02',
    title: 'Authorize',
    body: 'Guardrails → OPA policies → behavioral rules.',
    to: '/trust-lifecycle/authorize',
  },
  {
    num: '03',
    title: 'Monitor',
    body: 'Real-time runtime visibility, drift, cost, latency.',
    to: '/trust-lifecycle/monitor',
  },
  {
    num: '04',
    title: 'Verify',
    body: 'Goal alignment + tamper-proof Proof Certificates.',
    to: '/trust-lifecycle/verify',
  },
  {
    num: '05',
    title: 'Adapt',
    body: 'HITL approvals and policy suggestions from patterns.',
    to: '/trust-lifecycle/adapt',
  },
];

const ExploreSections = [
  {
    title: 'Try it out',
    links: [
      {label: 'Introduction', to: '/overview'},
      {label: 'Choose your integration', to: '/getting-started'},
      {label: 'Core concepts', to: '/core-concepts'},
    ],
  },
  {
    title: 'Agents',
    links: [
      {label: 'Overview', to: '/dashboard/agents'},
      {label: 'Registering agents', to: '/dashboard/agents/registering-agents'},
      {label: 'Trust lifecycle', to: '/trust-lifecycle'},
    ],
  },
  {
    title: 'Operations',
    links: [
      {label: 'Dashboard', to: '/dashboard'},
      {label: 'Approvals', to: '/approvals'},
      {label: 'Compliance', to: '/administration/compliance-and-audit'},
    ],
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroInner)}>
        <div>
          <span className={styles.heroLabel}>AI Trust Platform</span>
          <Heading as="h1" className={styles.heroTitle}>
            Trustworthy AI starts here
          </Heading>
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
          <div className={styles.heroCtas}>
            <Link className={clsx('button button--primary', styles.ctaPrimary)} to="/getting-started">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

const HelpfulLinks = [
  {
    labelPrefix: 'Need help with the docs?',
    labelLink: 'Email support',
    href: 'mailto:support@openbox.ai',
  },
  {
    labelPrefix: 'Join our community:',
    labelLink: 'Discord',
    href: 'https://discord.gg/YjRYvV6QJw',
  },
  {
    labelPrefix: 'Talk to us:',
    labelLink: 'Email sales',
    href: 'mailto:sales@openbox.ai',
  },
  {
    labelPrefix: 'For agents:',
    labelLink: 'Docs sitemap (llms.txt)',
    href: '/llms.txt',
  },
];

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Start governing AI agents in 5 minutes: Runtime policies, compliance automation, and cryptographic trust for any framework."
      wrapperClassName="homepage-no-footer">
      <Head>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'OpenBox Docs',
            url: 'https://docs.openbox.ai',
            description: 'Enterprise AI governance platform documentation.',
            publisher: {
              '@type': 'Organization',
              name: 'OpenBox AI',
              url: 'https://www.openbox.ai',
            },
          })}
        </script>
      </Head>
      <HomepageHeader />
      <main>
        <section className={styles.exploreSection}>
          <div className="container">
            <div className={styles.exploreGrid}>
              {ExploreSections.map((section) => (
                <div key={section.title} className={styles.exploreColumn}>
                  <div className={styles.exploreTitle}>{section.title}</div>
                  <div className={styles.exploreLinks}>
                    {section.links.map((l) => (
                      <Link key={l.to} className={styles.exploreLink} to={l.to}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className="container">
            <Heading as="h2" className={styles.featureHeading}>
              Works with the agent stack you already use
            </Heading>
            <p className={styles.featureKicker}>
              One SDK, no architectural changes. Your workflow engine remains the system of record.
            </p>
            <div className={styles.integrationsGrid}>
              {IntegrationsLive.map((item) => (
                <Link key={item.to} to={item.to} className={styles.integrationPill}>
                  {item.label}
                </Link>
              ))}
              {IntegrationsSoon.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={clsx(styles.integrationPill, styles.integrationPillSoon)}>
                  {item.label} <span className={styles.integrationSoonTag}>· soon</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className="container">
            <Heading as="h2" className={styles.featureHeading}>
              Integrate in 3 steps
            </Heading>
            <p className={styles.featureKicker}>
              Generate agent credentials, install the SDK, configure governance rules.
            </p>
            <div className={styles.tabsWrapper}>
              <Tabs groupId="quickstart-language" queryString>
                <TabItem value="crewai" label="CrewAI (Python)" default>
                  <CodeBlock language="python" title="crew.py">{CrewAISnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/crewai">
                    CrewAI quickstart →
                  </Link>
                </TabItem>
                <TabItem value="copilotkit" label="CopilotKit (TypeScript)">
                  <CodeBlock language="typescript" title="route.ts">{CopilotKitSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/copilotkit">
                    CopilotKit quickstart →
                  </Link>
                </TabItem>
                <TabItem value="deep-agents" label="Deep Agents (Python)">
                  <CodeBlock language="python" title="agent.py">{DeepAgentsSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/deep-agents">
                    Deep Agents quickstart →
                  </Link>
                </TabItem>
                <TabItem value="langchain" label="LangChain (Python)">
                  <CodeBlock language="python" title="agent.py">{LangChainSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/langchain">
                    LangChain quickstart →
                  </Link>
                </TabItem>
                <TabItem value="langgraph" label="LangGraph (Python)">
                  <CodeBlock language="python" title="agent.py">{LangGraphSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/langgraph">
                    LangGraph quickstart →
                  </Link>
                </TabItem>
                <TabItem value="mastra" label="Mastra (TypeScript)">
                  <CodeBlock language="typescript" title="src/mastra/index.ts">{MastraSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/mastra">
                    Mastra quickstart →
                  </Link>
                </TabItem>
                <TabItem value="temporal" label="Temporal (Python)">
                  <CodeBlock language="python" title="worker.py">{TemporalSnippet}</CodeBlock>
                  <Link className={styles.tabFooterLink} to="/getting-started/temporal">
                    Temporal quickstart →
                  </Link>
                </TabItem>
              </Tabs>
            </div>
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className="container">
            <Heading as="h2" className={styles.featureHeading}>
              The Trust Lifecycle
            </Heading>
            <p className={styles.featureKicker}>
              Five continuous phases that mirror the dashboard you operate every day.
            </p>
            <div className={styles.lifecycleGrid}>
              {LifecyclePhases.map((phase) => (
                <Link key={phase.num} to={phase.to} className={styles.lifecycleCard}>
                  <span className={styles.lifecycleNum}>{phase.num}</span>
                  <span className={styles.lifecycleTitle}>{phase.title}</span>
                  <span className={styles.lifecycleBody}>{phase.body}</span>
                </Link>
              ))}
            </div>
            <div className={styles.lifecycleFooter}>
              <Link to="/trust-lifecycle" className={styles.lifecycleFooterLink}>
                Read the full Trust Lifecycle overview →
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.helpSection}>
          <div className="container">
            <div className={styles.helpLinks}>
              {HelpfulLinks.map((item) => (
                <div key={item.labelLink} className={styles.helpRow}>
                  <span className={styles.helpIcon} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        opacity="0.55"
                      />
                      <path
                        d="M7.75 7.75a2.25 2.25 0 1 1 3.59 1.83c-.67.46-1.34.92-1.34 2.17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 14.25h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className={styles.helpText}>
                    <span className={styles.helpPrefix}>{item.labelPrefix} </span>
                    <a className={styles.helpLink} href={item.href}>
                      {item.labelLink}
                    </a>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
