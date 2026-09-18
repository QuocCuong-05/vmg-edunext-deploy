#!/usr/bin/env bash
# Giám sát VPS (chạy cron mỗi 5 phút):
#   - Disk > 80% (cảnh báo) / > 90% (khẩn)
#   - Container exited/unhealthy
#   - HTTPS /api/health của prod + staging (dùng --resolve, không phụ thuộc DNS công khai)
#   - Cert TLS còn < 14 ngày (kết nối 127.0.0.1 + SNI, không phụ thuộc DNS)
#
# Chống spam thông minh:
#   - Chỉ alert sau FAIL_THRESHOLD lần fail LIÊN TIẾP (bỏ qua blip ngắn, ví dụ DNS chập chờn)
#   - Tối đa 1 alert / ALERT_MIN_INTERVAL giây cho mỗi key — kể cả sau khi đã hồi phục
#   - Email "đã ổn" giữ lại nhưng cũng giới hạn RECOVER_MIN_INTERVAL giây/key
set -uo pipefail

BASE=/opt/edunext
LOG=$BASE/logs
STATE=$LOG/monitor.state
SCRIPTS=$BASE/scripts
mkdir -p "$LOG"
touch "$STATE"

FAIL_THRESHOLD=2          # số lần fail liên tiếp mới gửi alert (~10 phút với cron 5')
ALERT_MIN_INTERVAL=3600   # giây — tối thiểu giữa 2 alert cùng key
RECOVER_MIN_INTERVAL=3600 # giây — tối thiểu giữa 2 email "đã ổn" cùng key

log() { echo "[$(date '+%F %T %Z')] $*"; }

notify() {
  printf '%s\n' "$2" | python3 "$SCRIPTS/notify.py" "$1" >/dev/null 2>&1 || log "khong gui duoc email: $1"
}

# ---- state helpers (mỗi dòng: key=value) ----
state_get() { grep "^$1=" "$STATE" 2>/dev/null | tail -1 | cut -d= -f2 || true; }
state_set() {
  grep -v "^$1=" "$STATE" > "$STATE.tmp" 2>/dev/null || true
  echo "$1=$2" >> "$STATE.tmp"
  mv "$STATE.tmp" "$STATE"
}
state_del() {
  grep -v "^$1=" "$STATE" > "$STATE.tmp" 2>/dev/null || true
  mv "$STATE.tmp" "$STATE"
}

# Gọi khi check FAIL: đếm liên tiếp, chỉ gửi alert khi đủ ngưỡng + chưa gửi trong ALERT_MIN_INTERVAL
alert_once() {
  local key="$1" subject="$2" body="$3" now fails last
  now=$(date +%s)
  fails=$(( $(state_get "fail_$key" || echo 0) + 1 ))
  state_set "fail_$key" "$fails"

  if [ "$fails" -lt "$FAIL_THRESHOLD" ]; then
    log "fail lan $fails/$FAIL_THRESHOLD ($key) — chua gui alert"
    return
  fi

  last=$(state_get "alert_$key" || echo 0); last=${last:-0}
  if [ $((now - last)) -lt "$ALERT_MIN_INTERVAL" ]; then
    log "bo qua (rate-limit alert): $key"
  else
    notify "$subject" "$body"
    state_set "alert_$key" "$now"
    log "ALERT: $subject"
  fi
  state_set "problem_$key" "1"
}

# Gọi khi check OK: xoá đếm fail; nếu đang có vấn đề thì gửi email "đã ổn" (giới hạn tần suất)
recovered() {
  local key="$1" subject="$2" now last
  state_del "fail_$key"
  [ "$(state_get "problem_$key")" = "1" ] || return 0
  now=$(date +%s)
  last=$(state_get "recover_$key" || echo 0); last=${last:-0}
  if [ $((now - last)) -lt "$RECOVER_MIN_INTERVAL" ]; then
    log "bo qua (rate-limit recovered): $key"
  else
    notify "$subject" "Tinh trang da tro lai binh thuong luc $(date '+%F %T %Z')."
    state_set "recover_$key" "$now"
    log "RECOVERED: $key"
  fi
  state_del "problem_$key"
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
