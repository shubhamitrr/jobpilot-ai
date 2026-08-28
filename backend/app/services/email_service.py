"""
Optional SMTP email notifications. If SMTP is not configured, sending is
skipped silently (logged) and the rest of the app continues to work.
"""
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("jobpilot.email")


def is_smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not is_smtp_configured():
        logger.info("SMTP not configured; skipping email send to %s", to_email)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USERNAME
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to_email], msg.as_string())
        return True
    except Exception as e:
        logger.error("Failed to send email: %s", e)
        return False


def build_daily_report_html(jobs_found: int, top_matches: list) -> str:
    rows = "".join(
        f"<li><strong>{j['title']}</strong> at {j['company']} — Match: {j['overall_match']}% "
        f"<a href='{j['application_url']}'>View</a></li>"
        for j in top_matches
    )
    return f"""
    <h2>JobPilot AI — Daily Job Report</h2>
    <p>Jobs found today: <strong>{jobs_found}</strong></p>
    <p>Top matches:</p>
    <ul>{rows}</ul>
    """
