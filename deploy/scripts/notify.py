#!/usr/bin/env python3
"""Gửi email cảnh báo vận hành qua Gmail SMTP (noreply@vmg.edu.vn).

Dùng:  echo "nội dung" | notify.py "Tiêu đề"
Đọc cấu hình SMTP từ /opt/edunext/secrets/supabase-prod.env
"""
import os
import smtplib
import sys
from email.message import EmailMessage

SECRETS = "/opt/edunext/secrets/supabase-prod.env"
MAIL_TO = os.environ.get("MAIL_TO", "quoccuong.dni@vmg.edu.vn")


def _clean(value: str) -> str:
    """Bỏ khoảng trắng thừa và ngoặc kép bao ngoài (compose tự strip, đọc thô thì không)."""
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value


def load_smtp() -> tuple[str, str, str, int]:
    user = _clean(os.environ.get("SMTP_USER", ""))
    password = _clean(os.environ.get("SMTP_PASS", ""))
    host = _clean(os.environ.get("SMTP_HOST", ""))
    port = int(_clean(os.environ.get("SMTP_PORT", "")) or 465)
    if user and password:
        return user, password.replace(" ", ""), host or "smtp.gmail.com", port
    cfg = {}
    if os.path.exists(SECRETS):
        for line in open(SECRETS, encoding="utf-8", errors="ignore"):
            if "=" in line and not line.startswith("#"):
                k, v = line.rstrip("\n").split("=", 1)
                cfg[k] = _clean(v)
    return (
        cfg.get("SMTP_USER", "noreply@vmg.edu.vn"),
        cfg.get("SMTP_PASS", "").replace(" ", ""),
        cfg.get("SMTP_HOST", "smtp.gmail.com"),
        int(cfg.get("SMTP_PORT", "465")),
    )


def send(subject: str, body: str) -> None:
    user, password, host, port = load_smtp()
    if not password:
        raise SystemExit("Thiếu SMTP_PASS")
    msg = EmailMessage()
    msg["From"] = f"EduNext Ops <{user}>"
    msg["To"] = MAIL_TO
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP_SSL(host, port, timeout=25) as s:
        s.login(user, password)
        s.send_message(msg)


if __name__ == "__main__":
    subject = sys.argv[1] if len(sys.argv) > 1 else "[EduNext] Thông báo"
    body = sys.stdin.read() if not sys.stdin.isatty() else ""
    if not body.strip():
        body = "(không có nội dung)"
    send(subject, body)
    print(f"đã gửi: {subject} -> {MAIL_TO}")
