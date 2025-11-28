import { bridgeStatus, getClusterTopology, pingNode } from '../../bridge/avot';
import { markUpdateApplied, previewUpdate } from '../../suc/spm';
import { createGoal, listGoals, getGoal, completeGoal, failGoal } from '../goals/planner';
import { getRecentReflections, runReflectionTick } from '../autonomy/reflection';
import { getStatusSnapshot, refreshStatus } from '../autonomy/sucController';
import { createTask, inspectTask, listTasks, cancelTask } from '../tasks/engine';
import { getShortTermMemory } from '../memory/stm';
import { getViolations, violationSummary } from '../memory/violations';
import { getKernelState, logInfo } from '../autonomy/kernel';
import { getWorldState, loadWorldState } from '../../fortress/world/WorldState';
import { getGrid } from '../../fortress/world/WorldGrid';
import { buildingMetadata, getBuildingModule, listBuildings as listFortressBuildings } from '../../fortress/core/Registry';
import { getIAmProfile } from '../../fortress/core/IAmNode';
import { getAvot, listAvots, setAvotLocation, setAvotMood } from '../../fortress/avots/AvotRegistry';
import { getDialogue } from '../../fortress/avots/DialogueEngine';
import { getTraits } from '../../fortress/core/Traits';
import { activateSpatialMode, deactivateSpatialMode, getSpatialState, toggleSpatialModeState } from '../../spatial/SpatialContext';
import { CommandDefinition, CommandHandlerResult, CommandContext } from './types';

const registry = new Map<string, CommandDefinition>();

export const registerCommand = (def: CommandDefinition): void => {
  registry.set(def.id, def);
};

export const getCommand = (id: string): CommandDefinition | undefined => registry.get(id);

export const listCommands = (): CommandDefinition[] => Array.from(registry.values());

const navigateToFortress = (buildingId?: string): void => {
  if (typeof window === 'undefined') return;
  if (buildingId) {
    window.sessionStorage.setItem('fortress.initialSelection', buildingId);
  }
  window.dispatchEvent(new CustomEvent('sib:navigate', { detail: { path: '/fortress', buildingId } }));
};

const navigateToFortressSpatial = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sib:navigate', { detail: { path: '/fortress/spatial' } }));
};

const resolveSpatialControls = (
  ctx: CommandContext,
): {
  enterSpatialMode: typeof activateSpatialMode;
  exitSpatialMode: typeof deactivateSpatialMode;
  toggleSpatialMode: typeof toggleSpatialModeState;
  getSpatialState: typeof getSpatialState;
} => {
  if (ctx.spatial) {
    return ctx.spatial;
  }
  return {
    enterSpatialMode: activateSpatialMode,
    exitSpatialMode: deactivateSpatialMode,
    toggleSpatialMode: toggleSpatialModeState,
    getSpatialState: getSpatialState,
  };
};

const helpCommand: CommandDefinition = {
  id: 'help',
  description: 'List available commands',
  handler: () => {
    const commands = listCommands().map((c) => ({ id: c.id, description: c.description ?? '' }));
    return {
      status: 'ok',
      message: 'Available commands',
      payload: commands,
    } satisfies CommandHandlerResult;
  },
};

const pingCommand: CommandDefinition = {
  id: 'ping',
  description: 'Return kernel status and uptime',
  handler: () => {
    const state = getKernelState();
    const uptimeMs = Date.now() - state.startedAt.getTime();
    return {
      status: 'ok',
      message: 'pong',
      payload: {
        uptimeMs,
        sessionId: state.sessionId,
        commandCount: state.commandCount,
      },
      followups: ['state.snapshot', 'log.tail'],
    } satisfies CommandHandlerResult;
  },
};

const snapshotCommand: CommandDefinition = {
  id: 'state.snapshot',
  description: 'Dump current autonomy kernel state',
  handler: () => ({
    status: 'ok',
    message: 'Kernel snapshot',
    payload: getKernelState(),
  }),
};

const toggleThemeCommand: CommandDefinition = {
  id: 'ui.theme.toggle',
  description: 'Toggle the Sovereign UI theme',
  handler: (_, ctx) => {
    ctx.toggleTheme();
    const state = getKernelState();
    logInfo('ui.theme', 'Theme toggled');
    return {
      status: 'ok',
      message: 'Theme toggled',
      payload: { commandCount: state.commandCount },
    };
  },
};

