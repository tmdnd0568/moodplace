# ☕ MoodPlace — AI 기반 카페 추천 앱

> 오늘의 기분과 분위기에 맞는 카페를, 검색이 아닌 '무드'로 찾는 카페 탐색 앱

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/styled--components-DB7093?style=flat&logo=styledcomponents&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/status-Completed-brightgreen" />
</p>

## 🖼️ 실행페이지

| 무드 선택 화면 | 지도 기반 탐색 | 소셜 로그인 |
|---|---|---|
| <img width="399" height="922" alt="image" src="https://github.com/user-attachments/assets/cb6a2972-a94d-4d84-b6b8-728d0eb8fef6" /> | <img width="407" height="921" alt="image" src="https://github.com/user-attachments/assets/64facb1a-2c62-40f5-b7df-caa7a8967c20" /> | <img width="397" height="918" alt="image" src="https://github.com/user-attachments/assets/e1e5b80d-de5e-4ec3-a6e0-f4ddfd6b8990" /> |

배포 링크: https://moodplace001.vercel.app/ · 소개 페이지: https://tmdnd0568.github.io/site/ ([소개 페이지 저장소](https://github.com/tmdnd0568/site))

## 📖 소개

MoodPlace는 SNS의 세부 분위기·스타일 필터링 한계를 해결하기 위해 기획한 **무드(분위기) 기반 카페 검색 앱**입니다. 검색어나 지역명이 아니라 "지금 이 기분"에 맞는 무드를 기준으로 카페를 탐색할 수 있도록 만들었습니다. 디자인은 Figma와 AI 디자인 툴 **Stitch**를 함께 사용해 제작했습니다.

## ✨ 주요 기능 & 인터랙션

### 1. Firebase Authentication 기반 인증 및 소셜 로그인

Firebase Authentication을 이용하여 이메일 회원가입/로그인, 비밀번호 재설정 메일 발송, Google 소셜 로그인, 세션 유지 및 로그아웃 기능을 구현했습니다. 브라우저 저장소(localStorage)에는 비밀번호를 저장하지 않습니다.

Apple 로그인은 현재 준비 중입니다.

### 2. 지도 기반 카페 탐색 및 경로 미리보기

지도 페이지에서 카페의 위치를 확인할 수 있으며, 출발지와 목적지를 기준으로 이동 경로를 미리 확인할 수 있도록 구성했습니다.

GPS 위치를 사용할 수 없는 경우에는 기본 출발지를 명확하게 구분하여 표시하도록 처리했습니다.

### 3. 모바일 최적화 UX

모바일 브라우저에서 입력 시 화면이 자동으로 확대되는 현상을 방지하고, 모바일 화면 크기에 맞춰 주요 인터랙션과 레이아웃을 조정했습니다.

### 4. Gemini API 기반 무드 추천 & Fallback

사용자가 선택한 무드 태그와 텍스트 설명을 기반으로 Vercel Serverless Functions (`api/gemini.ts`)를 거쳐 Gemini API 추천 결과를 받아옵니다.

API Key는 서버 환경변수(`GEMINI_API_KEY`)로 관리하여 브라우저에 직접 노출되지 않도록 구성했습니다.

네트워크 또는 API 호출에 실패하더라도 fallback 추천 데이터를 제공해 앱 이용이 중단되지 않도록 처리했습니다.

## 🧭 사용자 플로우

```mermaid
flowchart LR
    A["앱 실행"] --> B["Firebase / Google 로그인"]
    B --> C["무드 선택 화면"]
    C --> D["카페 추천 및 탐색"]
    D --> E["카페 상세 화면"]
    E --> F["지도 위치 확인"]
