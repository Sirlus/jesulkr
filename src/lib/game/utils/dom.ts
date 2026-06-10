// ============================================================
// DOM helpers
// ============================================================

/** Shorthand for document.getElementById */
export function $<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** Query selector shortcut */
export function qs<T extends HTMLElement>(sel: string, parent?: ParentNode): T | null {
  return (parent || document).querySelector<T>(sel);
}

/** Query all shortcut */
export function qsa<T extends HTMLElement>(sel: string, parent?: ParentNode): T[] {
  return Array.from((parent || document).querySelectorAll<T>(sel));
}

/** Create element with optional attrs and children */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown>,
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') {
        el.className = String(v);
      } else if (k === 'dataset') {
        Object.assign(el.dataset, v as Record<string, string>);
      } else if (typeof v === 'boolean') {
        (el as any)[k] = v;
      } else if (v !== undefined && v !== null) {
        el.setAttribute(k, String(v));
      }
    }
  }
  for (const child of children) {
    el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return el;
}

/** Empty an element's children */
export function empty(el: HTMLElement): void {
  el.innerHTML = '';
}

/** Toggle a class */
export function toggleClass(el: HTMLElement, cls: string, force?: boolean): void {
  el.classList.toggle(cls, force);
}
