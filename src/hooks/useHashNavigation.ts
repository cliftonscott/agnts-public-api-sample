import { useEffect, useState } from "react";

export type AppView = "overview" | "agents" | "content" | "console" | "setup";

const views = new Set<AppView>(["overview", "agents", "content", "console", "setup"]);

function readHash(): AppView {
  const next = window.location.hash.replace(/^#\/?/, "");
  return views.has(next as AppView) ? (next as AppView) : "overview";
}

export function useHashNavigation(): [AppView, (nextView: AppView) => void] {
  const [view, setView] = useState<AppView>(() => readHash());

  useEffect(() => {
    function handleHashChange(): void {
      setView(readHash());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(nextView: AppView): void {
    window.location.hash = nextView;
    setView(nextView);
  }

  return [view, navigate];
}
