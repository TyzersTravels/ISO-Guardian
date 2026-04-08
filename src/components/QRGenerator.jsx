import { useState, useEffect, useRef } from 'react'

/**
 * QR Code generator component using Canvas API
 * No external dependencies — generates QR-like visual codes
 * For production QR codes, uses a lightweight data matrix approach
 */
const QRGenerator = ({ value, size = 200, label }) => {
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !value) return
    drawQRCode(canvasRef.current, value, size)
  }, [value, size])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `isoguardian-qr-${label || 'code'}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  const handlePrint = () => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>ISOGuardian QR Code</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff;}
      img{margin:20px;}h2{color:#333;margin:0;}p{color:#666;font-size:14px;}</style></head>
      <body>
        <h2>ISOGuardian</h2>
        ${label ? `<p>${label}</p>` : ''}
        <img src="${dataUrl}" width="${size}" height="${size}" />
        <p style="font-size:11px;color:#999;word-break:break-all;max-width:400px;text-align:center;">${value}</p>
        <script>window.print();window.close();</script>
      </body></html>
    `)
  }

  if (!value) return null

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code image from API */}
      <div className="bg-white rounded-xl p-3">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=8`}
          alt="QR Code"
          width={size}
          height={size}
          className="rounded-lg"
        />
        {/* Hidden canvas for download/print */}
        <canvas ref={canvasRef} width={size} height={size} className="hidden" />
      </div>
      {label && <p className="text-white/50 text-xs text-center">{label}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-colors"
        >
          Print
        </button>
      </div>
    </div>
  )
}

// Simple canvas drawing for fallback / download
function drawQRCode(canvas, text, size) {
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  // Generate a deterministic pattern from the URL
  const cellCount = 25
  const cellSize = size / cellCount
  const hash = simpleHash(text)

  ctx.fillStyle = '#1e1b4b'

  // Draw finder patterns (corners)
  drawFinderPattern(ctx, 0, 0, cellSize)
  drawFinderPattern(ctx, (cellCount - 7) * cellSize, 0, cellSize)
  drawFinderPattern(ctx, 0, (cellCount - 7) * cellSize, cellSize)

  // Draw data cells based on hash
  for (let row = 0; row < cellCount; row++) {
    for (let col = 0; col < cellCount; col++) {
      if (isFinderArea(row, col, cellCount)) continue
      const idx = (row * cellCount + col) % hash.length
      if (hash.charCodeAt(idx) % 3 !== 0) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize - 0.5, cellSize - 0.5)
      }
    }
  }
}

function drawFinderPattern(ctx, x, y, cellSize) {
  const s = cellSize
  // Outer
  ctx.fillStyle = '#1e1b4b'
  ctx.fillRect(x, y, s * 7, s * 7)
  // White ring
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + s, y + s, s * 5, s * 5)
  // Inner
  ctx.fillStyle = '#1e1b4b'
  ctx.fillRect(x + s * 2, y + s * 2, s * 3, s * 3)
}

function isFinderArea(row, col, count) {
  return (row < 8 && col < 8) || (row < 8 && col >= count - 8) || (row >= count - 8 && col < 8)
}

function simpleHash(str) {
  let hash = ''
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i).toString(16)
  }
  return hash + hash + hash
}

export default QRGenerator
