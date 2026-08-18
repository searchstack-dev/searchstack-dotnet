import AskOptions from './AskOptions.js';
import AskStream, { AskCitation, AskDone, AskSource } from './AskStream.js';
import askStyles from './AskStyles.js';
import escapeHtml from '../core/escapeHtml.js';

/**
 * The Ask surface: a centred overlay holding a streamed, cited answer over the
 * retrieved sections.
 *
 * It is an overlay rather than an extension of the suggestion dropdown because a
 * dropdown is sized for truncated one-line rows and an answer is prose. Widening
 * the dropdown to fit paragraphs would degrade the typeahead, which is the fast
 * path and must stay fast.
 */
export default class AskOverlay {

    private readonly backdrop = document.createElement('DIV');
    private readonly card = document.createElement('DIV');
    private readonly input = document.createElement('INPUT') as HTMLInputElement;
    private readonly body = document.createElement('DIV');
    private readonly status = document.createElement('DIV');
    private readonly answer = document.createElement('DIV');
    private readonly sections = document.createElement('DIV');
    private readonly foot = document.createElement('DIV');
    private readonly stream = new AskStream();

    private sources: AskSource[] = [];
    private text = '';
    private question = '';
    private streaming = false;
    private returnFocusTo: HTMLElement | undefined;
    private autoTimer: ReturnType<typeof setTimeout> | undefined;
    private lastAsked = '';

    constructor(private readonly options: AskOptions) {
        this.injectStyle();
        this.build();
    }

    /** Opens the overlay and immediately asks, when a question is supplied. */
    public open = (question: string) => {

        this.returnFocusTo = document.activeElement as HTMLElement;
        this.backdrop.style.display = 'flex';
        /* next frame, so the transition has a start state to animate from */
        requestAnimationFrame(() => this.backdrop.classList.add('searchstack-ask-open'));

        this.input.value = question;
        document.addEventListener('keydown', this.handleKeydown, true);

        if (question.trim()) {
            this.ask(question.trim());
        } else {
            this.reset();
            this.input.focus();
        }
    }

    public close = () => {
        this.stream.cancel();
        this.cancelAuto();
        this.streaming = false;
        this.backdrop.classList.remove('searchstack-ask-open');
        document.removeEventListener('keydown', this.handleKeydown, true);

        window.setTimeout(() => { this.backdrop.style.display = 'none'; }, 140);

        /* returning focus to whatever opened the overlay is what makes it usable
           by keyboard at all — without it, focus falls back to <body> and the
           reader has to tab from the top of the page again */
        this.returnFocusTo?.focus();
        this.returnFocusTo = undefined;
    }

    public destroy = () => {
        this.stream.cancel();
        this.cancelAuto();
        document.removeEventListener('keydown', this.handleKeydown, true);
        this.backdrop.remove();
    }

    // ---- asking ---------------------------------------------------------------

    /**
     * Queues an auto-answer once the reader stops typing, if what they have typed
     * ends in a question mark.
     *
     * Two guards, both about not spending money the reader did not ask us to
     * spend: the debounce means a sentence is only answered once it is finished,
     * and lastAsked means editing a question and returning to the same wording
     * does not answer it twice.
     */
    private scheduleAuto = () => {

        this.cancelAuto();
        if (!this.options.ask_on_question_mark) { return; }

        const question = this.input.value.trim();
        if (!question.endsWith('?') || question === this.lastAsked) { return; }

        this.autoTimer = setTimeout(() => {
            const settled = this.input.value.trim();
            if (settled.endsWith('?') && settled !== this.lastAsked) {
                this.ask(settled);
            }
        }, this.options.ask_auto_delay);
    }

    private cancelAuto = () => {
        clearTimeout(this.autoTimer);
        this.autoTimer = undefined;
    }

    private ask = (question: string) => {

        this.lastAsked = question;
        this.question = question;
        this.reset();
        this.streaming = true;
        this.status.style.display = 'flex';
        this.input.blur();

        this.stream.run(this.options.ask_endpoint, question, {
            onSources: sources => {
                /* paint the retrieved sections before the model has produced a
                   token, so the panel is never blank while it thinks */
                this.sources = sources;
                this.renderSections(sources, []);
            },
            onDelta: text => {
                this.text += text;
                this.renderAnswer();
            },
            onDone: done => {
                this.streaming = false;
                this.status.style.display = 'none';
                this.renderAnswer();
                this.finish(done);
            },
            onError: kind => {
                this.streaming = false;
                this.status.style.display = 'none';
                this.text = kind === 'rate'
                    ? 'That is a lot of questions in a short time — try again in a minute.'
                    : this.options.ask_error_label;
                this.renderAnswer();
            },
        });
    }

    private finish = (done: AskDone) => {
        this.renderSections(this.sources, done.citations);
        if (this.options.ask_feedback) {
            this.renderFeedback();
        }
    }

