# Returning zombie 0.41 — 2026-11-01

User feedback: unrestricted face growth, shorter protests, correct crowns/glasses, approved sticker roster, tooth-focused satisfaction.

- Face growth: enable allowFace; hair remains a separate removable layer over the unchanged face artwork.
- Satisfaction weights: hair 30 → 10, teeth 30 → 60, decorations 40 → 30. Existing all-requirements success and +1100/0 provisional reward rules unchanged.
- Protests: one line per grow/cut/wrong-tooth event, 1.5–2.4 seconds.
- Crown1/2 resolve to real ST-STRONG-CROWN IDs; glasses: Movieglasses, Sunglasses, SunglassesRed. SoftHatLong is head-only.
- Source: https://app.notion.com/p/404648bf677880f5a304c62262c5a3ce . Its 38th entry repeats SoftHatLong, but the actual Notion image is the pixel black T_Sunglasses. Pink ribbon and unicorn also carry duplicated labels; mapped by item identity to RibbonPink and Unicorn. Source page unchanged.
- Main and coffee tutorial expose the same approved 43 resources (59 → 43). Original PNGs are preserved. Existing five common graphics retained with canonical resource names.

## Removed from menus

- T_hairtie_R.png
- T_hornSmall_L.png
- T_hornSmall_R.png
- T_Hurt_R.png
- T_Piercing1.png
- T_Piercing2.png
- T_screw_L.png
- T_screw_R.png
- T_skeleton.png
- T_SmallRose.png
- T_SoftHatSmall.png
- T_Sunglasses2.png
- T_Sunglasses3.png
- T_SunglassesStar.png
- T_WhiteStar.png
- T_yellowStar.png

## Verification

68 focused unit/data tests pass. Real pointer-input Chromium checks cover face/cheek/mouth/chin growth, all six head answers and all three eye answers, both branches, success/failure and closing. Browser results and deployment recorded after completion.

Chromium completed successfully: all five starts and four result branches through day-three closing. Growth screenshot uses actual pointer input; no state injection. Initial test incorrectly assumed cut-stage Undo exists; moved growth checks into failure cases and kept successful cases untouched.
