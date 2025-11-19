import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/dicebank"



class Base(DeclarativeBase):
    pass



engine = create_engine(
    DATABASE_URL,
    echo=True,  
)



SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

    # Backfill schema tweaks that SQLAlchemy's create_all cannot apply retroactively.
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE cards "
                    "ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2) NOT NULL DEFAULT 0"
                )
            )
    except Exception as exc:  # pragma: no cover - defensive safety net
        logging.getLogger(__name__).warning("Schema check failed: %s", exc)
