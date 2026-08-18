import AutocompleteOptions from "./AutocompleteOptions.js";
import { attach as MobileAttach, destroy as MobileDestroy, reset as MobileReset } from "./mobile/Index.js";
import { attach as DesktopAttach, destroy as DesktopDestroy, reset as DesktopReset } from "./desktop/Index.js";
import { Data, Options, Storage, escapeHtml } from "./core/Types.js";
import DesktopOptions from "./desktop/DesktopOptions.js";
import AskOptions from "./ask/AskOptions.js";
import { attach as AskAttach, askRowFooter, launcher as AskLauncher, destroy as AskDestroy } from "./ask/Index.js";


const textboxWaitTimeoutMs = 30000;

/**
 * Attaches the autocomplete to the textbox with the given id, suggesting over a
 * single List. Waits for the element to appear in the DOM if necessary, and
 * uses the full-screen mobile experience on small touch screens and the
 * anchored desktop list elsewhere.
 *
 * @param apiKey - The Search Stack API key used to authenticate requests. Sent
 * as the `X-API-Key` header. Required.
 * @param version - The List version to suggest against.
 */
export const attachList =  (
textboxId:string,
apiKey:string,
accountName:string,
listName:string,
version:number,
options: Partial<AutocompleteOptions> = {}
):Promise<HTMLElement> =>
    attachTo(textboxId,apiKey,accountName,listName,version,false,options);

/**
 * Attaches the autocomplete to the textbox with the given id, suggesting across
 * every List in a Group. Otherwise identical to {@link attachList}.
 *
 * @param apiKey - The Search Stack API key used to authenticate requests. Sent
 * as the `X-API-Key` header. Required.
 * @param version - The Group's membership version to suggest against. Pass
 * `"latest"` to always track the Group's current version, or a concrete integer
 * to pin a frozen version.
 */
export const attachGroup =  (
textboxId:string,
apiKey:string,
accountName:string,
groupName:string,
version:number | "latest",
options: Partial<AutocompleteOptions> = {}
):Promise<HTMLElement> =>
    attachTo(textboxId,apiKey,accountName,groupName,version,true,options);

/**
 * Attaches typeahead AND a grounded, cited answer panel to the same input.
 *
 * Identical to {@link attachList} in every respect — same suggestions, same
 * direct search call, same Enter behaviour — plus an "Ask this" row pinned under
 * the suggestions and a Cmd-K shortcut, either of which opens an overlay that
 * streams an answer with a link back to every section it used.
 *
 * The typeahead call goes browser → search API on the key you pass here. The
 * answer goes through `ask_endpoint` on your own backend instead, because
 * generation needs a model key and a model key must never ship in a page.
 *
 * @param apiKey - Search Stack API key for the typeahead half. Use a read-only,
 * list-scoped key: it ships in your page.
 */
export const attachAsk = async (
textboxId:string,
apiKey:string,
accountName:string,
listName:string,
version:number,
options: Partial<AutocompleteOptions & AskOptions> = {}
):Promise<HTMLElement> =>{

    const askOptions = new AskOptions(options);
    const textbox = ()=> (document.getElementById(textboxId) as HTMLInputElement)?.value ?? '';

    const listElement = await attachTo(textboxId,apiKey,accountName,listName,version,false,{
        ...options,
        footer_template: askRowFooter(askOptions, options.footer_template, textbox),
    });

    AskAttach(listElement, document.getElementById(textboxId) as HTMLInputElement, askOptions);
    return listElement;
}

/**
 * Wires an element — a button, or a bar styled to look like one — to open the Ask
 * overlay. For pages with no search box of their own: a home page, a footer, a
 * help menu.
 *
 * Unlike {@link attachAsk} this fetches no suggestions and needs no search key,
 * because there is nothing to suggest into. All it needs is `ask_endpoint`.
 */
