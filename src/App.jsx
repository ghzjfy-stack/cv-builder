import React from 'react';
import { Analytics } from '@vercel/analytics/react';

/**
 * Root React shell for shared UI + Vercel Web Analytics.
 * Mounted from src/main.ts alongside the vanilla studio bootstrap.
 */
export default function App() {
  return <Analytics />;
}
