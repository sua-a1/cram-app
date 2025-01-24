"use client"

import * as React from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useTemplates } from "@/hooks/use-templates"
import type { TicketTemplate } from "@/types/tickets"

interface TemplateSelectorProps {
  onSelectTemplate: (template: TicketTemplate) => void
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { templates, loading, fetchTemplates } = useTemplates()
  const [recentTemplates, setRecentTemplates] = React.useState<TicketTemplate[]>([])

  // Initial fetch of templates
  React.useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Load recent templates from localStorage
  React.useEffect(() => {
    const recent = localStorage.getItem('recentTemplates')
    if (recent) {
      try {
        const parsed = JSON.parse(recent) as string[]
        const found = templates.filter(t => parsed.includes(t.id))
        setRecentTemplates(found.slice(0, 5))
      } catch (error) {
        console.error('Error loading recent templates:', error)
      }
    }
  }, [templates])

  // Add template to recent list
  const addToRecent = React.useCallback((template: TicketTemplate) => {
    setRecentTemplates(prev => {
      const newRecent = [template, ...prev.filter(t => t.id !== template.id)].slice(0, 5)
      try {
        localStorage.setItem('recentTemplates', JSON.stringify(newRecent.map(t => t.id)))
      } catch (error) {
        console.error('Error saving recent templates:', error)
      }
      return newRecent
    })
  }, [])

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(templates.map(t => t.category).filter(Boolean))
    return Array.from(cats)
  }, [templates])

  const handleSelect = React.useCallback((template: TicketTemplate) => {
    onSelectTemplate(template)
    addToRecent(template)
    setOpen(false)
  }, [onSelectTemplate, addToRecent])

  // Group templates
  const uncategorizedTemplates = React.useMemo(() => 
    templates.filter(t => !t.category),
    [templates]
  )

  const categorizedTemplates = React.useMemo(() => 
    categories.map(category => ({
      category,
      templates: templates.filter(t => t.category === category)
    })),
    [templates, categories]
  )

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>
            {recentTemplates.length > 0 && (
              <CommandGroup heading="Recent">
                {recentTemplates.map(template => (
                  <HoverCard key={template.id}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        onSelect={() => handleSelect(template)}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {template.name}
                      </CommandItem>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="prose prose-sm max-h-[200px] overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: template.content }} />
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </CommandGroup>
            )}
            {categorizedTemplates.map(({ category, templates }) => (
              <CommandGroup key={category} heading={category}>
                {templates.map(template => (
                  <HoverCard key={template.id}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        onSelect={() => handleSelect(template)}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {template.name}
                      </CommandItem>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="prose prose-sm max-h-[200px] overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: template.content }} />
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </CommandGroup>
            ))}
            {uncategorizedTemplates.length > 0 && (
              <CommandGroup heading="All Templates">
                {uncategorizedTemplates.map(template => (
                  <HoverCard key={template.id}>
                    <HoverCardTrigger asChild>
                      <CommandItem
                        onSelect={() => handleSelect(template)}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {template.name}
                      </CommandItem>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <div className="prose prose-sm max-h-[200px] overflow-y-auto">
                          <div dangerouslySetInnerHTML={{ __html: template.content }} />
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CollapsibleContent>
    </Collapsible>
  )
}
