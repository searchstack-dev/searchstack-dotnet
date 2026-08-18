import AskOptions from './AskOptions.js';
import { typingIn } from '../mobile/Index.js';

const ROW = '.searchstack-ask-row';
const FOCUSED = 'searchstack-ask-row-focused';
const ITEMS = '.searchstack-list-item, .searchstack-history-item,'
    + ' .searchstack-mobile-list-item, .searchstack-mobile-history-item';

/**
 * Makes the "Ask this" row a real keyboard destination.
 *
 * The row lives in the suggestion list's FOOTER, and the list puts its footer
 * outside the scrolling container precisely so it is never part of keyboard
 * navigation — which is right for the history header it was built for, and
 * wrong for a row that is an action. Arrowing to the bottom of the suggestions
 * simply stopped, and the only way to reach Ask was the mouse or Cmd-K.
 *
 * Rather than fork the shared List/ItemContainer navigation (used by the mobile
 * modal too, where none of this applies), this intercepts the keys at the
 * document in CAPTURE phase. Capture reaches us before the textbox's own
 * handler, which is what lets Enter open an answer instead of dispatching the
 * search that would navigate to the top match.
 *
 * Two ways in, and they compose:
 *   - ArrowDown past the last suggestion moves onto the row.
 *   - A query ending in "?" pre-selects it, so Enter answers straight away.
 * Arrowing into the suggestions always wins over the question mark, because an
 * explicit move should beat an inferred default.
 */
export default class AskKeyboard {

    private active = false;
    private observer: MutationObserver | undefined;

    constructor(
        private readonly listElement: HTMLElement,
        private readonly textbox: HTMLInputElement,
        private readonly options: AskOptions,
        /* Takes no question: the caller reads the textbox when it opens, because on a
           small screen the text lives in the full-screen modal until that stands down. */
        private readonly open: () => void,
    ) {
        document.addEventListener('keydown', this.handleKeyDown, true);

        // Arrowing back out of the suggestions returns focus to the box without
        // re-rendering the list, so the question-mark default has to be re-applied on
        // the way back. Listened for on the document rather than on the textbox because
        // which box is live changes with the viewport — see box().
        document.addEventListener('focusin', this.syncQuestionMark);

        // The list is rebuilt on every keystroke, so the row is a new element each
        // time and any highlight on the old one is gone with it. Re-apply on render.
        this.observer = new MutationObserver(() => this.syncQuestionMark());
        this.observer.observe(listElement, { childList: true, subtree: true });
    }

    public destroy = () => {
        document.removeEventListener('keydown', this.handleKeyDown, true);
        document.removeEventListener('focusin', this.syncQuestionMark);
        this.observer?.disconnect();
        this.observer = undefined;
    }

    private row = () => this.listElement.querySelector<HTMLElement>(ROW);

    private items = () => Array.from(this.listElement.querySelectorAll<HTMLElement>(ITEMS));

    /**
     * The box the reader is typing in.
     *
     * On a small screen the suggestions are a full-screen modal with an input of its
     * own, and the page textbox is left behind — not focused, not typed into, and not
     * updated until the modal closes. Watching only the page textbox meant neither the
     * "?" default nor Enter ever fired there, and Enter fell through to the modal's own
     * handler, which searches: the reader was navigated to the top match instead of
     * being given an answer.
     */
    private box = () => typingIn(this.listElement) ?? this.textbox;

    /** True when this key event belongs to our textbox or our suggestion list. */
    private ours = (target: EventTarget | null) =>
        target === this.box()
        || (target instanceof Node && this.listElement.contains(target));

    private select = (on: boolean, focus = false) => {
        this.active = on;

        const row = this.row();
        if (!row) { return; }

        row.classList.toggle(FOCUSED, on);
        row.setAttribute('aria-selected', String(on));

        if (on && focus) {
            // The list keeps its own highlight on whichever item was last selected, and
            // it only clears that when a NEW index is set. Moving focus out of the list
            // entirely never triggers that, so without this the last suggestion and the
            // ask row both look selected and the reader cannot tell what Enter will do.
            this.clearListHighlight();
            row.tabIndex = -1;
            row.focus({ preventScroll: false });
        }
    }

    /**
     * Removes whatever "focused" class the list is using. Matched by substring rather
     * than hard-coded, because focusedClassName is configurable and this module has no
     * handle on the List instance to read it from.
     */
    private clearListHighlight = () => {
        for (const item of this.items()) {
            for (const name of Array.from(item.classList)) {
                if (name.includes('focused')) { item.classList.remove(name); }
            }
        }
    }

    /** Applies (or clears) the question-mark default without stealing focus. */
    private syncQuestionMark = () => {
        if (!this.options.ask_on_question_mark) { return; }

        const box = this.box();

        // Only while the reader is still typing. Once they have arrowed into the
        // suggestions, focus is in the list and the default no longer applies.
        if (document.activeElement !== box) { return; }

        this.select(box.value.trim().endsWith('?'));
    }

    private handleKeyDown = (e: KeyboardEvent) => {

        if (!this.ours(e.target)) { return; }

        const row = this.row();
        if (!row) {
            this.active = false;
            return;
        }

        const items = this.items();
        const onLastItem = items.length > 0 && document.activeElement === items[items.length - 1];

        // Being SELECTED and being FOCUSED are different states, and conflating them
        // breaks the box: a trailing "?" selects the row while the reader is still
        // typing, and if that also swallowed ArrowDown they could never reach the
        // suggestions at all. Only trap the arrows when focus is genuinely on the row.
        const onRow = document.activeElement === row;

        switch (e.key) {

            case 'ArrowDown':
                if (onRow) {
                    // Nothing below the row.
                    e.preventDefault();
                    e.stopPropagation();
                } else if (onLastItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.select(true, true);
                } else if (document.activeElement === this.box()) {
                    // Heading into the suggestions — an explicit move beats the
                    // question-mark default, so drop it and let the list handle this.
                    this.select(false);
                }
                break;

            case 'ArrowUp':
                if (onRow) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.select(false);
                    if (items.length > 0) {
                        items[items.length - 1].focus();
                    } else {
                        this.box().focus();
                    }
                }
                break;

            case 'Enter':
                if (this.active) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.select(false);
                    this.open();
                }
                break;

            case 'Escape':
                this.select(false);
                break;

            default:
                // Any other key means more typing, so re-evaluate on the next render.
                // The list has not been rebuilt yet, so defer past this event.
                if (document.activeElement === this.box()) {
                    window.setTimeout(this.syncQuestionMark, 0);
                }
                break;
        }
    }
}
