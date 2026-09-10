import logging

from app.services.email.base import EmailBackend

logger = logging.getLogger("admissionmate.email")


class ConsoleEmailBackend(EmailBackend):
    """Dev backend: logs the email instead of sending it. Lets the app run
    end-to-end (including OTP login) without any third-party email provider."""

    async def send(self, to: str, subject: str, body: str) -> None:
        logger.info("=== EMAIL to=%s subject=%r ===\n%s\n=== END EMAIL ===", to, subject, body)
