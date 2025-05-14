import bcrypt
from passlib.context import CryptContext

# Add the missing attribute that Passlib looks for
if not hasattr(bcrypt, '__about__'):
    class About:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = About



pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Hash():
    def bcrypt(password: str):
        return pwd_ctx.hash(password)