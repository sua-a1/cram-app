'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/supabase-auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KnowledgeCategory } from '@/types/knowledge';

export interface CategorySelectorProps {
  categories: KnowledgeCategory[];
  selectedCategories: string[];
  onSelectCategories: (categories: string[]) => void;
  onCreateCategory?: (data: { name: string; description?: string }) => Promise<void>;
  canCreate?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CategorySelector({
  categories,
  selectedCategories,
  onSelectCategories,
  onCreateCategory,
  canCreate = false,
  disabled = false,
  className,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const { supabase } = useAuth();

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onSelectCategories(newSelected);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedCategories.length === 0
                ? 'Select categories...'
                : `${selectedCategories.length} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-64">
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => toggleCategory(category.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCategories.includes(category.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {categories
          .filter((category) => selectedCategories.includes(category.id))
          .map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="gap-1"
              onClick={() => toggleCategory(category.id)}
            >
              {category.name}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
              >
                <Plus className="h-3 w-3 rotate-45" />
              </Button>
            </Badge>
          ))}
      </div>
    </div>
  );
} 