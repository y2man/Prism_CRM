"""Baseline for the original single-user schema."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0001_legacy"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    existing = set(inspect(op.get_bind()).get_table_names())
    if "customers" not in existing:
        op.create_table("customers", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(160), nullable=False), sa.Column("company", sa.String(180), nullable=False), sa.Column("email", sa.String(255), nullable=False, server_default=""), sa.Column("value", sa.Integer(), nullable=False, server_default="0"), sa.Column("stage", sa.String(30), nullable=False, server_default="lead"), sa.Column("last_contact", sa.String(80), nullable=False, server_default="Not contacted"), sa.Column("notes", sa.Text(), nullable=False, server_default=""))
        op.create_index("ix_customers_id", "customers", ["id"]); op.create_index("ix_customers_stage", "customers", ["stage"])
    if "tasks" not in existing:
        op.create_table("tasks", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("detail", sa.String(200), nullable=False, server_default=""), sa.Column("due", sa.String(60), nullable=False, server_default="Today"), sa.Column("done", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.create_index("ix_tasks_id", "tasks", ["id"])
    if "activities" not in existing:
        op.create_table("activities", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("detail", sa.String(300), nullable=False, server_default=""), sa.Column("created", sa.DateTime(), nullable=False))
        op.create_index("ix_activities_id", "activities", ["id"])

def downgrade():
    op.drop_table("activities"); op.drop_table("tasks"); op.drop_table("customers")
