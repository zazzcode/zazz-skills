# Framework Setup Guide

This document explains how to use zazz-skills with different agent frameworks and platforms.

---

## Overview

The zazz-skills collection is **framework-agnostic**. Each skill is a markdown file with:
- YAML frontmatter (name, description)
- System prompt + instructions
- Examples and references

You can load and use these skills with:
- **Warp** (oz CLI and web app)
- **Claude API** (Anthropic)
- **LangGraph** (LangChain)
- **CrewAI**
- **AutoGen** (Microsoft)
- **OpenAI Swarm** (experimental)
- **Kimi** (Moonshot AI)
- Custom implementations

---

## 1. Warp

### Directory Structure

Place skills in `.agents/skills/` (or `.warp/skills/`):

```bash
zazz-skills/
└── .agents/skills/
    ├── coordinator-agent/
    │   └── SKILL.md
    ├── worker-agent/
    │   └── SKILL.md
    └── qa-agent/
        └── SKILL.md
```

### Usage with oz CLI

```bash
# Run Coordinator skill
oz agent run --skill "coordinator-agent" \
  --prompt "Start deliverable DEL-001 from project APP"

# The skill is automatically discovered and loaded
# Warp handles agent spawning (workers, QA)
```

### Warp Agent Profiles

For multi-agent orchestration in Warp:

```bash
# Create agent profile for coordinator
oz agent profile create zazz-coordinator \
  --skill coordinator-agent \
  --model claude-3-5-sonnet

# Create agent profile for worker
oz agent profile create zazz-worker \
  --skill worker-agent \
  --model claude-3-5-sonnet

# Create agent profile for QA
oz agent profile create zazz-qa \
  --skill qa-agent \
  --model claude-3-5-sonnet

# Run with profiles
oz agent run --profile zazz-coordinator \
  --prompt "Start DEL-001"
```

### Communication in Warp

Agents communicate through:
- **Zazz Board API** (primary)
- **Local files** (`.zazz/agent-state.json`, etc.)

Warp's context is isolated per agent invocation, so communication is via API + files.

---

## 2. Claude API (Direct)

### Setup

```python
import anthropic
import json

client = anthropic.Anthropic(api_key="your-api-key")

# Load skill files
def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

coordinator_skill = load_skill("coordinator-agent")
worker_skill = load_skill("worker-agent")
qa_skill = load_skill("qa-agent")
```

### Coordinator Agent

```python
def run_coordinator_agent(deliverable_id):
    """Run coordinator for a single deliverable."""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        system=coordinator_skill,
        messages=[
            {
                "role": "user",
                "content": f"Start deliverable {deliverable_id}"
            }
        ]
    )
    
    return response.content[0].text
```

### Worker Agent (Polling)

```python
import time
import os

def run_worker_agent(agent_id, poll_interval=15):
    """Worker agent that polls for tasks."""
    
    while True:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            system=worker_skill,
            messages=[
                {
                    "role": "user",
                    "content": f"Agent ID: {agent_id}. Poll for available tasks and execute one if found."
                }
            ]
        )
        
        print(f"Worker {agent_id}: {response.content[0].text}")
        
        # Check if task completed
        with open(f"{os.getenv('ZAZZ_STATE_DIR')}/agent-state.json") as f:
            state = json.load(f)
            if not any(t for t in state.get("tasks", []) if t["status"] == "TO_DO"):
                break
        
        time.sleep(poll_interval)
```

### QA Agent

```python
def run_qa_agent():
    """Run QA agent."""
    
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        system=qa_skill,
        messages=[
            {
                "role": "user",
                "content": "Verify the completed deliverable and create PR if all checks pass."
            }
        ]
    )
    
    return response.content[0].text
```

### Full Orchestration

```python
def orchestrate_deliverable(deliverable_id, num_workers=2):
    """Orchestrate a complete deliverable workflow."""
    
    print(f"Starting deliverable {deliverable_id}")
    
    # Phase 1: Coordinator planning
    coordinator_output = run_coordinator_agent(deliverable_id)
    print(f"Coordinator created task graph:\n{coordinator_output}\n")
    
    # Phase 2: Workers implementation (parallel)
    import threading
    worker_threads = []
    for i in range(num_workers):
        t = threading.Thread(
            target=run_worker_agent,
            args=(f"worker_{i+1}",)
        )
        t.start()
        worker_threads.append(t)
    
    # Wait for all workers
    for t in worker_threads:
        t.join()
    
    # Phase 3-4: QA
    qa_output = run_qa_agent()
    print(f"QA complete:\n{qa_output}")

# Run it
orchestrate_deliverable("DEL-001", num_workers=2)
```

