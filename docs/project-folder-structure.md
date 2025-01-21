# Project Folder Structure

## Root Directory
```
cram-app/
├── src/                      # Source code
│   ├── app/                  # Next.js 13 app directory
│   │   ├── (auth)/          # Authentication route group
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── layout.tsx   # Auth layout
│   │   ├── (dashboard)/     # Dashboard route group
│   │   │   ├── admin/       # Admin pages
│   │   │   ├── employee/    # Employee pages
│   │   │   ├── tickets/     # Ticket management
│   │   │   │   ├── [id]/    # Individual ticket view
│   │   │   │   └── page.tsx # Tickets list
│   │   │   └── layout.tsx   # Dashboard layout
│   │   ├── error.tsx        # Global error handling
│   │   ├── not-found.tsx    # 404 page
│   │   ├── loading.tsx      # Loading state
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Landing page
│   │   └── globals.css      # Global styles
│   ├── components/          # React components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── auth/            # Authentication components
│   │   ├── tickets/         # Ticket-related components
│   │   └── dashboard/       # Dashboard components
│   ├── lib/                 # Shared utilities
│   │   ├── server/          # Server-side utilities
│   │   │   ├── supabase.ts  # Server Supabase client
│   │   │   └── tickets-logic.ts # Ticket operations
│   │   ├── client/          # Client-side utilities
│   │   │   └── supabase.ts  # Client Supabase auth
│   │   └── utils.ts         # Shared utility functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
│       ├── supabase.ts      # Database types
│       └── tickets.ts       # Ticket-related types
├── public/                  # Static assets
├── docs/                    # Documentation
│   ├── sessions/            # Session logs
│   └── checklists/         # Project checklists
├── supabase/               # Supabase configurations
│   └── migrations/         # Database migrations
├── .env                    # Environment variables
├── .env.example            # Environment template
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── README.md              # Project overview
```

## Key Directories

### `/src/app`
Next.js 13 app directory using the App Router. Organized with route groups:
- `(auth)`: Authentication-related pages with isolated layout
- `(dashboard)`: Protected routes for authenticated users
- Root-level files for error handling, loading states, and layouts

### `/src/components`
React components organized by domain:
- `ui/`: Shadcn UI components (imported, not custom)
- `auth/`: Authentication-related components
- `tickets/`: Ticket management components
- `dashboard/`: Dashboard and analytics components

### `/src/lib`
Shared utilities and business logic:
- `server/`: Server-side operations and Supabase admin client
- `client/`: Client-side utilities and Supabase auth client
- `utils.ts`: Shared helper functions

### `/src/types`
TypeScript type definitions:
- `supabase.ts`: Database and auth types
- `tickets.ts`: Ticket-related interfaces

### `/supabase`
Supabase-related configurations:
- `migrations/`: SQL migrations for schema and RLS policies

## Conventions
1. Use route groups `(group)` for logical separation of routes
2. Keep pages minimal, move logic to server components/actions
3. Use Shadcn UI components by default, only create custom ones if needed
4. Centralize domain logic in "mega files" (e.g., tickets-logic.ts)
5. Keep types close to their domain in `/types`
