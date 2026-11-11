"""Add accounts, tenant ownership, and a date contact field."""
from alembic import op
import sqlalchemy as sa

revision = "0002_users"
down_revision = "0001_legacy"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(160), nullable=False), sa.Column("email", sa.String(255), nullable=False), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    for table in ("customers", "tasks", "activities"):
        with op.batch_alter_table(table) as batch:
            batch.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))
            batch.create_index(f"ix_{table}_owner_id", ["owner_id"])
            batch.create_foreign_key(f"fk_{table}_owner_id_users", "users", ["owner_id"], ["id"], ondelete="CASCADE")
    with op.batch_alter_table("customers") as batch:
        batch.add_column(sa.Column("last_contact_date", sa.Date(), nullable=True))

def downgrade():
    with op.batch_alter_table("customers") as batch: batch.drop_column("last_contact_date")
    for table in ("customers", "tasks", "activities"):
        with op.batch_alter_table(table) as batch:
            batch.drop_constraint(f"fk_{table}_owner_id_users", type_="foreignkey")
            batch.drop_index(f"ix_{table}_owner_id"); batch.drop_column("owner_id")
    op.drop_index("ix_users_email", table_name="users"); op.drop_table("users")
