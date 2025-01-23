'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/supabase-auth-provider'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OrgAccessPage() {
  const [isJoining, setIsJoining] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await signOut()
      toast({
        title: 'Success',
        description: 'Signed out successfully'
      })
    } catch (error) {
      console.error('Error signing out:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign out. Please try again.'
      })
    }
  }

  const handleCreateWorkspace = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/org/org-auth/register')
  }

  const handleJoinWorkspace = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!orgId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a workspace ID'
      })
      return
    }

    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to join a workspace'
      })
      return
    }

    setIsJoining(true)
    try {
      // First check if organization exists
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, status')
        .eq('id', orgId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      if (org.status !== 'active') {
        throw new Error('This workspace is not active')
      }

      // Then update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          org_id: org.id,
          role: 'employee',
          display_name: user.email?.split('@')[0] || 'Employee'
        })
        .eq('user_id', user.id)

      if (profileError) {
        throw new Error('Failed to update profile')
      }

      // Close dialog and clear state
      setDialogOpen(false)
      setOrgId('')
      
      toast({
        title: 'Success',
        description: `Successfully joined ${org.name}`
      })

      // Trigger both router refresh and manual redirect
      router.refresh()
      
      // Add a small delay before redirect to ensure state is updated
      setTimeout(() => {
        setIsJoining(false)
        router.push('/org/dashboard')
      }, 1000)

    } catch (error) {
      setIsJoining(false)
      console.error('Error joining workspace:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to join workspace'
      })
    }
  }

  return (
    <div className="flex flex-col justify-between min-h-[calc(100vh-8rem)]">
      <div className="flex flex-col items-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Cram
          </h1>
          <p className="text-sm text-muted-foreground">
            Create or join a workspace to get started
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <Button 
            onClick={handleCreateWorkspace}
            className="w-full"
          >
            Create a new workspace
          </Button>

          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              if (!isJoining) {
                setDialogOpen(open)
                if (!open) {
                  setOrgId('')
                }
              }
            }}
          >
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              Join an existing workspace
            </Button>
            <DialogContent onPointerDownOutside={(e) => {
              if (isJoining) {
                e.preventDefault()
              }
            }}>
              <DialogHeader>
                <DialogTitle>Join Workspace</DialogTitle>
                <DialogDescription>
                  Enter the workspace ID to join an existing organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="org-id">Workspace ID</Label>
                  <Input
                    id="org-id"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="Enter workspace ID"
                    disabled={isJoining}
                  />
                </div>
                <Button
                  onClick={handleJoinWorkspace}
                  disabled={isJoining || !orgId.trim()}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Workspace'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-32"
        >
          Sign out
        </Button>
      </div>
    </div>
  )
} 