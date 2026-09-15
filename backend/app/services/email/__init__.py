from app.core.cache import redis_client
from app.core.config import settings
from app.services.email.base import EmailBackend
from app.services.email.console import ConsoleEmailBackend
from app.services.email.resend import ResendEmailBackend
from app.services.email.smtp import SMTPEmailBackend

_DAILY_CAP_KEY = "email:sent:daily"
_DAILY_CAP_WINDOW_SECONDS = 86400


class EmailSpendingCapExceeded(Exception):
    """Raised when EMAIL_DAILY_CAP outbound emails have already been sent today."""


def get_email_backend() -> EmailBackend:
    if settings.EMAIL_BACKEND == "smtp":
        return SMTPEmailBackend()
    if settings.EMAIL_BACKEND == "resend":
        return ResendEmailBackend()
    return ConsoleEmailBackend()


email_backend = get_email_backend()


async def send_email(to: str, subject: str, body: str) -> None:
    """Sends through the configured backend, enforcing a shared daily send cap
    so a bug or bulk-resend can't run up an unbounded bill with the email provider."""
    count = await redis_client.incr(_DAILY_CAP_KEY)
    if count == 1:
        await redis_client.expire(_DAILY_CAP_KEY, _DAILY_CAP_WINDOW_SECONDS)
    if count > settings.EMAIL_DAILY_CAP:
        raise EmailSpendingCapExceeded(f"Daily email cap of {settings.EMAIL_DAILY_CAP} reached")
    await email_backend.send(to, subject, body)


__all__ = ["EmailBackend", "EmailSpendingCapExceeded", "get_email_backend", "email_backend", "send_email"]
