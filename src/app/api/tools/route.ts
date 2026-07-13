import { NextRequest, NextResponse } from "next/server"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { kaliTools, kaliCategories } from "@/lib/kali-data"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    // Try to fetch from Firestore first
    let tools: Array<Record<string, unknown>> = []
    try {
      const toolsRef = collection(db, "kali_tools")
      let q = query(toolsRef, orderBy("popularity", "desc"))

      if (category && category !== "all") {
        q = query(toolsRef, where("category", "==", category), orderBy("popularity", "desc"))
      }

      const snapshot = await getDocs(q)
      tools = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<Record<string, unknown>>

      // Filter by search if provided
      if (search) {
        const q = search.toLowerCase()
        tools = tools.filter(
          (t: Record<string, unknown>) =>
            String(t.name || "").toLowerCase().includes(q) ||
            String(t.description || "").toLowerCase().includes(q) ||
            String(t.tags || "").toLowerCase().includes(q) ||
            String(t.command || "").toLowerCase().includes(q)
        )
      }
    } catch (firestoreErr) {
      console.log("Firestore not available, using static data:", firestoreErr)
      // Fallback to static data
      let filtered = [...kaliTools]
      if (search) {
        const q = search.toLowerCase()
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.toLowerCase().includes(q) ||
            t.command.toLowerCase().includes(q)
        )
      }
      if (category && category !== "all") {
        filtered = filtered.filter((t) => t.category === category)
      }
      filtered.sort((a, b) => b.popularity - a.popularity)
      tools = filtered.map((t, i) => ({ id: `tool-${i}`, ...t }))
    }

    // Get categories with counts
    const categories = kaliCategories.map((c) => ({
      name: c,
      count: kaliTools.filter((t) => t.category === c).length,
    }))

    return NextResponse.json({
      tools,
      total: tools.length,
      categories,
    })
  } catch (error) {
    console.error("Tools API error:", error)
    return NextResponse.json(
      { error: "فشل في جلب الأدوات" },
      { status: 500 }
    )
  }
}
