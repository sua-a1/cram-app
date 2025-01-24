"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { TicketTemplate } from "@/types/tickets"

export const columns: ColumnDef<TicketTemplate>[] = [
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
    cell: ({ row }) => {
      const template = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("edit", template)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => console.log("delete", template)}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 