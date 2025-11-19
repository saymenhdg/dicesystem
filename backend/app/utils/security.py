import bcrypt

# passlib expects bcrypt.__about__.__version__, but some builds of bcrypt omit
# the attribute. Patch the module *before* importing passlib so its import-time
# introspection succeeds even on the trimmed-down wheels.
if not hasattr(bcrypt, "__about__"):
    class _About:
        __version__ = getattr(bcrypt, "__version__", "0")

    bcrypt.__about__ = _About()

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_LENGTH = 72


def hash_password(password: str) -> str:
    if not isinstance(password, str):
        password = str(password)
    password = password[:MAX_BCRYPT_LENGTH]

    try:
        return pwd_context.hash(password)
    except ValueError:
    
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not isinstance(plain_password, str):
        plain_password = str(plain_password)
    plain_password = plain_password[:MAX_BCRYPT_LENGTH]

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # fallback verify using bcrypt directly
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