export const attachAskLauncher = async (
elementId:string,
options: Partial<AskOptions> = {}
):Promise<HTMLElement> =>{

    const element = await waitForElement(elementId);
    AskLauncher(element, new AskOptions(options));
    return element;
}

/** Resolves once an element with this id is in the DOM, or rejects after 30s. */
const waitForElement = (elementId:string):Promise<HTMLElement> =>{

    const existing = document.getElementById(elementId);
    if(existing){
        return Promise.resolve(existing);
    }

    return new Promise((success, error) => {

        const cleanup = ()=>{
            observer.disconnect();
            clearTimeout(timeout);
        };

        const observer = new MutationObserver(()=>{
            const found = document.getElementById(elementId);
            if(found){
                cleanup();
                success(found);
            }
        });

        const timeout = setTimeout(()=>{
            cleanup();
            error(`Not found: ${elementId}`);
        }, textboxWaitTimeoutMs);

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id'],
        });
    });
}

const attachTo =  (
textboxId:string,
apiKey:string,
accountName:string,
listName:string,
version:number | "latest",
isGroup:boolean,
options: Partial<AutocompleteOptions> = {}
):Promise<HTMLElement> =>{

    if(!apiKey){
        return Promise.reject(new Error("An apiKey is required to authenticate with the Search Stack API."));
    }

    /* the explicit apiKey argument authenticates the client and takes
       precedence over any api_key supplied in options */
    const authenticatedOptions: Partial<AutocompleteOptions> = { ...options, api_key: apiKey };

    if(document.getElementById(textboxId)){
        return exec(textboxId,accountName,listName,version,isGroup,authenticatedOptions);
    }

    /* the textbox may not be in the DOM yet (script in <head>, async-rendered
       SPA, etc.). Watch for it rather than polling: the observer fires the
       moment a matching element is inserted or has its id set, and stays idle
       until then. A timeout rejects if it never appears. */
    return new Promise((success, error) => {

        const cleanup = ()=>{
            observer.disconnect();
            clearTimeout(timeout);
        };

        const observer = new MutationObserver(()=>{
            if(document.getElementById(textboxId)){
                cleanup();
                exec(textboxId,accountName,listName,version,isGroup,authenticatedOptions).then(success,error);
            }
        });

        const timeout = setTimeout(()=>{
            cleanup();
            error(`Not found: ${textboxId}`);
        }, textboxWaitTimeoutMs);

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['id'],
        });
    });
}

const exec =  (
textboxId:string,
accountName:string,
listName:string,
version:number | "latest",
isGroup:boolean,
options: Partial<AutocompleteOptions> = {}
):Promise<HTMLElement> =>{
    const fullOptions = new AutocompleteOptions(options);

    if(fullOptions.full_screen_on_mobile
    && isTouchEnabled()
    && screenWidth() <= fullOptions.mobile_max_screen_width){
        return MobileAttach(textboxId,accountName,listName,version,isGroup,fullOptions);
    }

    return DesktopAttach(textboxId,accountName,listName,version,isGroup,fullOptions);
}

/** Destroys every attached desktop list, mobile modal and ask overlay. */
export const destroy = ()=>{
    DesktopDestroy();
    MobileDestroy();
    AskDestroy();
}

/** Forgets attached instances without touching the DOM. */
export const reset = ()=>{
    DesktopReset();
    MobileReset();
}

/** Clears the stored suggestion history. */
export const clearHistory = ()=>{
    Storage.clear();
}

/** Removes a single entry from the stored suggestion history by its id. */
export const removeHistory = (key:string)=>{
    Storage.remove(key);
}

const screenWidth = ()=>{
    return (window.innerWidth > 0) ? window.innerWidth : screen.width;
};


const isTouchEnabled = ()=> {
    return ( 'ontouchstart' in window ) ||
           ( navigator.maxTouchPoints > 0 );
}


export { AutocompleteOptions, DesktopOptions, Options, AskOptions, escapeHtml };
export type { Data };
