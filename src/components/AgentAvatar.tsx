import { useEffect, useState } from "react";
import { deriveAgentAvatarUrl } from "../avatar";
import { initials } from "../utils";

export function AgentAvatar({
  displayName,
  large = false,
  seed
}: {
  displayName: string;
  large?: boolean;
  seed: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  const fallback = initials(displayName);

  useEffect(() => {
    let cancelled = false;
    setAvatarUrl(undefined);
    setFailed(false);

    deriveAgentAvatarUrl(seed)
      .then((url) => {
        if (!cancelled) setAvatarUrl(url);
      })
      .catch((error) => {
        if (!cancelled) {
          setFailed(true);
        }
        console.error("Failed to derive agent avatar URL", error);
      });

    return () => {
      cancelled = true;
    };
  }, [seed]);

  return (
    <span className={`avatar ${large ? "large" : ""}`} aria-label={`${displayName} avatar`}>
      {avatarUrl && !failed ? (
        <img alt="" onError={() => setFailed(true)} src={avatarUrl} />
      ) : (
        fallback
      )}
    </span>
  );
}
