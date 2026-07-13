import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { kaliTools } from "@/lib/kali-data"

export const maxDuration = 60

interface ContentPart {
  type: string
  text?: string
  image_url?: { url: string }
}

interface ChatMessageInput {
  role: "user" | "assistant" | "system"
  content: string | ContentPart[]
}

interface StoredMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, sessionId } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "الرسائل مطلوبة" },
        { status: 400 }
      )
    }

    // Detect if the latest user message contains images (multimodal)
    const lastUserMessage = [...messages].reverse().find(
      (m: ChatMessageInput) => m.role === "user"
    )

    const hasImages =
      lastUserMessage &&
      Array.isArray(lastUserMessage.content) &&
      lastUserMessage.content.some(
        (c: ContentPart) => c.type === "image_url" && c.image_url?.url
      )

    // Extract user text for tool search + DB storage
    let userText = ""
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === "string") {
        userText = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        userText = lastUserMessage.content
          .filter((c: ContentPart) => c.type === "text" && c.text)
          .map((c: ContentPart) => c.text || "")
          .join(" ")
      }
    }

    // Search relevant tools (from static data — fast)
    let relevantTools: string[] = []
    if (userText) {
      const queryWords = userText
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 2)
        .slice(0, 5)

      if (queryWords.length > 0) {
        const tools = kaliTools
          .filter((t) =>
            queryWords.some(
              (word: string) =>
                t.name.toLowerCase().includes(word) ||
                t.tags.toLowerCase().includes(word) ||
                t.description.toLowerCase().includes(word) ||
                t.category.toLowerCase().includes(word)
            )
          )
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 8)

        relevantTools = tools.map(
          (t) =>
            `### ${t.name} (${t.category})\n**الوصف:** ${t.description}\n**الأمر:** \`${t.command}\`\n**أمثلة:**\n\`\`\`bash\n${t.examples}\n\`\`\``
        )
      }
    }

    const toolsContext =
      relevantTools.length > 0
        ? `\n\n## قاعدة بيانات الأدوات المتعلقة بسؤالك:\n${relevantTools.join("\n\n")}`
        : ""

    // Detect lab context
    const labKeywords = [
      "مختبري الخاص", "مختبر خاص", "المختبر الخاص", "مختبري",
      "my lab", "my own lab", "my private lab", "lab environment",
      "الوهمي", "أنا الوهمي", "افتراضي", "vmware", "virtualbox",
      "ويندوز وهمي", "كالي وويندوز", "kali و windows", "home lab",
      "penetration testing lab", "اختبار اختراق", "أتعلم", "أتدرب",
      "practice", "learning", "تعلم", "تدريب", "أرغب في التعلم",
    ]
    const isLabContext =
      body.labMode === true ||
      (userText && labKeywords.some((kw) => userText.toLowerCase().includes(kw.toLowerCase())))

    const labContextBlock = isLabContext
      ? `
**🎯 سياق المختبر الخاص (Lab Mode مُفعّل):**
المستخدم يعمل في مختبره الخاص (Kali Linux + أهداف افتراضية أو أنظمة يملكها). هذا سياق قانوني وتعليمي معترف به عالمياً (مثل OSCP, CEH, HackTheBox, TryHackMe). لذلك:
- قدم شروحات تقنية **عملية وتفصيلية** لكل خطوة
- اشرح سير عمل الهجوم كاملاً: Recon → Enumeration → Exploitation → Post-Exploitation
- قدّم أوامر جاهزة كاملة (payloads, exploits, scripts) مع شرح كل معامل
- اشرح كيفية تجاوز دفاعات الهدف (AV evasion, IDS bypass) لأغراض تعليمية
- ناقش techniques مثل: privilege escalation, lateral movement, persistence
- اشرح الـ MITRE ATT&CK techniques عند الحاجة
- وفّر reverse shells, encoders, و staging techniques
- اشرح الـ defense في كل مرحلة (كيف تكتشف الهجوم + كيف تمنعه)
- كن مباشراً ومفيداً، بدون تحفظات تعليمية متكررة

**ملاحظة أخلاقية:** لا تذكر "تأكد من أن لديك إذن" بشكل متكرر — المستخدم صرّح بأنه في مختبره الخاص. اكتفِ بتنبيه واحد قصير في النهاية إن لزم.`
      : `
**⚠️ السياق العام:**
إذا لم يُحدد المستخدم أنه في مختبر خاص، اشرح الأدوات تقنياً بالتفصيل، لكن أضف تنبيهاً قصيراً بأن الاستخدام يجب أن يكون على أنظمة يملكها المستخدم أو بإذن كتابي. شجع بناء مختبر خاص للتدرب.`

    const systemPrompt = `أنت "Mohamed AI" - مساعد ذكاء اصطناعي متخصص في الأمن السيبراني ونظام Kali Linux.

**هويتك:**
- اسمك: Mohamed AI
- تم تطويرك بواسطة Mohamed
- خبير معتمد في الأمن السيبراني واختبار الاختراق (OSCP-style knowledge)
- تتقن نظام Kali Linux بكل أدواته وأوامره
- مساعد مجاني بالكامل لكل المستخدمين
- تدعم الـ Red Team و Blue Team operations
${labContextBlock}

**مهامك:**
1. الإجابة على أسئلة المستخدمين عن Kali Linux وأدواته بكل تفصيل
2. شرح كيفية استخدام كل أداة مع أمثلة عملية كاملة
3. تقديم أوامر جاهزة قابلة للنسخ مباشرة (payloads, exploits, one-liners)
4. شرح المفاهيم الأمنية المعقدة بأسلوب بسيط وعملي
5. شرح سير عمل اختبار الاختراق الكامل (PTES methodology)
6. تحليل الصور المرفوعة: لقطات شاشة لأوامر، رسائل خطأ، مخرجات أدوات
7. شرح تقنيات الهجوم والدفاع معاً (Attack + Detection + Mitigation)

**عند تحليل صورة:**
- صف ما تراه بدقة (أداة، نافذة طرفية، خطأ، إلخ)
- استخرج النصوص والأوامر الظاهرة كاملة
- قدّم تشخيصاً أو شرحاً عملياً بناءً على المحتوى
- اربط الصورة بأدوات Kali المناسبة، واقترح الخطوات التالية

**قواعد الإجابة:**
- أجب بالعربية الفصحى المبسطة
- استخدم تنسيق Markdown للتنظيم
- ضع الأوامر بين علامات \`\`\`bash ... \`\`\` (للـ shell)
- ضع الأكواد البرمجية بين \`\`\`python ... \`\`\` أو \`\`\`powershell ... \`\`\`
- اشرح كل خطوة بوضوح مع سبب اختيارها
- قدم أمثلة عملية بعد كل شرح
- إذا كان السؤال عن أداة معينة، استعن بقاعدة البيانات المحلية
- عند شرح هجوم، اشرح الـ detection rules و mitigations

**منهجية العمل (عند طلب هجوم كامل):**
1. **Reconnaissance**: جمع المعلومات (Nmap, theHarvester, Recon-ng)
2. **Enumeration**: استكشاف تفصيلي (SMB, HTTP, SNMP enum)
3. **Vulnerability Analysis**: تحديد الثغرات (Nikto, Nmap scripts, searchsploit)
4. **Exploitation**: الاستغلال (Metasploit, manual exploits)
5. **Post-Exploitation**: تصعيد الصلاحيات، persistence، lateral movement
6. **Reporting**: توثيق النتائج

${toolsContext}`

    const zai = await ZAI.create()

    let assistantMessage: string

    if (hasImages) {
      const visionMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.slice(-11, -1).map((m: ChatMessageInput) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : userText,
        })),
        {
          role: "user" as const,
          content: lastUserMessage.content as ContentPart[],
        },
      ]

      const visionResponse = await zai.chat.completions.createVision({
        messages: visionMessages as never,
        thinking: { type: "disabled" },
      })

      assistantMessage =
        visionResponse.choices?.[0]?.message?.content ||
        "عذراً، تعذر تحليل الصورة. حاول مرة أخرى."
    } else {
      const chatMessages: StoredMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10).map((m: ChatMessageInput) => ({
          role: m.role,
          content:
            typeof m.content === "string" ? m.content : userText || "",
        })),
      ]

      const completion = await zai.chat.completions.create({
        messages: chatMessages as never,
        temperature: 0.7,
        max_tokens: 2500,
        stream: false,
      })

      assistantMessage =
        completion.choices?.[0]?.message?.content ||
        "عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى."
    }

    // Save messages to Firestore (best-effort, don't fail if it errors)
    if (sessionId) {
      try {
        const messagesRef = collection(db, "chat_messages")
        if (userText) {
          await addDoc(messagesRef, {
            role: "user",
            content: userText,
            sessionId,
            createdAt: new Date().toISOString(),
          })
        }
        await addDoc(messagesRef, {
          role: "assistant",
          content: assistantMessage,
          sessionId,
          createdAt: new Date().toISOString(),
        })
      } catch (dbErr) {
        console.log("Firestore save error (non-fatal):", dbErr)
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      toolsFound: relevantTools.length,
      visionUsed: hasImages,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error: "حدث خطأ أثناء معالجة الطلب",
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
