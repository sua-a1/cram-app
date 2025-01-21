# Project Folder Structure

## Root Structure
```
src/
├── app/                    # Next.js app directory
│   ├── (org)/             # Organization routes group
│   │   ├── org/           # Public org routes
│   │   │   └── (routes)/  # Organization route handlers
│   │   │       ├── org-auth/  # Organization auth routes
│   │   │       │   ├── signin/    # Sign in
│   │   │       │   ├── signup/    # Sign up
│   │   │       │   ├── callback/  # Auth callback
│   │   │       │   └── access/    # Org access
│   │   └── [orgId]/      # Dynamic org routes
│   │       ├── layout.tsx # Shared org layout
│   │       ├── (admin)/  # Admin routes
│   │       │   ├── layout.tsx  # Admin layout
│   │       │   └── page.tsx    # Admin dashboard
│   │       └── (employee)/ # Employee routes
│   │           ├── layout.tsx  # Employee layout
│   │           └── page.tsx    # Employee dashboard
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── ui/              # Shadcn UI components
│   └── org/             # Organization components
│       ├── signin-form.tsx
│       ├── signup-form.tsx
│       └── signout-button.tsx
├── lib/                 # Shared utilities
│   ├── server/          # Server-side utilities
│   │   └── supabase.ts  # Supabase server clients
│   ├── client/          # Client-side utilities
│   │   └── supabase.ts  # Supabase browser client
│   ├── context/         # React contexts
│   │   └── auth-context.tsx  # Auth state management
│   └── utils/           # Shared utility functions
├── types/               # TypeScript type definitions
│   └── supabase.ts      # Supabase database types
└── styles/              # Global styles
    └── globals.css      # Global CSS

## Key Files
- `app/layout.tsx`: Root layout with providers
- `lib/server/supabase.ts`: Server-side Supabase clients
- `lib/context/auth-context.tsx`: Authentication context
- `types/supabase.ts`: Database type definitions

## Notes
- Route groups (in parentheses) for organization
- Dynamic routes with [brackets]
- Shared layouts for auth flows
- Separation of server/client utilities
- Component organization by feature
``` 