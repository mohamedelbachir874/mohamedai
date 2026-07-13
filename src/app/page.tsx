'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Terminal, Search, Send, Bot, User, Shield, Zap, Code2,
  Database, Cpu, Lock, Skull, ChevronRight, Copy, Check,
  Menu, X, BookOpen, Sparkles, Network, Wifi, KeyRound,
  Bug, Eye, Server, ImagePlus, XCircle, Gift, Crown, Star,
  Upload, Github, MessageSquare, Activity, Globe, FlaskConical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

interface ImageAttachment {
  dataUrl: string
  name: string
  size: number
}

interface Message {
  role: "user" | "assistant"
  content: string
  images?: ImageAttachment[]
  timestamp: number
}

interface Tool {
  id: string
  name: string
  category: string
  description: string
  command: string
  examples: string
  tags: string
  popularity: number
}

interface CategoryCount {
  name: string
  count: number
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Information Gathering": Search,
  "Vulnerability Analysis": Bug,
  "Web Application Analysis": Code2,
  "Password Attacks": KeyRound,
  "Wireless Attacks": Wifi,
  "Exploitation Tools": Zap,
  "Sniffing & Spoofing": Network,
  "Post Exploitation": Server,
  "Forensics": Eye,
  "Social Engineering": User,
  "Reporting": BookOpen,
  "Stress Testing": Cpu,
  "Hardware": Cpu,
  "Reverse Engineering": Code2,
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "tools">("chat")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "مرحباً بك في **Mohamed AI** 👾\n\nأنا مساعدك الذكي المتخصص في الأمن السيبراني ونظام **Kali Linux**.\n\n✨ **مجاني بالكامل** • 🧪 **Lab Mode مُفعّل** • 📋 **الصق screenshots بـ Ctrl+V**\n\nاسألني عن أي أداة، أو الصق لقطة شاشة لتحليلها، أو اطلب شرح هجوم كامل (Recon → Exploit → Post-Exploit + Defense).",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<ImageAttachment[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [labMode, setLabMode] = useState(true) // default ON — most users are learners
  const [labInput, setLabInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string>(
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )

  // Tools state
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)

  const fetchTools = useCallback(async () => {
    setToolsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (selectedCategory !== "all") params.set("category", selectedCategory)
      const res = await fetch(`/api/tools?${params.toString()}`)
      const data = await res.json()
      setTools(data.tools || [])
      setCategories(data.categories || [])
    } catch (e) {
      console.error(e)
      toast.error("فشل في تحميل الأدوات")
    } finally {
      setToolsLoading(false)
    }
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    const t = setTimeout(fetchTools, 250)
    return () => clearTimeout(t)
  }, [fetchTools])

  // Track initial mount to avoid scrolling down on page load
  const hasMountedRef = useRef(false)

