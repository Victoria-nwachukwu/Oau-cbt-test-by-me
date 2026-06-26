/* ==========================================================================
   OAU ASPIRANTS CBT â€” shared helpers
   ========================================================================== */

// ---- ADMIN: paste your deployed Google Apps Script Web App URL below ----
// See backend/AppsScript.gs and README.md for setup instructions.
const API_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const CBT = {
  /* ---------- name / session handling ---------- */
  getName(){
    return sessionStorage.getItem("cbt_name") || "";
  },
  setName(name){
    sessionStorage.setItem("cbt_name", name.trim());
  },
  clearName(){
    sessionStorage.removeItem("cbt_name");
  },
  requireName(){
    const name = this.getName();
    if(!name){
      window.location.href = "index.html";
      return null;
    }
    return name;
  },

  /* ---------- completed-subjects tracking (this session only) ---------- */
  getCompleted(){
    try{
      return JSON.parse(sessionStorage.getItem("cbt_completed") || "[]");
    }catch(e){ return []; }
  },
  markCompleted(subjectKey){
    const done = this.getCompleted();
    if(!done.includes(subjectKey)){
      done.push(subjectKey);
      sessionStorage.setItem("cbt_completed", JSON.stringify(done));
    }
  },

  /* ---------- data loading ---------- */
  async fetchConfig(){
    const res = await fetch("data/config.json", { cache: "no-store" });
    if(!res.ok) throw new Error("Could not load today's subject list.");
    return res.json();
  },
  async fetchTest(file){
    const res = await fetch("data/" + file, { cache: "no-store" });
    if(!res.ok) throw new Error("Could not load that test.");
    return res.json();
  },

  /* ---------- timer rules ----------
     20 questions = 30 minutes
     25 questions = 35 minutes
     30 questions = 45 minutes
     Anything outside that range degrades gracefully. */
  durationMinutes(questionCount){
    if(questionCount <= 20) return 30;
    if(questionCount <= 25) return 35;
    if(questionCount <= 30) return 45;
    // beyond 30: keep ~1.5 min/question as a sane fallback
    return Math.ceil(questionCount * 1.5);
  },

  /* ---------- formatting ---------- */
  formatClock(totalSeconds){
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  },
  todayStr(){
    const d = new Date();
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  },
  nowTimeStr(){
    const d = new Date();
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  },

  /* ---------- submit a result to the backend (Google Sheets via Apps Script) ---------- */
  async submitResult({ name, subject, score, total }){
    const payload = {
      name, subject, score, total,
      date: this.todayStr(),
      time: this.nowTimeStr()
    };
    if(!API_URL || API_URL.indexOf("PASTE_YOUR") === 0){
      console.warn("API_URL not configured â€” result was not sent to Google Sheets.", payload);
      return { status: "skipped" };
    }
    try{
      const res = await fetch(API_URL, {
        method: "POST",
        // text/plain avoids a CORS preflight that Apps Script web apps don't handle
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    }catch(err){
      console.error("Failed to send result to backend:", err);
      return { status: "error", message: err.message };
    }
  },

  /* ---------- toast ---------- */
  toast(message, isError){
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
};
