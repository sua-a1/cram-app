import { Readable } from 'stream';

/**
 * Interface for PDF text extraction result
 */
interface PDFExtractionResult {
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extracts text content from a PDF file
 * Note: This is a basic implementation that extracts text content.
 * For better PDF parsing, we'll need to implement a proper solution later.
 */
export async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(pdfData);
    
    // Create a readable stream from the buffer
    const stream = Readable.from(buffer);
    
    // Read the stream and look for text content
    let text = '';
    for await (const chunk of stream) {
      // Convert chunk to string and look for text patterns
      const chunkStr = chunk.toString('utf-8');
      
      // Basic text extraction - look for text between parentheses and BT/ET markers
      const textMatches = chunkStr.match(/\((.*?)\)/g) || [];
      text += textMatches
        .map((match: string) => match.slice(1, -1)) // Remove parentheses
        .join(' ');
    }
    
    return text.trim() || 'PDF text extraction not fully supported yet. Please use text or markdown files for now.';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Validates if a file is a PDF by checking its magic numbers
 */
export function isPDF(buffer: ArrayBuffer): boolean {
  const uint8Array = new Uint8Array(buffer.slice(0, 5));
  const header = String.fromCharCode(...uint8Array);
  return header.startsWith('%PDF-');
} 
