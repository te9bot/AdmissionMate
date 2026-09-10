import httpx

from app.core.config import settings
from app.services.email.base import EmailBackend

_RESEND_API_URL = "https://api.resend.com/emails"


class ResendEmailBackend(EmailBackend):
    async def send(self, to: str, subject: str, body: str) -> None:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                _RESEND_API_URL,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.EMAIL_FROM,
                    "to": [to],
                    "subject": subject,
                    "text": body,
                },
                timeout=10.0,
            )
            response.raise_for_status()
