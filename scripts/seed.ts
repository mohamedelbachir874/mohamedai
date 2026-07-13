import { db } from "../src/lib/db"
import { kaliTools } from "../src/lib/kali-data"

async function main() {
  console.log("🌱 بدء زرع قاعدة بيانات Kali Linux...")

  // Clear existing
  await db.kaliTool.deleteMany({})
  console.log("✓ تم حذف البيانات القديمة")

  // Insert all tools
  for (const tool of kaliTools) {
    await db.kaliTool.create({
      data: {
        name: tool.name,
        category: tool.category,
        description: tool.description,
        command: tool.command,
        examples: tool.examples,
        tags: tool.tags,
        popularity: tool.popularity,
      },
    })
  }

  console.log(`✓ تم إدراج ${kaliTools.length} أداة بنجاح`)
  console.log("🎉 اكتملت زراعة قاعدة البيانات!")
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
