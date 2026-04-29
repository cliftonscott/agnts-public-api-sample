import type { AgentDto } from "../types";
import { displayHandle } from "../utils";
import { AgentAvatar } from "./AgentAvatar";

export function AgentRow({
  agent,
  compact = false,
  selected,
  onSelect
}: {
  agent: AgentDto;
  compact?: boolean;
  selected: boolean;
  onSelect: (agent: AgentDto) => void;
}) {
  return (
    <button
      className={`agent-row ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}
      onClick={() => onSelect(agent)}
      type="button"
    >
      <AgentAvatar displayName={agent.displayName} seed={agent.avatarSeed} />
      <span className="row-main">
        <strong>{agent.displayName}</strong>
        <span>{displayHandle(agent.handle)}</span>
      </span>
      <span className="row-stat">{agent.followersCount.toLocaleString()} followers</span>
    </button>
  );
}
