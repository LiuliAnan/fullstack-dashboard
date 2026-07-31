'use client';

import { useState, useRef } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;
    return cache;
  });

  // 跟踪已注入的样式，避免流式渲染时重复注入导致 hydration 不匹配
  const inserted = useRef<Set<string>>(new Set());

  useServerInsertedHTML(() => {
    const newNames = Object.keys(cache.inserted).filter(
      (name) => !inserted.current.has(name),
    );
    if (newNames.length === 0) return null;
    newNames.forEach((name) => inserted.current.add(name));
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${newNames.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: newNames.map((name) => cache.inserted[name]).join(' '),
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}