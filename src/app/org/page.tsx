import { redirect } from 'next/navigation'

// This page only handles the exact /org path
export default function OrgRootPage() {
  // Redirect to organization access
  return redirect('/org/org-auth/access')
} 