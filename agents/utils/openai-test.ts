import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables using absolute path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAIAccess() {
  try {
    console.log('Testing OpenAI API access...');
    
    // Test text for embedding
    const testText = 'This is a test of the OpenAI embeddings API.';
    
    // Generate embeddings
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: testText,
    });

    console.log('✅ OpenAI API is working!');
    console.log('Generated embedding dimension:', response.data[0].embedding.length);
    console.log('First few values of the embedding:', response.data[0].embedding.slice(0, 5));
    
    return true;
  } catch (error) {
    console.error('❌ Error accessing OpenAI API:', error);
    return false;
  }
}

// Run the test
testOpenAIAccess()
  .then((success) => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 
