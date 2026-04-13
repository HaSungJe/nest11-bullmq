#!/bin/bash

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# .ts 파일이 수정될 때만 타입 체크 실행
if [[ "$FILE" == *.ts ]]; then
  BUILD_RESULT=$(npx tsc --noEmit 2>&1)
  EXIT_CODE=$?

  if [ $EXIT_CODE -ne 0 ]; then
    echo "TypeScript 타입 오류 감지:"
    echo "$BUILD_RESULT"
    exit 2
  fi
fi
