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
│   ├── org/             # Organization routes
│   │   ├── (routes)/(auth)/   # Organization auth routes
│   │   │   ├── signin/    # Org sign in
│   │   │   ├── signup/    # Org sign up
│   │   │   ├── access/    # Get org access
│   │   │   ├── register/  # Register new org
│   │   │   ├── callback/  # Auth callback handling
│   │   │   ├── reset-password/  # Password reset
│   │   │   └── update-password/ # Password update
│   │   └── [orgId]/       # Dynamic org routes
│   │       ├── layout.tsx # Shared org layout
│   │       ├── (admin)/   # Admin routes
│   │       │   ├── layout.tsx  # Admin layout
│   │       │   ├── page.tsx    # Admin dashboard
│   │       │   └── settings/   # Admin settings
│   │       ├── (employee)/ # Employee routes
│   │       │   ├── layout.tsx  # Employee layout
│   │       │   ├── page.tsx    # Employee dashboard
│   │       │   └── tickets/    # Ticket management
│   │       └── (shared)/   # Shared org features
│   │           ├── tickets/    # Ticket features
│   │           └── settings/   # Org settings
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── customer/         # Customer components
│   │   ├── ticket-list.tsx     # Ticket list component
│   │   ├── ticket-form.tsx     # Ticket creation form
│   │   └── ticket-details.tsx  # Ticket details view
│   ├── org/              # Organization components
│   │   ├── access-form.tsx     # Org access form
│   │   ├── registration-form.tsx # Org registration
│   │   └── dashboard/          # Dashboard components
│   ├── tickets/          # Shared ticket components
│   └── ui/               # Shared UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Shared utilities
│   └── server/          # Server-side utilities
├── middleware.ts         # Next.js middleware
└── types/               # TypeScript types
```

## Key Files and Directories

### Customer Portal
- `src/app/(customer)/`: Customer-specific routes and features
- `src/app/(customer)/tickets/`: Ticket management for customers
- `src/components/customer/`: Customer-specific components

### Organization Management
- `src/app/(org)/(auth)/`: Organization authentication flows
- `src/app/(org)/[orgId]/`: Organization-specific routes and features
- `src/components/org/`: Organization-related components
- `src/lib/server/auth-logic.ts`: Authentication and authorization logic

### Authentication
- `src/app/(auth)/auth/`: Public authentication flows
- `src/app/(auth)/user/`: Protected user settings
- `src/components/auth/`: Authentication components
- `src/middleware.ts`: Route protection and auth state management

### Database
- `supabase/migrations/`: Database migrations
- `supabase/types/`: Generated database types

### UI Components
- `src/components/ui/`: Shared UI components (buttons, forms, etc.)
- `src/components/org/dashboard/`: Dashboard-specific components
- `src/components/tickets/`: Ticket management components

### Documentation
- `docs/`: Project documentation
  - Architecture diagrams
  - API documentation
  - Session notes
  - Development guidelines
