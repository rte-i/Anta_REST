"""update_ldap_user

Revision ID: bb2d1f638a3e
Revises: 512a751033dd
Create Date: 2021-07-27 10:38:44.741632

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bb2d1f638a3e'
down_revision = '512a751033dd'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_ldap', schema=None) as batch_op:
        batch_op.add_column(sa.Column('firstname', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('lastname', sa.String(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_ldap', schema=None) as batch_op:
        batch_op.drop_column('lastname')
        batch_op.drop_column('firstname')

    # ### end Alembic commands ###