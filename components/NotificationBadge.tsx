interface NotificationBadgeProps {
  temNotificacao: boolean;
}

export function NotificationBadge({ temNotificacao }: NotificationBadgeProps) {
  if (!temNotificacao) return null;

  return (
    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
  );
}
