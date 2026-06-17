# Player Migration Notes

## Overview

The monolithic `HlsVideoPlayer.tsx` (~1980 lines) has been refactored into a modular architecture under `frontend/app/features/player/`.

`HlsVideoPlayer` remains as a **thin backward-compatible wrapper** around `PlayerShell`.

## Breaking Changes

| Before | After |
|--------|-------|
| All state inside `HlsVideoPlayer` | Zustand store (`playerStore.ts`) + `PlayerController` FSM |
| No episode navigation in player | `seriesContext` + `onEpisodeSelect` props |
| GraphQL watchEpisode without next/prev | Watch page fetches `next_episode`, `prev_episode` |
| No loading recovery | Watchdog (8s) + exponential backoff retry (max 3) |
| No subtitle delay | Subtitle delay slider ±10s in subtitle menu |

## New Props (HlsVideoPlayer / PlayerShell)

```tsx
<HlsVideoPlayer
  src="..."
  seriesContext={seriesContext}      // optional — enables episode drawer
  onEpisodeSelect={(s, e) => ...}   // required for series navigation
  dubbedAudioUrl="..."               // external dubbed audio sync
  skipRanges={{ introStart, introEnd, recapEnd }}  // skip buttons
/>
```

## Architecture

```
features/player/
  core/          PlayerController, HLSEngine, FSM, sync engines
  store/         Zustand playerStore
  hooks/         usePlayer, usePlayerKeyboard, usePlayerGestures
  components/    PlayerShell, ControlBar, EpisodeNavigator, ...
```

## Preferences (localStorage)

Key: `cinema.player.preferences.v1`

Persists: quality level, audio track, subtitle track, playback rate, subtitle delay.

## API Updates Recommended

For full skip intro/recap support, expose in GraphQL/REST:

```json
{
  "playback": {
    "intro_start": 0,
    "intro_end": 90,
    "recap_end": 120
  }
}
```

Map to `skipRanges` when building `media` prop.

## Performance

- Player code-split via `dynamic()` with skeleton loader
- Fixed `aspect-video` container prevents CLS
- Zustand selectors minimize re-renders
- Prefetch next episode manifest when < 2 min remaining

## Tests

```bash
cd frontend && npm test
```

Covers: FSM transitions, SubtitleEngine parsing, AudioSyncManager resync, MediaResolver URLs.