const logTailCommand: CommandDefinition = {
  id: 'log.tail',
  description: 'Return the latest log entries',
  handler: (args) => {
    const count = args.args[0] ? Number.parseInt(args.args[0], 10) : 20;
    const safeCount = Number.isFinite(count) && count > 0 ? Math.min(count, 100) : 20;
    const state = getKernelState();
    const start = Math.max(0, state.log.length - safeCount);
    const entries = state.log.slice(start);
    return {
      status: 'ok',
      message: `Showing last ${entries.length} log entries`,
      payload: entries,
    };
  },
};

const taskNewCommand: CommandDefinition = {
  id: 'task.new',
  description: 'Create a new autonomy task',
  handler: (args) => {
    const description = args.rawArgs.trim();
    if (!description) {
      return { status: 'error', message: 'Description is required' };
    }
    const task = createTask(description);
    return { status: 'ok', message: `Task created (${task.id})`, payload: task };
  },
};

const taskListCommand: CommandDefinition = {
  id: 'task.list',
  description: 'List current autonomy tasks',
  handler: () => ({ status: 'ok', message: 'Current tasks', payload: listTasks() }),
};

const taskInspectCommand: CommandDefinition = {
  id: 'task.inspect',
  description: 'Inspect a specific task by id',
  handler: (args) => {
    const id = args.args[0];
    if (!id) return { status: 'error', message: 'Task id required' };
    const task = inspectTask(id);
    if (!task) return { status: 'error', message: `Task not found: ${id}` };
    return { status: 'ok', message: `Task ${id}`, payload: task };
  },
};

const taskCancelCommand: CommandDefinition = {
  id: 'task.cancel',
  description: 'Cancel a queued or running task',
  handler: (args) => {
    const id = args.args[0];
    if (!id) return { status: 'error', message: 'Task id required' };
    const ok = cancelTask(id);
    return ok
      ? { status: 'ok', message: `Task ${id} cancelled` }
      : { status: 'error', message: `Unable to cancel task ${id}` };
  },
};

const memoryStmCommand: CommandDefinition = {
  id: 'memory.stm',
  description: 'Inspect short-term memory cache',
  handler: () => ({ status: 'ok', message: 'STM snapshot', payload: getShortTermMemory() }),
};

