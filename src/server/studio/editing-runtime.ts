/**
 * Returns a self-contained JS string that gets injected into preview iframes
 * when edit mode is active (?edit=1). Communicates with parent via postMessage.
 */
export function getEditingRuntimeScript(): string {
  return `
(function() {
  let editMode = false;
  let selectedEl = null;
  let hoverOverlay = null;
  let selectOverlay = null;
  let toolbar = null;
  let editing = false;
  let editingOldText = '';

  // --- Overlays ---
  function createOverlay(id, color) {
    const el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid ' + color + ';border-radius:3px;transition:all 0.1s ease;display:none;';
    document.body.appendChild(el);
    return el;
  }

  hoverOverlay = createOverlay('__edit-hover', 'rgba(59,130,246,0.5)');
  selectOverlay = createOverlay('__edit-select', '#FF6B6B');

  // --- Toolbar ---
  toolbar = document.createElement('div');
  toolbar.id = '__edit-toolbar';
  toolbar.style.cssText = 'position:fixed;z-index:100000;display:none;background:#1a1917;border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:4px;gap:2px;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:system-ui;font-size:12px;display:none;flex-direction:row;';
  toolbar.innerHTML = '<button data-action="edit-text" style="padding:4px 8px;border:none;border-radius:4px;background:transparent;color:#e8e4df;cursor:pointer;font-size:12px;">Edit Text</button>'
    + '<button data-action="delete" style="padding:4px 8px;border:none;border-radius:4px;background:transparent;color:#FF6B6B;cursor:pointer;font-size:12px;">Delete</button>'
    + '<button data-action="move-up" style="padding:4px 8px;border:none;border-radius:4px;background:transparent;color:#e8e4df;cursor:pointer;font-size:12px;">&uarr;</button>'
    + '<button data-action="move-down" style="padding:4px 8px;border:none;border-radius:4px;background:transparent;color:#e8e4df;cursor:pointer;font-size:12px;">&darr;</button>';
  document.body.appendChild(toolbar);

  toolbar.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || !selectedEl) return;
    const action = btn.dataset.action;
    if (action === 'edit-text') startTextEdit(selectedEl);
    else if (action === 'delete') sendAction('delete-element', getSignature(selectedEl));
    else if (action === 'move-up') sendAction('reorder-element', { ...getSignature(selectedEl), direction: 'up' });
    else if (action === 'move-down') sendAction('reorder-element', { ...getSignature(selectedEl), direction: 'down' });
  });

  toolbar.querySelectorAll('button').forEach(function(btn) {
    btn.addEventListener('mouseenter', function() { btn.style.background = 'rgba(255,255,255,0.1)'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = 'transparent'; });
  });

  // --- Helpers ---
  function positionOverlay(overlay, el) {
    const r = el.getBoundingClientRect();
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
    overlay.style.display = 'block';
  }

  function positionToolbar(el) {
    const r = el.getBoundingClientRect();
    toolbar.style.display = 'flex';
    toolbar.style.left = r.left + 'px';
    toolbar.style.top = Math.max(0, r.top - 36) + 'px';
  }

  function isEditable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const tag = el.tagName.toLowerCase();
    if (['html', 'head', 'script', 'style', 'meta', 'link', 'noscript'].includes(tag)) return false;
    return true;
  }

  function findBestTarget(el) {
    while (el && el.parentElement) {
      if (el.children.length > 0 && el.className && typeof el.className === 'string' && el.className.length > 0) return el;
      if (el.parentElement === document.body) return el;
      if (el.parentElement.children.length > 1) return el;
      el = el.parentElement;
    }
    return el;
  }

  function getDomPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      let tag = cur.tagName.toLowerCase();
      if (cur.id) tag += '#' + cur.id;
      else if (cur.className && typeof cur.className === 'string') {
        const cls = cur.className.trim().split(/\\s+/)[0];
        if (cls && cls.length < 40) tag += '.' + cls;
      }
      parts.unshift(tag);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  function getSignature(el) {
    if (!el) return null;
    const parent = el.parentElement;
    let nthChild = 0;
    if (parent) {
      for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i] === el) { nthChild = i; break; }
      }
    }
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      tagName: el.tagName.toLowerCase(),
      className: (typeof el.className === 'string' ? el.className : '').slice(0, 200),
      textContent: (el.textContent || '').slice(0, 100),
      directText: getTextContent(el),
      childCount: el.children.length,
      nthChild: nthChild,
      path: getDomPath(el),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      styles: {
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
        backgroundColor: cs.backgroundColor,
        padding: cs.padding,
        margin: cs.margin,
        borderRadius: cs.borderRadius,
        display: cs.display,
        width: Math.round(rect.width) + 'px',
        height: Math.round(rect.height) + 'px',
      },
    };
  }

  function getTextContent(el) {
    let text = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3) text += el.childNodes[i].textContent;
    }
    return text.trim();
  }

  function sendAction(type, data) {
    window.parent.postMessage({ type: type, ...data }, '*');
  }

  // --- Event Handlers ---
  function onMouseMove(e) {
    if (!editMode || editing) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !isEditable(el) || el === selectedEl) {
      if (!selectedEl) hoverOverlay.style.display = 'none';
      return;
    }
    if (el !== selectedEl) positionOverlay(hoverOverlay, el);
  }

  function onClick(e) {
    if (!editMode || editing) return;
    e.preventDefault();
    e.stopPropagation();
    const raw = document.elementFromPoint(e.clientX, e.clientY);
    if (!raw || !isEditable(raw)) return;
    const el = e.shiftKey ? raw : findBestTarget(raw);
    selectElement(el);
  }

  function onDblClick(e) {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || !isEditable(el)) return;
    selectElement(el);
    startTextEdit(el);
  }

  function onKeyDown(e) {
    if (!editMode) return;
    if (e.key === 'Escape') {
      if (editing) finishTextEdit(selectedEl, true);
      else deselectElement();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!editing && selectedEl) {
        e.preventDefault();
        sendAction('delete-element', getSignature(selectedEl));
      }
    }
  }

  function selectElement(el) {
    selectedEl = el;
    hoverOverlay.style.display = 'none';
    positionOverlay(selectOverlay, el);
    positionToolbar(el);
    sendAction('element-selected', {
      signature: getSignature(el),
      hasText: getTextContent(el).length > 0,
    });
  }

  function deselectElement() {
    selectedEl = null;
    selectOverlay.style.display = 'none';
    toolbar.style.display = 'none';
    sendAction('element-deselected', {});
  }

  function startTextEdit(el) {
    const text = getTextContent(el);
    if (!text) return;
    editing = true;
    editingOldText = text;
    el.contentEditable = 'true';
    el.style.outline = '2px dashed #FF6B6B';
    el.style.outlineOffset = '2px';
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    toolbar.style.display = 'none';
    selectOverlay.style.display = 'none';
    sendAction('text-edit-started', { text: text });
  }

  function finishTextEdit(el, cancelled) {
    if (!el || !editing) return;
    editing = false;
    el.contentEditable = 'false';
    el.style.outline = '';
    el.style.outlineOffset = '';
    const newText = getTextContent(el);
    if (!cancelled && newText !== editingOldText) {
      sendAction('text-edited', {
        oldText: editingOldText,
        newText: newText,
        tagName: el.tagName.toLowerCase(),
        className: (typeof el.className === 'string' ? el.className : ''),
      });
    } else if (cancelled) {
      for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3) {
          el.childNodes[i].textContent = editingOldText;
          break;
        }
      }
    }
    selectElement(el);
    sendAction('text-edit-finished', {});
  }

  document.addEventListener('focusout', function(e) {
    if (editing && selectedEl && e.target === selectedEl) {
      setTimeout(function() { finishTextEdit(selectedEl, false); }, 100);
    }
  });

  document.addEventListener('keydown', function(e) {
    if (editing && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      finishTextEdit(selectedEl, false);
    }
  }, true);

  // --- Activation ---
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('dblclick', onDblClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'edit-mode') {
      editMode = e.data.enabled;
      if (!editMode) {
        deselectElement();
        hoverOverlay.style.display = 'none';
        document.body.style.cursor = '';
      } else {
        document.body.style.cursor = 'crosshair';
      }
    }
  });

  // If loaded with edit mode already active
  editMode = true;
  document.body.style.cursor = 'crosshair';
})();
`;
}
