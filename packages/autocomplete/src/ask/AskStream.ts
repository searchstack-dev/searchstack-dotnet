/** One retrieved section, as returned by the ask endpoint. */
export interface AskSource {
    marker: number;
    title: string;
    page: string;
    url: string;
    content: string;
}

/** A source the answer actually cited. */
export interface AskCitation {
    marker: number;
    title: string;
    page: string;
    url: string;
}

export interface AskDone {
    answered: boolean;
    reason: string | null;
    citations: AskCitation[];
    cached: boolean;
}

export interface AskHandlers {
    onSources: (sources: AskSource[]) => void;
    onDelta: (text: string) => void;
    onDone: (done: AskDone) => void;
    onError: (message: string) => void;
}

/**
 * Reads the endpoint's server-sent event stream.
 *
 * Written against fetch + a reader rather than EventSource because the question
 * is posted, not put in a query string — a question is user text and has no
 * business in a URL, where it would land in access logs and referrer headers.
 */
export default class AskStream {

    private controller: AbortController | undefined;

    /** Abandons any in-flight answer. Safe to call when nothing is running. */
    public cancel = () => {
        this.controller?.abort();
        this.controller = undefined;
    }

    public run = async (endpoint: string, question: string, handlers: AskHandlers): Promise<void> => {

        this.cancel();
        const controller = new AbortController();
        this.controller = controller;

        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
                signal: controller.signal,
            });
        } catch {
            /* an aborted request is a deliberate cancellation, not a failure */
            if (!controller.signal.aborted) { handlers.onError('network'); }
            return;
        }

        if (!response.ok || !response.body) {
            handlers.onError(response.status === 429 ? 'rate' : 'server');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            for (; ;) {
                const { done, value } = await reader.read();
                if (done) { break; }

                buffer += decoder.decode(value, { stream: true });

                /* events are separated by a blank line; anything after the last
                   separator is a partial event and stays in the buffer */
                const events = buffer.split('\n\n');
                buffer = events.pop() ?? '';

                for (const event of events) {
                    this.dispatch(event, handlers);
                }
            }
        } catch {
            if (!controller.signal.aborted) { handlers.onError('network'); }
        } finally {
            this.controller = undefined;
        }
    }

    private dispatch = (event: string, handlers: AskHandlers) => {

        let name = '';
        let data = '';

        for (const line of event.split('\n')) {
            if (line.startsWith('event: ')) { name = line.slice(7).trim(); }
            else if (line.startsWith('data: ')) { data += line.slice(6); }
        }

        if (!name || !data) { return; }

        let payload: any;
        try {
            payload = JSON.parse(data);
        } catch {
            return;
        }

        switch (name) {
            case 'sources':
                handlers.onSources(payload.sources ?? []);
                break;
            case 'delta':
                handlers.onDelta(payload.text ?? '');
                break;
            case 'done':
                handlers.onDone(payload as AskDone);
                break;
            case 'error':
                handlers.onError('server');
                break;
        }
    }
}
