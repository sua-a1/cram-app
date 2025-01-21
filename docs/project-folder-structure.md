# Project Folder Structure

## Root Directory
```
cram-app/
├── .next/               # Next.js build output
├── docs/               # Project documentation
├── node_modules/       # Dependencies
├── public/            # Static assets
├── src/               # Source code
├── supabase/          # Supabase migrations and types
├── .env               # Environment variables
├── .gitignore         # Git ignore rules
├── next.config.js     # Next.js configuration
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # Project overview
```

## Source Code Structure
```
src/
├── app/                    # Next.js 13 app directory
│   ├── (auth)/            # Authentication routes
│   │   ├── auth/          # Public auth flows
│   │   │   ├── signin/    # Sign in page
│   │   │   ├── signup/    # Sign up page
│   │   │   ├── callback/  # Auth callback handling
│   │   │   ├── verify/    # Email verification
│   │   │   ├── reset-password/    # Password reset
│   │   │   └── update-password/   # Password update
│   │   ├── user/          # User settings
│   │   └── signout/       # Sign out handling
│   ├── (customer)/        # Customer routes
│   │   ├── layout.tsx     # Customer layout with nav
│   │   ├── page.tsx       # Customer dashboard
│   │   └── tickets/       # Ticket management
│   │       ├── page.tsx   # Ticket list
│   │       ├── new/       # New ticket
│   │       └── [id]/      # Ticket details
│   ├── org/               # Organization routes
│   │   ├── layout.tsx     # Org layout
│   │   ├── page.tsx       # Org landing
│   │   ├── dashboard/     # Main dashboard
│   │   │   ├── layout.tsx # Dashboard layout
│   │   │   └── page.tsx   # Dashboard with tickets
│   │   ├── auth/         # Organization auth
│   │   └── (routes)/     # Additional org routes
│   ├── api/               # API routes
│   │   ├── tickets/      # Ticket API endpoints
│   │   └── teams/        # Team API endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── tickets/          # Ticket components
│   │   ├── ticket-list.tsx      # Ticket listing
│   │   ├── ticket-form.tsx      # Ticket creation/edit
│   │   ├── ticket-details.tsx   # Ticket view
│   │   ├── ticket-status.tsx    # Status management
│   │   └── ticket-filters.tsx   # Filter/sort controls
│   ├── dashboard/         # Dashboard components
│   └── ui/               # Shared UI components
├── lib/                  # Shared utilities
│   ├── server/          # Server-side utilities
│   │   ├── tickets.ts   # Ticket server actions
│   │   └── auth.ts      # Auth server actions
│   └── utils/           # Shared utilities
├── types/               # TypeScript types
│   ├── tickets.ts      # Ticket types
│   └── database.ts     # Database types
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
│   └── use-tickets.ts  # Ticket-related hooks
└── middleware.ts        # Next.js middleware
```

## Key Files and Directories

### Dashboard & Ticket Management
- `src/app/org/dashboard/`: Main dashboard with ticket management
- `src/components/tickets/`: Ticket-related components
- `src/lib/server/tickets.ts`: Ticket server actions and logic
- `src/types/tickets.ts`: Ticket type definitions
- `src/hooks/use-tickets.ts`: Ticket-related hooks

### Organization Management
- `src/app/org/`: Organization routes and features
- `src/app/org/dashboard/`: Main organization dashboard
- `src/app/org/auth/`: Organization auth flows

### Authentication
- `src/app/(auth)/`: Authentication routes
- `src/components/auth/`: Authentication components
- `src/middleware.ts`: Auth middleware and route protection

### Shared Components
- `src/components/ui/`: Shared UI components
- `src/lib/utils/`: Shared utilities
- `src/contexts/`: Shared contexts
- `src/hooks/`: Shared hooks

### Documentation
- `docs/`: Project documentation
  - Architecture diagrams
  - API documentation
  - Session notes
  - Development guidelines
