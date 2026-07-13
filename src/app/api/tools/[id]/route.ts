import { NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { kaliTools } from "@/lib/kali-data"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try Firestore first
    let tool = null
    try {
      const docRef = doc(db, "kali_tools", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        tool = { id: docSnap.id, ...docSnap.data() }
      }
    } catch (firestoreErr) {
      console.log("Firestore not available, using static data:", firestoreErr)
    }

    // Fallback to static data
    if (!tool) {
      const staticTool = kaliTools.find((t, i) => `tool-${i}` === id || t.name === id)
      if (staticTool) {
        tool = { id, ...staticTool }
      }
    }

    if (!tool) {
      return NextResponse.json(
        { error: "الأداة غير موجودة" },
        { status: 404 }
      )
    }

    // Get related tools from the same category (static for performance)
    const toolCategory = (tool as Record<string, unknown>).category as string
    const toolName = (tool as Record<string, unknown>).name as string
    const related = kaliTools
      .filter((t) => t.category === toolCategory && t.name !== toolName)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4)
      .map((t, i) => ({ id: `tool-${kaliTools.indexOf(t)}`, ...t }))

    return NextResponse.json({ tool, related })
  } catch (error) {
    console.error("Tool detail API error:", error)
    return NextResponse.json(
      { error: "فشل في جلب تفاصيل الأداة" },
      { status: 500 }
    )
  }
}
