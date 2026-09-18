#!/usr/bin/env bash
# Giám sát VPS (chạy cron mỗi 5 phút):
#   - Disk > 80% (cảnh báo) / > 90% (khẩn)
#   - Container exited/unhealthy
#   - HTTPS /api/health của prod + staging
#   - Cert TLS còn < 14 ngày
# Chống spam: mỗi lỗi chỉ gửi lại sau 6 giờ; khi hết lỗi gửi email "đã ổn".
set -uo pipefail

BASE=/opt/edunext
LOG=$BASE/logs
STATE=$LOG/monitor.state
SCRIPTS=$BASE/scripts
mkdir -p "$LOG"
touch "$STATE"

log() { echo "[$(date '+%F %T %Z')] $*"; }

notify() {
  printf '%s\n' "$2" | python3 "$SCRIPTS/notify.py" "$1" >/dev/null 2>&1 || log "khong gui duoc email: $1"
}

alert_once() {
  local key="$1" subject="$2" body="$3" now last
  now=$(date +%s)
  last=$(grep "^$key=" "$STATE" 2>/dev/null | cut -d= -f2 || true)
  last=${last:-0}
  if [ $((now - last)) -ge 21600 ]; then
    notify "$subject" "$body"
    grep -v "^$key=" "$STATE" > "$STATE.tmp" 2>/dev/null || true
    echo "$key=$now" >> "$STATE.tmp"
    mv "$STATE.tmp" "$STATE"
    log "ALERT: $subject"
  else
    log "bo qua (chong spam): $key"
  fi
}

recovered() {
  local key="$1" subject="$2"
  if grep -q "^$key=" "$STATE" 2>/dev/null; then
    notify "$subject" "Tinh trang da tro lai binh thuong luc $(date '+%F %T %Z')."
    grep -v "^$key=" "$STATE" > "$STATE.tmp" 2>/dev/null || true
    mv "$STATE.tmp" "$STATE"
    log "RECOVERED: $key"
  fi
}

# 1) Disk
pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')
log "disk: ${pct}%"
if [ "${pct:-0}" -ge 90 ]; then
  alert_once disk_crit "[EduNext] KHA CAP: o dia VPS ${pct}%" \
"O dia / tren VPS da dung ${pct}%.
Can don dep ngay (docker system prune, xoa backup cu).
Lenh kiem tra: df -h / && docker system df"
elif [ "${pct:-0}" -ge 80 ]; then
  alert_once disk_warn "[EduNext] Canh bao: o dia VPS ${pct}%" \
"O dia / tren VPS da dung ${pct}% (nguong canh bao 80%)."
else
  recovered disk_warn "[EduNext] O dia VPS da binh thuong"
  recovered disk_crit "[EduNext] O dia VPS da binh thuong"
fi

# 2) Container
bad=$(docker ps -a --format '{{.Names}}|{{.State}}|{{.Status}}' | grep -v '|running|' || true)
if [ -n "$bad" ]; then
  log "container bat thuong: $bad"
  alert_once containers "[EduNext] Container bat thuong" \
"Container khong o trang thai running:
$bad

Lenh goi y: docker ps -a ; docker logs <ten> --tail 100 ; cd /opt/edunext/<env>/... && docker compose up -d"
else
  recovered containers "[EduNext] Container da on dinh tro lai"
fi

# 3) HTTPS health — dùng --resolve để không phụ thuộc DNS công khai (tránh báo động giả khi DNS VPS chập chờn)
for url in https://edunext.vmgenglish.edu.vn/api/health https://staging.edunext.vmgenglish.edu.vn/api/health; do
  host=${url#https://}; host=${host%%/*}
  code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' --resolve "$host:443:103.195.237.150" "$url" 2>/dev/null)
  code=${code:-000}
  key="url_$(printf '%s' "$url" | md5sum | cut -c1-8)"
  log "$url -> $code"
  if [ "$code" != "200" ]; then
    alert_once "$key" "[EduNext] Endpoint loi ($code): $url" \
"Kiem tra: $url tra ve HTTP $code (mong doi 200).
Goi y: docker logs edunext-edge-caddy --tail 50 ; docker ps"
  else
    recovered "$key" "[EduNext] Endpoint da on: $url"
  fi
done

# 4) Cert TLS (< 14 ngày) — kết nối thẳng 127.0.0.1 + SNI domain để không phụ thuộc DNS
for host in edunext.vmgenglish.edu.vn staging.edunext.vmgenglish.edu.vn; do
  if echo | timeout 15 openssl s_client -connect 127.0.0.1:443 -servername "$host" 2>/dev/null \
      | openssl x509 -checkend 1209600 -noout >/dev/null 2>&1; then
    recovered "cert_$host" "[EduNext] Cert $host da on dinh"
  else
    log "cert $host sap het han hoac loi TLS"
    alert_once "cert_$host" "[EduNext] Cert $host sap het han (<14 ngay) hoac loi TLS" \
"Cert cua $host sap het han hoac handshake loi.
Caddy thuong tu gia han; kiem tra: docker logs edunext-edge-caddy --tail 100"
  fi
done

# Giữ log gọn (nếu > 5MB thì cắt còn 500 dòng)
if [ "$(stat -c%s "$LOG/monitor.log" 2>/dev/null || echo 0)" -gt 5242880 ]; then
  tail -n 500 "$LOG/monitor.log" > "$LOG/monitor.log.tmp" && mv "$LOG/monitor.log.tmp" "$LOG/monitor.log"
fi
