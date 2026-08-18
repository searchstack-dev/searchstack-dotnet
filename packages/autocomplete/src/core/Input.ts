import List from "./List.js";
import Data from "./Data.js";
import Suggester from "./Suggester.js";



export default abstract class Input{

    private blurTimer: ReturnType<typeof setTimeout> | undefined;
    public repopulate = true;


    constructor(
    readonly textbox:HTMLInputElement,
    readonly list:List)
    {
        this.textbox.setAttribute('aria-expanded', 'false');
        this.textbox.setAttribute('autocomplete', 'off');
        this.textbox.setAttribute('aria-autocomplete', 'list');
        this.textbox.setAttribute('role', 'combobox');
    }

   addEventHandlers = ()=>{
        this.textbox.addEventListener('paste', this.handlePaste);
        this.textbox.addEventListener('keydown', this.handleKeyDown);
        this.textbox.addEventListener('keyup', this.handleKeyUp);
        this.textbox.addEventListener('focus', this.handleFocus);
        this.textbox.addEventListener('focusout',this.handleFocusOut);
    }

    public destroy(){

        clearTimeout(this.blurTimer);

        this.textbox.removeAttribute('aria-expanded');
        this.textbox.removeAttribute('autocomplete');
        this.textbox.removeAttribute('aria-autocomplete');
        this.textbox.removeAttribute('role');
        this.textbox.removeAttribute('aria-owns');

        this.textbox.removeEventListener('paste',this.handlePaste);
        this.textbox.removeEventListener('keydown', this.handleKeyDown);
        this.textbox.removeEventListener('keyup', this.handleKeyUp);
        this.textbox.removeEventListener('focus', this.handleFocus);
        this.textbox.removeEventListener('focusout',this.handleFocusOut);
    }

    abstract handleFocusOut (event: FocusEvent):void;

    abstract handleKeyUp  (event: KeyboardEvent):Promise<void>;


    public static handleKeyUp = async (event: KeyboardEvent,suggester:Suggester,list:List)=>
    {
        const isBackSpaceOrDelete = event.key === 'Backspace' || event.key === 'Delete';
        if(isBackSpaceOrDelete)
        {
            const elements = await suggester.suggestions(false);
            if(elements){
                list.populate(elements);
            }
        }
    };

    public value = ()=>{
        return this.textbox.value;
    }


    public clear = ()=>{
        this.textbox.value = '';
        this.populateList();
    }

    public clearList(delay:number = 100){
        clearTimeout(this.blurTimer);
            this.blurTimer = setTimeout(() => {
                this.list.clear();
            }, delay);
    }

    abstract handlePaste(event:ClipboardEvent):Promise<void>;

    public static handlePaste = async (event:ClipboardEvent,suggester:Suggester,list:List) =>
    {
        const elements = await suggester.suggestions(false);
        if(elements){
            list.populate(elements);
        }
    }

    abstract populateList():Promise<void>;

    public static populateList = async (suggester:Suggester,list:List, container?:HTMLElement)=>
    {
        const elements = await suggester.suggestions(false);
        if(elements){
            list.populate(elements);
        }
    }

    public handleKeyDown = (event: KeyboardEvent)=>{

        switch (event.key) {

            case "ArrowDown":
                this.handleDownKey(event);
                break;
            case "PageDown":
                this.handlePageDown(event);
                break;
            case "Escape":
                this.handleBlur(event);
                break;
            case "Enter":
                this.handleEnterKey(event);
                break;
            default:
                this.handleKeyDownDefault(event);
                break;
        }
    };

    handlePageDown = (event: KeyboardEvent) => {
        if (this.list && this.list.lastIndex() >= 0) {
            this.list.setSelectedIndex(this.list.lastIndex());
            event.preventDefault();
        }
    }

    handleBlur = (event: KeyboardEvent) => {

        this.clearList();
    }

    abstract handleDownKey(event: KeyboardEvent):Promise<void>;

    public static handleDownKey = async (event: KeyboardEvent, list:List, suggester:Suggester) => {

        event.preventDefault();

        if(list.lastIndex() < 0)
        {
            const elements = await suggester.suggestions(true);
            if(elements){
                list.populate(elements);
            }
        }

        list.setSelectedIndex(0);
    }

    abstract handleFocus(event:FocusEvent):Promise<void>;

    public static handleFocus =  async (event:FocusEvent,list:List, suggester:Suggester,input:Input) => {

        list.resetSelectedIndex();

        if(input.repopulate)
        {
            const elements = await suggester.suggestions(true);
            if(elements){
                list.populate(elements);
            }
        }
        else{
            input.repopulate = true;
        }
    };

    private handleEnterKey = (event: KeyboardEvent) =>
    {
        this.dispatchSearch(this.textbox.value);

        event.preventDefault();
    }

    abstract handleKeyDownDefault(event: KeyboardEvent):Promise<void>;


    public static handleKeyDownDefault = async(event: KeyboardEvent, list:List,suggester:Suggester)=>
    {
        if(Input.isPrintableKey(event)){
            const elements = await suggester.suggestions(event.key === ' ');
            if(elements){
                list.populate(elements);
            }
        }
    }

    private static isPrintableKey =  (event: KeyboardEvent)=>
    {
        return (event.key.length === 1 || event.key === 'Unidentified') ;
    }

    public setFocus(){
        this.textbox.focus();
    }

    public setValue = (value:string)=>{
        this.textbox.value = value;
    }

    public dispatchSelected(data:Data)
    {
        this.list.dispatchSelected(this.textbox.value,data);

    }

    public dispatchSelectedFailed(id:string,status:number, message:string){

        this.list.dispatchSelectedFailed(id,status,message);
    }

    public dispatchSearch(query:string)
    {
        this.list.dispatchSearch(query);
    }
}
