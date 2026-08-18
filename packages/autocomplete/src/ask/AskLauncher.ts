import AskOptions from './AskOptions.js';

/**
 * Turns any element into a way to open the Ask overlay — a button, a link, or a
 * bar styled to look like a search box.
 *
 * Separate from `attachAsk` because the two answer different needs. `attachAsk`
 * upgrades a working search box that already has typeahead; a launcher is for
 * places with no search box at all — a home page, a footer, a help menu — where
 * the point is simply "you can ask this site something".
 *
 * A launcher deliberately does NOT fetch suggestions. It has nothing to suggest
 * into, and a page that only wants an answer should not pay for a search index
 * round-trip on every keystroke.
 *
 * Two shapes, and the element decides which:
 *
 * A **`<button>`** opens on click or Enter/Space. Use it when the element is
 * really a doorway — a footer link, a help menu entry.
 *
 * An **`<input>`** is a real field the reader types into, and it opens on Enter
 * or on a trailing `?`, **carrying what they typed into the overlay**. That
 * hand-off is the whole point: a field you can type into but whose text is
 * thrown away when the dialog opens is a trap, and it is the only reason to
 * prefer a button over a box on a page where typing is the obvious gesture.
 *
 * Neither opens on focus. Someone tabbing through the page would have a modal
 * spring open unbidden — disorienting for a sighted keyboard user and worse for
 * a screen-reader one. Focus is how you *reach* a control, not how you
 * *activate* it.
 */
export const attachLauncher = (
    element: HTMLElement,
    open: (question: string) => void,
    options: AskOptions,
): void => {

    /**
     * The question this element opens with: an input's value, or a preset in
     * `data-ask-question`. The preset is what turns a launcher into an example
     * question — "what does it cost?" as a button that answers itself — which is
     * far more persuasive on a landing page than an empty box the visitor has to
     * think of something to type into.
     */
    const value = () =>
        element.dataset.askQuestion?.trim()
        || (element as HTMLInputElement).value?.trim()
        || '';

    if (element instanceof HTMLInputElement) {

        /* No click handler here, deliberately. Clicking into a field is how you start
           typing in it — if that opened the overlay, the box could never be typed in
           at all, which is the whole reason it is a box and not a button. */
        let timer: ReturnType<typeof setTimeout> | undefined;
        const cancel = () => { clearTimeout(timer); timer = undefined; };

        element.addEventListener('keydown', e => {
            if (e.key !== 'Enter') { return; }
            e.preventDefault();
            cancel();
            open(value());
        });

        if (options.ask_on_question_mark) {
            element.addEventListener('input', () => {
                cancel();
                if (!element.value.trim().endsWith('?')) { return; }

                /* Wait for the reader to stop typing before taking the page over. A "?"
                   can land mid-sentence — "what?" on the way to "what does it cost?" —
                   and opening a modal on that keystroke would interrupt the very
                   question it is meant to answer. */
                timer = setTimeout(() => {
                    if (element.value.trim().endsWith('?')) { open(value()); }
                }, options.ask_auto_delay);
            });
        }

        return;
    }

    element.addEventListener('click', e => {
        e.preventDefault();
        open(value());
    });

    /* A non-button element given a button's job still needs a button's keyboard
       contract, or it is unreachable without a mouse. */
    if (element.tagName !== 'BUTTON' && element.tagName !== 'A') {
        element.setAttribute('role', 'button');
        if (!element.hasAttribute('tabindex')) { element.tabIndex = 0; }

        element.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(value());
            }
        });
    }

    if (!element.hasAttribute('aria-label') && !element.textContent?.trim()) {
        element.setAttribute('aria-label', options.ask_placeholder);
    }
}

export default attachLauncher;
