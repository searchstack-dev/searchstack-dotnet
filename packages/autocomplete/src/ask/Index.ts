import AutocompleteOptions from '../AutocompleteOptions.js';
import AskOptions from './AskOptions.js';
import AskOverlay from './AskOverlay.js';
import AskKeyboard from './AskKeyboard.js';
import attachLauncher from './AskLauncher.js';
import escapeHtml from '../core/escapeHtml.js';
import { standDown as standDownMobile } from '../mobile/Index.js';

let overlay: AskOverlay | undefined;
let hotkeyBound = false;
let hotkeyTextbox: HTMLInputElement | undefined;
const keyboards: AskKeyboard[] = [];

/**
 * Adds Ask to an input that already has typeahead.
 *
 * Deliberately a *composition* over `attachList` rather than a variant of it.
 * Typing keeps working exactly as before — same suggestions, same direct call to
 * the search API, same Enter behaviour — and Ask arrives as an extra way out of
 * the box: a row pinned beneath the suggestions, or Cmd-K.
 *
 * That split matters beyond tidiness. Search is fast and free; an answer costs a
 * model call and a second or two. Making the reader opt into the expensive path
 * keeps the cheap one honest, and lets a deployment run search-only simply by
 * not calling this.
 */
export const attach = (
    listElement: HTMLElement,
    textbox: HTMLInputElement,
    askOptions: AskOptions,
): void => {

    overlay = overlay ?? new AskOverlay(askOptions);
    textbox.setAttribute('data-searchstack-ask', '');

    /* mousedown, not click: the suggestion list hides on blur, and a click event
       would arrive after the row it was aimed at had already been removed */
    listElement.addEventListener('mousedown', e => {
        const row = (e.target as HTMLElement)?.closest('.searchstack-ask-row');
        if (!row) { return; }

        e.preventDefault();
        e.stopPropagation();
        open(textbox);
    });

    /* The row has to be reachable by keyboard too — it sits in the list's footer,
       which is deliberately outside the shared arrow-key navigation. */
    keyboards.push(new AskKeyboard(listElement, textbox, askOptions, () => open(textbox)));

    /* A page normally attaches to more than one input — the docs site has a
       desktop box and a mobile bar, both present in the DOM with CSS hiding one.
       The hotkey is on `document`, so binding it per attachment would fire once
       per input: two overlay opens, two answers, twice the spend, and a rate
       limit tripped by a single keypress. Bind it once, and point it at whichever
       textbox is actually visible when it fires. */
    hotkeyTextbox = hotkeyTextbox ?? textbox;

    if (askOptions.ask_hotkey && !hotkeyBound) {
        hotkeyBound = true;
        document.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                standDownMobile();
                overlay?.open(visibleValue());
            }
        });
    }
}

/**
 * Opens the overlay with whatever is in the textbox — after clearing the screen of
 * anything else claiming it.
 *
 * On a small screen the suggestions are not a dropdown but a full-screen modal, and
 * the Ask row that opens this dialog is *inside* it. Left up, it covers the dialog
 * completely — the answer streams behind an opaque panel — and it still holds the
 * question, because its own input is the one the reader typed into. So it has to go
 * first, and the question has to be read afterwards, once it has handed the text back.
 */
const open = (textbox: HTMLInputElement) => {
    standDownMobile();
    overlay?.open(textbox.value.trim());
}

/**
 * The value of whichever attached textbox the reader can actually see, so Cmd-K
 * carries over what they had already typed regardless of viewport.
 */
const visibleValue = (): string => {
    const boxes = document.querySelectorAll<HTMLInputElement>('input[data-searchstack-ask]');
    for (const box of Array.from(boxes)) {
        if (box.offsetParent !== null && box.value.trim()) { return box.value.trim(); }
    }
    return hotkeyTextbox?.value.trim() ?? '';
}

/**
 * Builds the footer that pins the "Ask this" row beneath the suggestions,
 * preserving any footer the caller already supplied.
 */
export const askRowFooter = (
    askOptions: AskOptions,
    existing: ((elements: HTMLElement[]) => string) | undefined,
    textbox: () => string,
) => (elements: HTMLElement[]): string => {

    const query = textbox().trim();
    const label = escapeHtml(askOptions.ask_row_label);
    const shown = query.length > 24 ? query.slice(0, 24) + '…' : query;

    /* role=option, not button: it is the last stop in the same list the arrow keys
       walk, and a screen reader should hear it as one more choice rather than as a
       control that appeared from nowhere. */
    const row = `<div class="searchstack-ask-row" role="option" aria-selected="false" tabindex="-1">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 4.5 16.8L21 21l-1.2-4.5A9 9 0 0 0 12 3z"/>
             <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.5"/><path d="M12 16.5h.01"/></svg>
        <span>${label}</span>
        <span class="searchstack-ask-row-query">${escapeHtml(shown)}</span>
        <span class="searchstack-ask-row-key">⏎</span>
    </div>`;

    return (existing ? existing(elements) : '') + row;
}

/** Wires an element that has no search box of its own to open the Ask overlay. */
export const launcher = (element: HTMLElement, askOptions: AskOptions): void => {
    overlay = overlay ?? new AskOverlay(askOptions);
    attachLauncher(element, question => {
        /* A launcher's question comes from the launcher itself, so nothing is lost by
           reading it first — but a modal left open would still bury the dialog. */
        standDownMobile();
        overlay?.open(question);
    }, askOptions);
}

/** Closes and forgets the overlay. */
export const destroy = () => {
    overlay?.destroy();
    overlay = undefined;
    hotkeyBound = false;
    hotkeyTextbox = undefined;
    keyboards.splice(0).forEach(k => k.destroy());
}

export { AskOptions };
export type { AutocompleteOptions };
