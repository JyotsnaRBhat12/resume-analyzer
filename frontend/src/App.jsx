import { useState, useEffect, useRef } from "react"
import axios from "axios"

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
const MAX_FILE_SIZE_MB = 5

function AuroraBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let t = 0, animId
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)
    const orbs = [
      { x: 0.2, y: 0.3, r: 0.35, color: "99,51,255" },
      { x: 0.8, y: 0.2, r: 0.3, color: "0,180,255" },
      { x: 0.5, y: 0.8, r: 0.4, color: "180,0,255" },
      { x: 0.1, y: 0.7, r: 0.25, color: "0,220,180" },
      { x: 0.9, y: 0.6, r: 0.28, color: "255,80,180" },
    ]
    const draw = () => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = "#06020f"
      ctx.fillRect(0, 0, w, h)
      orbs.forEach((orb, i) => {
        const px = (orb.x + 0.08 * Math.sin(t * 0.4 + i * 1.3)) * w
        const py = (orb.y + 0.07 * Math.cos(t * 0.3 + i * 0.9)) * h
        const radius = orb.r * Math.min(w, h)
        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius)
        grad.addColorStop(0, `rgba(${orb.color},0.18)`)
        grad.addColorStop(0.5, `rgba(${orb.color},0.07)`)
        grad.addColorStop(1, `rgba(${orb.color},0)`)
        ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fillStyle = grad; ctx.fill()
      })
      if (!AuroraBg.stars) {
        AuroraBg.stars = Array.from({ length: 120 }, () => ({
          x: Math.random(), y: Math.random(),
          r: Math.random() * 1.2 + 0.3,
          twinkle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
        }))
      }
      AuroraBg.stars.forEach(s => {
        s.twinkle += s.speed
        const opacity = 0.3 + 0.4 * Math.sin(s.twinkle)
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${opacity})`; ctx.fill()
      })
      ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.lineWidth = 1
      const gs = 60
      for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
      for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
      t += 0.008; animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none", display: "block" }} />
}

function Toast({ message, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [])
  const bg = type === "success" ? "linear-gradient(135deg, #10b981, #3b82f6)" : "linear-gradient(135deg, #ef4444, #f97316)"
  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999, background: bg, color: "#fff", padding: "0.9rem 1.5rem", borderRadius: "14px", fontSize: "15px", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", animation: "slideUp 0.3s ease", maxWidth: "320px" }}>
      {type === "success" ? "✅" : "⚠️"} {message}
    </div>
  )
}

function ScoreCircle({ score }) {
  const color = score >= 70 ? "34,197,94" : score >= 40 ? "251,191,36" : "248,113,113"
  const circumference = 2 * Math.PI * 54
  const dash = (score / 100) * circumference
  return (
    <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
      <svg width="160" height="160" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={`rgb(${color})`} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" style={{ transition: "stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)" }} />
        <text x="70" y="65" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800">{score}%</text>
        <text x="70" y="84" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11">ATS Score</text>
      </svg>
    </div>
  )
}

function ResultCard({ title, color, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "2rem", backdropFilter: "blur(20px)", marginTop: "1.5rem", animation: "fadeUp 0.5s ease both" }}>
      <div style={{ fontSize: "20px", fontWeight: 800, color: color || "#a78bfa", marginBottom: "1.2rem" }}>{title}</div>
      {children}
    </div>
  )
}

function TextOutput({ content }) {
  return (
    <div style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: 2, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem" }}>{content}</div>
  )
}

function FeatureCard({ icon, title, desc, color, delay }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(${color},0.2)`, borderRadius: "20px", padding: "1.8rem", backdropFilter: "blur(12px)", animation: `fadeUp 0.6s ease ${delay}s both`, transition: "transform 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ fontSize: "32px", marginBottom: "1rem" }}>{icon}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: `rgb(${color})`, marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{desc}</div>
    </div>
  )
}

function Spinner() {
  return <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: "10px", verticalAlign: "middle" }} />
}

