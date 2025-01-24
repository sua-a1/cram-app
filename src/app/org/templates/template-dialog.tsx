"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { TicketTemplate } from "@/types/tickets"
import { EditorToolbar } from "./editor-toolbar"

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  content: z.string().min(1, "Content is required"),
})

type TemplateFormValues = z.infer<typeof templateSchema>

interface TemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TemplateFormValues) => Promise<void>
  defaultValues?: Partial<TicketTemplate>
  mode: "create" | "edit"
}

export function TemplateDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode,
}: TemplateDialogProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      category: defaultValues?.category || "",
      content: defaultValues?.content || "",
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        code: {
          HTMLAttributes: {
            class: "rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-2 pl-4 italic",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 hover:text-primary/80",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full",
        },
      }),
      Placeholder.configure({
        placeholder: "Write your template content... (Supports Markdown)",
        emptyEditorClass: "cursor-text before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
    ],
    content: defaultValues?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-3 py-2 border rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      },
    },
    onUpdate: ({ editor }) => {
      form.setValue("content", editor.getHTML(), { shouldValidate: true })
    },
  })

  React.useEffect(() => {
    if (open && editor && defaultValues?.content) {
      editor.commands.setContent(defaultValues.content)
    }
  }, [open, editor, defaultValues?.content])

  async function handleSubmit(values: TemplateFormValues) {
    try {
      await onSubmit(values)
      form.reset()
      editor?.commands.clearContent()
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting template:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Template" : "Edit Template"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new response template."
              : "Edit the response template."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <div className="min-h-[200px] border rounded-md">
                      <EditorToolbar editor={editor} />
                      {editor && <EditorContent editor={editor} className="p-3" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>{mode === "create" ? "Create Template" : "Save Changes"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 