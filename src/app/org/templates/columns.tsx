"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TicketTemplate } from "@/types/tickets"

export function getColumns(
  onEdit: (template: TicketTemplate) => void,
  onDelete: (template: TicketTemplate) => void
): ColumnDef<TicketTemplate>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const template = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{template.name}</span>
            {template.category && (
              <Badge variant="outline" className="w-fit mt-1">
                {template.category}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("content") as string
        return (
          <div className="max-w-[500px] truncate text-muted-foreground">
            {content.replace(/<[^>]*>/g, '')}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        return format(new Date(row.getValue("created_at")), "PPp")
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const template = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(template)}
              className="h-8 px-2 lg:px-3"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only lg:not-sr-only lg:ml-2">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this template?')) {
                  onDelete(template)
                }
              }}
              className="h-8 px-2 lg:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only lg:not-sr-only lg:ml-2">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]
}