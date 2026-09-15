from django.contrib.auth.hashers import PBKDF2PasswordHasher


class TunedPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """Django 6's default PBKDF2 iteration count (1.5M) targets fast modern
    server hardware and took ~4.5s per password check on this machine -
    enough to make login/signup feel broken. 400k iterations still meets
    OWASP's current minimum for PBKDF2-SHA256 while staying responsive here.
    Existing password hashes keep working: Django reads the iteration count
    embedded in each stored hash, it doesn't need to match this class's value.
    """
    iterations = 400_000
