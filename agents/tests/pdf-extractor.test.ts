import { extractTextFromPDF, isPDF } from '../utils/pdf-extractor';
import { readFile } from 'fs/promises';
import path from 'path';

async function testPDFExtraction() {
  try {
    console.log('Starting PDF extraction test...');

    // Read the sample PDF file
    const pdfPath = path.resolve(__dirname, 'resources/sample.pdf');
    const pdfBuffer = await readFile(pdfPath);
    
    // Convert Buffer to ArrayBuffer
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;
    
    // First test: Check if file is recognized as PDF
    const isPdfResult = isPDF(arrayBuffer);
    console.log('Is PDF file:', isPdfResult);
    
    if (!isPdfResult) {
      throw new Error('File not recognized as PDF');
    }

    // Second test: Extract text from PDF
    console.log('\nExtracting text from PDF...');
    const extractedText = await extractTextFromPDF(arrayBuffer);
    
    console.log('\nExtracted Text:');
    console.log('-------------------');
    console.log(extractedText);
    console.log('-------------------');
    
    // Verify if expected text is present
    const expectedPhrases = [
      'test PDF document',
      'sample text',
      'testing PDF extraction'
    ];
    
    const missingPhrases = expectedPhrases.filter(phrase => 
      !extractedText.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (missingPhrases.length > 0) {
      console.warn('\nWarning: Some expected phrases were not found:');
      missingPhrases.forEach(phrase => console.warn(`- "${phrase}"`));
    } else {
      console.log('\nSuccess: All expected phrases were found in the extracted text!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPDFExtraction().catch(console.error); 
