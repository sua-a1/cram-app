import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const analyzeTicketTool = tool(async ({ ticket }: { ticket: string }, config) => {
  // Define arrays for different indicators
  const urgencyIndicators = ['urgent', 'immediately', 'asap', 'emergency', 'right away', 'right now'];
  const damageIndicators = ['damaged', 'broken', 'tear', 'ripped', 'defective', 'stain', 'hole'];
  const highValueIndicators = ['expensive', '$200', '200 dollars', 'luxury', 'premium'];
  const eventIndicators = ['wedding', 'event', 'party', 'ceremony', 'weekend'];
  const multipleIssuesIndicators = ['also', 'additionally', 'moreover', 'multiple', 'several issues'];
  const dissatisfactionIndicators = ['disappointed', 'unhappy', 'frustrated', 'upset', 'angry'];

  const ticketLower = ticket.toLowerCase();
  
  // Check for indicators
  const hasUrgency = urgencyIndicators.some(indicator => ticketLower.includes(indicator));
  const hasDamage = damageIndicators.some(indicator => ticketLower.includes(indicator));
  const hasHighValue = highValueIndicators.some(indicator => ticketLower.includes(indicator));
  const hasEvent = eventIndicators.some(indicator => ticketLower.includes(indicator));
  const hasMultipleIssues = multipleIssuesIndicators.some(indicator => ticketLower.includes(indicator));
  const hasDissatisfaction = dissatisfactionIndicators.some(indicator => ticketLower.includes(indicator));

  // Determine if human intervention is required
  const requiresHuman = 
    (hasDamage) || // Damaged items always require human intervention
    (hasHighValue && (hasUrgency || hasDissatisfaction)) || // High value + urgency/dissatisfaction
    (hasUrgency && hasEvent) || // Urgent event-related issues
    (hasMultipleIssues && (hasDamage || hasHighValue)) || // Multiple issues with damage/high value
    (hasDamage && hasHighValue); // Both damage and high value

  // Determine reason for human intervention
  let reason = '';
  if (requiresHuman) {
    if (hasDamage) reason = 'Damaged item reported';
    else if (hasHighValue && hasUrgency) reason = 'Urgent high-value issue';
    else if (hasUrgency && hasEvent) reason = 'Urgent event-related issue';
    else if (hasMultipleIssues) reason = 'Multiple complex issues reported';
    else reason = 'Complex issue requiring human attention';
  }

  // Return a properly formatted response for LangGraph
  return {
    content: JSON.stringify({
      requires_human: requiresHuman,
      status: requiresHuman ? 'open' : 'in-progress',
      reason: requiresHuman ? reason : 'Can be handled by automated system'
    }),
    metadata: {
      requires_human: requiresHuman,
      status: requiresHuman ? 'open' : 'in-progress',
      reason: requiresHuman ? reason : 'Can be handled by automated system',
      tool_name: 'analyze_ticket',
      indicators: {
        hasUrgency,
        hasDamage,
        hasHighValue,
        hasEvent,
        hasMultipleIssues,
        hasDissatisfaction
      }
    }
  };
}, {
  name: 'analyze_ticket',
  description: 'Analyze a customer support ticket to determine if it requires human intervention and its current status.',
  schema: z.object({
    ticket: z.string().min(1, 'Ticket content is required')
  })
}); 