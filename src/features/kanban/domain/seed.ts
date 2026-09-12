import type { Board } from './types.ts'

export function seedBoard(): Board {
  return [
    {
      id: 'todo',
      name: 'Por hacer',
      accent: 'oklch(0.62 0.23 300)',
      cards: [
        {
          id: 1,
          title: 'Diseñar sistema de notificaciones',
          desc: '',
          tags: ['Diseño', 'UX'],
          assignee: { name: 'Marta Ríos' },
          due: '18 sep',
          priority: 'Media',
        },
        {
          id: 2,
          title: 'Investigar proveedor de pagos',
          desc: '',
          tags: ['Backend'],
          assignee: { name: 'Luis Peña' },
          due: '22 sep',
          priority: 'Baja',
        },
      ],
    },
    {
      id: 'doing',
      name: 'En progreso',
      accent: 'oklch(0.62 0.2 250)',
      cards: [
        {
          id: 3,
          title: 'Integrar API de autenticación',
          desc: '',
          tags: ['Backend', 'API'],
          assignee: { name: 'Sofía Díaz' },
          due: '15 sep',
          priority: 'Alta',
        },
        {
          id: 4,
          title: 'Rediseñar onboarding móvil',
          desc: '',
          tags: ['Frontend', 'Diseño'],
          assignee: { name: 'Carlos Vega' },
          due: '19 sep',
          priority: 'Media',
        },
      ],
    },
    {
      id: 'review',
      name: 'Revisión',
      accent: 'oklch(0.75 0.19 70)',
      cards: [
        {
          id: 5,
          title: 'Corregir bug de sincronización',
          desc: '',
          tags: ['Bug', 'API'],
          assignee: { name: 'Ana Ortiz' },
          due: '13 sep',
          priority: 'Alta',
        },
      ],
    },
    {
      id: 'done',
      name: 'Hecho',
      accent: 'oklch(0.7 0.16 165)',
      cards: [
        {
          id: 6,
          title: 'Configurar CI/CD',
          desc: '',
          tags: ['DevOps'],
          assignee: { name: 'Diego Ruiz' },
          due: '10 sep',
          priority: 'Baja',
        },
      ],
    },
  ]
}
