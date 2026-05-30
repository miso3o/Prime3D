# MES 인터랙티브 설명서 — VS Code 작업 가이드

## 📁 파일 구조
```
mes_project/
├── index.html      ← 메인 HTML (건드릴 필요 거의 없음)
├── hotspots.js     ← ✅ 여기서 위치·내용 수정
├── MES.png         ← 배경 이미지
└── README.md       ← 이 파일
```

---

## 🖥️ 브라우저에서 위치 조정하는 방법

1. `index.html`을 브라우저로 열기
2. 상단 **「✏️ 위치 조정」** 버튼 클릭
3. 파란 박스가 나타나면 목록에서 항목 선택
4. 슬라이더로 **TOP / LEFT / WIDTH / HEIGHT** 조정
5. **「이 항목 값 복사」** 클릭 → 클립보드에 복사됨
6. VS Code에서 `hotspots.js` 열고 해당 항목에 붙여넣기
7. 브라우저 새로고침 → 위치 반영 확인

> 💡 **「전체 값 복사」** 버튼을 누르면 모든 항목의 현재 위치값이 한번에 복사돼요.
> hotspots.js 상단에 주석으로 붙여넣어두면 백업이 돼요.

---

## ✏️ 카드 내용 수정하는 방법 (hotspots.js)

### 텍스트 수정
```js
{
  type: 'card',
  title: '제목을 바꾸려면 여기',   // ← 수정
  text:  '내용을 바꾸려면 여기'    // ← 수정
},
```

### 공정 스텝 수정
```js
{
  type: 'steps',
  title: '공정 순서',
  rows: [
    { num: 1, code: 'CJL', name: 'Jelly Roll Loader', note: '메모', noteStyle: 'key' },
    //                                                  ↑ 없애려면 note 줄 삭제
    //                                  noteStyle: 'key'(노란색) | 'last'(핑크색)
    { num: 2, code: 'CCI', name: 'Can Insert' },  // note 없는 경우
  ]
}
```

### RMS 서브카드 수정
```js
{
  type: 'rms-subs',
  subs: [
    { name: 'RMS Scheduler', comm: '↔ FMS · CDC', desc: '설명 텍스트' },
    // name = 제목, comm = 파란 뱃지, desc = 본문
  ]
}
```

### 새 핫스팟 추가
```js
// HOTSPOTS 배열 맨 아래에 추가
{
  id: 'f99',                          // 고유 ID (영문)
  label: '새 항목',                   // 툴팁에 표시
  top: 50, left: 50, width: 15, height: 15,  // 위치 (%)
  title: '새 항목 제목',
  sub: '부제목',
  theme: 'func',                      // mes|cim|eis|rms|fms|func
  emoji: '⭐',
  content: [
    { type: 'card', title: '제목', text: '내용' }
  ]
},
```

### theme 색상 종류
| theme | 색상 |
|-------|------|
| `mes`  | 네이비 블루 |
| `cim`  | 청록 |
| `eis`  | 보라 |
| `rms`  | 주황 |
| `fms`  | 초록 |
| `func` | 회색 |

---

## 🚀 VS Code 추천 확장
- **Live Server** — 저장할 때마다 브라우저 자동 새로고침
  - 설치 후 `index.html` 우클릭 → "Open with Live Server"
- **Prettier** — JS/HTML 자동 포맷

---

## ⚠️ 주의사항
- `hotspots.js`와 `index.html`과 `MES.png`는 **반드시 같은 폴더**에 있어야 해요.
- 위치값(top/left/width/height)은 이미지 크기 대비 **퍼센트(%)** 값이에요.
- 브라우저에서 파일을 직접 열 때(`file://`)는 클립보드 API가 동작하지 않을 수 있어요.
  Live Server 또는 로컬 서버(`python -m http.server`)를 사용하면 정상 동작해요.