---

## 3. LangGraph

### Setup

```python
from langgraph.graph import StateGraph
from langchain_anthropic import ChatAnthropic

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
coordinator_skill = load_skill("coordinator-agent")
worker_skill = load_skill("worker-agent")
qa_skill = load_skill("qa-agent")
```

### Graph Definition

```python
from typing import TypedDict
from langgraph.graph import END

class WorkflowState(TypedDict):
    deliverable_id: str
    task_graph: dict
    tasks_completed: int
    rework_cycles: int
    pr_created: bool

def coordinator_node(state: WorkflowState):
    """Coordinator: Plan and create task graph."""
    response = llm.invoke([
        {
            "role": "system",
            "content": coordinator_skill
        },
        {
            "role": "user",
            "content": f"Start deliverable {state['deliverable_id']}"
        }
    ])
    
    return {
        **state,
        "task_graph": response.content,  # simplified
        "tasks_completed": 0
    }

def workers_node(state: WorkflowState):
    """Workers: Execute tasks."""
    response = llm.invoke([
        {
            "role": "system",
            "content": worker_skill
        },
        {
            "role": "user",
            "content": "Execute all available tasks"
        }
    ])
    
    return {
        **state,
        "tasks_completed": len(state["task_graph"])  # simplified
    }

def qa_node(state: WorkflowState):
    """QA: Verify and create PR."""
    response = llm.invoke([
        {
            "role": "system",
            "content": qa_skill
        },
        {
            "role": "user",
            "content": "Run QA checks and create PR if all pass"
        }
    ])
    
    return {
        **state,
        "pr_created": True
    }

# Build graph
workflow = StateGraph(WorkflowState)
workflow.add_node("coordinator", coordinator_node)
workflow.add_node("workers", workers_node)
workflow.add_node("qa", qa_node)

workflow.add_edge("coordinator", "workers")
workflow.add_edge("workers", "qa")
workflow.add_edge("qa", END)

workflow.set_entry_point("coordinator")
app = workflow.compile()

# Run it
result = app.invoke({"deliverable_id": "DEL-001"})
```

---

## 4. CrewAI

### Setup

```python
from crewai import Agent, Task, Crew
import json

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()
```

### Agent Definitions

```python
coordinator_agent = Agent(
    role="Zazz Coordinator",
    goal="Orchestrate deliverable workflow",
    backstory=load_skill("coordinator-agent"),
    tools=[...],  # Zazz Board API tools
    verbose=True
)

worker_agent = Agent(
    role="Zazz Worker",
    goal="Implement tasks autonomously",
    backstory=load_skill("worker-agent"),
    tools=[...],  # Git, file operations tools
    verbose=True
)

qa_agent = Agent(
    role="Zazz QA",
    goal="Verify quality and create PRs",
    backstory=load_skill("qa-agent"),
    tools=[...],  # Test, security scan tools
    verbose=True
)
```

### Task Definitions

```python
plan_task = Task(
    description="Select deliverable DEL-001 and create task graph",
    agent=coordinator_agent,
    expected_output="Task graph with dependencies"
)

implement_task = Task(
    description="Execute all tasks from the task graph",
    agent=worker_agent,
    expected_output="All tasks completed with commits"
)

qa_task = Task(
    description="Verify AC, run tests, create PR",
    agent=qa_agent,
    expected_output="PR created and deliverable IN_REVIEW"
)
```

### Crew Orchestration

```python
crew = Crew(
    agents=[coordinator_agent, worker_agent, qa_agent],
    tasks=[plan_task, implement_task, qa_task],
    verbose=2
)

result = crew.kickoff(inputs={"deliverable_id": "DEL-001"})
```

---

## 5. AutoGen (Microsoft)

### Setup

```python
import autogen
from autogen import AssistantAgent, UserProxyAgent

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

config_list = [
    {
        "model": "gpt-4",
        "api_key": "your-api-key"
    }
]
```

### Agent Definitions

```python
coordinator = AssistantAgent(
    name="Coordinator",
    system_message=load_skill("coordinator-agent"),
    llm_config={"config_list": config_list}
)

worker = AssistantAgent(
    name="Worker",
    system_message=load_skill("worker-agent"),
    llm_config={"config_list": config_list}
)

qa = AssistantAgent(
    name="QA",
    system_message=load_skill("qa-agent"),
    llm_config={"config_list": config_list}
)

user_proxy = UserProxyAgent(
    name="User",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    code_execution_config={"work_dir": "."}
)
```

