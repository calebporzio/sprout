// Replace the whole file with the new implementation
(function () {
    // ---------------------------------------------
    // Utility helpers
    // ---------------------------------------------

    function dataGet(obj, path) {
        if (path === "_" || path === "" || obj == null) return obj;
        return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
    }

    function stripBraces(str) {
        str = str.trim();
        if (str.startsWith("{") && str.endsWith("}")) {
            return str.slice(1, -1).trim();
        }
        return str.trim();
    }

    function evaluate(expr, ctx) {
        expr = stripBraces(expr);
        if (expr === "_") return ctx._;
        return dataGet(ctx, expr);
    }

    const isJsDom = () => {
        if (typeof navigator === 'undefined') return false;
        return /jsdom/i.test(navigator.userAgent);
    };

    // ---------------------------------------------
    // Public entry
    // ---------------------------------------------

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('template[is="🌱"]').forEach(init);
    });

    // ---------------------------------------------
    // Core pipeline: init → ingest → render → observe
    // ---------------------------------------------

    function init(tpl) {
        const doRender = () => {
            const raw = tpl.getAttribute("data-json") || "null";
            if (raw === tpl._lastJson) return; // no-op optimization
            tpl._lastJson = raw;
            const data = JSON.parse(raw);
            render(tpl, data);
        };

        // first paint
        doRender();

        // watch for future changes so we can re-render
        new MutationObserver((muts) => {
            if (muts.some((m) => m.type === "attributes" && m.attributeName === "data-json")) {
                doRender();
            }
        }).observe(tpl, { attributes: true, attributeFilter: ["data-json"] });
    }

    // ---------------------------------------------
    // Rendering
    // ---------------------------------------------

    function render(tpl, data) {
        // book-end comments so we know where our stuff lives
        if (!tpl._startMarker) {
            tpl._startMarker = document.createComment("🌱start");
            tpl._endMarker = document.createComment("🌱end");
            tpl.after(tpl._endMarker);
            tpl.after(tpl._startMarker);
        }

        // wipe previous render (fast bulk delete in real browsers)
        cleanupRange(tpl._startMarker, tpl._endMarker);

        const frag = document.createDocumentFragment();
        tpl.content.childNodes.forEach((child) => {
            hydrateNode(child, frag, { _: data });
        });

        tpl._endMarker.before(frag);
    }

    function cleanupRange(start, end) {
        if (!isJsDom()) {
            const range = document.createRange();
            range.setStartAfter(start);
            range.setEndBefore(end);
            range.deleteContents();
        } else {
            let node = start.nextSibling;
            while (node && node !== end) {
                const next = node.nextSibling;
                node.remove();
                node = next;
            }
        }
    }

    // ---------------------------------------------
    // Hydration (recursively turn template nodes → real DOM)
    // ---------------------------------------------

    function hydrateNode(node, parent, ctx) {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                return hydrateText(node, parent, ctx);
            case Node.ELEMENT_NODE:
                if (node.nodeName === "TEMPLATE") {
                    return hydrateTemplate(node, parent, ctx);
                } else {
                    return hydrateElement(node, parent, ctx);
                }
            default:
                // clone any other node types as-is
                parent.append(node.cloneNode(true));
        }
    }

    function hydrateText(node, parent, ctx) {
        const raw = node.textContent;
        const trimmed = raw.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            const val = evaluate(trimmed, ctx);
            parent.append(document.createTextNode(val != null ? String(val) : ""));
        } else {
            parent.append(document.createTextNode(raw));
        }
    }

    function hydrateElement(node, parent, ctx) {
        const el = node.cloneNode(false); // shallow clone

        // attributes
        Array.from(node.attributes).forEach(({ name, value }) => {
            const trimmed = value.trim();
            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                const val = evaluate(trimmed, ctx);
                el.setAttribute(name, val != null ? String(val) : "");
            } else {
                el.setAttribute(name, value);
            }
        });

        // recurse into children
        node.childNodes.forEach((child) => hydrateNode(child, el, ctx));
        parent.append(el);
    }

    function hydrateTemplate(tpl, parent, ctx) {
        // conditionals → if
        if (tpl.hasAttribute("data-if")) {
            const condition = tpl.getAttribute("data-if");
            if (evaluate(condition, ctx)) {
                tpl.content.childNodes.forEach((c) => hydrateNode(c, parent, ctx));
            }
            return;
        }

        // conditionals → unless
        if (tpl.hasAttribute("data-unless")) {
            const condition = tpl.getAttribute("data-unless");
            if (!evaluate(condition, ctx)) {
                tpl.content.childNodes.forEach((c) => hydrateNode(c, parent, ctx));
            }
            return;
        }

        // loops
        if (tpl.hasAttribute("data-for")) {
            hydrateForLoop(tpl, parent, ctx);
            return;
        }

        // bare template → just inline its content
        tpl.content.childNodes.forEach((c) => hydrateNode(c, parent, ctx));
    }

    // -------------------------------------------------
    // Keyed loop hydration & diffing
    // -------------------------------------------------

    function hydrateForLoop(tpl, parent, ctx) {
        const expr = stripBraces(tpl.getAttribute("data-for")); // e.g. "user in _"
        const [, itemName, listExpr] = expr.match(/^(\w+)\s+in\s+(.+)$/) || [];
        const list = evaluate(listExpr, ctx) || [];

        // Prepare key expression, default to loop index if not provided
        const keyAttr = tpl.getAttribute("data-key") || "";

        // Create or reuse sentinel markers to delimit the loop region
        if (!tpl._loopStart) {
            tpl._loopStart = document.createComment("loop-start");
            tpl._loopEnd = document.createComment("loop-end");
        }
        // Ensure markers are attached to current parent (they may have been detached by cleanup)
        if (tpl._loopStart.parentNode !== parent) {
            parent.append(tpl._loopStart);
            parent.append(tpl._loopEnd);
        }

        // Internal cache mapping keys → {node, snapshot}
        if (!tpl._keyMap) tpl._keyMap = new Map();
        const keyMap = tpl._keyMap;

        // Track which keys we saw this pass
        const seenKeys = new Set();

        // Helper to evaluate key for current item
        const getKey = (childCtx, item, idx) => {
            if (!keyAttr) {
                // Heuristic: use item's `id` if present, else fallback to index
                if (item && typeof item === 'object' && 'id' in item) return item.id;
                return idx;
            }
            const raw = keyAttr.trim();
            if (raw.startsWith("{") && raw.endsWith("}")) {
                return evaluate(raw, childCtx);
            }
            return evaluate(`{${raw}}`, childCtx); // allow plain path without braces
        };

        // Render / move items in order
        list.forEach((item, idx) => {
            const childCtx = { ...ctx, [itemName]: item, _: item };
            const key = getKey(childCtx, item, idx);
            seenKeys.add(key);

            let entry = keyMap.get(key);
            let rootNode = entry ? entry.node : null;

            if (!rootNode) {
                // New item → create DOM
                const frag = document.createDocumentFragment();
                tpl.content.childNodes.forEach((c) => hydrateNode(c, frag, childCtx));

                // Prefer the first element node as the root. Fallback to the very first node.
                rootNode = Array.from(frag.childNodes).find(n => n.nodeType === Node.ELEMENT_NODE) || frag.firstChild;
                const snapshot = JSON.stringify(item);
                keyMap.set(key, { node: rootNode, snapshot });

                parent.insertBefore(frag, tpl._loopEnd);
            } else {
                // Existing item → move to correct position (before loopEnd keeps order)
                parent.insertBefore(rootNode, tpl._loopEnd);

                const newSnapshot = JSON.stringify(item);
                if (entry.snapshot !== newSnapshot) {
                    // Content actually changed → re-render subtree
                    while (rootNode.firstChild) rootNode.firstChild.remove();
                    tpl.content.childNodes.forEach((c) => hydrateNode(c, rootNode, childCtx));
                    entry.snapshot = newSnapshot;
                }
            }
        });

        // Remove any stale items not seen in this pass
        keyMap.forEach((entry, key) => {
            if (!seenKeys.has(key)) {
                entry.node.remove();
                keyMap.delete(key);
            }
        });
    }
})();
