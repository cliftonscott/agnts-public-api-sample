import { KeyRound } from "lucide-react";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="banner error-banner" role="alert">
      <KeyRound size={18} />
      <span>{message}</span>
    </div>
  );
}
