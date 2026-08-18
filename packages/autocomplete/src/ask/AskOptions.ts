/**
 * Options for the Ask overlay.
 *
 * Everything a deployment needs to differ on is here rather than baked into the
 * component, because this widget ships twice: once on searchstack.dev's own
 * documentation, and once as the embeddable "Ask this Site" widget. Nothing in
 * `src/ask` may hard-code a hostname, our product name, or an assumption about
 * the surrounding page.
 */
export default class AskOptions {

    /**
     * Endpoint that answers a question. Receives `{ question }` and replies with
     * server-sent events: `sources`, then `delta`…, then `done` (or `error`).
     *
     * The answer goes through a backend rather than direct to the search API
     * because generation needs a model key, which must never reach the page.
     * Typeahead stays a direct browser call — that split is the whole topology.
     */
    ask_endpoint: string = '/api/docs/ask';

    /** Label on the row pinned beneath the suggestions. */
    ask_row_label: string = 'Ask this';

    /** Heading above the answer while it streams. */
    ask_thinking_label: string = 'Looking through the documentation…';

    /** Heading above the deduplicated list of cited sources. */
    ask_sources_label: string = 'Answered from';

    /** Heading above the full retrieved set. */
    ask_results_label: string = 'Related sections';

    /** Placeholder in the overlay's own question box. */
    ask_placeholder: string = 'Ask a question…';

    /** Shown when the endpoint is unreachable or errors. */
    ask_error_label: string = 'Something went wrong producing that answer.';

    /** Open the overlay on Cmd-K / Ctrl-K anywhere on the page. */
    ask_hotkey: boolean = true;

    /**
     * Treat a trailing question mark as "I am asking", in two places:
     *   - in the search box, it pre-selects the Ask row so Enter answers rather
     *     than jumping to the top match;
     *   - in the overlay, it starts the answer on its own, no Enter needed.
     *
     * Deliberately keyed on the question mark alone rather than on question
     * words. Typing "?" is an explicit act — the reader has said they are asking
     * rather than looking — whereas "how to add a reranker" is just as likely to
     * be keywords, and silently redefining Enter for it would break the muscle
     * memory of people already using the box. Arrowing into the suggestions
     * always overrides it.
     */
    ask_on_question_mark: boolean = true;

    /**
     * How long to wait after the last keystroke before an auto-started answer
     * fires, in milliseconds.
     *
     * This exists because every answer is a paid model call. Without the pause,
     * "why?" typed mid-sentence would fire before the reader had finished the
     * thought, and each further character would fire again — burning money and
     * tripping the rate limiter on a single sentence. Long enough to mean
     * "stopped typing", short enough to still feel automatic.
     */
    ask_auto_delay: number = 700;

    /** Ask the reader whether the answer helped. */
    ask_feedback: boolean = true;

    /**
     * Rewrites a citation/source link before navigation. The docs site uses this
     * to stay on the host being browsed, since records store absolute crawled
     * URLs and dev/staging are different origins.
     */
    ask_link?: (url: string) => string = undefined;

    /** Fired when the reader rates an answer. Wire it to your own telemetry. */
    ask_rated?: (rating: 'up' | 'down', question: string) => void = undefined;

    constructor(options: Partial<AskOptions> = {}) {
        Object.assign(this, options);
    }
}