### Multi-Agent Conversation

```python
# Coordinator starts
user_proxy.initiate_chat(
    coordinator,
    message="Start deliverable DEL-001"
)

# Coordinator hands off to workers
# Workers communicate with each other and coordinator
# QA takes over after workers done
```

---

## 6. OpenAI Swarm (Experimental)

### Setup

```python
from swarm import Swarm, Agent

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

client = Swarm(api_key="your-api-key")
```

### Agent Definitions with Handoffs

```python
coordinator_agent = Agent(
    name="Coordinator",
    instructions=load_skill("coordinator-agent"),
    functions=[create_task_graph, get_deliverable, ...]
)

worker_agent = Agent(
    name="Worker",
    instructions=load_skill("worker-agent"),
    functions=[get_available_tasks, implement_task, commit_changes, ...]
)

qa_agent = Agent(
    name="QA",
    instructions=load_skill("qa-agent"),
    functions=[verify_ac, run_tests, create_pr, ...]
)

# Agent functions can include handoffs
def handoff_to_workers():
    return worker_agent

def handoff_to_qa():
    return qa_agent

coordinator_agent.functions.append(
    {
        "name": "handoff_to_workers",
        "description": "Hand off to workers to execute tasks",
        "function": handoff_to_workers
    }
)

coordinator_agent.functions.append(
    {
        "name": "handoff_to_qa",
        "description": "Hand off to QA agent",
        "function": handoff_to_qa
    }
)
```

### Swarm Execution

```python
messages = [
    {
        "role": "user",
        "content": "Start deliverable DEL-001"
    }
]

agent = coordinator_agent
while True:
    response = client.run(
        agent=agent,
        messages=messages
    )
    
    if response.agent:
        agent = response.agent  # Handoff to next agent
    
    messages.append({"role": "assistant", "content": response.output})
    
    if not response.agent:  # No more handoffs
        break

print(f"Final output: {response.output}")
```

---

## 7. Kimi (Moonshot AI)

### Setup

Kimi uses a similar API to Claude. Implementation is nearly identical to Claude API approach.

```python
import requests
import json

KIMI_API_BASE = "https://api.moonshot.cn/v1"
KIMI_API_KEY = "your-kimi-api-key"

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

manager_skill = load_skill("coordinator-agent")
worker_skill = load_skill("worker-agent")
qa_skill = load_skill("qa-agent")
```

### Coordinator Agent

```python
def run_coordinator_with_kimi(deliverable_id):
    """Run coordinator agent using Kimi API."""
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "moonshot-v1-32k",
        "messages": [
            {
                "role": "system",
                "content": coordinator_skill
            },
            {
                "role": "user",
                "content": f"Start deliverable {deliverable_id}"
            }
        ],
        "temperature": 0.3
    }
    
    response = requests.post(
        f"{KIMI_API_BASE}/chat/completions",
        headers=headers,
        json=payload
    )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]
```

### Worker Agent (Polling)

```python
import time
import os

def run_worker_with_kimi(agent_id, poll_interval=15):
    """Worker agent using Kimi API."""
    
    while True:
        headers = {
            "Authorization": f"Bearer {KIMI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "moonshot-v1-32k",
            "messages": [
                {
                    "role": "system",
                    "content": worker_skill
                },
                {
                    "role": "user",
                    "content": f"Agent ID: {agent_id}. Poll for tasks and execute one."
                }
            ],
            "temperature": 0.3
        }
        
        response = requests.post(
            f"{KIMI_API_BASE}/chat/completions",
            headers=headers,
            json=payload
        )
        
        result = response.json()
        output = result["choices"][0]["message"]["content"]
        print(f"Worker {agent_id}: {output}")
        
        # Check completion
        state_dir = os.getenv("ZAZZ_STATE_DIR")
        with open(f"{state_dir}/agent-state.json") as f:
            state = json.load(f)
            if not any(t for t in state.get("tasks", []) if t["status"] == "TO_DO"):
                break
        
        time.sleep(poll_interval)
```

### QA Agent

```python
def run_qa_with_kimi():
    """QA agent using Kimi API."""
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "moonshot-v1-32k",
        "messages": [
            {
                "role": "system",
                "content": qa_skill
            },
            {
                "role": "user",
                "content": "Verify AC, run tests, create PR"
            }
        ],
        "temperature": 0.3
    }
    
    response = requests.post(
        f"{KIMI_API_BASE}/chat/completions",
        headers=headers,
        json=payload
    )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]
```

### Full Kimi Orchestration

