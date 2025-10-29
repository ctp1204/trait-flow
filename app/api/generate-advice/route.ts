import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { moodScore, energyLevel, notes, userTraits, locale = 'vi' } = await request.json()

    // Tạo prompt dựa trên thông tin checkin
    const prompt = createPrompt(moodScore, energyLevel, notes, userTraits, locale)

    const systemPrompts = {
      vi: "Bạn là một chuyên gia tâm lý và coach cá nhân. Hãy đưa ra lời khuyên ngắn gọn, tích cực và thực tế bằng tiếng Việt dựa trên tình trạng cảm xúc và năng lượng của người dùng. Lời khuyên nên từ 2-3 câu, dễ hiểu và có thể thực hiện được.",
      en: "You are a psychology expert and personal coach. Provide concise, positive, and practical advice in English based on the user's emotional state and energy level. The advice should be 2-3 sentences, easy to understand and actionable.",
      ja: "あなたは心理学の専門家でありパーソナルコーチです。ユーザーの感情状態とエネルギーレベルに基づいて、簡潔で前向きで実用的なアドバイスを日本語で提供してください。アドバイスは2-3文で、理解しやすく実行可能なものにしてください。"
    }

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
      max_tokens: 200,
      temperature: 0.7,
    })

    const advice = completion.choices[0]?.message?.content || "Hãy dành thời gian chăm sóc bản thân và lắng nghe cảm xúc của mình."

    // Xác định template type dựa trên mood score
    let templateType = 'general_advice'
    if (moodScore <= 2) {
      templateType = 'supportive_advice'
    } else if (moodScore === 3) {
      templateType = 'neutral_boost'
    } else if (moodScore >= 4) {
      templateType = 'positive_reinforcement'
    }

    return NextResponse.json({
      advice,
      template_type: templateType
    })

  } catch (error) {
    console.error('Error generating advice:', error)

    // Fallback advice nếu OpenAI API lỗi
    const fallbackAdvice = getFallbackAdvice(await request.json())

    return NextResponse.json({
      advice: fallbackAdvice.message,
      template_type: fallbackAdvice.template_type,
      fallback: true
    })
  }
}

function createPrompt(moodScore: number, energyLevel: string, notes: string, userTraits?: Record<string, number>, locale: string = 'vi'): string {
  let moodDescription = ''
  switch (moodScore) {
    case 1:
      moodDescription = 'rất tệ (1/5)'
      break
    case 2:
      moodDescription = 'không tốt (2/5)'
      break
    case 3:
      moodDescription = 'bình thường (3/5)'
      break
    case 4:
      moodDescription = 'tốt (4/5)'
      break
    case 5:
      moodDescription = 'rất tốt (5/5)'
      break
  }

  let energyDescription = ''
  switch (energyLevel.toLowerCase()) {
    case 'low':
      energyDescription = 'thấp'
      break
    case 'mid':
    case 'medium':
      energyDescription = 'trung bình'
      break
    case 'high':
      energyDescription = 'cao'
      break
  }

  let prompt = `Người dùng đang có tâm trạng ${moodDescription} và mức năng lượng ${energyDescription}.`

  if (notes && notes.trim().length > 0) {
    prompt += ` Họ chia sẻ thêm: "${notes.trim()}"`
  }

  if (userTraits) {
    prompt += ` Đặc điểm tính cách của họ bao gồm: ${Object.entries(userTraits).map(([key, value]) => `${key}: ${value}/100`).join(', ')}.`
  }

  prompt += ` Hãy đưa ra lời khuyên phù hợp để giúp họ cải thiện tâm trạng và năng lượng.`

  return prompt
}

function getFallbackAdvice(data: { moodScore: number }): { template_type: string, message: string } {
  const { moodScore } = data
  let advice = ''
  let templateType = 'general_advice'

  if (moodScore <= 2) {
    advice = "Có vẻ như bạn đang trải qua thời gian khó khăn. Hãy nhớ rằng cảm xúc này sẽ qua đi. Thử nghỉ ngơi một chút hoặc làm điều gì đó nhỏ nhặt mà bạn yêu thích."
    templateType = 'supportive_advice'
  } else if (moodScore === 3) {
    advice = "Tâm trạng bình thường cũng là điều tốt. Đôi khi một thay đổi nhỏ có thể tạo ra sự khác biệt lớn. Hãy thử đi dạo hoặc nghe nhạc yêu thích."
    templateType = 'neutral_boost'
  } else if (moodScore >= 4) {
    advice = "Thật tuyệt khi bạn cảm thấy tốt! Hãy duy trì động lực tích cực này. Có điều gì nhỏ bạn có thể làm để giữ vững cảm giác này không?"
    templateType = 'positive_reinforcement'
  }

  return { template_type: templateType, message: advice }
}
