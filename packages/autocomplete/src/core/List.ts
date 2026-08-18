import Data from "./Data.js";
import Options from "./Options.js";
import Input from "./Input.js";
import escapeHtml from "./escapeHtml.js";


export default abstract class List{

    protected readonly list: HTMLElement = document.createElement('DIV');
    protected readonly innerDiv: HTMLElement = document.createElement('DIV');
    protected readonly style = document.createElement('style');
    private footerElement: HTMLElement | undefined;
    private historyHeaderElement: HTMLElement | undefined;
    public element:HTMLElement = this.list;
    public selectedIndex:number = -1;
    public focusedClassName = 'searchstack-list-item-focused';

    /** The combobox input this list belongs to, when the list is anchored to
     *  one (desktop). Used to keep `aria-expanded` in sync with visibility. */
    protected comboboxElement: HTMLInputElement | undefined;


    constructor(
    readonly options:Options,
    readonly instance:number)
    {

        this.list.setAttribute('role', 'listbox');

        this.list.addEventListener('keydown', this.handleKeyDown);

        this.list.appendChild(this.innerDiv);

    }


   handleKeyDown = (event: KeyboardEvent)=>{

        switch (event.key) {

            case "PageUp":
                this.handlePageUp(event);
                break;
            case "PageDown":
                this.handlePageDown(event);
                break;

        }
    };

   handlePageDown = (event: KeyboardEvent) => {
        if (this.innerDiv.children.length > 0) {
            this.setSelectedIndex(this.lastIndex());
            event.preventDefault();
        }
    }

    handlePageUp = (event: KeyboardEvent) => {
        if (this.innerDiv.children.length > 0) {
            this.setSelectedIndex(0);
            event.preventDefault();
        }
    }

    public destroy()
    {
        this.list.removeEventListener('keydown', this.handleKeyDown);
        this.list.remove();
        this.style.remove();
    }


    abstract setFocus():void

    public static setFocus(selectedIndex:number,list:List,input:Input)
    {
        if(selectedIndex > -1 && list.innerDiv.children.length > 0){

            List.removeFocusedClassName(list);

            const suggestion = list.innerDiv.children[selectedIndex] as HTMLElement;

            List.addFocusedClassName(suggestion,list);

            suggestion.focus({focusVisible: true } as FocusOptions);

            return;
        }

        input.setFocus();
    }

    public populate = (elements:HTMLElement[])=>
    {

        this.clear();

        if(elements.length > 0){
            this.show();

            this.renderHistoryHeader(elements);

            const fragment = document.createDocumentFragment();
            elements.forEach(element => fragment.appendChild(element));
            this.innerDiv.appendChild(fragment);
        }

        if(this.options.footer_template && elements.length > 0)
        {
            this.footerElement = document.createElement('DIV');
            this.footerElement.innerHTML = this.options.footer_template(elements);
            this.list.insertAdjacentElement('beforeend',this.footerElement);
        }
    }

    /** When the list is showing history results (query empty), render a small
     *  header above the rows so the user can tell the suggestions come from
     *  their recent selections. Inserted outside `innerDiv` so it is never part
     *  of keyboard navigation. */
    private renderHistoryHeader = (elements:HTMLElement[])=>
    {
        const isHistory = elements[0]?.classList.contains('searchstack-history-item');

        if(!isHistory || !this.options.history_header){
            return;
        }

        const header = document.createElement('DIV');
        header.className = 'searchstack-history-header';
        header.setAttribute('role', 'presentation');
        header.setAttribute('aria-hidden', 'true');
        header.innerHTML =
            `<svg class="searchstack-history-header-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><polyline points="12 7.5 12 12 15 13.5"></polyline></svg>`
            + `<span class="searchstack-history-header-label">${escapeHtml(this.options.history_header)}</span>`;

        this.historyHeaderElement = header;
        this.list.insertBefore(header, this.innerDiv);
    }

    public show = ()=>
    {
        if(this.options.headless){
            this.hide();
            return;
        }

        this.list.style.visibility = 'visible';
        this.comboboxElement?.setAttribute('aria-expanded', 'true');
    }

     public hide = ()=>{

        this.list.style.visibility = 'hidden';
        this.comboboxElement?.setAttribute('aria-expanded', 'false');
    }

    public resetSelectedIndex()
    {
         this.removeFocusedClassName();

         this.selectedIndex = -1;
    }

    abstract setSelectedIndex(index:number):void;

    public static setSelectedIndex(index:number,list:List,input:Input)
    {
        if(index == -1){
            list.resetSelectedIndex();
            input.setFocus();
            return;
        }

        if(index > list.lastIndex())
        {
            index = list.lastIndex();
        }

        list.selectedIndex = index;

        list.setFocus();
    }

    abstract injectStyle():void;


    public lastIndex(){

        return this.innerDiv.children.length-1;
    }

    public getSelectedIndex(){
        return this.selectedIndex;
    }

    public containsActiveElement(){
        return this.innerDiv.contains(document.activeElement);
    }


    static addFocusedClassName = (suggestion:HTMLElement,list:List)=> {

        suggestion.classList.add(list.focusedClassName);
        suggestion.setAttribute('aria-selected', 'true');
    }

    removeFocusedClassName = ()=> {

        List.removeFocusedClassName(this);
    }

    public static removeFocusedClassName = (list:List)=> {

        const suggestions = list.innerDiv.children;

        for (let i = 0; i < suggestions.length; i++) {
            suggestions[i].classList.remove(list.focusedClassName);
            suggestions[i].setAttribute('aria-selected', 'false');
        }

    }

    public clear = ()=>{
        this.innerDiv.replaceChildren();
        this.footerElement?.remove();
        this.footerElement = undefined;
        this.historyHeaderElement?.remove();
        this.historyHeaderElement = undefined;
        this.hide();
        this.resetSelectedIndex();
    };


    public dispatchSelected(query:string, data:Data)
    {
        const evt  = new Event("searchstack-selected",{bubbles:true}) as any;
        evt["query"] = query;
        evt["data"] = data;
        evt["id"] = data.id;
        this.element.dispatchEvent(evt);

        if(this.options.selected)
        {
            this.options.selected(data);
        }
    }

    public dispatchSelectedFailed(id:string,status:number, message:string){

        const evt  = new Event("searchstack-selected-failed",{bubbles:true}) as any;
        evt["status"] = status;
        evt["message"] = message;
        evt["id"] = id;
        this.element.dispatchEvent(evt);
        if(this.options.selected_failed)
        {
            this.options.selected_failed(id,status,message);
        }
    }

    public dispatchSuggestions(query:string, data:Data[]){

        const evt  = new Event("searchstack-suggestions",{bubbles:true}) as any;
        evt["query"] = query;
        evt["data"] = data;
        this.element.dispatchEvent(evt);
        if(this.options.suggested)
        {
            this.options.suggested(data);
        }
    }

    public dispatchSuggestionsFailed(query:string,status:number, message:string){

        const evt  = new Event("searchstack-suggestions-failed",{bubbles:true}) as any;
        evt["status"] = status;
        evt["message"] = message;
        evt["query"] = query;
        this.element.dispatchEvent(evt);
        if(this.options.suggested_failed)
        {
            this.options.suggested_failed(query,status,message);
        }
    }

    public dispatchSearch(query:string)
    {
        const evt  = new Event("searchstack-search",{bubbles:true}) as any;
        evt["query"] = query;
        this.element.dispatchEvent(evt);
        if(this.options.search)
        {
            this.options.search(query);
        }
    }

}