```python
def orchestrate_with_kimi(deliverable_id, num_workers=2):
    """Complete workflow using Kimi."""
    
    print(f"Starting {deliverable_id} with Kimi")
    
    # Phase 1: Coordinator
    coordinator_output = run_coordinator_with_kimi(deliverable_id)
    print(f"Coordinator:\n{coordinator_output}\n")
    
    # Phase 2: Workers (parallel)
    import threading
    threads = []
    for i in range(num_workers):
        t = threading.Thread(
            target=run_worker_with_kimi,
            args=(f"worker_{i+1}",)
        )
        t.start()
        threads.append(t)
    
    for t in threads:
        t.join()
    
    # Phase 3-4: QA
    qa_output = run_qa_with_kimi()
    print(f"QA:\n{qa_output}")

# Run it
orchestrate_with_kimi("DEL-001")
```

---

## 7.5 Kimi Agent Swarm (Advanced)

Kimi's **Agent Swarm** capability allows dynamic creation and coordination of up to 100 specialized sub-agents using Parallel Agent Reinforcement Learning (PARL). This is ideal for zazz-skills orchestration as it enables autonomous task decomposition and parallel execution.

### Setup with Agent Swarm

```python
import requests
import json
import time

KIMI_API_BASE = "https://api.moonshot.cn/v1"
KIMI_API_KEY = "your-kimi-api-key"

def load_skill(skill_name):
    with open(f".agents/skills/{skill_name}/SKILL.md", "r") as f:
        return f.read()

manager_skill = load_skill("coordinator-agent")
worker_skill = load_skill("worker-agent")
qa_skill = load_skill("qa-agent")
```

### Coordinator Agent with Agent Swarm

```python
def run_coordinator_swarm(deliverable_id):
    """Run coordinator using Kimi Agent Swarm to coordinate workers."""
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "moonshot-v1-32k",
        "messages": [
            {
                "role": "system",
                "content": coordinator_skill + "\n\n[AGENT_SWARM_MODE] You can create and coordinate up to 100 sub-agents. Each worker will be spawned as a specialized agent."
            },
            {
                "role": "user",
                "content": f"Start deliverable {deliverable_id}. Create task graph and spawn worker agents for parallel execution."
            }
        ],
        "temperature": 0.3,
        "enable_agent_swarm": True,  # Enable Agent Swarm mode
        "max_agents": 100,           # Allow up to 100 workers
        "swarm_strategy": "parl"     # Use Parallel Agent Reinforcement Learning
    }
    
    response = requests.post(
        f"{KIMI_API_BASE}/chat/completions",
        headers=headers,
        json=payload
    )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]
```

### Worker Sub-Agents (Spawned by Swarm)

```python
def run_worker_swarm_agent(task_id, task_description):
    """Individual worker spawned by Agent Swarm."""
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "moonshot-v1-32k",
        "messages": [
            {
                "role": "system",
                "content": worker_skill
            },
            {
                "role": "user",
                "content": f"Task ID: {task_id}\nDescription: {task_description}\nExecute this task and commit changes."
            }
        ],
        "temperature": 0.3
    }
    
    response = requests.post(
        f"{KIMI_API_BASE}/chat/completions",
        headers=headers,
        json=payload
    )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]
```

### QA Agent with Swarm Coordination

```python
def run_qa_with_swarm():
    """QA agent that monitors swarm execution and validates results."""
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "moonshot-v1-32k",
        "messages": [
            {
                "role": "system",
                "content": qa_skill + "\n\n[SWARM_CONTEXT] You are reviewing work completed by a swarm of worker agents. Verify all acceptance criteria across parallel executions."
            },
            {
                "role": "user",
                "content": "Verify all tasks completed by the worker swarm. Run integration tests, validate AC, and create PR if all checks pass."
            }
        ],
        "temperature": 0.3,
        "enable_agent_swarm": True
    }
    
    response = requests.post(
        f"{KIMI_API_BASE}/chat/completions",
        headers=headers,
        json=payload
    )
    
    result = response.json()
    return result["choices"][0]["message"]["content"]
```

### Full Orchestration with Agent Swarm

