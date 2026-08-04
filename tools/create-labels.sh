#!/usr/bin/env sh
set -e
REPO="cuonghqdev/vmg-edunext"

create() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null 2>&1 || true
}

create "feature"       "1D76DB" "Tính năng mới"
create "bug"           "D73A4A" "Lỗi hoạt động sai"
create "question"      "FBCA04" "Câu hỏi / cần làm rõ"
create "priority: high" "B60205" "Ưu tiên cao - làm trước"
create "priority: medium" "D93F0B" "Ưu tiên trung bình"
create "priority: low"   "C5DEF5" "Ưu tiên thấp"
create "env: staging"   "5319E7" "Liên quan môi trường staging"
create "env: production" "0052CC" "Liên quan môi trường production"

echo "Labels created for $REPO"
