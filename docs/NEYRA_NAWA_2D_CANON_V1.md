# NAWA / „Sześć Tysięcy Lat Ciszy” — Neyra Senn 2D (izolowany prototyp)

**Miejsce w aplikacji:** `LivingFrame → NeyraLayer` w repozytorium `Wienio68/nawa-vs-preview`.
**Nie dodawać do:** ogólnego czytnika Will Veritas, biblioteki ani stron książek.
**Status:** PROTOTYP TECHNICZNY, nie produkcyjny kanon. Nie mergować bez odbioru właściciela.

## Wierność tożsamości
Właściciel zatwierdził Neyrę Senn z nagrań:
- `1000014081.mp4` — twarz frontalna, 1080×1920, 5,056 s, 5 035 750 B; SHA-256: `218dd905965f5d1fb88894eef637cfe25774e21ac463c272c3d0b7917c5b1c57`
- `1000014021.mp4` — ruch i mrugnięcie, 1080×1920, 5,056 s, 5 070 326 B; SHA-256: `1676e98c4b4cfcfd06afe159e64b97e7244d15b72b20210d8135615fda18087e`

W tych materiałach **nie wolno zmieniać twarzy**. Klatki są referencją tożsamości i ruchu. Nie używać modeli Meshy, Tripo ani poprzednich triptyków jako zastępstwa.

## Pliki runtime do dostarczenia
Materiały z rozmowy należy skopiować bajt w bajt jako:
- `public/assets/nawa/neyra/NEYRA_CANON_FRONT_1000014081.mp4` ← `1000014081.mp4`
- `public/assets/nawa/neyra/NEYRA_CANON_TURN_1000014021.mp4` ← `1000014021.mp4`

Przed dołączeniem zweryfikować SHA-256. **Tych filmów nie ma jeszcze na gałęzi GitHub.**
Nie umieszczać ich na produkcji bez weryfikacji praw i akceptacji właściciela.
Brak któregoś pliku pozostawia dotychczasowy bezpieczny fallback: `NEYRA_FRONT_RUNTIME.webp`, oznaczony w pakiecie v2 jako referencyjny.

## Obecna implementacja
- Neyra jest renderowana wyłącznie w `LivingFrame` w obrębie Nawy.
- `idle` i `inspect` wskazują nagranie frontalne.
- `look-at-event` i `transfer` wskazują oryginalny klip z ruchem.
- Cisza: `muted`, `playsInline`, `loop`. Nie dublować lektora.
- Bez autoplay przy `prefers-reduced-motion`, powrót do nieruchomej referencji.
- Niedostępny plik wideo nie usuwa Neyry z ekranu.
- Nie dorabiamy na obrazie imitacji sensorów ani źrenic, dopóki nie mamy prawdziwych przezroczystych warstw.

## Co NIE jest jeszcze wykonane
1. Nie rozdzielono zatwierdzonego obrazu na rzeczywiste warstwy (źrenice, powieki, usta i maski oczu).
2. Nie ma synchronizacji ust z lektorem.
3. 12 sensorów nie ma przypisanych sprawdzonych pozycji do nowego wizerunku.
4. Brak animacji dowolnego obrotu 3D — i nie jest to celem.
5. Nagrania nie zostały jeszcze umieszczone w repozytorium.

## Warunki odbioru przed produkcją
- Właściciel sprawdza na telefonie widok Neyry w Ramie Nawy.
- Twarz jest identyczna z zaakceptowanymi filmami.
- Brak zmiany scenariusza Nawy, historii, mapy, pamięci i rekordów.
- Brak ingerencji w `will-veritas-frontend`, master v0.2, GLB R4b i projekty książek.
- Jeśli użytkownik zezwoli: etap 2 tworzy maski warstw z **tego samego** zatwierdzonego portretu.
