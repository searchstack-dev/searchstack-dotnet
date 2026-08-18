import { SuggestOptions } from '@searchstack/public-api';
import Data from './Data.js';
import escapeHtml from './escapeHtml.js';


export default class Options{

    delay?:number = 200;
    minimum_characters?:number = 2;
    suggestion_options?:SuggestOptions = undefined;
    headless:boolean = false;
    template :(data:Data)=> string  = (data:Data)=>{
         return `<div>This is the default options.template..</div>
         <div>
         <div>Name : ${escapeHtml(data.name)}</div>
         <div>Any other field name: $` + `{data.your-field-name}</div>
         </div>`
    };
    footer_template?:(elements:HTMLElement[])=>string  = undefined;
    history_template?:(data:Data)=>string  = undefined;
    list_style?:string = undefined;
    list_item_style?:string = undefined;
    history_item_style?:string = undefined;
    /** Label shown in a header row above history results so the user can see the
     *  suggestions are from their recent selections. Set to an empty string to
     *  hide the header. Defaults to "Recent". */
    history_header?:string = 'Recent';
    enable_history = true;
    selected?:(data:Data)=>void = undefined;
    suggested?:(dataArray:Data[])=>void = undefined;
    search?:(query:string)=>void = undefined;
    selected_failed?:(id:string,status:number, message:string)=>void = undefined;
    suggested_failed?:(query:string,status:number, message:string)=>void = undefined;
    allow_multiple = true;
    /** API key sent as the X-API-Key header. Supply this or access_token. */
    api_key?:string|undefined = undefined;
    /** JWT access token sent as Authorization: Bearer. Supply this or api_key. */
    access_token?:string|undefined = undefined;
    base_url?:string|undefined = undefined

    constructor(options: Partial<Options> = {}) {
        Object.assign(this, options);
    }
}
