export type Category =
  | 'Utilidades'
  | 'Supermercado'
  | 'Feria'
  | 'Otros'
  | 'Mermelada'
  | 'Viaje'
  | 'Salidas'
  | 'Comida preparada'
  | 'Transporte'

export interface Expense {
  id: string
  title: string
  amount: number          // stored amount (half if shared)
  originalAmount?: number // full amount before split (only when isShared=true)
  isShared?: boolean      // true when split 50/50
  category: Category
  date: string
}

export const CATEGORIES: Category[] = [
  'Utilidades',
  'Supermercado',
  'Feria',
  'Otros',
  'Mermelada',
  'Viaje',
  'Salidas',
  'Comida preparada',
  'Transporte',
]

export const CATEGORY_COLORS: Record<Category, string> = {
  Utilidades: '#c8f54a',
  Supermercado: '#4ab8f5',
  Feria: '#f5c842',
  Otros: '#a855f7',
  Mermelada: '#f54a6e',
  Viaje: '#4af5c8',
  Salidas: '#f5894a',
  'Comida preparada': '#f54af5',
  Transporte: '#4a6ef5',
}
