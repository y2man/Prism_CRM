from collections import Counter
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.security import current_user
from app.core.limiter import limiter
from app.database.session import get_db
from app.models.customer import Customer, User
from app.services.ai.provider import active_provider, generate_text, open_stream

router = APIRouter(prefix="/api/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=3000)
    history: list[dict] = Field(default_factory=list, max_length=20)

def money(n: int) -> str:
    return f"${n:,}"

def find(db: Session, cid: int, owner_id: int) -> Customer:
    c = db.query(Customer).filter(Customer.id == cid, Customer.owner_id == owner_id).first()
    if not c: raise HTTPException(404, "Customer not found")
    return c

def describe(c: Customer) -> str:
    contact = f"{(datetime.now(timezone.utc).date() - c.last_contact_date).days} days ago ({c.last_contact_date})" if c.last_contact_date else c.last_contact
    return f"{c.name} at {c.company}: stage={c.stage}, value={c.value}, score={c.score}, last_contact={contact}, notes={c.notes}"

def generate(prompt: str, history=None) -> str | None:
    try:
        return generate_text(prompt, history)
    except Exception as exc:
        print(f"[AI ERROR] {type(exc).__name__}")
        raise HTTPException(503, "AI is unavailable right now. Please try again shortly.") from exc

def local_reply(body: ChatRequest, db: Session, user: User) -> dict:
    cs = db.query(Customer).filter(Customer.owner_id == user.id).order_by(Customer.id.desc()).limit(500).all()
    open_ = [c for c in cs if c.stage not in ("won", "lost")]
    counts = dict(Counter(c.stage for c in cs)); q = body.message.lower()
    if not cs: return {"reply": "There are no records yet. Add a client and I can start helping.", "provider": "local"}
    if any(w in q for w in ("attention", "follow", "call", "urgent")):
        pick = sorted(open_, key=lambda c: (c.last_contact_date is not None or c.last_contact != "Not contacted", -c.value))[:3]
        text = "Focus on these first:\n" + "\n".join(f"• {c.name} ({c.company}) — {c.stage}, {money(c.value)}, last contact: {describe(c).split('last_contact=')[1].split(', notes=')[0]}" for c in pick)
    elif "pipeline" in q or "summar" in q:
        text = f"You have {len(open_)} open deals worth {money(sum(c.value for c in open_))}. " + ", ".join(f"{s}: {counts.get(s, 0)}" for s in ("lead", "contacted", "qualified", "proposal", "won"))
    else:
        top = max(open_ or cs, key=lambda c: c.value)
        text = f"Your biggest open opportunity is {top.name} at {top.company} ({money(top.value)}, stage {top.stage})."
    return {"reply": text, "provider": "local"}

@router.get("/status")
def status(user: User = Depends(current_user)):
    provider = active_provider()
    return {"provider": provider, "message": "Groq is connected." if provider == "groq" else "AI is using local answers. Add GROQ_API_KEY to enable Groq."}

@router.post("/insight/{cid}")
@limiter.limit("20/minute")
def insight(request: Request, cid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    c = find(db, cid, user.id)
    ai = generate("Analyze this CRM record. Separate facts from assumptions. Give strengths, risks and one next action.\n" + describe(c))
    if ai: return {"insight": ai, "provider": "groq"}
    risk = "No recorded contact yet." if not c.last_contact else f"Last contact: {c.last_contact}."
    nxt = {"lead": "Send a short intro and book a discovery call.", "contacted": "Offer a demo with a clear date.", "qualified": "Send a tailored proposal.", "proposal": "Follow up on the proposal and ask for blockers.", "won": "Schedule an onboarding check-in.", "lost": "Ask for feedback and revisit in 90 days."}.get(c.stage, "Review this record.")
    return {"insight": f"Facts: {c.name} ({c.company}) is at the {c.stage} stage, deal value {money(c.value)}, score {c.score}/100.\nRisk: {risk}\nNext action: {nxt}", "provider": "local"}

@router.post("/email/{cid}")
@limiter.limit("20/minute")
def email(request: Request, cid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    c = find(db, cid, user.id)
    ai = generate("Draft a concise personalized follow-up email with a subject line. Do not invent commitments. It is a draft for human review.\n" + describe(c))
    if ai: return {"email": ai, "provider": "groq"}
    first = c.name.split()[0]
    return {"email": f"Subject: Following up, {c.company}\n\nHi {first},\n\nThanks for your time so far. What would be most useful as a next step? Do you have 15 minutes this week for a quick call?\n\nBest regards,\n{user.name}", "provider": "local"}

@router.post("/chat")
@limiter.limit("10/minute")
def chat(request: Request, body: ChatRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    cs = db.query(Customer).filter(Customer.owner_id == user.id).order_by(Customer.id.desc()).limit(500).all()
    open_ = [c for c in cs if c.stage not in ("won", "lost")]
    counts = dict(Counter(c.stage for c in cs))
    ctx = (f"Open deals: {len(open_)}, total open value: {money(sum(c.value for c in open_))}\nDeals per stage: {counts}\nRecords:\n" + "\n".join(describe(c) for c in cs))
    history = [{"role": m["role"], "content": str(m.get("content", ""))[:3000]} for m in body.history[-10:] if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)]
    prompt = f"CRM DATA (use only for business questions):\n{ctx}\n\nUSER: {body.message}"
    ai = generate(prompt, history)
    if ai: return {"reply": ai, "provider": "groq"}
    return local_reply(body, db, user)

@router.post("/chat/stream")
@limiter.limit("10/minute")
def chat_stream(request: Request, body: ChatRequest, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not active_provider() == "groq":
        result = local_reply(body, db, user)
        def local_chunks():
            answer = result["reply"]
            for i in range(0, len(answer), 24): yield answer[i:i + 24]
        return StreamingResponse(local_chunks(), media_type="text/plain; charset=utf-8", headers={"X-AI-Provider": "local", "Cache-Control": "no-cache"})
    cs = db.query(Customer).filter(Customer.owner_id == user.id).order_by(Customer.id.desc()).limit(500).all()
    open_ = [c for c in cs if c.stage not in ("won", "lost")]
    counts = dict(Counter(c.stage for c in cs))
    ctx = f"Open deals: {len(open_)}, total open value: {money(sum(c.value for c in open_))}\nDeals per stage: {counts}\nRecords:\n" + "\n".join(describe(c) for c in cs)
    history = [{"role": m["role"], "content": str(m.get("content", ""))[:3000]} for m in body.history[-10:] if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)]
    try:
        stream = open_stream(f"CRM DATA (use only for business questions):\n{ctx}\n\nUSER: {body.message}", history)
    except Exception as exc:
        print(f"[AI ERROR] {type(exc).__name__}")
        raise HTTPException(503, "AI is unavailable right now. Please try again shortly.") from exc
    def chunks():
        try:
            for chunk in stream:
                text = chunk.choices[0].delta.content
                if text: yield text
        except Exception:
            yield "\n\n_AI is unavailable right now. Please try again._"
    return StreamingResponse(chunks(), media_type="text/plain; charset=utf-8", headers={"X-AI-Provider": "groq", "Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