  useEffect(() => {
    // Only scroll to bottom AFTER the initial mount (when new messages arrive)
    // On first mount, leave the page at the top so the user sees the hero/header first
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      // Scroll the whole page to the top on first load
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  // Handle image upload
  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} ليس صورة`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} أكبر من 5 ميجابايت`)
          continue
        }

        const formData = new FormData()
        formData.append("image", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Upload failed")
        const data = await res.json()

        setImages((prev) => [
          ...prev,
          {
            dataUrl: data.dataUrl,
            name: data.name,
            size: data.size,
          },
        ])
      }
      toast.success("تم رفع الصورة")
    } catch (e) {
      console.error(e)
      toast.error("فشل رفع الصورة")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  // Send message with optional images
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if ((!content && images.length === 0) || loading) return

    const userImages = [...images]
    const userMsg: Message = {
      role: "user",
      content,
      images: userImages.length > 0 ? userImages : undefined,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setImages([])
    setLoading(true)

    try {
      // Build multimodal content for the last user message
      const apiMessages = [...messages, userMsg].map((m) => {
        if (m.role === "user" && m.images && m.images.length > 0) {
          const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
          if (m.content) {
            contentParts.push({ type: "text", text: m.content })
          } else {
            contentParts.push({ type: "text", text: "حلل هذه الصورة واشرح ما تراه." })
          }
          for (const img of m.images) {
            contentParts.push({ type: "image_url", image_url: { url: img.dataUrl } })
          }
          return { role: m.role, content: contentParts }
        }
        return { role: m.role, content: m.content }
      })

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          messages: apiMessages,
          labMode,
        }),
      })

      if (!res.ok) throw new Error("فشل الاتصال")

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: Date.now(),
        },
      ])
    } catch (e) {
      console.error(e)
      toast.error("حدث خطأ. حاول مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Global paste listener — handles ALL paste events (including textarea)
  // Only ONE handler to avoid duplicates
  useEffect(() => {
    const onGlobalPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return
      // Skip if user is typing in a regular input (text, email, etc.)
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" &&
        target.getAttribute("type") !== "file"
      ) return

      const items = Array.from(e.clipboardData.items)
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length > 0) {
        e.preventDefault()
        e.stopPropagation() // prevent any other handlers from firing
        const files = imageItems
          .map((item) => item.getAsFile())
          .filter((f): f is File => f !== null)

        if (files.length > 0) {
          const fileList = new DataTransfer()
          files.forEach((f) => fileList.items.add(f))
          handleImageSelect(fileList.files)
          toast.success(`تم لصق ${files.length} صورة من الحافظة 📋`)
        }
      }
    }

    // Use capture phase to intercept before textarea's onPaste
    window.addEventListener("paste", onGlobalPaste, true)
    return () => window.removeEventListener("paste", onGlobalPaste, true)
  }, [])

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <SonnerToaster position="top-center" dir="rtl" />
      <MatrixBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/40 flex items-center justify-center neon-glow float-anim">
                  <Skull className="w-5 h-5 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold gradient-text">
                  Mohamed AI
                </h1>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] md:text-xs text-muted-foreground font-mono">
                    Kali Linux Security Assistant
                  </p>
                  <Badge className="text-[9px] h-4 px-1.5 bg-primary/20 text-primary border border-primary/40 font-mono">
                    FREE
                  </Badge>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
                ONLINE
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono">
                <Gift className="w-2.5 h-2.5 mr-1" />
                مجاني
              </Badge>
              <Badge variant="outline" className="border-primary/40 text-primary font-mono">
                v2.0
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative py-8 md:py-10 px-4 overflow-hidden">
        <div className="hero-glow" />
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4 animated-border"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-mono text-primary">مدعوم بـ GLM-4 Vision</span>
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold mb-3 gradient-text terminal-glow">
              مساعدك الذكي للأمن السيبراني
              <span className="typewriter-cursor" />
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5 max-w-2xl mx-auto">
              تعلّم اختبار الاختراق و Kali Linux مع مساعد ذكاء اصطناعي مجاني بالكامل.
              اسأل، ارفع صور، احصل على أوامر جاهزة وشروحات تفصيلية.
            </p>

            <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
              {[
                { icon: Crown, text: "مجاني 100%", color: "text-yellow-500" },
                { icon: Database, text: "84+ أداة", color: "text-primary" },
                { icon: ImagePlus, text: "تحليل الصور", color: "text-cyan-400" },
                { icon: MessageSquare, text: "بلا حدود", color: "text-emerald-400" },
                { icon: FlaskConical, text: "Lab Mode", color: "text-amber-400" },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/60 border border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <Icon className={`w-3 h-3 ${item.color}`} />
                    {item.text}
                  </motion.span>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 pb-6 relative z-10">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "tools")}>
          <div className="flex justify-center mb-6">
            <TabsList className="glass-card-strong p-1">
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono"
              >
                <Bot className="w-4 h-4 ml-2" />
                المساعد الذكي
              </TabsTrigger>
              <TabsTrigger
                value="tools"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono"
              >
                <Database className="w-4 h-4 ml-2" />
                مكتبة الأدوات
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chat tab */}
          <TabsContent value="chat" className="mt-0">
            <div className="grid lg:grid-cols-[1fr_320px] gap-4">
              {/* Chat area */}
              <Card
                className={`flex flex-col h-[72vh] glass-card border-primary/20 transition-all ${
                  isDragging ? "border-primary neon-glow-strong scale-[1.005]" : ""
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center gap-2 p-3 border-b border-primary/20">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/40 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">Mohamed AI</p>
                      <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono">
                        FREE
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {loading ? "يكتب الآن..." : "متصل • مجاني • بلا حدود"}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
                    GLM-4 Vision
                  </Badge>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${
                      labMode
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400 neon-glow"
                        : "bg-card/60 border-border text-muted-foreground"
                    }`}
                    title="يتم التفعيل من خانة الإدخال في الـ sidebar"
                  >
                    <FlaskConical className="w-3 h-3" />
                    {labMode ? "LAB MODE: ON" : "LAB MODE: OFF"}
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse msg-user" : "msg-assistant"}`}
                      >
                        <Avatar className="w-8 h-8 border border-primary/30 shrink-0">
                          {msg.role === "user" ? (
                            <AvatarFallback className="bg-secondary text-foreground">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-primary/20 text-primary">
                              <Bot className="w-4 h-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div
                          className={`flex-1 max-w-[85%] rounded-2xl p-3 ${
                            msg.role === "user"
                              ? "bg-secondary/50 text-foreground border border-border"
                              : "glass-card border-primary/20"
                          }`}
                        >
                          {/* Show images ABOVE the text — LARGE and CLEAR (object-contain to show full image) */}
                          {msg.images && msg.images.length > 0 && (
                            <div
                              className={`mb-2 ${
                                msg.images.length === 1
                                  ? "grid grid-cols-1"
                                  : msg.images.length === 2
                                  ? "grid grid-cols-2 gap-2"
                                  : "grid grid-cols-2 gap-2"
                              }`}
                            >
                              {msg.images.map((img, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: idx * 0.08 }}
                                  className={`relative rounded-xl overflow-hidden border-2 border-primary/40 group cursor-zoom-in hover:border-primary/70 transition-colors bg-background/40 ${
                                    msg.images.length === 3 && idx === 0 ? "col-span-2" : ""
                                  }`}
                                  onClick={() => window.open(img.dataUrl, "_blank")}
                                  title="انقر لعرض الصورة بحجم كامل"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.dataUrl}
                                    alt={img.name}
                                    className={`w-full object-contain transition-transform group-hover:scale-105 ${
                                      msg.images.length === 1
                                        ? "max-h-96"
                                        : msg.images.length === 3 && idx === 0
                                        ? "max-h-56"
                                        : "max-h-44"
                                    }`}
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                                    <span className="text-[10px] text-white font-mono truncate">
                                      {img.name} · انقر للتكبير
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                          {msg.role === "assistant" ? (
                            <div className="prose-chat text-sm">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border border-primary/30">
                          <AvatarFallback className="bg-primary/20 text-primary">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="glass-card border-primary/20 rounded-lg p-4 flex items-center gap-1.5">
                          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
                          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
                          <span className="typing-dot w-2 h-2 rounded-full bg-primary" />
                          <span className="text-xs text-primary mr-2 font-mono">
                            Mohamed AI يفكر...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Drag overlay */}
                {isDragging && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-primary mx-auto mb-2 float-anim" />
                      <p className="text-primary font-mono">أفلت الصور هنا للرفع</p>
                    </div>
                  </div>
                )}

                {/* Input area — thumbnails ABOVE the input field */}
                <div className="border-t border-primary/20">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />

                  {/* Thumbnails row ABOVE the input */}
                  <AnimatePresence>
                    {images.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pt-3 overflow-hidden"
                      >
                        <div className="flex gap-2 flex-wrap items-center">
                          <span className="text-[10px] text-primary font-mono shrink-0 mb-1">
                            {images.length} صورة:
                          </span>
                          {images.map((img, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.7, opacity: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="relative group shrink-0 mb-1"
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/40 bg-muted/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.dataUrl}
                                  alt={img.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => removeImage(idx)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                title="إزالة الصورة"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ))}
                          <button
                            onClick={() => setImages([])}
                            className="text-[10px] text-muted-foreground hover:text-destructive font-mono px-2 py-1 mb-1"
                          >
                            مسح الكل
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input row */}
                  <div className="p-3 flex gap-2 items-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading || uploadingImage}
                      className="border-primary/30 text-primary hover:bg-primary/10 h-11 w-11 shrink-0"
                      title="رفع صورة للتحليل"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                    </Button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        images.length > 0
                          ? "أضف وصفاً للصورة (اختياري)..."
                          : "اكتب سؤالك هنا"
                      }
                      className="flex-1 bg-background/60 border border-primary/30 rounded-md outline-none font-mono text-sm resize-none min-h-[44px] max-h-32 focus:border-primary transition-colors px-3 py-2.5 placeholder:text-muted-foreground"
                      rows={1}
                      disabled={loading}
                      style={{ fieldSizing: "content" } as React.CSSProperties}
                    />

                    <Button
                      onClick={() => sendMessage()}
                      disabled={loading || (!input.trim() && images.length === 0)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-11 w-11 p-0 pulse-glow"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Sidebar */}
              <div className="hidden lg:block space-y-4">
                <Card className="p-4 glass-card border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-primary">حالة النظام</h3>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <StatusRow label="النظام" value="Kali Linux 2025.2" />
                    <StatusRow label="النواة" value="6.12.0-kali" />
                    <StatusRow label="الأدوات" value="84+ أداة" />
                    <StatusRow label="النموذج" value="GLM-4 Vision" />
                    <StatusRow label="الحالة" value="نشط" pulse />
                    <StatusRow label="التكلفة" value="مجاني 100%" highlight />
                    <StatusRow
                      label="وضع المختبر"
                      value={labMode ? "مُفعّل 🧪" : "معطّل"}
                      pulse={labMode}
                    />
                  </div>
                </Card>

                <Card className="p-4 glass-card border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-primary">الميزات</h3>
                  </div>
                  <div className="space-y-3">
                    <FeatureItem icon={Shield} title="قاعدة معرفة شاملة" desc="84+ أداة Kali" color="emerald" />
                    <FeatureItem icon={Zap} title="إجابات فورية" desc="مدعومة بـ GLM-4" color="yellow" />
                    <FeatureItem icon={ImagePlus} title="تحليل الصور" desc="لقطات شاشة وأخطاء" color="cyan" />
                    <FeatureItem icon={Code2} title="أوامر جاهزة" desc="قابلة للنسخ مباشرة" color="purple" />
                    <FeatureItem icon={Gift} title="مجاني بالكامل" desc="بلا حدود أو اشتراك" color="emerald" />
                  </div>
                </Card>

                {/* Lab Mode activation box — type "تفعيل وضع المختبر" to enable */}
                <Card className={`p-3 border transition-all ${
                  labMode
                    ? "bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/50 neon-glow"
                    : "glass-card border-primary/20"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className={`w-3.5 h-3.5 ${labMode ? "text-amber-400" : "text-muted-foreground"}`} />
                    <h3 className={`text-xs font-bold font-mono ${labMode ? "text-amber-400" : "text-muted-foreground"}`}>
                      {labMode ? "🟢 LAB MODE مُفعّل" : "⚪ LAB MODE معطّل"}
                    </h3>
                  </div>
                  {labMode ? (
                    <Button
                      onClick={() => setLabMode(false)}
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[11px] font-mono border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    >
                      تعطيل وضع المختبر
                    </Button>
                  ) : (
                    <Input
                      value={labInput}
                      onChange={(e) => setLabInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && labInput.trim() === "تفعيل وضع المختبر") {
                          setLabMode(true)
                          setLabInput("")
                          toast.success("🧪 تم تفعيل وضع المختبر — شروحات عملية تفصيلية الآن!")
                        }
                      }}
                      placeholder='اكتب: "تفعيل وضع المختبر"'
                      className="h-7 text-[11px] font-mono bg-background/60 border-primary/30 text-center placeholder:text-muted-foreground/60"
                    />
                  )}
                </Card>

                <Card className="p-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/30 relative overflow-hidden">
                  <div className="absolute top-2 left-2 opacity-20">
                    <Skull className="w-20 h-20 text-primary" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-sm font-bold gradient-text">
                        Mohamed AI
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      مساعد ذكاء اصطناعي مجاني متخصص في الأمن السيبراني و Kali Linux. صُمم لمساعدة الباحثين على فهم أدوات اختبار الاختراق.
                    </p>
                    <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[9px]">
                      <Star className="w-2.5 h-2.5 ml-1" />
                      للأغراض التعليمية
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tools tab */}
          <TabsContent value="tools" className="mt-0">
            <div className="space-y-4">
              {/* Search & filters */}
              <Card className="p-4 glass-card border-primary/20">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن أداة... (مثال: Nmap, SQLmap, Hashcat)"
                      className="bg-background/60 border-primary/30 pr-10 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      onClick={() => setSelectedCategory("all")}
                      className={selectedCategory === "all" ? "bg-primary text-primary-foreground" : "border-primary/30"}
                    >
                      الكل
                    </Button>
                    {categories.slice(0, 6).map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.name] || Terminal
                      return (
                        <Button
                          key={cat.name}
                          size="sm"
                          variant={selectedCategory === cat.name ? "default" : "outline"}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={
                            selectedCategory === cat.name
                              ? "bg-primary text-primary-foreground"
                              : "border-primary/30"
                          }
                        >
                          <Icon className="w-3.5 h-3.5 ml-1.5" />
                          <span className="hidden md:inline">{cat.name}</span>
                          <span className="md:hidden">
                            {cat.name.split(" ")[0]}
                          </span>
                          <Badge variant="outline" className="ml-1.5 text-[10px] py-0">
                            {cat.count}
                          </Badge>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </Card>

              {/* Tools grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {toolsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-4 glass-card h-40 animate-pulse">
                      <div className="h-4 bg-primary/20 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-full mb-1.5" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </Card>
                  ))
                ) : tools.length === 0 ? (
                  <Card className="p-8 glass-card border-primary/20 col-span-full text-center">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">لا توجد نتائج لبحثك</p>
                  </Card>
                ) : (
                  tools.map((tool) => {
                    const Icon = CATEGORY_ICONS[tool.category] || Terminal
                    return (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          className="p-4 glass-card hover:border-primary/50 hover:bg-primary/5 hover:neon-glow transition-all cursor-pointer group h-full flex flex-col"
                          onClick={() => setSelectedTool(tool)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-primary font-mono">
                                  {tool.name}
                                </h3>
                                <p className="text-[10px] text-muted-foreground">
                                  {tool.category}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">
                              {tool.popularity}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
                            {tool.description}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <code className="text-[10px] text-primary/80 font-mono truncate max-w-[70%]">
                              {tool.command}
                            </code>
                            <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary group-hover:translate-x-[-2px] transition-all" />
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-primary/20 backdrop-blur-xl bg-background/70 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <Skull className="w-3.5 h-3.5 text-primary" />
              <span>Mohamed AI © 2025</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline text-primary/60 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Cybersecurity Education Platform
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground font-mono text-[10px]">
              <span className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-emerald-400" />
                مجاني بالكامل
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary" />
                لأغراض تعليمية
              </span>
              <span>•</span>
              <span>GLM-4 Vision</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Tool detail modal */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedTool(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[85vh] overflow-hidden glass-card-strong border border-primary/30 rounded-xl neon-glow"
            >
              <ToolDetail tool={selectedTool} onClose={() => setSelectedTool(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper component: status row
function StatusRow({
  label,
  value,
  pulse,
  highlight,
}: {
  label: string
  value: string
  pulse?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={
          highlight
            ? "text-emerald-400 flex items-center gap-1"
            : "text-primary flex items-center gap-1"
        }
      >
        {pulse && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
        {highlight && <Gift className="w-2.5 h-2.5" />}
        {value}
      </span>
    </div>
  )
}

// Helper component: feature item
function FeatureItem({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  color: "emerald" | "yellow" | "cyan" | "purple"
}) {
  const colorMap = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    yellow: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    cyan: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

// Tool detail modal
function ToolDetail({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
    toast.success("تم النسخ!")
  }

  const Icon = CATEGORY_ICONS[tool.category] || Terminal

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="flex items-start justify-between p-5 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center neon-glow">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary font-mono terminal-glow">
              {tool.name}
            </h2>
            <Badge variant="outline" className="border-primary/30 text-primary mt-1 text-[10px]">
              {tool.category}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-primary">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-mono text-primary mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              الوصف
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {tool.description}
            </p>
          </div>

          <Separator className="bg-primary/20" />

          <div>
            <h3 className="text-xs font-mono text-primary mb-1.5 flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              الصيغة العامة
            </h3>
            <div className="relative">
              <pre className="code-block p-3 text-xs overflow-x-auto">
                <code>{tool.command}</code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-1 left-1 h-7 w-7 hover:bg-primary/10"
                onClick={() => copy(tool.command, "cmd")}
              >
                {copied === "cmd" ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div>
            <h3 className="text-xs font-mono text-primary mb-1.5 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              أمثلة عملية
            </h3>
            <div className="space-y-2">
              {tool.examples.split("\n").map((ex, i) => (
                <div key={i} className="relative">
                  <pre className="code-block p-3 text-xs overflow-x-auto">
                    <code>{ex}</code>
                  </pre>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 left-1 h-7 w-7 hover:bg-primary/10"
                    onClick={() => copy(ex, `ex-${i}`)}
                  >
                    {copied === `ex-${i}` ? (
                      <Check className="w-3 h-3 text-primary" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-primary/20" />

          <div>
            <h3 className="text-xs font-mono text-primary mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              الوسوم
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tool.tags.split(",").map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-primary/30 text-primary/80 font-mono text-[10px]"
                >
                  #{tag.trim()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span className="font-mono">الشعبية: {tool.popularity}%</span>
            <span className="font-mono text-primary/60">
              Mohamed AI Database
            </span>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// Matrix background
function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const chars =
      "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン<>{}[]()+-*/=#$%&!"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(columns).fill(1)

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00ff41"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 50)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="matrix-bg" />
}
