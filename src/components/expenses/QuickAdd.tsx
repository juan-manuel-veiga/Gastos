import { Plus } from 'lucide-react'

interface QuickAddProps {
  onClick: () => void
}

export function QuickAdd({ onClick }: QuickAddProps) {
  return (
    <button
      onClick={onClick}
      title="Agregar gasto (N)"
      className="
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-2xl
        bg-accent-lime text-surface
        flex items-center justify-center
        shadow-glow-lime shadow-xl
        hover:scale-105 hover:shadow-glow-lime
        active:scale-95
        transition-all duration-200
        font-bold
      "
    >
      <Plus size={22} strokeWidth={2.5} />
    </button>
  )
}
