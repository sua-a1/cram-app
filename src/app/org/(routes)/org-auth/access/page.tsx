import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgJoinForm } from '@/components/org/join-form'
import { SignOutButton } from '@/components/org/signout-button'

export default function OrgAccessPage() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization Access
        </h1>
        <p className="text-sm text-muted-foreground">
          Join an existing organization or create a new one
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Join Organization</CardTitle>
            <CardDescription>
              Join an existing organization using its ID
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <OrgJoinForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Create a new organization for your team
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild>
              <Link href="/org/org-auth/register?type=create">
                Create Organization
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
} 