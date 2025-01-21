# Project Folder Structure

## Root Directory
```
cram-app/
├── src/                      # Source code
│   ├── app/                  # Next.js 13 app directory
│   │   ├── (auth)/          # Authentication route group
│   │   │   ├── auth/        # Auth routes (URL segment)
│   │   │   │   ├── signin/  # Sign-in page
│   │   │   │   └── signup/  # Sign-up page
│   │   │   ├── user/        # User profile management
│   │   │   ├── signout/     # Sign-out functionality
│   │   │   ├── callback/    # Auth callback handling
│   │   │   ├── reset-password/  # Password reset
│   │   │   ├── update-password/ # Password update
│   │   │   ├── actions.ts   # Server actions for auth
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
│   │   │   ├── signin-form.tsx  # Sign-in form
│   │   │   ├── signup-form.tsx  # Sign-up form
│   │   │   └── auth-layout.tsx  # Auth layout component
│   │   ├── tickets/         # Ticket-related components
│   │   └── dashboard/       # Dashboard components
│   ├── lib/                 # Shared utilities
│   │   ├── server/          # Server-side utilities
│   │   │   ├── auth-logic.ts # Auth server utilities
│   │   │   └── tickets-logic.ts # Ticket operations
│   │   ├── client/          # Client-side utilities
│   │   │   └── supabase.ts  # Client Supabase auth
│   │   └── utils.ts         # Shared utility functions
│   ├── hooks/               # Custom React hooks
│   │   ├── use-toast.ts     # Toast notifications hook
│   │   └── use-auth.ts      # Auth context hook
│   ├── contexts/            # React contexts
│   │   └── auth-context.tsx # Auth context provider
│   └── types/               # TypeScript types
│       ├── supabase.ts      # Database types
│       └── auth.ts          # Auth-related types
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

### `/src/app/(auth)`
Authentication route group with proper URL segments:
- `auth/`: Contains actual auth routes (signin, signup)
- Shared layout and server actions
- Support for password reset and callbacks

### `/src/components/auth`
Authentication components:
- Form components with client-side validation
- Shared auth layout components
- Toast notifications for feedback

### `/src/lib`
Shared utilities split between client and server:
- `server/auth-logic.ts`: Server-side auth operations
- `client/supabase.ts`: Client-side auth utilities

### `/src/contexts`
React contexts for state management:
- `auth-context.tsx`: Global auth state management

## Conventions
1. Use route groups with proper URL segments
2. Keep auth logic separated between client/server
3. Use Shadcn UI components by default
4. Implement proper error handling and feedback
5. Follow Next.js 13+ best practices
