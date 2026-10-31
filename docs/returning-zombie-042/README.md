# Returning zombie dialogue — 0.42

2026-11-01. User asked for an in-character explanation for this beauty-only guest leaving without Yacha, and more direct teasing choices.

All six departure groups now ask whether there will be Yacha, followed by two branch-specific replies. Employment: social status and fear of performance review. Lottery: a full heart and trusting the bank balance over fists. Existing door-side mutters and hair-damage punchlines remain last. No actual battle choice or battle state was introduced.

Four teasing options and their replies are synchronized between the visible button and dialogue sheet. Agree choices, scoring, rewards and art remain unchanged.

## New teasing replies

- employedSuccess: 신입인데 허세는 벌써 회장님이네요. → 크흠. 포부가 직급보다 좀 클 수도 있죠.
- employedFail: 신입인데 벌써 퇴사 직전 얼굴이네요. → 으어…! 아직 수습도 안 끝났거든요?
- lotterySuccess: 부자 냄새요? 그냥 운 좋은 백수 같은데요. → 백수라니요. 평생 휴가 중인 겁니다.
- lotteryFail: 돈으로 취향까지 살 수는 없나 봐요. → ……지금 이 취향, 여기서 만들어주신 거잖아요.

## Verification

22 focused dialogue/data checks passed; build succeeded. Focused Chromium tests inject a completed beauty-result message to exercise the actual result choices, existing departure animation, no-Yacha lines and closing. They do not claim a full manual beauty run. Public pipeline also retains the existing four-branch pointer-input regression gate.

Focused Chromium result: all four result choices, no-Yacha lines, original last lines and day-three closing passed. No gameplay change beyond dialogue/version data.
