# 몬스타그램 이미지 연결 · 2026-11-08

기존 일차별 게시글에 제공 그림을 연결하고 실험실에서 게시글/프로필 이미지를 고를 수 있도록 했다. AI는 연결·검증을 보조했으며 원화는 제공 파일을 사용했다.

- 손님 게시물 6장, 일반 게시물 11장, 프로필 11장: 원본 PNG 바이트 그대로 등록. asset-verification.json에 SHA-256 기록.
- 일반 게시글 11개에 10종 연결(마왕 찌라시 두 게시글은 같은 이미지). 홍보 포스터 T_Monstagram_3.png는 선택 목록에만 둠.
- 손님 후기 6종은 기존 손질 머리 합성과 위치를 유지. 좀비·샌즈·부하 프로필과 재등장 좀비 공용 프로필 연결. 렉카 게시글은 제공 렉카 프로필 사용.
- 기존 사용자 이미지 설정을 불러올 때 기본값으로 덮어쓰지 않음. 빗자루 음주비행 게시글의 비활성 설정 유지.
- 기존 본문·댓글·노출 조건·게임 보상 변경 없음. Excel 및 Unity 계약 변경 없음.

## 확인

관련 단위 검사 25개 통과. Chromium에서 28장 이미지 디코딩, 0~3일차 실제 실험실 핸드폰 미리보기, 후기 합성 레이어와 프로필, 두 선택 목록, 비활성 게시글 숨김 및 시험 기록 격리를 확인했다. 미리보기는 기본 머리를 사용하며 사용자 실제 플레이 결과 캡처가 아니다. 실제 손질 머리 전달 보존은 단위 검사로 별도 확인했다. 전체 게임 수동 완주·Unity 실행 검증은 아니다.

## 일반 게시글 연결

- world-day0-1 → T_Monstagram_smallroad.png
- world-day0-3 → T_Monstagram_vampire.png
- world-day0-4 → T_Monstagram_snagmyeongbohum.png
- world-day1-1 → T_Monstagram_hell.png
- world-day1-3 → T_Monstagram_blood.png
- world-day1-4 → T_Monstagram_1.png
- world-day2-1 → T_Monstagram_manyeo.png
- world-day2-2 → T_Monstagram_wakbbu.png
- world-day3-1 → T_Monstagram_maunjagol.png
- world-day3-3 → T_Monstagram_1.png
- world-day3-4 → T_Monstagram_2.png
