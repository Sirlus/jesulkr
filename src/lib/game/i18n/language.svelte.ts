// ============================================================
// Reactive language signal (Svelte 5 $state)
// ============================================================
// Using $state on an object so we can export it across modules
// without reassigning the export itself — only its property.
// This ensures Svelte's reactive proxy tracks all reads/writes.

export const lang = $state({ current: 'ko' as 'ko' | 'en', selected: false });