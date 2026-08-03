export function NotificationBadge({ temNotificacao }: { temNotificacao: boolean }) {
  if (!temNotificacao) return null;

  return (
    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
  );
}
