#!/bin/bash

JQ="$CLAUDE_PROJECT_DIR/.claude/bin/jq.exe"

INPUT=$(cat)
FILE=$(echo "$INPUT" | "$JQ" -r '.tool_input.file_path // empty')

# .ts 파일이 수정될 때만 타입 체크 실행
if [[ "$FILE" == *.ts ]]; then
  BUILD_RESULT=$(npx tsc --noEmit 2>&1)
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    echo "TypeScript 타입 오류 감지:" >&2
    echo "$BUILD_RESULT" >&2
    exit 2
  fi
fi
