'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SelectedTickets } from '@/types/tickets';

interface TicketSelectionContextType {
  selectedTickets: SelectedTickets;
  selectTicket: (ticketId: string, selected: boolean) => void;
  toggleTicket: (ticketId: string) => void;
  clearSelection: () => void;
  selectAll: (ticketIds: string[]) => void;
  selectedCount: number;
  isSelected: (ticketId: string) => boolean;
}

const TicketSelectionContext = createContext<TicketSelectionContextType | undefined>(
  undefined
);

export function useTicketSelection() {
  const context = useContext(TicketSelectionContext);
  if (!context) {
    throw new Error('useTicketSelection must be used within a TicketSelectionProvider');
  }
  return context;
}

interface TicketSelectionProviderProps {
  children: ReactNode;
}

export function TicketSelectionProvider({ children }: TicketSelectionProviderProps) {
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});

  const selectTicket = useCallback((ticketId: string, selected: boolean) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: selected,
    }));
  }, []);

  const toggleTicket = useCallback((ticketId: string) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTickets({});
  }, []);

  const selectAll = useCallback((ticketIds: string[]) => {
    const newSelection = ticketIds.reduce<SelectedTickets>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    setSelectedTickets(newSelection);
  }, []);

  const selectedCount = Object.values(selectedTickets).filter(Boolean).length;

  const isSelected = useCallback(
    (ticketId: string) => Boolean(selectedTickets[ticketId]),
    [selectedTickets]
  );

  const value = {
    selectedTickets,
    selectTicket,
    toggleTicket,
    clearSelection,
    selectAll,
    selectedCount,
    isSelected,
  };

  return (
    <TicketSelectionContext.Provider value={value}>
      {children}
    </TicketSelectionContext.Provider>
  );
} 