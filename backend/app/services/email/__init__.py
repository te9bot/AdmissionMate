from app.core.config import settings
from app.services.email.base import EmailBackend
from app.services.email.console import ConsoleEmailBackend
from app.services.email.resend import ResendEmailBackend
from app.services.email.smtp import SMTPEmailBackend


def get_email_backend() -> EmailBackend:
    if settings.EMAIL_BACKEND == "smtp":
        return SMTPEmailBackend()
    if settings.EMAIL_BACKEND == "resend":
        return ResendEmailBackend()
    return ConsoleEmailBackend()


email_backend = get_email_backend()

__all__ = ["EmailBackend", "get_email_backend", "email_backend"]