export default function App() {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState("")
  const [jd, setJd] = useState("")
  const [jdError, setJdError] = useState("")
  const [result, setResult] = useState(null)
  const [suggestions, setSuggestions] = useState("")
  const [roadmap, setRoadmap] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [coverLoading, setCoverLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [showMatched, setShowMatched] = useState(false)
  const [showMissing, setShowMissing] = useState(false)
  const [toast, setToast] = useState({ message: "", type: "success" })
  const suggestionsRef = useRef(null)
  const roadmapRef = useRef(null)
  const coverRef = useRef(null)
  const uploadRef = useRef(null)

  const scrollTo = (ref) => setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
  const showToast = (message, type = "success") => setToast({ message, type })

  const handleFileChange = (f) => {
    setFileError("")
    if (!f) return
    if (!f.name.endsWith(".pdf")) {
      setFileError("Only PDF files are accepted.")
      return
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }
    setFile(f)
  }

  const handleJdChange = (val) => {
    setJd(val)
    if (val.trim().length > 0 && val.trim().length < 50) {
      setJdError("Job description seems too short. Please paste the full JD.")
    } else {
      setJdError("")
    }
  }

  const post = async (endpoint) => {
    const formData = new FormData()
    formData.append("resume", file)
    formData.append("job_description", jd)
    return axios.post(`${API}/${endpoint}/`, formData, { headers: { "Content-Type": "multipart/form-data" } })
  }

  const getErrorMessage = (err) => {
  if (err.response?.status === 429) return "Too many requests. Please wait a minute and try again."
  if (err.response?.data?.error) return err.response.data.error
  if (err.code === "ECONNREFUSED" || err.message?.includes("Network")) return "Cannot connect to server. Make sure Django is running."
  return "Something went wrong. Please try again."
}

  const handleAnalyze = async () => {
    if (!file || !jd.trim() || fileError || jdError) return
    setLoading(true); setError(""); setResult(null)
    setSuggestions(""); setRoadmap(""); setCoverLetter("")
    setShowMatched(false); setShowMissing(false)
    try {
      const res = await post("analyze-resume")
      setResult(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }

  const handleAiSuggestions = async () => {
    setAiLoading(true); setError("")
    try {
      const res = await post("ai-suggestions")
      setSuggestions(res.data.suggestions)
      scrollTo(suggestionsRef)
    } catch (err) { setError(getErrorMessage(err)) } 
    finally { setAiLoading(false) }
  }

  const handleRoadmap = async () => {
    setRoadmapLoading(true); setError("")
    try {
      const res = await post("learning-roadmap")
      setRoadmap(res.data.roadmap)
      scrollTo(roadmapRef)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setRoadmapLoading(false) }
  }

  const handleCoverLetter = async () => {
    setCoverLoading(true); setError("")
    try {
      const res = await post("cover-letter")
      setCoverLetter(res.data.cover_letter)
      scrollTo(coverRef)
    } catch (err) { setError(getErrorMessage(err)) }
    finally { setCoverLoading(false) }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showToast("Copied to clipboard!")
  }

  const canAnalyze = file && jd.trim().length >= 50 && !fileError && !jdError && !loading

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: "#06020f", fontFamily: "'Segoe UI', sans-serif", color: "#fff", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: rgba(255,255,255,0.25); }
        * { box-sizing: border-box; }
      `}</style>

      <AuroraBg />

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 5%", background: "rgba(6,2,15,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 100, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #6333ff, #00b4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⚡</div>
          <span style={{ fontSize: "20px", fontWeight: 800, background: "linear-gradient(90deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ResumeAI</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ fontSize: "12px", background: "rgba(99,51,255,0.15)", color: "#a78bfa", padding: "5px 14px", borderRadius: "20px", border: "1px solid rgba(99,51,255,0.3)" }}>Semantic AI</div>
          <div style={{ fontSize: "12px", background: "rgba(0,180,255,0.1)", color: "#67e8f9", padding: "5px 14px", borderRadius: "20px", border: "1px solid rgba(0,180,255,0.2)" }}>Groq LLaMA</div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "clamp(3rem,8vw,6rem) 5% 1rem", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-block", fontSize: "12px", fontWeight: 700, color: "#a78bfa", background: "rgba(99,51,255,0.15)", padding: "6px 16px", borderRadius: "20px", border: "1px solid rgba(99,51,255,0.3)", marginBottom: "1.5rem", letterSpacing: "0.1em", textTransform: "uppercase", animation: "fadeUp 0.5s ease 0.1s both" }}>
          AI-Powered Resume Analysis
        </div>
        <h1 style={{ fontSize: "clamp(32px, 7vw, 68px)", fontWeight: 900, margin: "0 0 1.5rem", lineHeight: 1.1, animation: "fadeUp 0.5s ease 0.2s both" }}>
          <span style={{ background: "linear-gradient(135deg, #fff 30%, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Land Your Dream Job</span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #67e8f9, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>with AI Precision</span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2.5vw, 19px)", color: "rgba(255,255,255,0.45)", maxWidth: "560px", margin: "0 auto 2.5rem", lineHeight: 1.8, animation: "fadeUp 0.5s ease 0.3s both" }}>
          Semantic ATS scoring, skill gap analysis, AI rewrite suggestions, personalized learning roadmap and cover letter — all in one place.
        </p>
        <button onClick={() => uploadRef.current?.scrollIntoView({ behavior: "smooth" })}
          style={{ padding: "1rem 2.5rem", fontSize: "16px", fontWeight: 700, borderRadius: "14px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6333ff, #00b4ff)", color: "#fff", boxShadow: "0 8px 32px rgba(99,51,255,0.4)", animation: "fadeUp 0.5s ease 0.4s both", transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,51,255,0.5)" }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,51,255,0.4)" }}>
          Analyze My Resume →
        </button>
      </div>

      {/* Feature Cards */}
      <div style={{ width: "90%", maxWidth: "960px", margin: "2rem auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", position: "relative", zIndex: 1 }}>
        {[
          { icon: "🎯", title: "Semantic ATS Score", desc: "AI understands meaning — 'ML' and 'Machine Learning' are treated as the same.", color: "167,139,250", delay: 0.1 },
          { icon: "🔍", title: "Skill Gap Analysis", desc: "Instantly see which skills you have and what's missing for the role.", color: "34,197,94", delay: 0.2 },
          { icon: "✨", title: "AI Rewrite Suggestions", desc: "Get your weak bullet points rewritten to be stronger and more impactful.", color: "96,165,250", delay: 0.3 },
          { icon: "🗺️", title: "Learning Roadmap", desc: "Personalized 4-week plan to upskill for your target role with free resources.", color: "251,191,36", delay: 0.4 },
        ].map(f => <FeatureCard key={f.title} {...f} />)}
      </div>

      {/* Divider */}
      <div style={{ width: "90%", maxWidth: "960px", margin: "2rem auto", position: "relative", zIndex: 1 }}>
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)" }} />
      </div>

      {/* Upload Section */}
      <div ref={uploadRef} style={{ width: "90%", maxWidth: "960px", margin: "0 auto", padding: "0 0 3rem", position: "relative", zIndex: 1 }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, margin: "0 0 0.5rem", background: "linear-gradient(90deg, #fff, #c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Start Your Analysis</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "15px" }}>Upload your resume and paste the job description below</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", marginBottom: "1.2rem" }}>

          {/* Upload Card */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${fileError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "24px", padding: "1.8rem", backdropFilter: "blur(20px)" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>📄 Resume PDF</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]) }}
              style={{ border: `2px dashed ${fileError ? "rgba(248,113,113,0.5)" : dragOver ? "#a78bfa" : "rgba(167,139,250,0.25)"}`, borderRadius: "16px", padding: "2.5rem 1rem", textAlign: "center", cursor: "pointer", position: "relative", background: dragOver ? "rgba(167,139,250,0.06)" : "rgba(0,0,0,0.2)", transition: "all 0.2s" }}
            >
              <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files[0])}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>{fileError ? "❌" : file ? "✅" : "📂"}</div>
              {fileError
                ? <div style={{ fontSize: "14px", color: "#f87171", fontWeight: 600 }}>{fileError}</div>
                : file
                  ? <div style={{ fontSize: "14px", color: "#a78bfa", fontWeight: 700 }}>{file.name}</div>
                  : <>
                    <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", marginBottom: "6px" }}>Drop PDF here or click to browse</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>PDF only · Max {MAX_FILE_SIZE_MB}MB</div>
                  </>
              }
            </div>
            {file && !fileError && (
              <button onClick={() => { setFile(null); setFileError(""); setResult(null); setSuggestions(""); setRoadmap(""); setCoverLetter("") }}
                style={{ marginTop: "10px", fontSize: "12px", color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Remove file
              </button>
            )}
          </div>

          {/* JD Card */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${jdError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "24px", padding: "1.8rem", backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#67e8f9", textTransform: "uppercase", letterSpacing: "0.12em" }}>📋 Job Description</div>
              <div style={{ fontSize: "11px", color: jd.length > 4500 ? "#f87171" : "rgba(255,255,255,0.25)" }}>{jd.length}/5000</div>
            </div>
            <textarea rows={7} value={jd} onChange={(e) => handleJdChange(e.target.value)}
              placeholder="Paste the full job description here..."
              maxLength={5000}
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${jdError ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "14px", padding: "1rem", color: "#fff", fontSize: "15px", lineHeight: 1.7, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
            {jdError && <div style={{ fontSize: "12px", color: "#f87171", marginTop: "6px" }}>{jdError}</div>}
          </div>
        </div>

        {/* Analyze Button */}
        <button onClick={handleAnalyze} disabled={!canAnalyze}
          style={{ width: "100%", padding: "1.1rem", fontSize: "17px", fontWeight: 800, borderRadius: "16px", border: "none", cursor: canAnalyze ? "pointer" : "not-allowed", background: canAnalyze ? "linear-gradient(135deg, #6333ff, #00b4ff)" : "rgba(255,255,255,0.06)", color: canAnalyze ? "#fff" : "rgba(255,255,255,0.3)", transition: "all 0.3s", marginBottom: "1.2rem", boxShadow: canAnalyze ? "0 8px 32px rgba(99,51,255,0.35)" : "none" }}>
          {loading ? <><Spinner />Analyzing Semantically...</> : "🔍 Analyze My Resume"}
        </button>

        {/* Hint text when button disabled */}
        {!canAnalyze && !loading && (
          <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.25)", marginTop: "-0.8rem", marginBottom: "1rem" }}>
            {!file ? "Upload a PDF resume to continue" : !jd.trim() ? "Paste a job description to continue" : jd.trim().length < 50 ? "Job description is too short" : ""}
          </p>
        )}

        {error && (
          <div style={{ color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "14px", padding: "1rem 1.2rem", marginTop: "1rem", fontSize: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
            ⚠️ {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px" }}>×</button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "2rem", backdropFilter: "blur(20px)" }}>
              <ScoreCircle score={result.ats_score} />
              {result.match_summary && (
                <p style={{ textAlign: "center", fontSize: "15px", color: "rgba(255,255,255,0.5)", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: 1.8, fontStyle: "italic" }}>"{result.match_summary}"</p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {[
                  { label: "Total Skills", value: result.total_jd_keywords, color: "167,139,250" },
                  { label: "Matched", value: result.matched_keywords.length, color: "34,197,94" },
                  { label: "Missing", value: result.missing_keywords.length, color: "248,113,113" },
                ].map(s => (
                  <div key={s.label} style={{ background: `rgba(${s.color},0.07)`, border: `1px solid rgba(${s.color},0.18)`, borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 900, color: `rgb(${s.color})` }}>{s.value}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                {[
                  { title: "✅ Matched Skills", keys: result.matched_keywords, color: "34,197,94", open: showMatched, toggle: () => setShowMatched(v => !v) },
                  { title: "❌ Missing Skills", keys: result.missing_keywords, color: "248,113,113", open: showMissing, toggle: () => setShowMissing(v => !v) },
                ].map(box => (
                  <div key={box.title} style={{ background: `rgba(${box.color},0.05)`, border: `1px solid rgba(${box.color},0.18)`, borderRadius: "16px", overflow: "hidden" }}>
                    <div onClick={box.toggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.2rem", cursor: "pointer", userSelect: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: `rgb(${box.color})`, textTransform: "uppercase", letterSpacing: "0.06em" }}>{box.title}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, background: `rgba(${box.color},0.15)`, color: `rgb(${box.color})`, padding: "2px 8px", borderRadius: "20px" }}>{box.keys.length}</span>
                      </div>
                      <span style={{ fontSize: "16px", color: `rgb(${box.color})`, transform: box.open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", display: "inline-block" }}>⌄</span>
                    </div>
                    <div style={{ maxHeight: box.open ? "400px" : "0", overflow: "hidden", transition: "max-height 0.4s ease" }}>
                      <div style={{ padding: "1rem 1.2rem 1.2rem", display: "flex", flexWrap: "wrap", gap: "7px", borderTop: `1px solid rgba(${box.color},0.12)` }}>
                        {box.keys.length === 0
                          ? <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>None found</span>
                          : box.keys.map(k => (
                            <span key={k} style={{ fontSize: "13px", padding: "4px 12px", borderRadius: "20px", background: `rgba(${box.color},0.1)`, color: `rgb(${box.color})`, border: `1px solid rgba(${box.color},0.2)` }}>{k}</span>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", marginTop: "1.2rem" }}>
              {[
                { label: aiLoading ? "Generating..." : "✨ AI Suggestions", handler: handleAiSuggestions, isLoading: aiLoading, from: "#0ea5e9", to: "#6366f1" },
                { label: roadmapLoading ? "Generating..." : "🗺️ Learning Roadmap", handler: handleRoadmap, isLoading: roadmapLoading, from: "#f59e0b", to: "#ef4444" },
                { label: coverLoading ? "Generating..." : "📝 Cover Letter", handler: handleCoverLetter, isLoading: coverLoading, from: "#10b981", to: "#3b82f6" },
              ].map(btn => (
                <button key={btn.label} onClick={btn.handler} disabled={btn.isLoading}
                  style={{ padding: "1rem", fontSize: "15px", fontWeight: 700, borderRadius: "14px", border: "none", cursor: btn.isLoading ? "wait" : "pointer", background: btn.isLoading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${btn.from}, ${btn.to})`, color: btn.isLoading ? "rgba(255,255,255,0.3)" : "#fff", transition: "all 0.2s", boxShadow: btn.isLoading ? "none" : "0 4px 20px rgba(0,0,0,0.3)" }}
                  onMouseEnter={e => { if (!btn.isLoading) e.currentTarget.style.transform = "translateY(-2px)" }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)" }}>
                  {btn.isLoading ? <><Spinner />{btn.label}</> : btn.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "0.8rem" }}>Each button makes a separate AI call — results appear below</p>
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions && (
          <div ref={suggestionsRef}>
            <ResultCard title="✨ AI Rewrite Suggestions" color="#60a5fa">
              <TextOutput content={suggestions} />
            </ResultCard>
          </div>
        )}

        {/* Learning Roadmap */}
        {roadmap && (
          <div ref={roadmapRef}>
            <ResultCard title="🗺️ Personalized Learning Roadmap" color="#f59e0b">
              <TextOutput content={roadmap} />
            </ResultCard>
          </div>
        )}

        {/* Cover Letter */}
        {coverLetter && (
          <div ref={coverRef}>
            <ResultCard title="📝 Generated Cover Letter" color="#10b981">
              <TextOutput content={coverLetter} />
              <button onClick={() => copyToClipboard(coverLetter)}
                style={{ marginTop: "1rem", padding: "0.7rem 1.5rem", fontSize: "14px", fontWeight: 700, borderRadius: "10px", border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", background: "rgba(16,185,129,0.1)", color: "#10b981", transition: "all 0.2s" }}>
                📋 Copy to Clipboard
              </button>
            </ResultCard>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.25)", margin: 0 }}>
          © 2026 <span style={{ color: "#a78bfa", fontWeight: 600 }}>Jyotsna R Bhat</span> — All Rights Reserved.
        </p>
      </div>

      {/* Toast */}
      {toast.message && <Toast message={toast.message} type={toast.type} onDone={() => setToast({ message: "", type: "success" })} />}
    </div>
  )
}