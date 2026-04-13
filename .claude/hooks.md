# Claude Code Hooks

## 개요

Claude Code의 도구 실행, 파일 편집 등 특정 이벤트 발생 시 자동으로 실행되는 사용자 정의 명령어.
LLM 판단이 아닌 **시스템이 결정론적으로 실행**하는 것이 특징.

---

## 설정 위치

| 파일 | 범위 | git 커밋 |
|------|------|---------|
| `.claude/settings.json` | 현재 프로젝트 | 가능 |
| `.claude/settings.local.json` | 현재 프로젝트 | 불가 (gitignore) |
| `~/.claude/settings.json` | 모든 프로젝트 | - |

---

## 이벤트 타입

| 이벤트 | 발생 시점 |
|--------|---------|
| `PreToolUse` | 도구 실행 **전** |
| `PostToolUse` | 도구 실행 **후** (성공) |
| `SessionStart` | 세션 시작 |
| `SessionEnd` | 세션 종료 |
| `Notification` | 알림 필요 시 |
| `UserPromptSubmit` | 사용자 프롬프트 제출 시 |

---

## settings.json 기본 구조

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/my-hook.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

- `matcher`: 도구 이름 필터 (`|` 로 여러 개, 빈 문자열 = 전체)
- `type`: `command` / `http` / `prompt` / `agent`
- `timeout`: 초 단위 (기본 600초)

---

## Hook 스크립트 입력 (stdin JSON)

```json
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "old_string": "...",
    "new_string": "..."
  }
}
```

파일 경로 추출:
```bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
```

---

## 종료 코드

| 코드 | 동작 |
|------|------|
| `0` | 정상, 작업 계속 |
| `2` | **차단** — stderr 내용을 Claude에 피드백 후 작업 중단 |
| `1, 3+` | 오류 메시지만 표시, 작업 계속 |

---

## 환경변수

| 변수 | 내용 |
|------|------|
| `$CLAUDE_PROJECT_DIR` | 프로젝트 루트 경로 |
| `$CLAUDE_ENV_FILE` | Hook이 환경변수를 추가할 파일 |

---

## 이 프로젝트 Hook

### `on-code-written.sh`

- **트리거**: `Write` / `Edit` 도구 실행 후
- **동작**: `.ts` 파일 수정 시 `tsc --noEmit` 타입 체크 자동 실행
- **오류 시**: 오류 내용을 Claude에 피드백 → 자동 재수정

---

## 사전 요구사항

- `jq` 설치 필요
  ```
  winget install jqlang.jq
  ```
- Git Bash 또는 WSL 환경

---

## Hook 목록 확인

Claude Code 내에서:
```
/hooks
```
