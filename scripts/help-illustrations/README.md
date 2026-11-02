# Асуултын тусламжийн зургуудыг үүсгэх pipeline

## Зорилго

Махбодын сорилын 12 асуулт бүр «Хэрхэн тодорхойлох вэ?» тусламжтай бөгөөд
асуулт бүрт гурван зураг (Хий / Шар / Бадган төлөв) харагдана. Эдгээр 36 зургийг
2026-11-02-нд Nano Banana Pro (Gemini image model) ашиглан нэг жигд flat
illustration загвараар үүсгэж, эзэмшигч баталсан. Аппад ордог эцсийн файлууд нь
`src/assets/help-illustrations/q{NN}-{h|s|b}.webp` (1200×800).

Батлагдсан эх PNG композитууд, 2K гурван панелтай эх зургууд болон энэ хавтасны
скриптүүдийн хуулбар repo-гоос **гадна** хадгалагддаг:
`OneDrive/IT Projects/bio-dosha-12-assets/help-illustrations/` (`final/`,
`sources/`, `jobs/`, `MANIFEST.md`). Тэдгээрийг git-д оруулахгүй.

## Урьдчилсан нөхцөл

- Repo-ийн үндсэн хавтаст `.env.local` файлд `GEMINI_API_KEY=...` байх
  (`.gitignore`-д орсон, чатаар бүү дамжуул).
- Python 3.10+ ба `pip install google-genai pillow`.
- Nano Banana skill-ийн `generate.py` скрипт. Анхдагч зам нь
  `~/.claude/skills/synced/…/nanobanana/scripts/generate.py`; өөр газар байвал
  `NANOBANANA_GENERATE` орчны хувьсагчаар заана.

## Дөрвөн алхам

1. **Үүсгэх.** `python scripts/help-illustrations/run_jobs.py jobs/<файл>.json <out-dir> --inputs <эх зургийн хавтас>`
   Job бүр `{name, prompt, ratio, size, input, kept, note}` бүтэцтэй; `input` нь
   засварлах буюу reference зураг (харьцангуй зам бол `--inputs`-аас хайна).
2. **Хуваах эсвэл угсрах.**
   - Гурван панелтай зураг: `python split_panels.py <3panel.png> <out-dir> q<N> [--cx 0.5]`
     → `q<N>-h.png`, `q<N>-s.png`, `q<N>-b.png`.
   - Суурь зураг + томруулагч inset (Q1, Q3): `python compose_inset.py <base.png> <macro-3panel.png> <out-dir> q<N> --point x,y --inset cx,cy,r`.
3. **Экспорт.** `python export_frames.py <composite-dir> src/assets/help-illustrations`
   (3:2 болгон center-crop, 1200×800, WebP q82).
4. **Шалгах.** `npm test` (`src/lib/__tests__/helpFrames.test.ts` 36 файл бүгд
   1200×800 эсэхийг, `frames.ts` бүртгэл бүрэн эсэхийг шалгана).

## Асуулт бүрийн эх сурвалж

| Q | Арга | Job файл · хадгалсан гаралт | Тэмдэглэл |
|---|------|------------------------------|-----------|
| 1 | суурь + macro inset | `q01-wrist.json` · `q1-base-V1-topdown.png` + `q1-macro-3panel.png` | `compose_inset.py … --point 640,440 --inset 640,200,178` |
| 2 | 3 панел | `batch1-q02-q06.json` · `q2-3panel.png` | `split_panels.py --cx 0.46` |
| 3 | суурь + macro inset | `retry-q03-q06.json` · `q3-base-v2.png`; `batch1-q02-q06.json` · `q3-macro-3panel.png` | `compose_inset.py … --point 590,465 --inset 520,172,155 --macro-cx 0.5 --src-r 50`; reference зурагтай эхний суурь (v1) загвараа алдсан тул текстээр дахин үүсгэсэн |
| 4 | 3 панел | `batch1-q02-q06.json` · `q4-3panel.png` | |
| 5 | 3 панел | `batch1-q02-q06.json` · `q5-3panel.png` | |
| 6 | 3 панел | `retry-q06.json` · `q6-3panel-v3.png` | v1, v2-ын доод панел бүдгэрсэн; v3-д «бүх панел адил тод» заалт нэмсэн; `--cx 0.6` |
| 7 | 3 панел | `batch2-q07-q12.json` · `q7-3panel.png` | |
| 8 | 3 панел | `batch2-q07-q12.json` · `q8-3panel.png` | |
| 9 | 3 панел | `retry-q09-q12.json` · `q9-3panel-fix.png` | `q9-3panel.png`-ийн доод панелийг засварласан |
| 10 | 3 панел | `retry-q09-q12.json` · `q10-3panel-v2.png` | |
| 11 | 3 панел | `fix-q11-q12.json` · `q11-3panel-fix2.png` | `q11-3panel-v2.png`-ийн доод панелийг засварласан |
| 12 | 3 панел | `fix-q11-q12.json` · `q12-3panel-fix.png` | `q12-3panel-v2.png`-ийн доод панелийг засварласан; `--cx 0.55` |

Нэг дүр бүх зурагт: монгол насанд хүрэгч, богино хар үстэй, цайвар саарал
футболк, хар саарал өмд. Өнгө: teal `#00626b`, amber `#fe932c`, slate `#4b596e`,
дэвсгэр `#eff3f3`. Зурган дотор текст, тоо байхгүй.

## Сургамж

- Загвар бүтэн дүр зурагт хурууны байрлалын нарийн ялгааг зурж чаддаггүй. Ийм
  асуултад нэг суурь зураг + гурван панелтай macro inset ашиглана (Q1, Q3).
- Гурван төлөвийг **нэг** зурагт давхарласан гурван панелиар зуруулбал загвар,
  дүр, камерын зай яг ижил хадгалагдана; `split_panels.py` хуваана.
- Давхарласан зургийн доод панел («тайван, амарсан» төлөв) байнга бүдгэрч
  гардаг. Засвар: тухайн зураг дээр «redraw the bottom panel crisp, keep the
  others pixel-identical» гэсэн edit pass, эсвэл prompt-д «every panel equally
  crisp, no blur, no mist» заалт нэмэх.
- Reference (style) зураг өгөх нь энгийн гарын дүр зургийг эвдэж болно; тийм
  зургийг зөвхөн текстээр үүсгэнэ.

## Нэг зураг солих

1. Тухайн асуултын job файлаас prompt-ыг аваад `run_jobs.py`-аар шинээр үүсгэнэ
   (3 панелтай бол бүгдийг, inset-тэй бол зөвхөн macro эсвэл суурийг).
2. `split_panels.py` эсвэл `compose_inset.py`-аар `q<N>-{h,s,b}.png` гаргана.
3. `export_frames.py`-аар WebP болгож `src/assets/help-illustrations/` руу
   бичнэ (зөвхөн тэр асуултын 3 файл солигдоно).
4. `npm test` ажиллуулна. Код өөрчлөх шаардлагагүй.
5. Шинэ эх файлуудыг `bio-dosha-12-assets/help-illustrations/` дотор хадгалж,
   `MANIFEST.md`-д тэмдэглэнэ.
