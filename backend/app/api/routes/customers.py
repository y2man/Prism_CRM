from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.security import current_user
from app.database.session import get_db
from app.models.customer import Activity, Customer, Task, User, utc_now
from app.schemas.customer import STAGES, ActivityRead, CustomerCreate, CustomerRead, CustomerUpdate, TaskCreate, TaskRead

router = APIRouter(prefix="/api", tags=["CRM"])

def log(db: Session, owner_id: int, title: str, detail: str = "") -> None:
    db.add(Activity(owner_id=owner_id, title=title, detail=detail, created=utc_now()))

def get_owned(db: Session, model, id_: int, owner_id: int):
    obj = db.query(model).filter(model.id == id_, model.owner_id == owner_id).first()
    if not obj:
        raise HTTPException(404, f"{model.__name__} not found")
    return obj

@router.get("/customers", response_model=list[CustomerRead])
def list_customers(q: str = Query(default="", max_length=120), sort: str = "newest",
                   page: int = Query(default=1, ge=1), per_page: int = Query(default=5000, ge=1, le=5000),
                   db: Session = Depends(get_db), user: User = Depends(current_user)):
    query = db.query(Customer).filter(Customer.owner_id == user.id)
    if q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(Customer.name.ilike(term), Customer.company.ilike(term), Customer.email.ilike(term)))
    ordering = {"newest": Customer.id.desc(), "oldest": Customer.id.asc(), "name": Customer.name.asc(), "value": Customer.value.desc(), "stage": Customer.stage.asc()}.get(sort)
    if ordering is None:
        raise HTTPException(422, "Unknown sort order")
    return query.order_by(ordering).offset((page - 1) * per_page).limit(per_page).all()

@router.get("/customers/count")
def count_customers(q: str = Query(default="", max_length=120), db: Session = Depends(get_db), user: User = Depends(current_user)):
    query = db.query(Customer).filter(Customer.owner_id == user.id)
    if q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(Customer.name.ilike(term), Customer.company.ilike(term), Customer.email.ilike(term)))
    return {"total": query.count()}

@router.post("/customers", response_model=CustomerRead, status_code=201)
def add_customer(payload: CustomerCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if payload.stage not in STAGES: raise HTTPException(422, "Unknown stage")
    data = payload.model_dump(); data["email"] = data.get("email") or ""
    c = Customer(owner_id=user.id, **data)
    db.add(c); log(db, user.id, "New client added", f"{c.name} · {c.company}")
    db.commit(); db.refresh(c); return c

@router.patch("/customers/{cid}", response_model=CustomerRead)
def update_customer(cid: int, payload: CustomerUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    c = get_owned(db, Customer, cid, user.id); data = payload.model_dump(exclude_unset=True)
    if "stage" in data and data["stage"] not in STAGES: raise HTTPException(422, "Unknown stage")
    if data.get("email") is None and "email" in data: data["email"] = ""
    old = c.stage
    for k, v in data.items(): setattr(c, k, v)
    if c.stage != old: log(db, user.id, f"Moved to {c.stage}", f"{c.name} · {c.company}")
    db.commit(); db.refresh(c); return c

@router.post("/customers/{cid}/advance", response_model=CustomerRead)
def advance_customer(cid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    c = get_owned(db, Customer, cid, user.id)
    i = STAGES.index(c.stage) if c.stage in STAGES else 0
    if c.stage in ("won", "lost"): raise HTTPException(409, "Closed deals cannot be advanced")
    c.stage = STAGES[i + 1]; log(db, user.id, f"Moved to {c.stage}", f"{c.name} · {c.company}")
    db.commit(); db.refresh(c); return c

@router.delete("/customers/{cid}")
def delete_customer(cid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    c = get_owned(db, Customer, cid, user.id); log(db, user.id, "Client removed", c.name)
    db.delete(c); db.commit(); return {"ok": True}

@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Task).filter(Task.owner_id == user.id).order_by(Task.done, Task.id.desc()).all()

@router.post("/tasks", response_model=TaskRead, status_code=201)
def add_task(payload: TaskCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    t = Task(owner_id=user.id, **payload.model_dump()); db.add(t); log(db, user.id, "Task created", t.title)
    db.commit(); db.refresh(t); return t

@router.post("/tasks/{tid}/toggle", response_model=TaskRead)
def toggle_task(tid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    t = get_owned(db, Task, tid, user.id); t.done = not t.done
    if t.done: log(db, user.id, "Task completed", t.title)
    db.commit(); db.refresh(t); return t

@router.delete("/tasks/{tid}")
def delete_task(tid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.delete(get_owned(db, Task, tid, user.id)); db.commit(); return {"ok": True}

@router.get("/activities", response_model=list[ActivityRead])
def activities(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Activity).filter(Activity.owner_id == user.id).order_by(Activity.id.desc()).limit(12).all()

@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    cs = db.query(Customer).filter(Customer.owner_id == user.id).all()
    won = [c for c in cs if c.stage == "won"]; open_ = [c for c in cs if c.stage not in ("won", "lost")]
    closed = [c for c in cs if c.stage in ("won", "lost")]
    by_stage = [{"stage": s, "count": sum(c.stage == s for c in cs), "value": sum(c.value for c in cs if c.stage == s)} for s in STAGES]
    return {"customers": len(cs), "open_deals": len(open_), "pipeline": sum(c.value for c in open_), "won": sum(c.value for c in won),
            "win_rate": round(100 * len(won) / len(closed)) if closed else 0, "by_stage": by_stage}
