import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import axios from 'axios'

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

    if (!fileData) {
      throw new Error('No PDF file uploaded')
    }

    // Parse PDF content
    const pdfData = await pdfParse(fileData.data)
    const fileContent = pdfData.text

    // Get API key from environment
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('API key not configured')
    }

    // Prepare API request with preserved formatting
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
        content: `${userPrompt?.replace(/\r\n/g, '\n') || 'Please extract information from this document:'}\n\n${fileContent}`
      }
    ]

    const config = formData.find(item => item.name === 'config')?.data.toString('utf-8')
    const configData = config ? JSON.parse(config) : {}

    const payload = {
      model: "deepseek-chat",
      messages,
      ...configData  // Merge the custom config
    }

    // Make API request
    const response = await axios.post(apiUrl, payload, { headers })
    
    return {
      result: response.data.choices[0].message.content
    }

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'An error occurred while processing the PDF'
    })
  }
}) 
