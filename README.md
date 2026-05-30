# Prime3D

공장 도면(2D Floor Plan)을 3D로 렌더링하는 뷰어.  
React + Three.js (React Three Fiber) + TypeScript + Vite

---

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 열기

---

## 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됨

---

## 빌드 결과물 미리보기

```bash
npm run preview
```

---

## 처음 설치할 때

```bash
npm install
npm run dev
```

---

## 주요 파일

| 경로 | 설명 |
|------|------|
| `src/config/defaultLayout.json` | 도면 데이터 (트랙, 크레인, 박스, 레이어 등) |
| `src/config/types.ts` | 도면 관련 타입 정의 |
| `src/config/fp2world.ts` | 2D 픽셀 좌표 → 3D 월드 좌표 변환 상수 |
| `src/components/Scene/FPScene3D.tsx` | 3D 씬 렌더링 메인 컴포넌트 |
