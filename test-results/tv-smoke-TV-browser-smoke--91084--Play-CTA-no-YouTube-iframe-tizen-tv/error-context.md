# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tv-smoke.spec.ts >> TV browser smoke — unified UI (Tizen UA) >> /movies/[slug] — Play CTA, no YouTube iframe
- Location: e2e\tv-smoke.spec.ts:119:7

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:8005
Call log:
  - → GET http://localhost:8005/api/movies?per_page=1
    - user-agent: Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/56.0.2987.98 TV Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```