```python
def orchestrate_with_agent_swarm(deliverable_id):
    """Complete zazz-skills workflow using Kimi Agent Swarm.
    
    The swarm automatically:
    - Creates specialized worker agents based on task types
    - Distributes tasks across agents using PARL
    - Monitors agent progress and handles failures
    - Synchronizes results and dependencies
    """
    
    print(f"Starting {deliverable_id} with Kimi Agent Swarm")
    print(f"Max workers: 100, Strategy: PARL (Parallel Agent Reinforcement Learning)\n")
    
    # Phase 1: Coordinator creates task graph and spawns workers
    print("[PHASE 1] Coordinator Planning & Worker Spawning")
    coordinator_output = run_coordinator_swarm(deliverable_id)
    print(f"Coordinator Output:\n{coordinator_output}\n")
    
    # Phase 2: Workers execute in parallel (managed by swarm)
    print("[PHASE 2] Workers Executing in Parallel")
    print("Agent Swarm is coordinating task execution...")
    
    # In real implementation, the swarm handles worker spawning
    # Here we simulate checking swarm status
    time.sleep(2)
    
    swarm_status = {
        "active_agents": 5,
        "tasks_completed": 12,
        "tasks_in_progress": 3,
        "tasks_failed": 0,
        "execution_time_sec": 45
    }
    
    print(f"Swarm Status: {json.dumps(swarm_status, indent=2)}\n")
    
    # Phase 3-4: QA validates all worker output
    print("[PHASE 3-4] QA Validation & PR Creation")
    qa_output = run_qa_with_swarm()
    print(f"QA Output:\n{qa_output}")
    
    print(f"\n✓ Deliverable {deliverable_id} completed with Agent Swarm")

# Run it
orchestrate_with_agent_swarm("DEL-001")
```

### Benefits of Agent Swarm for zazz-skills

1. **Parallel Task Execution** - Multiple workers run simultaneously, reducing overall execution time
2. **Dynamic Worker Spawning** - Creates agents on-demand based on task complexity and type
3. **PARL Intelligence** - Uses reinforcement learning to optimize task distribution
4. **Automatic Synchronization** - Respects task dependencies while maximizing parallelism
5. **Failure Resilience** - Swarm handles worker failures and redistributes work
6. **Scalability** - Supports up to 100 agents for large, complex deliverables

### Environment Variables for Agent Swarm

```bash
# Kimi Agent Swarm specific
export KIMI_ENABLE_SWARM=true
export KIMI_MAX_AGENTS=100
export KIMI_SWARM_STRATEGY="parl"  # or "sequential", "round_robin"
export KIMI_AGENT_TIMEOUT_SEC=300
export KIMI_SWARM_MONITORING=true  # Enable swarm progress monitoring
```

---

## 8. Custom Implementation

For custom frameworks or implementations:

```python
# Pseudocode
class ZazzAgent:
    def __init__(self, role, skill_name):
        self.role = role
        self.skill = self.load_skill(skill_name)
        self.agent_id = f"{role}_1"
        self.llm = your_llm_provider
    
    def load_skill(self, skill_name):
        with open(f".agents/skills/{skill_name}/SKILL.md") as f:
            return f.read()
    
    def invoke(self, user_message):
        """Call LLM with skill as system prompt."""
        return self.llm.invoke(
            system=self.skill,
            messages=[{"role": "user", "content": user_message}]
        )

# Usage
coordinator = ZazzAgent("coordinator", "coordinator-agent")
output = coordinator.invoke("Start deliverable DEL-001")

worker = ZazzAgent("worker", "worker-agent")
output = worker.invoke("Poll for tasks")

qa = ZazzAgent("qa", "qa-agent")
output = qa.invoke("Verify and create PR")
```

---

## Environment Variables (All Frameworks)

```bash
export ZAZZ_API_BASE_URL="http://localhost:3000"
export ZAZZ_API_TOKEN="your-token"
export AGENT_ID="coordinator|worker_1|qa"
export AGENT_ROLE="coordinator|worker|qa"
export ZAZZ_WORKSPACE="/path/to/project"
export ZAZZ_STATE_DIR="${ZAZZ_WORKSPACE}/.zazz"

# LLM provider
export LLM_PROVIDER="anthropic|openai|kimi"
export LLM_API_KEY="your-api-key"
export LLM_MODEL="claude-3-5-sonnet|gpt-4|moonshot-v1-32k"
```

---

## Recommended Approach

**For learning/testing:** Use Claude API directly (simplest)

**For Warp users:** Use oz CLI with skills in `.agents/skills/`

**For teams:** Use CrewAI (best developer experience)

**For production:** Use LangGraph (best observability/persistence)

**For experiments:** Use Swarm (fastest to prototype)

**For Chinese models:** Use Kimi implementation

---

## Next Steps

1. Choose your framework
2. Set environment variables
3. Load the three skills from `.agents/skills/`
4. Implement agent orchestration following examples above
5. Test with single deliverable
6. Monitor with `.zazz/audit.log` and agent-state.json

See **README.md** for next steps.
