import random
from sqlalchemy.orm import Session
from app.models.account import Account
from app.models.card import Card


def generate_unique_card_number(db: Session) -> str:
    """Generate a unique 16-digit card number across accounts and issued cards."""
    while True:
        number = ''.join(str(random.randint(0, 9)) for _ in range(16))
        exists_account = db.query(Account).filter(Account.card_number == number).first()
        exists_card = db.query(Card).filter(Card.card_number == number).first()
        if not exists_account and not exists_card:
            return number
