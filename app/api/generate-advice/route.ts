import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { moodScore, energyLevel, notes, userTraits, locale = 'vi' } = await request.json()

    // Get user ID from authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const systemPrompts = {
      vi: "Bạn là một chuyên gia tâm lý và coach cá nhân. Hãy đưa ra lời khuyên ngắn gọn, tích cực và thực tế bằng tiếng Việt dựa trên tình trạng cảm xúc và năng lượng của người dùng. Lời khuyên nên từ 2-3 câu, dễ hiểu và có thể thực hiện được. Ngoài ra, hãy đề xuất một thói quen nhỏ (micro-habit) cụ thể (tối đa 5 từ) mà họ có thể làm ngay hôm nay.",
      en: "You are a psychology expert and personal coach. Provide concise, positive, and practical advice in English based on the user's emotional state and energy level. The advice should be 2-3 sentences, easy to understand and actionable. Also, suggest a specific micro-habit (max 5 words) they can do today.",
      ja: "あなたは心理学の専門家でありパーソナルコーチです。ユーザーの感情状態とエネルギーレベルに基づいて、簡潔で前向きで実用的なアドバイスを日本語で提供してください。アドバイスは2-3文で、理解しやすく実行可能なものにしてください。また、今日できる具体的なマイクロ習慣（最大5語）を提案してください。"
    }

    const prompt = `
      User Data:
      - Mood: ${moodScore}/5
      - Energy: ${energyLevel}
      - Note: "${notes || ''}"
      ${userTraits ? `- Traits: ${JSON.stringify(userTraits)}` : ''}
      
      Return the response in the following JSON format:
      {
        "advice": "Your advice here",
        "suggested_habit": "Actionable habit here",
        "template_type": "general_advice"
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompts[locale as keyof typeof systemPrompts] || systemPrompts.vi
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    const result = JSON.parse(content)

    // Ensure template_type exists
    if (!result.template_type) {
      result.template_type = 'general_advice'
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error generating advice:', error)

    // Fallback
    return NextResponse.json({
      advice: "Hãy dành thời gian chăm sóc bản thân và lắng nghe cảm xúc của mình.",
      suggested_habit: "Hít thở sâu 3 lần",
      template_type: "fallback",
      fallback: true
    })
  }
}
