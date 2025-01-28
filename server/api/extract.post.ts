import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import axios from 'axios'
import { VertexAI } from '@google-cloud/vertexai'
import { PredictionServiceClient } from '@google-cloud/aiplatform'
import { Storage } from '@google-cloud/storage'
import * as fs from 'fs'
import * as path from 'path'

interface ModelProvider {
  makeRequest: (text: string, systemPrompt: string, userPrompt: string, apiKey: string, config: any) => Promise<string>;
}

// Initialize Vertex AI client once
let vertexAI: VertexAI | null = null;
let predictionClient: PredictionServiceClient | null = null;
let storage: Storage | null = null;

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

      // Initialize Google Cloud Storage
      storage = new Storage({
        credentials: parsedCredentials,
        projectId: parsedCredentials.project_id
      });
      
      console.log('Successfully initialized Google Cloud clients');
    } catch (parseError) {
      console.error('Failed to parse Google credentials:', parseError);
    }
  } else {
    console.error('GOOGLE_APPLICATION_CREDENTIALS not found in environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Google Cloud clients:', error);
}

// Function to upload file to GCS and get signed URL
async function uploadToGCS(fileData: Buffer, fileName: string): Promise<string> {
  if (!storage) {
    throw new Error('Google Cloud Storage not initialized');
  }

  const config = useRuntimeConfig();
  const bucketName = config.googleBucketName;
  const bucketPath = config.googleBucketPath;

  if (!bucketName) {
    throw new Error('Google Cloud Storage bucket name not configured');
  }

  const bucket = storage.bucket(bucketName);
  const blobPath = `${bucketPath}/${fileName}`;
  const blob = bucket.file(blobPath);

  // Upload the file
  await blob.save(fileData, {
    contentType: 'application/pdf',
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Get the signed URL that expires in 1 hour
  const [url] = await blob.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return `gs://${bucketName}/${blobPath}`;
}

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
      model: config.model || "deepseek-chat",
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

    // Create parts for the request
    const filePart = {
      fileData: {
        fileUri: text, // This will be the GCS URL
        mimeType: 'application/pdf',
      },
    };

    const textPart = {
      text: `${systemPrompt || 'You are an AI assistant that helps extract information from documents.'}\n\n${userPrompt || 'Please extract information from this document:'}`
    };

    // Prepare the request
    const request = {
      contents: [{
        role: 'user',
        parts: [filePart, textPart]
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

    // Get configuration
    const config = formData.find(item => item.name === 'config')?.data.toString('utf-8')
    const configData = config ? JSON.parse(config) : {}

    let content: string;
    if (provider === 'google') {
      // For Google provider, upload to GCS and get URL
      const fileName = `${Date.now()}-${fileData.filename}`;
      const gcsUrl = await uploadToGCS(fileData.data, fileName);
      content = gcsUrl;
    } else {
      // For other providers, parse PDF content
      const pdfData = await pdfParse(fileData.data);
      content = pdfData.text;
    }

    // Make request using selected provider
    const result = await selectedProvider.makeRequest(
      content,
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
