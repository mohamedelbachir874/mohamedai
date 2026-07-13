import OpenAI from "openai"

// Groq client (compatible with OpenAI SDK)
// Get your free API key from: https://console.groq.com/keys
export const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
})

// Model: llama-3.3-70b-versatile (fast + smart, free on Groq)
export const GROQ_MODEL = "llama-3.3-70b-versatile"

// Vision model (for image analysis)
export const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface VisionContentPart {
  type: string
  text?: string
  image_url?: { url: string }
}

/**
 * Send a text chat completion request to Groq
 */
export async function chatCompletion(messages: ChatMessage[]) {
  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2500,
  })
  return completion.choices?.[0]?.message?.content || ""
}

/**
 * Send a vision (image + text) chat completion request to Groq
 */
export async function visionChatCompletion(
  systemPrompt: string,
  historyMessages: Array<{ role: string; content: string }>,
  userText: string,
  imageUrls: string[]
) {
  const messages: Array<{
    role: "system" | "user" | "assistant"
    content: string | VisionContentPart[]
  }> = [
    { role: "system", content: systemPrompt },
    ...historyMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: [
        { type: "text", text: userText || "حلل هذه الصورة واشرح ما تراه." },
        ...imageUrls.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ],
    },
  ]

  const completion = await groqClient.chat.completions.create({
    model: GROQ_VISION_MODEL,
    messages: messages as never,
    temperature: 0.7,
    max_tokens: 2500,
  })
  return completion.choices?.[0]?.message?.content || ""
}
