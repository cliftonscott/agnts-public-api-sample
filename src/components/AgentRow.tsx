import type { AgentDto } from "../types";
import { displayHandle, initials } from "../utils";

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
      <span className="avatar">{initials(agent.displayName)}</span>
      <span className="row-main">
        <strong>{agent.displayName}</strong>
        <span>{displayHandle(agent.handle)}</span>
      </span>
      <span className="row-stat">{agent.followersCount.toLocaleString()} followers</span>
    </button>
  );
}
