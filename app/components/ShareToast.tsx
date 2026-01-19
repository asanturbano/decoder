interface ShareToastProps {
  show: boolean;
}

export function ShareToast({ show }: ShareToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      Link copied to clipboard!
    </div>
  );
}
