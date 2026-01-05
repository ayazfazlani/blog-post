"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { 
  Image as ImageIcon, 
  Table as TableIcon, 
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Quote,
  Strikethrough,
  Undo,
  Redo,
  Palette,
  Type,
  Highlighter,
  Maximize2,
  Columns,
  Settings
} from "lucide-react"

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const bgColorInputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBgColorPicker, setShowBgColorPicker] = useState(false)
  const [showFontSize, setShowFontSize] = useState(false)
  const [showImageSettings, setShowImageSettings] = useState(false)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current && onChange) {
      // Clean up placeholder elements before saving
      const clonedContent = editorRef.current.cloneNode(true) as HTMLElement
      
      // Remove placeholder divs
      const placeholders = clonedContent.querySelectorAll('div[style*="border: 2px dashed"]')
      placeholders.forEach(placeholder => {
        if (placeholder.textContent?.includes("Click to upload")) {
          placeholder.remove()
        }
      })
      
      // Remove hidden file inputs
      const fileInputs = clonedContent.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => input.remove())
      
      onChange(clonedContent.innerHTML)
    }
  }

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const insertImage = (imageUrl: string, width?: string, alignment?: string, container?: HTMLElement) => {
    if (!editorRef.current) return

    const img = document.createElement("img")
    img.src = imageUrl
    img.style.height = "auto"
    img.style.display = "block"
    img.style.margin = "0.5rem"
    img.style.borderRadius = "0.375rem"
    img.style.cursor = "pointer"
    
    // Set width
    if (width) {
      img.style.width = width
      img.style.maxWidth = width
    } else {
      img.style.width = "100%"
      img.style.maxWidth = "100%"
    }

    // Make image editable on click
    img.onclick = (e) => {
      e.stopPropagation()
      setSelectedImage(img)
      setShowImageSettings(true)
    }

    const selection = window.getSelection()
    if (container) {
      // Add to existing container (for side-by-side)
      container.appendChild(img)
    } else if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(img)
      range.setStartAfter(img)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.current.appendChild(img)
    }

    // Add paragraph after for easier editing
    const p = document.createElement("p")
    p.innerHTML = "<br>"
    if (container && container.parentNode) {
      if (container.nextSibling) {
        container.parentNode.insertBefore(p, container.nextSibling)
      } else {
        container.parentNode.appendChild(p)
      }
    } else {
      editorRef.current.appendChild(p)
    }

    editorRef.current.focus()
    handleInput()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB")
      return
    }

    try {
      // Upload image to storage
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "blog/content")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload image")
      }

      // Insert the uploaded image URL
      insertImage(data.url)
    } catch (error) {
      console.error("Error uploading image:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInsertTwoImages = () => {
    if (!editorRef.current) return

    const container = document.createElement("div")
    container.style.display = "flex"
    container.style.gap = "1rem"
    container.style.margin = "1rem 0"
    container.style.flexWrap = "wrap"
    container.className = "image-row-container"
    container.contentEditable = "false"

    // Create two file inputs
    const input1 = document.createElement("input")
    input1.type = "file"
    input1.accept = "image/*"
    input1.style.display = "none"
    
    const input2 = document.createElement("input")
    input2.type = "file"
    input2.accept = "image/*"
    input2.style.display = "none"

    const handleFile1 = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          const img = document.createElement("img")
          img.src = imageUrl
          img.style.width = "calc(50% - 0.5rem)"
          img.style.flex = "1 1 calc(50% - 0.5rem)"
          img.style.minWidth = "200px"
          img.style.height = "auto"
          img.style.display = "block"
          img.style.margin = "0"
          img.style.borderRadius = "0.375rem"
          img.style.cursor = "pointer"
          img.onclick = (e) => {
            e.stopPropagation()
            setSelectedImage(img)
            setShowImageSettings(true)
          }
          container.appendChild(img)
          handleInput()
        }
        reader.readAsDataURL(file)
      }
    }

    const handleFile2 = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          const img = document.createElement("img")
          img.src = imageUrl
          img.style.width = "calc(50% - 0.5rem)"
          img.style.flex = "1 1 calc(50% - 0.5rem)"
          img.style.minWidth = "200px"
          img.style.height = "auto"
          img.style.display = "block"
          img.style.margin = "0"
          img.style.borderRadius = "0.375rem"
          img.style.cursor = "pointer"
          img.onclick = (e) => {
            e.stopPropagation()
            setSelectedImage(img)
            setShowImageSettings(true)
          }
          container.appendChild(img)
          handleInput()
        }
        reader.readAsDataURL(file)
      }
    }

    input1.addEventListener("change", handleFile1)
    input2.addEventListener("change", handleFile2)

    // Insert container
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(container)
      
      // Add placeholders
      const placeholder1 = document.createElement("div")
      placeholder1.style.width = "calc(50% - 0.5rem)"
      placeholder1.style.flex = "1 1 calc(50% - 0.5rem)"
      placeholder1.style.minWidth = "200px"
      placeholder1.style.height = "200px"
      placeholder1.style.border = "2px dashed hsl(var(--border))"
      placeholder1.style.borderRadius = "0.375rem"
      placeholder1.style.display = "flex"
      placeholder1.style.alignItems = "center"
      placeholder1.style.justifyContent = "center"
      placeholder1.style.cursor = "pointer"
      placeholder1.style.backgroundColor = "hsl(var(--muted))"
      placeholder1.textContent = "Click to upload image 1"
      placeholder1.onclick = () => input1.click()
      
      const placeholder2 = document.createElement("div")
      placeholder2.style.width = "calc(50% - 0.5rem)"
      placeholder2.style.flex = "1 1 calc(50% - 0.5rem)"
      placeholder2.style.minWidth = "200px"
      placeholder2.style.height = "200px"
      placeholder2.style.border = "2px dashed hsl(var(--border))"
      placeholder2.style.borderRadius = "0.375rem"
      placeholder2.style.display = "flex"
      placeholder2.style.alignItems = "center"
      placeholder2.style.justifyContent = "center"
      placeholder2.style.cursor = "pointer"
      placeholder2.style.backgroundColor = "hsl(var(--muted))"
      placeholder2.textContent = "Click to upload image 2"
      placeholder2.onclick = () => input2.click()
      
      container.appendChild(placeholder1)
      container.appendChild(placeholder2)
      
      const p = document.createElement("p")
      p.innerHTML = "<br>"
      range.setStartAfter(container)
      range.insertNode(p)
      range.setStart(p, 0)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.current.appendChild(container)
    }

    editorRef.current.appendChild(input1)
    editorRef.current.appendChild(input2)
    editorRef.current.focus()
    handleInput()
  }

  const handleImageSettings = (width: string, alignment: string) => {
    if (!selectedImage) return

    // Set width
    if (width && width !== "auto") {
      selectedImage.style.width = width
      selectedImage.style.maxWidth = width
    } else {
      selectedImage.style.width = "100%"
      selectedImage.style.maxWidth = "100%"
    }

    // Set alignment
    const parent = selectedImage.parentElement
    if (parent) {
      if (alignment === "left") {
        parent.style.textAlign = "left"
        selectedImage.style.display = "inline-block"
        selectedImage.style.margin = "0.5rem 0.5rem 0.5rem 0"
      } else if (alignment === "center") {
        parent.style.textAlign = "center"
        selectedImage.style.display = "inline-block"
        selectedImage.style.margin = "0.5rem auto"
      } else if (alignment === "right") {
        parent.style.textAlign = "right"
        selectedImage.style.display = "inline-block"
        selectedImage.style.margin = "0.5rem 0 0.5rem 0.5rem"
      } else {
        selectedImage.style.display = "block"
        selectedImage.style.margin = "1rem auto"
      }
    }

    setShowImageSettings(false)
    setSelectedImage(null)
    editorRef.current?.focus()
    handleInput()
  }

  const handleInsertTable = () => {
    if (!editorRef.current) return

    const rows = prompt("Number of rows (1-10):", "3")
    const cols = prompt("Number of columns (1-10):", "3")
    
    if (!rows || !cols) return

    const rowCount = Math.min(Math.max(parseInt(rows) || 3, 1), 10)
    const colCount = Math.min(Math.max(parseInt(cols) || 3, 1), 10)

    const table = document.createElement("table")
    table.style.width = "100%"
    table.style.borderCollapse = "collapse"
    table.style.margin = "1rem 0"

    // Create header row
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")
    for (let i = 0; i < colCount; i++) {
      const th = document.createElement("th")
      th.textContent = `Header ${i + 1}`
      th.style.border = "1px solid hsl(var(--border))"
      th.style.padding = "0.5rem"
      th.style.backgroundColor = "hsl(var(--muted))"
      th.style.fontWeight = "600"
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Create body rows
    const tbody = document.createElement("tbody")
    for (let i = 0; i < rowCount; i++) {
      const tr = document.createElement("tr")
      for (let j = 0; j < colCount; j++) {
        const td = document.createElement("td")
        td.textContent = `Cell ${i + 1},${j + 1}`
        td.style.border = "1px solid hsl(var(--border))"
        td.style.padding = "0.5rem"
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)

    // Insert table at cursor position
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(table)
      
      // Add a paragraph after table for easier editing
      const p = document.createElement("p")
      p.innerHTML = "<br>"
      range.setStartAfter(table)
      range.insertNode(p)
      range.setStart(p, 0)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.current.appendChild(table)
      const p = document.createElement("p")
      p.innerHTML = "<br>"
      editorRef.current.appendChild(p)
    }

    editorRef.current.focus()
    handleInput()
  }

  const handleInsertHTML = () => {
    const html = prompt("Paste your HTML code:")
    if (!html) return

    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0)
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = html
        const fragment = document.createDocumentFragment()
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild)
        }
        range.deleteContents()
        range.insertNode(fragment)
        
        // Move cursor to end
        range.setStartAfter(fragment.lastChild || fragment)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = html
        while (tempDiv.firstChild) {
          editorRef.current.appendChild(tempDiv.firstChild)
        }
      }
      
      editorRef.current.focus()
      handleInput()
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFormat("foreColor", e.target.value)
    setShowColorPicker(false)
  }

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFormat("backColor", e.target.value)
    setShowBgColorPicker(false)
  }

  const handleFontSize = (size: string) => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0)
        const span = document.createElement("span")
        span.style.fontSize = size
        try {
          const contents = range.extractContents()
          span.appendChild(contents)
          range.insertNode(span)
          handleInput()
        } catch {
          // Fallback
          document.execCommand("fontSize", false, "3")
          const fontElements = editorRef.current.querySelectorAll("font[size='3']")
          fontElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.fontSize = size
              el.removeAttribute("size")
            }
          })
        }
        editorRef.current.focus()
      }
    }
    setShowFontSize(false)
  }

  const handleInsertLink = () => {
    const url = prompt("Enter URL:", "https://")
    if (!url) return
    handleFormat("createLink", url)
  }

  const handleInsertBlockquote = () => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0)
        const blockquote = document.createElement("blockquote")
        blockquote.style.margin = "1em 0"
        blockquote.style.paddingLeft = "1em"
        blockquote.style.borderLeft = "3px solid hsl(var(--border))"
        blockquote.style.fontStyle = "italic"
        blockquote.style.color = "hsl(var(--muted-foreground))"
        
        try {
          const contents = range.extractContents()
          if (contents.textContent?.trim()) {
            blockquote.appendChild(contents)
          } else {
            blockquote.innerHTML = "<br>"
          }
          range.insertNode(blockquote)
          
          // Move cursor after blockquote
          const p = document.createElement("p")
          p.innerHTML = "<br>"
          range.setStartAfter(blockquote)
          range.insertNode(p)
          range.setStart(p, 0)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } catch {
          blockquote.innerHTML = "<br>"
          editorRef.current.appendChild(blockquote)
        }
        editorRef.current.focus()
        handleInput()
      }
    }
  }

  const handleInsertCodeBlock = () => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0)
        const pre = document.createElement("pre")
        const code = document.createElement("code")
        code.style.display = "block"
        code.style.padding = "1rem"
        code.style.backgroundColor = "hsl(var(--muted))"
        code.style.borderRadius = "0.375rem"
        code.style.fontFamily = "monospace"
        code.style.fontSize = "0.875rem"
        code.style.overflowX = "auto"
        
        try {
          const contents = range.extractContents()
          if (contents.textContent?.trim()) {
            code.textContent = contents.textContent
          } else {
            code.innerHTML = "<br>"
          }
          pre.appendChild(code)
          range.insertNode(pre)
          
          // Move cursor after code block
          const p = document.createElement("p")
          p.innerHTML = "<br>"
          range.setStartAfter(pre)
          range.insertNode(p)
          range.setStart(p, 0)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } catch {
          code.innerHTML = "<br>"
          pre.appendChild(code)
          editorRef.current.appendChild(pre)
        }
        editorRef.current.focus()
        handleInput()
      }
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background shadow-sm",
        "focus-within:ring-ring focus-within:ring-[3px] focus-within:ring-offset-0",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => handleFormat("undo")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("redo")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => handleFormat("bold")}
          className="rounded px-2 py-1 text-sm font-bold hover:bg-accent transition-colors"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("italic")}
          className="rounded px-2 py-1 text-sm italic hover:bg-accent transition-colors"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("underline")}
          className="rounded px-2 py-1 text-sm underline hover:bg-accent transition-colors"
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("strikeThrough")}
          className="rounded px-2 py-1 text-sm line-through hover:bg-accent transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        
        {/* Text Color & Background */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker)
              setShowBgColorPicker(false)
              setShowFontSize(false)
            }}
            className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
            <span className="text-xs">A</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg p-2 z-50">
              <input
                ref={colorInputRef}
                type="color"
                onChange={handleColorChange}
                className="w-32 h-8 cursor-pointer"
                defaultValue="#000000"
                aria-label="Text color picker"
                title="Select text color"
              />
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowBgColorPicker(!showBgColorPicker)
              setShowColorPicker(false)
              setShowFontSize(false)
            }}
            className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
            title="Highlight Color"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showBgColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg p-2 z-50">
              <input
                ref={bgColorInputRef}
                type="color"
                onChange={handleBgColorChange}
                className="w-32 h-8 cursor-pointer"
                defaultValue="#ffff00"
                aria-label="Background color picker"
                title="Select highlight color"
              />
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontSize(!showFontSize)
              setShowColorPicker(false)
              setShowBgColorPicker(false)
            }}
            className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
            title="Font Size"
          >
            <Type className="h-4 w-4" />
            <span className="text-xs">Size</span>
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[120px]">
              {["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFontSize(size)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mx-1 h-6 w-px bg-border" />
        
        {/* Headings */}
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "h1")}
          className="rounded px-2 py-1 text-base font-bold hover:bg-accent transition-colors"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "h2")}
          className="rounded px-2 py-1 text-sm font-semibold hover:bg-accent transition-colors"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "h3")}
          className="rounded px-2 py-1 text-xs font-semibold hover:bg-accent transition-colors"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "p")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Paragraph"
        >
          P
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          type="button"
          onClick={() => handleFormat("insertUnorderedList")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleFormat("insertOrderedList")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Numbered List"
        >
          1. List
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        
        {/* Text Alignment */}
        <button
          type="button"
          onClick={() => handleFormat("justifyLeft")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("justifyCenter")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("justifyRight")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleFormat("justifyFull")}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        
        {/* Special Elements */}
        <button
          type="button"
          onClick={handleInsertLink}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
          <span>Link</span>
        </button>
        <button
          type="button"
          onClick={handleInsertBlockquote}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Quote"
        >
          <Quote className="h-4 w-4" />
          <span>Quote</span>
        </button>
        <button
          type="button"
          onClick={handleInsertCodeBlock}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Code Block"
        >
          <Code className="h-4 w-4" />
          <span>Code</span>
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
          <span>Image</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Upload image"
        />
        <button
          type="button"
          onClick={handleInsertTwoImages}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Two Images Side by Side"
        >
          <Columns className="h-4 w-4" />
          <span>2 Images</span>
        </button>
        <div className="mx-1 h-6 w-px bg-border" />
        <button
          type="button"
          onClick={handleInsertTable}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
          <span>Table</span>
        </button>
        <button
          type="button"
          onClick={handleInsertHTML}
          className="rounded px-2 py-1 text-sm hover:bg-accent transition-colors flex items-center gap-1"
          title="Insert Custom HTML"
        >
          <Code className="h-4 w-4" />
          <span>HTML</span>
        </button>
      </div>
      
      {/* Image Settings Dialog */}
      {showImageSettings && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Image Settings
            </h3>
            
            <div className="space-y-4">
              {/* Width Setting */}
              <div>
                <label htmlFor="image-width-select" className="block text-sm font-medium mb-2">Width</label>
                <select
                  id="image-width-select"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  defaultValue={selectedImage.style.width || "100%"}
                  aria-label="Select image width"
                  title="Select image width"
                  onChange={(e) => {
                    const width = e.target.value
                    if (width === "auto") {
                      selectedImage.style.width = "100%"
                      selectedImage.style.maxWidth = "100%"
                    } else {
                      selectedImage.style.width = width
                      selectedImage.style.maxWidth = width
                    }
                    handleInput()
                  }}
                >
                  <option value="auto">Auto (100%)</option>
                  <option value="25%">25%</option>
                  <option value="33%">33%</option>
                  <option value="50%">50%</option>
                  <option value="66%">66%</option>
                  <option value="75%">75%</option>
                  <option value="100%">100%</option>
                  <option value="300px">300px</option>
                  <option value="400px">400px</option>
                  <option value="500px">500px</option>
                  <option value="600px">600px</option>
                  <option value="800px">800px</option>
                </select>
              </div>

              {/* Alignment Setting */}
              <div>
                <label className="block text-sm font-medium mb-2">Alignment</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleImageSettings(selectedImage.style.width || "100%", "left")}
                    className="flex-1 px-3 py-2 border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <AlignLeft className="h-4 w-4" />
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageSettings(selectedImage.style.width || "100%", "center")}
                    className="flex-1 px-3 py-2 border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <AlignCenter className="h-4 w-4" />
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageSettings(selectedImage.style.width || "100%", "right")}
                    className="flex-1 px-3 py-2 border rounded-md hover:bg-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <AlignRight className="h-4 w-4" />
                    Right
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageSettings(false)
                    setSelectedImage(null)
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedImage && confirm("Delete this image?")) {
                      selectedImage.remove()
                      setShowImageSettings(false)
                      setSelectedImage(null)
                      handleInput()
                    }
                  }}
                  className="px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showColorPicker || showBgColorPicker || showFontSize) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowColorPicker(false)
            setShowBgColorPicker(false)
            setShowFontSize(false)
          }}
        />
      )}

      {/* Editor */}
      <div className="relative">
        <style dangerouslySetInnerHTML={{
          __html: `
            .rich-editor-content h1 {
              font-size: 2em !important;
              font-weight: bold !important;
              margin: 1em 0 0.5em 0 !important;
              line-height: 1.2 !important;
              display: block !important;
            }
            .rich-editor-content h2 {
              font-size: 1.5em !important;
              font-weight: bold !important;
              margin: 0.8em 0 0.4em 0 !important;
              line-height: 1.3 !important;
              display: block !important;
            }
            .rich-editor-content h3 {
              font-size: 1.25em !important;
              font-weight: 600 !important;
              margin: 0.6em 0 0.3em 0 !important;
              line-height: 1.4 !important;
              display: block !important;
            }
            .rich-editor-content ul,
            .rich-editor-content ol {
              margin: 0.5em 0 !important;
              padding-left: 2em !important;
              display: block !important;
            }
            .rich-editor-content ul {
              list-style-type: disc !important;
            }
            .rich-editor-content ol {
              list-style-type: decimal !important;
            }
            .rich-editor-content li {
              margin: 0.25em 0 !important;
              display: list-item !important;
            }
            .rich-editor-content img {
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
              margin: 1rem 0 !important;
              border-radius: 0.375rem !important;
              cursor: pointer !important;
              transition: opacity 0.2s !important;
            }
            .rich-editor-content img:hover {
              opacity: 0.9 !important;
              outline: 2px solid hsl(var(--primary)) !important;
              outline-offset: 2px !important;
            }
            .rich-editor-content .image-row-container {
              display: flex !important;
              gap: 1rem !important;
              margin: 1rem 0 !important;
              flex-wrap: wrap !important;
            }
            .rich-editor-content .image-row-container img {
              flex: 1 1 calc(50% - 0.5rem) !important;
              min-width: 200px !important;
              margin: 0 !important;
            }
            .rich-editor-content table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 1.5rem 0 !important;
              border: 1px solid hsl(var(--border)) !important;
              border-radius: 0.375rem !important;
              overflow: hidden !important;
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important;
            }
            .rich-editor-content table thead {
              background-color: hsl(var(--muted)) !important;
            }
            .rich-editor-content table td,
            .rich-editor-content table th {
              border: 1px solid hsl(var(--border)) !important;
              padding: 0.75rem 0.625rem 0.75rem 1rem !important;
              text-align: left !important;
              vertical-align: top !important;
            }
            .rich-editor-content table th {
              background-color: hsl(var(--muted)) !important;
              font-weight: 600 !important;
              color: hsl(var(--foreground)) !important;
            }
            .rich-editor-content table tbody tr {
              transition: background-color 0.15s ease !important;
            }
            .rich-editor-content table tbody tr:hover {
              background-color: hsl(var(--muted) / 0.5) !important;
            }
            .rich-editor-content table tbody tr:nth-child(even) {
              background-color: hsl(var(--muted) / 0.3) !important;
            }
            .rich-editor-content table tbody tr:nth-child(even):hover {
              background-color: hsl(var(--muted) / 0.6) !important;
            }
            .rich-editor-content p {
              margin: 0.5em 0 !important;
              min-height: 1.5em !important;
            }
            .rich-editor-content p:first-child {
              margin-top: 0 !important;
            }
            .rich-editor-content p:last-child {
              margin-bottom: 0 !important;
            }
            .rich-editor-content blockquote {
              margin: 1em 0 !important;
              padding-left: 1em !important;
              border-left: 3px solid hsl(var(--border)) !important;
              font-style: italic !important;
              color: hsl(var(--muted-foreground)) !important;
            }
            .rich-editor-content pre {
              margin: 1em 0 !important;
              overflow-x: auto !important;
            }
            .rich-editor-content code {
              display: block !important;
              padding: 1rem !important;
              background-color: hsl(var(--muted)) !important;
              border-radius: 0.375rem !important;
              font-family: monospace !important;
              font-size: 0.875rem !important;
              overflow-x: auto !important;
            }
            .rich-editor-content a {
              color: hsl(var(--primary)) !important;
              text-decoration: underline !important;
            }
            .rich-editor-content a:hover {
              color: hsl(var(--primary) / 0.8) !important;
            }
          `
        }} />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "rich-editor-content min-h-[400px] w-full px-4 py-3 text-sm",
            "focus:outline-none",
            "[&_strong]:font-bold [&_b]:font-bold",
            "[&_em]:italic [&_i]:italic",
            "[&_u]:underline"
          )}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
        {!value && !isFocused && (
          <div className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}