const goalNewCommand: CommandDefinition = {
  id: 'goal.new',
  description: 'Create a new goal with optional description',
  handler: (args) => {
    const quoteMatch = args.rawArgs.match(/\"([^\"]+)\"/);
    const title = quoteMatch?.[1] ?? args.args[0];
    if (!title) return { status: 'error', message: 'Goal title is required' };
    const description = quoteMatch ? args.rawArgs.replace(quoteMatch[0], '').trim() : args.args.slice(1).join(' ');
    const goal = createGoal(title, description || undefined);
    return { status: 'ok', message: `Goal created (${goal.id})`, payload: goal };
  },
};

const goalListCommand: CommandDefinition = {
  id: 'goal.list',
  description: 'List current goals',
  handler: () => ({ status: 'ok', message: 'Goals', payload: listGoals() }),
};

const goalInspectCommand: CommandDefinition = {
  id: 'goal.inspect',
  description: 'Inspect a goal by id',
  handler: (args) => {
    const goalId = args.args[0];
    if (!goalId) return { status: 'error', message: 'Goal id required' };
    const goal = getGoal(goalId);
    if (!goal) return { status: 'error', message: `Goal not found: ${goalId}` };
    return { status: 'ok', message: `Goal ${goalId}`, payload: goal };
  },
};

const goalCompleteCommand: CommandDefinition = {
  id: 'goal.complete',
  description: 'Complete a goal with a summary',
  handler: (args) => {
    const goalId = args.args[0];
    const summaryMatch = args.rawArgs.match(/\"([^\"]+)\"/);
    const summary = summaryMatch?.[1];
    if (!goalId) return { status: 'error', message: 'Goal id required' };
    const updated = completeGoal(goalId, summary ?? undefined);
    if (!updated) return { status: 'error', message: `Goal not found: ${goalId}` };
    return { status: 'ok', message: `Goal ${goalId} completed`, payload: updated };
  },
};

const goalFailCommand: CommandDefinition = {
  id: 'goal.fail',
  description: 'Mark a goal as failed with a reason',
  handler: (args) => {
    const goalId = args.args[0];
    const reasonMatch = args.rawArgs.match(/\"([^\"]+)\"/);
    const reason = reasonMatch?.[1];
    if (!goalId) return { status: 'error', message: 'Goal id required' };
    const updated = failGoal(goalId, reason ?? 'No reason provided');
    if (!updated) return { status: 'error', message: `Goal not found: ${goalId}` };
    return { status: 'ok', message: `Goal ${goalId} failed`, payload: updated };
  },
};

const reflectNowCommand: CommandDefinition = {
  id: 'reflect.now',
  description: 'Run a reflection tick immediately',
  handler: () => {
    const reflection = runReflectionTick();
    return { status: 'ok', message: 'Reflection captured', payload: reflection };
  },
};

const reflectListCommand: CommandDefinition = {
  id: 'reflect.list',
  description: 'List recent reflections',
  handler: () => ({ status: 'ok', message: 'Recent reflections', payload: getRecentReflections() }),
};

const bridgeClusterCommand: CommandDefinition = {
  id: 'bridge.cluster',
  description: 'Show AVOT cluster topology',
  handler: () => ({ status: 'ok', message: 'AVOT cluster topology', payload: getClusterTopology() }),
};

const bridgePingCommand: CommandDefinition = {
  id: 'bridge.ping',
  description: 'Ping a specific AVOT node',
  handler: async (args) => {
    const nodeId = args.args[0];
    if (!nodeId) return { status: 'error', message: 'Node id required' };
    const result = await pingNode(nodeId);
    return { status: 'ok', message: `Ping ${nodeId}: ${result}`, payload: { nodeId, result } };
  },
};

const guardrailStatusCommand: CommandDefinition = {
  id: 'guardrails.status',
  description: 'Show guardrail violation counts',
  handler: () => ({ status: 'ok', message: 'Guardrail status', payload: violationSummary() }),
};

const guardrailViolationsCommand: CommandDefinition = {
  id: 'guardrails.violations',
  description: 'List recent guardrail violations',
  handler: () => ({ status: 'ok', message: 'Recent guardrail violations', payload: getViolations() }),
};

const bridgeStatusCommand: CommandDefinition = {
  id: 'bridge.status',
  description: 'Show AVOT bridge status',
  handler: () => ({ status: 'ok', message: 'Bridge status', payload: bridgeStatus() }),
};

const updateStatusCommand: CommandDefinition = {
  id: 'update.status',
  description: 'Show Sovereign Update Chain status',
  handler: async () => {
    await refreshStatus();
    const snapshot = getStatusSnapshot();
    const lastChecked = snapshot.lastUpdateCheckAt
      ? new Date(snapshot.lastUpdateCheckAt).toLocaleTimeString()
      : 'never';
    return {
      status: 'ok',
      message: `System ${snapshot.systemVersion}: ${snapshot.appliedCount} applied / ${snapshot.pendingCount} available (last check: ${lastChecked}). Fortress OS: ${snapshot.fortressVersionLabel}. Spatial Mode: ${snapshot.spatialSupport}.`,
      payload: snapshot,
    } satisfies CommandHandlerResult;
  },
};

const updateListCommand: CommandDefinition = {
  id: 'update.list',
  description: 'List available SUC updates',
  handler: async () => {
    await refreshStatus();
    const snapshot = getStatusSnapshot();
    const summary = snapshot.available.map((item) => ({
      id: item.id,
      version: item.version,
      title: item.title,
      safetyLevel: item.safetyLevel,
    }));
    return {
      status: 'ok',
      message: `${summary.length} available update(s)`,
      payload: summary,
    } satisfies CommandHandlerResult;
  },
};

const updatePreviewCommand: CommandDefinition = {
  id: 'update.preview',
  description: 'Preview a Sovereign Update manifest',
  handler: async (args) => {
    const id = args.args[0];
    if (!id) return { status: 'error', message: 'Update id required' } satisfies CommandHandlerResult;
    const manifest = await previewUpdate(id);
    if (!manifest) return { status: 'error', message: `Update not found: ${id}` } satisfies CommandHandlerResult;
    return {
      status: 'ok',
      message: `Previewing update ${id}`,
      payload: {
        id: manifest.id,
        version: manifest.version,
        scope: manifest.scope,
        affects: manifest.affects ?? [],
        migrationNotes: manifest.migrationNotes ?? [],
        safetyLevel: manifest.safetyLevel,
        manifest,
      },
    } satisfies CommandHandlerResult;
  },
};

const updateMarkAppliedCommand: CommandDefinition = {
  id: 'update.mark-applied',
  description: 'Mark an update as applied with optional notes',
  handler: async (args) => {
    const id = args.args[0];
    const notes = args.args.slice(1).join(' ') || undefined;
    if (!id) return { status: 'error', message: 'Update id required' } satisfies CommandHandlerResult;
    const record = await markUpdateApplied(id, notes);
    if (!record) return { status: 'error', message: `Unable to mark update ${id} as applied` } satisfies CommandHandlerResult;
    await refreshStatus();
    const snapshot = getStatusSnapshot();
    return {
      status: 'ok',
      message: `Update ${id} marked as applied.`,
      payload: { record, status: snapshot },
    } satisfies CommandHandlerResult;
  },
};

const fortressStatusCommand: CommandDefinition = {
  id: 'fortress.status',
  description: 'Show Fortress OS status and grid',
  handler: () => {
    loadWorldState();
    const world = getWorldState();
    const grid = getGrid();
    const profile = getIAmProfile();

    return {
      status: 'ok',
      message: `Fortress OS ${world.worldVersion} ready with ${world.unlockedBuildings.length} buildings unlocked.`,
      payload: {
        townHall: {
          id: profile.id,
          title: profile.title,
          coherenceIndex: profile.coherenceIndex,
          essenceSignature: profile.essenceSignature,
        },
        grid,
        unlockedBuildings: world.unlockedBuildings,
        bindToIAmNode: world.bindToIAmNode,
      },
    } satisfies CommandHandlerResult;
  },
};

const fortressOpenCommand: CommandDefinition = {
  id: 'fortress.open',
  description: 'Open Fortress OS view',
  handler: () => {
    navigateToFortress();
    return { status: 'ok', message: 'Opening Fortress OS view.' } satisfies CommandHandlerResult;
  },
};

const fortressSpatialCommand: CommandDefinition = {
  id: 'fortress.spatial',
  description: 'Enter Fortress spatial mode simulation',
  handler: (_, ctx) => {
    const controls = resolveSpatialControls(ctx);
    const state = controls.getSpatialState();
    const targetMode = state.supported ? state.mode : 'simulated';
    const next = controls.enterSpatialMode(targetMode);
    navigateToFortressSpatial();
    logInfo('fortress.spatial', '[SPATIAL] Entered Fortress spatial mode.');
    return {
      status: 'ok',
      message: state.supported
        ? 'Spatial mode activated. Opening Fortress Spatial Shell.'
        : 'Spatial simulation mode activated (no XR capability detected).',
      payload: next,
    } satisfies CommandHandlerResult;
  },
};

const fortressSpatialOffCommand: CommandDefinition = {
  id: 'fortress.spatial.off',
  description: 'Exit Fortress spatial mode',
  handler: (_, ctx) => {
    const controls = resolveSpatialControls(ctx);
    const next = controls.exitSpatialMode();
    logInfo('fortress.spatial', '[SPATIAL] Exited Fortress spatial mode.');
    return { status: 'ok', message: 'Spatial mode deactivated.', payload: next } satisfies CommandHandlerResult;
  },
};

const fortressBuildingsCommand: CommandDefinition = {
  id: 'fortress.buildings',
  description: 'List Fortress OS building metadata',
  handler: () => ({
    status: 'ok',
    message: `${buildingMetadata.length} Fortress building modules`,
    payload: listFortressBuildings(),
  }),
};

const fortressInspectCommand: CommandDefinition = {
  id: 'fortress.inspect',
  description: 'Inspect a Fortress building module',
  handler: (args) => {
    const buildingId = args.args[0];
    if (!buildingId) return { status: 'error', message: 'Building name required' } satisfies CommandHandlerResult;

    const match = buildingMetadata.find((meta) => meta.id.toLowerCase() === buildingId.toLowerCase());
    if (!match) return { status: 'error', message: `Building not found: ${buildingId}` } satisfies CommandHandlerResult;

    const module = getBuildingModule(match.id);
    if (!module) return { status: 'error', message: `Module missing for ${match.id}` } satisfies CommandHandlerResult;

    const state = module.getState();
    navigateToFortress(match.id);
    return {
      status: 'ok',
      message: `Building ${match.id} — ${module.getDescription()}`,
      payload: {
        metadata: match,
        state,
        description: module.getDescription(),
      },
    } satisfies CommandHandlerResult;
  },
};

const fortressGridCommand: CommandDefinition = {
  id: 'fortress.grid',
  description: 'Show the Fortress world grid layout',
  handler: () => {
    const grid = getGrid();
    return {
      status: 'ok',
      message: 'Fortress world grid (3x3)',
      payload: grid,
    } satisfies CommandHandlerResult;
  },
};

const avotWhereCommand: CommandDefinition = {
  id: 'avot.where',
  description: 'Show where each AVOT NPC is stationed',
  handler: () => {
    loadWorldState();
    const avots = listAvots();
    return {
      status: 'ok',
      message: `${avots.length} AVOT(s) present across the Fortress`,
      payload: avots.map((avot) => ({
        id: avot.id,
        role: avot.role,
        currentBuilding: avot.currentBuilding,
        mood: avot.mood,
      })),
    } satisfies CommandHandlerResult;
  },
};

const avotSummonCommand: CommandDefinition = {
  id: 'avot.summon',
  description: 'Manually relocate an AVOT to a building',
  handler: (args) => {
    const [avotId, buildingId] = args.args;
    if (!avotId || !buildingId) return { status: 'error', message: 'Usage: avot.summon <id> <building>' } satisfies CommandHandlerResult;
    try {
      getAvot(avotId);
    } catch (err) {
      return { status: 'error', message: (err as Error).message } satisfies CommandHandlerResult;
    }
    setAvotLocation(avotId, buildingId);
    return { status: 'ok', message: `${avotId} summoned to ${buildingId}` } satisfies CommandHandlerResult;
  },
};

const avotMoodCommand: CommandDefinition = {
  id: 'avot.mood',
  description: 'Update an AVOT mood marker',
  handler: (args) => {
    const [avotId, mood] = args.args;
    if (!avotId || !mood) return { status: 'error', message: 'Usage: avot.mood <id> <mood>' } satisfies CommandHandlerResult;
    try {
      getAvot(avotId);
    } catch (err) {
      return { status: 'error', message: (err as Error).message } satisfies CommandHandlerResult;
    }
    setAvotMood(avotId, mood);
    return { status: 'ok', message: `${avotId} mood set to ${mood}` } satisfies CommandHandlerResult;
  },
};

const avotTalkCommand: CommandDefinition = {
  id: 'avot.talk',
  description: 'Hear dialogue from an AVOT at their current post',
  handler: (args) => {
    const avotId = args.args[0];
    if (!avotId) return { status: 'error', message: 'Usage: avot.talk <id>' } satisfies CommandHandlerResult;
    try {
      const world = getWorldState();
      const dialogue = getDialogue(avotId, world, getTraits());
      return { status: 'ok', message: dialogue, payload: { avotId, building: getAvot(avotId).currentBuilding } } satisfies CommandHandlerResult;
    } catch (err) {
      return { status: 'error', message: (err as Error).message } satisfies CommandHandlerResult;
    }
  },
};

const spatialStatusCommand: CommandDefinition = {
  id: 'spatial.status',
  description: 'Show current spatial capability status',
  handler: (_, ctx) => {
    const controls = resolveSpatialControls(ctx);
    const state = controls.getSpatialState();
    return {
      status: 'ok',
      message: `Spatial status: supported=${state.supported}, active=${state.active}, mode=${state.mode}.`,
      payload: state,
    } satisfies CommandHandlerResult;
  },
};

[
  helpCommand,
  pingCommand,
  snapshotCommand,
  toggleThemeCommand,
  logTailCommand,
  taskNewCommand,
  taskListCommand,
  taskInspectCommand,
  taskCancelCommand,
  memoryStmCommand,
  goalNewCommand,
  goalListCommand,
  goalInspectCommand,
  goalCompleteCommand,
  goalFailCommand,
  reflectNowCommand,
  reflectListCommand,
  bridgeClusterCommand,
  bridgePingCommand,
  guardrailStatusCommand,
  guardrailViolationsCommand,
  bridgeStatusCommand,
  updateStatusCommand,
  updateListCommand,
  updatePreviewCommand,
  updateMarkAppliedCommand,
  fortressOpenCommand,
  fortressSpatialCommand,
  fortressSpatialOffCommand,
  spatialStatusCommand,
  fortressStatusCommand,
  fortressBuildingsCommand,
  fortressInspectCommand,
  fortressGridCommand,
  avotWhereCommand,
  avotSummonCommand,
  avotMoodCommand,
  avotTalkCommand,
].forEach(registerCommand);
