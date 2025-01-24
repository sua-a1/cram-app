"use client"

import { Suspense } from "react"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { TemplateDialog } from "./template-dialog"
import { useTemplates } from "@/hooks/use-templates"
import type { TicketTemplate } from "@/types/tickets"

export default function TemplatesPage() {
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null)
  const { templates, loading, fetchTemplates, subscribeToTemplates } = useTemplates()

  const handleEdit = useCallback((template: TicketTemplate) => {
    setSelectedTemplate(template)
    setOpen(true)
  }, [])

  const handleDelete = useCallback(async (template: TicketTemplate) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      // If delete fails, refetch to ensure correct state
      fetchTemplates()
    }
  }, [fetchTemplates])

  useEffect(() => {
    // Initial fetch
    fetchTemplates()

    // Setup subscription
    let unsubscribe: (() => void) | undefined
    subscribeToTemplates().then(cleanup => {
      unsubscribe = cleanup
    })
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [fetchTemplates, subscribeToTemplates])

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch('/api/templates' + (selectedTemplate ? `/${selectedTemplate.id}` : ''), {
        method: selectedTemplate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save template')
      }
      
      setOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      // If save fails, refetch to ensure correct state
      fetchTemplates()
    }
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <div className="flex items-center space-x-4">
            <Link href="/org/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
              <p className="text-muted-foreground">
                Manage your response templates and quick replies.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => {
            setSelectedTemplate(null)
            setOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>
      <DataTable 
        columns={getColumns(handleEdit, handleDelete)} 
        data={templates} 
      />
      <TemplateDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={selectedTemplate || undefined}
        mode={selectedTemplate ? "edit" : "create"}
      />
    </div>
  )
}