    private reset = () => {
        this.text = '';
        this.answer.innerHTML = '';
        this.sections.innerHTML = '';
        this.foot.innerHTML = '';
        this.foot.style.display = 'none';
        this.status.style.display = 'none';
        this.sources = [];
    }

    // ---- rendering ------------------------------------------------------------

    /**
     * Renders the answer text, turning `[^n]` into a real link to that section.
     *
     * The markers are safe to trust here: the server strips any that do not
     * resolve to a retrieved source, and does so incrementally, so an invented
     * one never arrives in the first place.
     */
    private renderAnswer = () => {

        const byMarker = new Map(this.sources.map(s => [s.marker, s]));
        const paragraphs = this.clean(this.text).split(/\n\s*\n/).filter(p => p.trim().length > 0);

        const html = paragraphs.map((paragraph, index) => {
            const heading = /^(#{1,6})\s+(.*)$/.exec(paragraph.trim());
            const body = heading ? heading[2] : paragraph;

            const withCites = this.inline(escapeHtml(body)).replace(/\[\^(\d{1,3})\]/g, (whole, digits) => {
                const source = byMarker.get(parseInt(digits, 10));
                if (!source) { return ''; }
                return `<a class="searchstack-ask-cite" href="${escapeHtml(this.link(source.url))}"`
                    + ` title="${escapeHtml(source.title)}">${digits}</a>`;
            });

            /* the caret belongs at the end of the text being written, not on a
               line of its own underneath it — otherwise it reads as a stray mark
               rather than as "still typing" */
            const last = index === paragraphs.length - 1;
            const caret = last && this.streaming ? '<span class="searchstack-ask-caret"></span>' : '';

            return heading
                ? `<div class="searchstack-ask-h">${withCites}${caret}</div>`
                : `<p>${withCites.replace(/\n/g, '<br>')}${caret}</p>`;
        }).join('');

        this.answer.innerHTML = html
            || (this.streaming ? '<p><span class="searchstack-ask-caret"></span></p>' : '');
    }

    /**
     * Removes the two habits that make a model's prose look broken in a compact
     * panel: a trailing list of footnote definitions (`[^1]: …`), which is what
     * markdown expects `[^n]` to be paired with, and stray horizontal rules.
     *
     * The system prompt already asks for neither. This is here because a prompt
     * is a request, not a guarantee, and the rendering must not depend on the
     * model having complied.
     */
    private clean = (text: string) => text
        .replace(/^\s*\[\^\d{1,3}\]:.*$/gm, '')
        .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    /** Minimal inline markdown — bold and code, the only two that show up in practice. */
    private inline = (escaped: string) => escaped
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    private renderSections = (sources: AskSource[], citations: AskCitation[]) => {

        const blocks: string[] = [];

        if (citations.length > 0) {
            blocks.push(this.sourceBlock(this.options.ask_sources_label, citations));
        }

        /* the full retrieved set is shown even on a refusal — a refusal over a
           blank panel reads as a broken feature, and these sections are usually
           still what the reader wanted */
        const uncited = sources.filter(s => !citations.some(c => c.marker === s.marker));
        if (uncited.length > 0) {
            /* "Answered from" would be a lie when nothing was answered, so an
               uncited block is always labelled as merely related */
            blocks.push(this.sourceBlock(this.options.ask_results_label, uncited));
        }

        this.sections.innerHTML = blocks.join('');
    }

    private sourceBlock = (label: string, items: { marker: number, title: string, page: string, url: string }[]) => {

        const rows = items.map(item => {
            const parts = String(item.title).split('—');
            const heading = (parts.length > 1 ? parts.slice(1).join('—') : parts[0]).trim();
            const crumb = parts.length > 1 ? parts[0].trim() : item.page;

            return `<a class="searchstack-ask-source" href="${escapeHtml(this.link(item.url))}">
                <span class="searchstack-ask-source-marker">${item.marker}</span>
                <span class="searchstack-ask-source-text">
                    <span class="searchstack-ask-source-title">${escapeHtml(heading)}</span>
                    <span class="searchstack-ask-source-crumb">${escapeHtml(crumb)}</span>
                </span>
            </a>`;
        }).join('');

        return `<div class="searchstack-ask-section">
            <div class="searchstack-ask-label">${escapeHtml(label)}</div>${rows}
        </div>`;
    }

    private renderFeedback = () => {

        this.foot.style.display = 'flex';
        this.foot.innerHTML = `<span>Did this answer help?</span>
            <button class="searchstack-ask-rate" data-rate="up" aria-pressed="false" aria-label="Yes, this helped">Yes</button>
            <button class="searchstack-ask-rate" data-rate="down" aria-pressed="false" aria-label="No, this did not help">No</button>
            <span class="searchstack-ask-spacer"></span>`;

        this.foot.querySelectorAll('.searchstack-ask-rate').forEach(button => {
            button.addEventListener('click', () => {
                const rating = (button as HTMLElement).dataset.rate as 'up' | 'down';
                this.foot.querySelectorAll('.searchstack-ask-rate')
                    .forEach(b => b.setAttribute('aria-pressed', String(b === button)));
                this.options.ask_rated?.(rating, this.question);
            });
        });
    }

    private link = (url: string) => this.options.ask_link ? this.options.ask_link(url) : url;

    // ---- shell ----------------------------------------------------------------

    private build = () => {

        this.backdrop.className = 'searchstack-ask-backdrop';
        this.backdrop.style.display = 'none';
        this.backdrop.addEventListener('mousedown', e => {
            if (e.target === this.backdrop) { this.close(); }
        });

        this.card.className = 'searchstack-ask-card';
        this.card.setAttribute('role', 'dialog');
        this.card.setAttribute('aria-modal', 'true');
        this.card.setAttribute('aria-label', 'Ask the documentation');

        const head = document.createElement('DIV');
        head.className = 'searchstack-ask-head';
        head.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.2-3.2"/></svg>`;

        this.input.className = 'searchstack-ask-input';
        this.input.type = 'text';
        this.input.setAttribute('aria-label', 'Ask a question');
        this.input.placeholder = this.options.ask_placeholder;
        this.input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && this.input.value.trim()) {
                e.preventDefault();
                this.cancelAuto();
                this.ask(this.input.value.trim());
            }
        });

        /* A trailing "?" starts the answer without Enter — the reader has already
           said they are asking. Debounced and de-duplicated, because each fire is a
           paid model call. */
        this.input.addEventListener('input', this.scheduleAuto);

        const close = document.createElement('BUTTON') as HTMLButtonElement;
        close.className = 'searchstack-ask-close';
        close.type = 'button';
        close.textContent = 'ESC';
        close.setAttribute('aria-label', 'Close');
        close.addEventListener('click', this.close);

        head.appendChild(this.input);
        head.appendChild(close);

        this.status.className = 'searchstack-ask-status';
        this.status.style.display = 'none';
        this.status.innerHTML = `<span class="searchstack-ask-dot"></span>
            <span>${escapeHtml(this.options.ask_thinking_label)}</span>`;

        /* polite, not assertive: an answer arriving must not interrupt whatever a
           screen reader is already saying. The region announces the settled text
           rather than every token. */
        this.answer.className = 'searchstack-ask-answer';
        this.answer.setAttribute('aria-live', 'polite');
        this.answer.setAttribute('aria-atomic', 'false');

        this.body.className = 'searchstack-ask-body';
        this.body.appendChild(this.status);
        this.body.appendChild(this.answer);
        this.body.appendChild(this.sections);

        this.foot.className = 'searchstack-ask-foot';
        this.foot.style.display = 'none';

        this.card.appendChild(head);
        this.card.appendChild(this.body);
        this.card.appendChild(this.foot);
        this.backdrop.appendChild(this.card);
        document.body.appendChild(this.backdrop);
    }

    private handleKeydown = (e: KeyboardEvent) => {

        if (this.backdrop.style.display === 'none') { return; }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            this.moveThroughSources(e);
            return;
        }

        if (e.key !== 'Tab') { return; }

        /* focus stays inside the dialog while it is open — tabbing out to the
           page behind an overlay strands keyboard and screen-reader users */
        const focusable = this.card.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled])');
        if (focusable.length === 0) { return; }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    /**
     * Walks the cited and related sections with the arrow keys.
     *
     * Tab already reaches them, but an answer's sources are a *list* and a list is
     * what arrow keys are for — Tab also stops at the close button and the feedback
     * buttons, so it is the wrong tool for "show me the next source". Both blocks
     * are treated as one sequence, because to the reader they are one ranked list
     * of places the answer came from.
     *
     * Enter needs no handling: each source is a real anchor, so following it is the
     * browser's job.
     */
    private moveThroughSources = (e: KeyboardEvent) => {

        const sources = Array.from(this.card.querySelectorAll<HTMLElement>('.searchstack-ask-source'));
        if (sources.length === 0) { return; }

        const current = sources.indexOf(document.activeElement as HTMLElement);
        const down = e.key === 'ArrowDown';

        // From the question box, down enters the list; up from the first goes back to
        // it, so the reader can always type again without reaching for the mouse.
        if (current === -1) {
            if (!down) { return; }
            e.preventDefault();
            sources[0].focus();
            return;
        }

        e.preventDefault();
        const next = current + (down ? 1 : -1);

        if (next < 0) {
            this.input.focus();
            this.input.select();
            return;
        }

        sources[Math.min(next, sources.length - 1)].focus();
    }

    private injectStyle = () => {
        if (document.getElementById('searchstack-ask-style')) { return; }

        const style = document.createElement('style');
        style.id = 'searchstack-ask-style';
        style.innerHTML = askStyles();
        document.head.appendChild(style);
    }
}
