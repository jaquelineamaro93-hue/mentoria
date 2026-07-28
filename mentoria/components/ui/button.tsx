export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  [key: string]: any;
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
