from sqlalchemy.orm import Session
from app.models.customer import Activity, Customer, Task

def seed(db: Session) -> None:
    if db.query(Customer).count():
        return
    db.add_all([
        Customer(name="Selam Tesfaye", company="Habesha Logistics", email="selam@habesha.example", value=48000, stage="proposal", last_contact="3 days ago", notes="Wants fleet tracking across 3 depots. Asked for a revised quote."),
        Customer(name="Daniel Bekele", company="Nile Coffee Co.", email="daniel@nile.example", value=22000, stage="contacted", last_contact="1 week ago", notes="Interested in export reporting. Needs a demo."),
        Customer(name="Marta Alemu", company="Blue Abay Tech", email="marta@abay.example", value=95000, stage="lead", last_contact="Not contacted", notes="Inbound from website. Large potential deal."),
        Customer(name="Hana Worku", company="Lalibela Travel", email="hana@lalibela.example", value=17500, stage="qualified", last_contact="2 days ago", notes="Budget confirmed. Decision expected this month."),
        Customer(name="Yonas Haile", company="Addis Fresh Foods", email="yonas@fresh.example", value=31000, stage="won", last_contact="Yesterday", notes="Signed annual plan."),
    ])
    db.add_all([
        Task(title="Follow up with Selam Tesfaye", detail="Habesha Logistics · Email", due="Today"),
        Task(title="Send demo invite to Daniel Bekele", detail="Nile Coffee Co. · Meeting", due="Tomorrow"),
        Task(title="Qualify Marta Alemu", detail="Blue Abay Tech · Call", due="This week"),
    ])
    db.add_all([Activity(title="Workspace created", detail="Sample data loaded")])
    db.commit()
