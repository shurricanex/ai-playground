import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import axios from 'axios'
import { VertexAI } from '@google-cloud/vertexai'
import { PredictionServiceClient } from '@google-cloud/aiplatform'
import * as fs from 'fs'
import * as path from 'path'

interface ModelProvider {
  makeRequest: (text: string, systemPrompt: string, userPrompt: string, apiKey: string, config: any) => Promise<string>;
}

// Initialize Vertex AI client once
let vertexAI: VertexAI | null = null;
let predictionClient: PredictionServiceClient | null = null;

try {
  // Get credentials from environment variable
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsJson) {
    try {
      // Parse the credentials JSON string
      const parsedCredentials = JSON.parse(credentialsJson);
      
      // Extract only the required credentials
      const credentials = {
        client_email: parsedCredentials.client_email,
        private_key: parsedCredentials.private_key,
      };

      // Initialize Vertex AI with project configuration and credentials
      vertexAI = new VertexAI({
        project: process.env.GOOGLE_PROJECT_ID || '',
        location: process.env.GOOGLE_LOCATION || 'us-central1',
        googleAuthOptions: {
          credentials: credentials,
          projectId: parsedCredentials.project_id,
        }
      });
      
      predictionClient = new PredictionServiceClient({
        credentials: parsedCredentials
      });
      console.log('Successfully initialized Vertex AI client');
    } catch (parseError) {
      console.error('Failed to parse Google credentials:', parseError);
    }
  } else {
    console.error('GOOGLE_APPLICATION_CREDENTIALS not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Vertex AI client:', error);
}
// try {
//   // Check if GOOGLE_APPLICATION_CREDENTIALS is set and points to a valid file
//   const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
//   if (credentialsPath && fs.existsSync(credentialsPath)) {
//     // Read and parse the credentials file
//     const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
//     console.log('credentials', credentials)
//     // Initialize Vertex AI with project configuration
//     vertexAI = new VertexAI({
//       project: process.env.GOOGLE_PROJECT_ID || '',
//       location: process.env.GOOGLE_LOCATION || 'us-central1'
//     });
    
//     // Set GOOGLE_APPLICATION_CREDENTIALS environment variable
//     process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(credentialsPath);
    
//     predictionClient = new PredictionServiceClient({
//       credentials: credentials
//     });
//     console.log('Successfully initialized Vertex AI client');
//   } else {
//     console.error('GOOGLE_APPLICATION_CREDENTIALS not found or invalid:', credentialsPath);
//   }
// } catch (error) {
//   console.error('Failed to initialize Vertex AI client:', error);
// }

const deepseekProvider: ModelProvider = {
  makeRequest: async (text: string, systemPrompt: string, userPrompt: string, apiKey: string, config: any) => {
    const apiUrl = 'https://api.deepseek.com/chat/completions'
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt?.replace(/\r\n/g, '\n') || 'You are an AI assistant that helps extract information from documents.'
      },
      {
        role: "user",
        content: `${userPrompt?.replace(/\r\n/g, '\n') || 'Please extract information from this document:'}\n\n${text}`
      }
    ]

    const payload = {
      model: "deepseek-chat",
      messages,
      ...config
    }

    const response = await axios.post(apiUrl, payload, { headers })
    return response.data.choices[0].message.content
  }
}

const googleProvider: ModelProvider = {
  makeRequest: async (text: string, systemPrompt: string, userPrompt: string, _apiKey: string, config: any) => {
    if (!vertexAI) {
      throw new Error('Vertex AI client not initialized. Please check your Google Cloud credentials.');
    }
    console.log('config', config)
    // Get the generative model
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      ...config
    });

    // Create text parts for the request
    const textPart = {
      text: `${systemPrompt || 'You are an AI assistant that helps extract information from documents.'}\n\n${userPrompt || 'Please extract information from this document:'}\n\n${text}`
    };

    // Prepare the request
    const request = {
      contents: [{
        role: 'user',
        parts: [textPart]
      }]
    };

    // Generate content
    const response = await generativeModel.generateContent(request);
    const result = await response.response;
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Failed to generate content from Gemini');
    }
    
    return result.candidates[0].content.parts[0].text;
  }
}

const anthropicProvider: ModelProvider = {
  makeRequest: async (text: string, systemPrompt: string, userPrompt: string, apiKey: string, config: any) => {
    const apiUrl = 'https://api.anthropic.com/v1/messages'
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }

    const payload = {
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${systemPrompt || 'You are an AI assistant that helps extract information from documents.'}\n\n${userPrompt || 'Please extract information from this document:'}\n\n${text}`
            }
          ]
        }
      ],
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      top_p: config.top_p,
      ...config
    }

    const response = await axios.post(apiUrl, payload, { headers })
    return response.data.content[0].text
  }
}

const providers: Record<string, ModelProvider> = {
  deepseek: deepseekProvider,
  google: googleProvider,
  anthropic: anthropicProvider
}

export default defineEventHandler(async (event) => {
  try {
    // Read multipart form data
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw new Error('No data uploaded')
    }

    // Find PDF file and prompts in form data
    const fileData = formData.find(item => item.filename?.toLowerCase().endsWith('.pdf'))
    const systemPrompt = formData.find(item => item.name === 'systemPrompt')?.data.toString('utf-8')
    const userPrompt = formData.find(item => item.name === 'userPrompt')?.data.toString('utf-8')
    const provider = formData.find(item => item.name === 'provider')?.data.toString('utf-8')

    if (!fileData) {
      throw new Error('No PDF file uploaded')
    }

    if (!provider) {
      throw new Error('No provider specified')
    }

    const selectedProvider = providers[provider]
    if (!selectedProvider) {
      throw new Error('Invalid provider')
    }

    // Get API key based on provider
    let finalApiKey = ''
    switch (provider) {
      case 'deepseek':
        finalApiKey = process.env.DEEPSEEK_API_KEY || ''
        break
      case 'anthropic':
        finalApiKey = process.env.ANTHROPIC_API_KEY || ''
        break
      case 'google':
        // No API key needed for Google as it uses application credentials
        break
    }
    
    if (provider !== 'google' && !finalApiKey) {
      throw new Error('API key not configured')
    }

    // Parse PDF content
    const pdfData = await pdfParse(fileData.data)
    const fileContent = pdfData.text

    // Get configuration
    const config = formData.find(item => item.name === 'config')?.data.toString('utf-8')
    const configData = config ? JSON.parse(config) : {}

    // Make request using selected provider
    const result = await selectedProvider.makeRequest(
      fileContent,
      systemPrompt || '',
      userPrompt || '',
      finalApiKey,
      configData
    )
    
    return { result }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'An error occurred while processing the PDF'
    })
  }
}) 
