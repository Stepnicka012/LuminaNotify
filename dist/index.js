const PILL_H = 38;
const TOAST_W = 360;
const DEFAULT_DUR = 6000;
const EXIT_DUR = 500;
const DEFAULT_ROUND = 19;
const BLUR_RATIO = 0.45;
const GOO_OVERLAP = 10;
const PILL_PAD = 24; // Padding más ajustado para la cápsula
const HEADER_EXIT = 420;
const AP_EXPAND = 400;
const AP_COLLAPSE = 4500;
const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    loading: `<svg class="ln-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    action: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
};
let _ctr = 0;
const uid = () => `ln-${++_ctr}-${Date.now().toString(36)}`;
const store = {
    toasts: [],
    listeners: new Set(),
    position: 'top-right',
    emit() { for (const fn of this.listeners)
        fn(this.toasts); },
    set(fn) { this.toasts = fn(this.toasts); this.emit(); },
};
function buildItem(o, id, fp) {
    return {
        id,
        instanceId: uid(),
        title: o.title,
        description: o.description,
        state: o.state,
        position: o.position ?? fp ?? store.position,
        duration: o.duration !== undefined ? o.duration : DEFAULT_DUR,
        icon: o.icon,
        fill: o.fill,
        roundness: o.roundness,
        button: o.button,
        autopilot: o.autopilot,
    };
}
function createToast(o) {
    const id = o.id ?? uid();
    const prev = store.toasts.find(t => t.id === id && !t.exiting);
    const item = buildItem(o, id, prev?.position);
    store.set(prev
        ? p => p.map(t => t.id === id ? item : t)
        : p => [...p.filter(t => t.id !== id), item]);
    return id;
}
function updateToast(id, o) {
    const ex = store.toasts.find(t => t.id === id);
    if (!ex)
        return;
    store.set(p => p.map(t => t.id === id ? buildItem({ ...o, id }, id, ex.position) : t));
}
function dismissToast(id) {
    const it = store.toasts.find(t => t.id === id);
    if (!it || it.exiting)
        return;
    store.set(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => store.set(p => p.filter(t => t.id !== id)), EXIT_DUR);
}
export const lumina = {
    show: (o) => createToast(o),
    success: (o) => createToast({ ...o, state: 'success' }),
    error: (o) => createToast({ ...o, state: 'error' }),
    warning: (o) => createToast({ ...o, state: 'warning' }),
    info: (o) => createToast({ ...o, state: 'info' }),
    action: (o) => createToast({ ...o, state: 'action' }),
    loading: (o) => createToast({ ...o, state: 'loading', duration: null }),
    update: updateToast,
    dismiss: dismissToast,
    clear: (pos) => store.set(p => pos ? p.filter(t => t.position !== pos) : []),
    promise(promise, opts) {
        const id = createToast({
            ...opts.loading, state: 'loading', duration: null,
            position: opts.position, autopilot: false,
        });
        const p = typeof promise === 'function' ? promise() : promise;
        p.then(data => {
            const s = typeof opts.success === 'function' ? opts.success(data) : opts.success;
            updateToast(id, { ...s, state: 'success', id });
        }).catch(err => {
            const e = typeof opts.error === 'function' ? opts.error(err) : opts.error;
            updateToast(id, { ...e, state: 'error', id });
        });
        return p;
    },
};
const NS = 'http://www.w3.org/2000/svg';
class LuminaNotify extends HTMLElement {
    sh;
    vps;
    entries = new Map();
    hovered = false;
    _sub;
    constructor() {
        super();
        this.sh = this.attachShadow({ mode: 'open' });
        this._buildShadow();
    }
    connectedCallback() {
        this._sub = ts => this._sync(ts);
        store.listeners.add(this._sub);
    }
    disconnectedCallback() {
        store.listeners.delete(this._sub);
        for (const e of this.entries.values()) {
            e.roInner?.disconnect();
            e.roDesc?.disconnect();
        }
    }
    _buildShadow() {
        const externalLink = document.querySelector('link[data-lumina]');
        if (externalLink) {
            this.sh.appendChild(externalLink.cloneNode());
        }
        const root = document.createElement('div');
        root.id = 'ln-root';
        this.vps = new Map();
        for (const pos of [
            'top-left', 'top-center', 'top-right',
            'bottom-left', 'bottom-center', 'bottom-right',
        ]) {
            const vp = document.createElement('section');
            vp.setAttribute('data-ln-vp', pos);
            vp.setAttribute('aria-live', 'polite');
            root.appendChild(vp);
            this.vps.set(pos, vp);
        }
        this.sh.appendChild(root);
    }
    _sync(toasts) {
        const alive = new Set(toasts.map(t => t.id));
        for (const item of toasts) {
            const e = this.entries.get(item.id);
            if (!e)
                this._mount(item);
            else if (item.instanceId !== e.item.instanceId)
                this._patch(e, item);
            else if (item.exiting && !e.item.exiting) {
                e.item = item;
                this._exit(e);
            }
        }
        for (const [id, e] of this.entries) {
            if (!alive.has(id)) {
                e.roInner?.disconnect();
                e.roDesc?.disconnect();
                e.el.remove();
                this.entries.delete(id);
            }
        }
    }
    _mount(item) {
        const isBottom = item.position.startsWith('bottom');
        const edge = isBottom ? 'top' : 'bottom';
        const fill = item.fill ?? '#1c1c1e';
        const R = item.roundness ?? DEFAULT_ROUND;
        const blur = R * BLUR_RATIO;
        const fid = `lg-${item.id}`;
        const st = item.state ?? 'success';
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('data-ln-toast', '');
        el.setAttribute('data-state', st);
        el.setAttribute('data-edge', edge);
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('data-ln-canvas', '');
        svg.setAttribute('data-edge', edge);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('width', String(TOAST_W));
        svg.setAttribute('height', String(PILL_H));
        svg.setAttribute('viewBox', `0 0 ${TOAST_W} ${PILL_H}`);
        const defs = document.createElementNS(NS, 'defs');
        defs.innerHTML = `
      <filter id="${fid}" x="-20%" y="-100%" width="140%" height="300%"
              color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blur.toFixed(2)}" result="b"/>
        <feColorMatrix in="b" mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
          result="g"/>
        <feComposite in="SourceGraphic" in2="g" operator="atop"/>
      </filter>`;
        svg.appendChild(defs);
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('filter', `url(#${fid})`);
        const pillRect = document.createElementNS(NS, 'rect');
        pillRect.setAttribute('data-ln-pill', '');
        pillRect.setAttribute('fill', fill);
        pillRect.setAttribute('rx', String(R));
        pillRect.setAttribute('ry', String(R));
        pillRect.setAttribute('x', '0');
        pillRect.setAttribute('y', '0');
        pillRect.setAttribute('width', '40'); // Tamaño inicial pequeño
        pillRect.setAttribute('height', String(PILL_H));
        const bodyRect = document.createElementNS(NS, 'rect');
        bodyRect.setAttribute('data-ln-body', '');
        bodyRect.setAttribute('fill', fill);
        bodyRect.setAttribute('rx', String(R));
        bodyRect.setAttribute('ry', String(R));
        bodyRect.setAttribute('x', '0');
        bodyRect.setAttribute('y', String(PILL_H - GOO_OVERLAP));
        bodyRect.setAttribute('width', String(TOAST_W)); // Ancho fijo para el cuerpo
        bodyRect.setAttribute('height', '0');
        g.append(pillRect, bodyRect);
        svg.appendChild(g);
        el.appendChild(svg);
        const header = document.createElement('div');
        header.setAttribute('data-ln-header', '');
        header.setAttribute('data-edge', edge);
        const stack = document.createElement('div');
        stack.setAttribute('data-ln-stack', '');
        header.appendChild(stack);
        this._injectHeader(stack, item, true);
        el.appendChild(header);
        const content = document.createElement('div');
        content.setAttribute('data-ln-content', '');
        content.setAttribute('data-edge', edge);
        const hasDesc = !!(item.description || item.button);
        if (hasDesc)
            content.innerHTML = this._contentHTML(item);
        el.appendChild(content);
        const entry = {
            el, item, pillRect, bodyRect, header, content, stack,
            expanded: false, pillW: 0, contentH: 0,
            tDismiss: null, tExpand: null, tCollapse: null,
        };
        this.entries.set(item.id, entry);
        const vp = this.vps.get(item.position);
        isBottom ? vp.appendChild(el) : vp.prepend(el);
        const inner = stack.querySelector('[data-ln-inner]');
        if (inner) {
            const measure = () => {
                const innerWidth = inner.getBoundingClientRect().width;
                // La cápsula solo mide lo que su contenido necesita
                const targetW = innerWidth + PILL_PAD;
                const w = Math.min(Math.max(targetW, PILL_H), TOAST_W);
                if (Math.abs(w - entry.pillW) > 1) {
                    entry.pillW = w;
                    this._applyPillW(entry);
                }
            };
            requestAnimationFrame(measure);
            const ro = new ResizeObserver(measure);
            ro.observe(inner);
            entry.roInner = ro;
        }
        if (hasDesc) {
            const desc = content.querySelector('[data-ln-desc]');
            if (desc) {
                requestAnimationFrame(() => { entry.contentH = desc.scrollHeight; });
                const ro = new ResizeObserver(() => { entry.contentH = desc.scrollHeight; });
                ro.observe(desc);
                entry.roDesc = ro;
            }
        }
        el.addEventListener('mouseenter', () => this._onEnter(item.id));
        el.addEventListener('mouseleave', () => this._onLeave(item.id));
        el.addEventListener('click', ev => this._onClick(ev, item.id));
        this._addSwipe(el, item.id);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.setAttribute('data-ready', '');
            this._scheduleTimers(entry);
        }));
    }
    _patch(e, newItem) {
        const prev = e.item;
        e.item = newItem;
        e.el.setAttribute('data-state', newItem.state ?? 'success');
        if (newItem.fill !== prev.fill) {
            const f = newItem.fill ?? '#1c1c1e';
            e.pillRect.setAttribute('fill', f);
            e.bodyRect.setAttribute('fill', f);
        }
        this._injectHeader(e.stack, newItem, false);
        const hasDesc = !!(newItem.description || newItem.button);
        if (newItem.description !== prev.description || newItem.button !== prev.button) {
            e.roDesc?.disconnect();
            e.content.innerHTML = hasDesc ? this._contentHTML(newItem) : '';
            if (hasDesc) {
                const desc = e.content.querySelector('[data-ln-desc]');
                if (desc) {
                    requestAnimationFrame(() => { e.contentH = desc.scrollHeight; });
                    const ro = new ResizeObserver(() => { e.contentH = desc.scrollHeight; });
                    ro.observe(desc);
                    e.roDesc = ro;
                }
            }
            else {
                e.contentH = 0;
            }
        }
        this._clearTimers(e);
        if (e.expanded && (newItem.state === 'loading' || !hasDesc))
            this._collapse(e);
        this._scheduleTimers(e);
    }
    _injectHeader(stack, item, initial) {
        if (!initial) {
            const old = stack.querySelector('[data-layer="current"]');
            if (old) {
                old.setAttribute('data-layer', 'prev');
                old.setAttribute('data-exiting', 'true');
                setTimeout(() => old.remove(), HEADER_EXIT);
            }
        }
        const inner = document.createElement('div');
        inner.setAttribute('data-ln-inner', '');
        inner.setAttribute('data-layer', 'current');
        inner.innerHTML = this._badgeHTML(item) + this._titleHTML(item);
        stack.prepend(inner);
    }
    _scheduleTimers(e) {
        if (this.hovered)
            return;
        const { item } = e;
        const hasDesc = !!(item.description || item.button);
        const ap = item.autopilot;
        if (hasDesc && item.state !== 'loading' && ap !== false && ap !== undefined) {
            const cfg = typeof ap === 'object' ? ap : undefined;
            e.tExpand = window.setTimeout(() => {
                this._expand(e);
                e.tCollapse = window.setTimeout(() => this._collapse(e), cfg?.collapse ?? AP_COLLAPSE);
            }, cfg?.expand ?? AP_EXPAND);
        }
        if (item.duration && item.duration > 0) {
            e.tDismiss = window.setTimeout(() => dismissToast(item.id), item.duration);
        }
    }
    _clearTimers(e) {
        if (e.tDismiss) {
            clearTimeout(e.tDismiss);
            e.tDismiss = null;
        }
        if (e.tExpand) {
            clearTimeout(e.tExpand);
            e.tExpand = null;
        }
        if (e.tCollapse) {
            clearTimeout(e.tCollapse);
            e.tCollapse = null;
        }
    }
    _expand(e) {
        if (e.expanded)
            return;
        if (e.item.state === 'loading')
            return;
        if (!e.item.description && !e.item.button)
            return;
        e.expanded = true;
        const bodyH = Math.max(e.contentH + 24, 56);
        const totalH = PILL_H + bodyH;
        e.bodyRect.style.height = `${bodyH + GOO_OVERLAP}px`;
        e.el.style.setProperty('--h', `${totalH}px`);
        e.content.setAttribute('data-visible', '');
    }
    _collapse(e) {
        if (!e.expanded)
            return;
        e.expanded = false;
        e.bodyRect.style.height = '0px';
        e.el.style.setProperty('--h', `${PILL_H}px`);
        e.content.removeAttribute('data-visible');
        e.header.style.transform = '';
    }
    _applyPillW(e) {
        const pos = e.item.position;
        const align = pos.includes('right') ? 'right' : pos.includes('center') ? 'center' : 'left';
        // El ancho de la cápsula
        const w = e.pillW;
        let pillX = 0;
        if (align === 'right')
            pillX = TOAST_W - w;
        if (align === 'center')
            pillX = (TOAST_W - w) / 2;
        // Aplicamos X y Ancho dinámico SOLO a la cápsula
        e.pillRect.setAttribute('x', `${pillX}`);
        e.pillRect.setAttribute('width', `${w}`);
        e.header.style.left = `${pillX}px`;
        e.header.style.width = `${w}px`;
        // El contenido (descripción) siempre ocupa el ancho total de 360px
        e.content.style.left = '0px';
        e.content.style.width = `${TOAST_W}px`;
        const isBottom = pos.startsWith('bottom');
        if (isBottom) {
            e.header.style.top = 'auto';
            e.header.style.bottom = '0';
            e.content.style.top = 'auto';
            e.content.style.bottom = `${PILL_H}px`;
        }
        else {
            e.header.style.top = '0';
            e.header.style.bottom = 'auto';
            e.content.style.top = `${PILL_H}px`;
            e.content.style.bottom = 'auto';
        }
    }
    _exit(e) {
        this._clearTimers(e);
        if (e.expanded)
            this._collapse(e);
        e.el.setAttribute('data-exiting', '');
    }
    _onEnter(id) {
        this.hovered = true;
        for (const e of this.entries.values())
            this._clearTimers(e);
        const e = this.entries.get(id);
        if (e && !e.expanded)
            this._expand(e);
    }
    _onLeave(id) {
        this.hovered = false;
        const e = this.entries.get(id);
        if (e?.expanded)
            this._collapse(e);
        for (const e2 of this.entries.values()) {
            if (!e2.item.exiting)
                this._scheduleTimers(e2);
        }
    }
    _onClick(ev, id) {
        if (ev.target.closest('[data-ln-btn]'))
            return;
        const e = this.entries.get(id);
        if (!e)
            return;
        if (!e.expanded && (e.item.description || e.item.button))
            this._expand(e);
        else
            dismissToast(id);
    }
    _addSwipe(el, id) {
        let startY = null;
        el.addEventListener('pointerdown', (ev) => {
            if (ev.target.closest('[data-ln-btn]'))
                return;
            startY = ev.clientY;
            el.setPointerCapture(ev.pointerId);
        }, { passive: true });
        el.addEventListener('pointermove', (ev) => {
            if (startY === null)
                return;
            const dy = ev.clientY - startY;
            el.style.transform = `translateY(${Math.sign(dy) * Math.min(Math.abs(dy), 18)}px)`;
        }, { passive: true });
        el.addEventListener('pointerup', (ev) => {
            if (startY === null)
                return;
            const dy = ev.clientY - startY;
            el.style.transform = '';
            startY = null;
            if (Math.abs(dy) > 30)
                dismissToast(id);
        });
    }
    _badgeHTML(item) {
        const s = item.state ?? 'success';
        const icon = item.icon !== undefined ? item.icon : ICONS[s];
        if (!icon)
            return '';
        return `<span data-ln-badge data-state="${s}">${icon}</span>`;
    }
    _titleHTML(item) {
        const s = item.state ?? 'success';
        return `<span data-ln-title data-state="${s}">${item.title ?? s}</span>`;
    }
    _contentHTML(item) {
        const s = item.state ?? 'success';
        const btn = item.button
            ? `<button data-ln-btn data-state="${s}" type="button">${item.button.label}</button>`
            : '';
        return `<div data-ln-desc><p data-ln-msg>${item.description ?? ''}</p>${btn}</div>`;
    }
}
customElements.define('lumina-notify', LuminaNotify);
(function autoMount() {
    if (typeof document === 'undefined')
        return;
    const go = () => {
        if (!document.querySelector('lumina-notify'))
            document.body.appendChild(document.createElement('lumina-notify'));
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
})();
export default lumina;
