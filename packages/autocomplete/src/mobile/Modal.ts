import ControlsContainer from "./ControlsContainer.js";
import MobileList from "./MobileList.js";
import {Endpoint, Options,SearchStackClient} from '../core/Types.js';

export default class Modal{
    private readonly modal: HTMLElement = document.createElement('DIV');
    private readonly style = document.createElement('style');
    public element:HTMLElement = this.modal;
    private readonly controlsContainer: ControlsContainer;
    public readonly list:MobileList;
    private isOpen = false;

    constructor(
    client:SearchStackClient,
    readonly options:Options,
    instance:number,
    readonly textbox:HTMLInputElement,
    endpoint:Endpoint
    ){

        this.modal.id = 'searchstack-mobile-' + instance;
        this.modal.className = 'searchstack-mobile';

        textbox.addEventListener('click', this.handleTextboxActivate, false);
        textbox.addEventListener('keydown', this.handleTextboxActivate, false);
        textbox.addEventListener('paste', this.handleTextboxActivate, false);

        this.list = new MobileList(client,textbox,options,instance,this,endpoint);
        this.controlsContainer = new ControlsContainer(this,this.list);

        this.modal.insertBefore(this.list.element,null);
        this.modal.insertBefore(this.controlsContainer.element,this.list.element);
       
        document.body.insertBefore(this.modal,null);

        this.injectStyle(instance);
        this.list.injectStyle();
    }

    private handleTextboxActivate = (e:Event)=>{

        if(e instanceof KeyboardEvent){

            const passThroughKeys = ['Tab','Shift','Escape','Control','Alt','Meta','CapsLock'];

            if(e.ctrlKey || e.altKey || e.metaKey || passThroughKeys.includes(e.key)){
                return;
            }
        }

        if(e.type === 'click'){
            this.open(this.textbox.value);
            return;
        }

        /* keydown/paste fire before the textbox value updates — read it next tick */
        setTimeout(() => this.open(this.textbox.value), 0);
    }

    show = ()=>{
        this.modal.style.visibility = 'visible';
        this.list.show();

    }
    open(initialValue:string|undefined){
         this.show();
         this.isOpen = true;
         document.body.classList.add('searchstack-mobile-body');
         if(initialValue){
            this.list.input.setValue(initialValue);
         }
         this.list.input.setFocus();
    }

    close(returnFocus:boolean = true){
        this.isOpen = false;
        document.body.classList.remove('searchstack-mobile-body');
        this.hide()

        const data = this.controlsContainer.input.value();
        this.textbox.value = data;

        if(returnFocus){
            this.textbox.focus();
            return;
        }

        /* Handing the screen to another surface: focusing the page textbox here would
           raise the on-screen keyboard over whatever is taking over, so let go of focus
           instead and leave it to the new surface to place. */
        this.controlsContainer.input.textbox.blur();
    }

    /**
     * Gets the modal off the screen so another full-screen surface — the Ask dialog —
     * can have it, handing back whatever was typed.
     *
     * The modal is `position:fixed` at z-index 9999 and locks body scroll, so anything
     * opened while it is up is simply invisible behind it. It also *owns the question*:
     * the reader types into the modal's own input, and the page textbox only catches up
     * when the modal closes. Standing down therefore has to happen before the question
     * is read, not just before the dialog is painted.
     */
    public standDown = ()=>{
        if(!this.isOpen){ return; }
        this.close(false);
    }

    /**
     * The box the reader is actually typing in, when this modal is up and the given
     * list is the one it is showing.
     *
     * The modal replaces the page textbox with its own input for as long as it is
     * open, so anything watching keystrokes on the page textbox — the Ask row's "?"
     * default and its Enter — sees nothing at all on a small screen. Asking through
     * the modal keeps that knowledge here rather than teaching Ask about the mobile
     * DOM, and the list check keeps one attachment's modal from answering for
     * another's.
     */
    public typingIn = (listElement:HTMLElement):HTMLInputElement|undefined =>
        this.isOpen && this.modal.contains(listElement)
            ? this.list.input.textbox
            : undefined;
    hide = ()=>{
        this.modal.style.visibility = 'hidden';
        this.list.hide();
    }

    private  injectStyle(instance:number)
    {
        this.style.appendChild(document.createTextNode(this.iconCss(instance)));
        this.style.appendChild(document.createTextNode(this.listItemCss(instance)));
        this.style.appendChild(document.createTextNode(this.bodyCss(instance)));
        this.style.appendChild(document.createTextNode(this.modualCss(instance)));
        this.style.appendChild(document.createTextNode(this.controlsContainerCss(instance)));
        this.style.appendChild(document.createTextNode(this.textboxCss(instance)));
        this.modal.insertAdjacentElement("beforebegin", this.style);
    }

    protected  iconCss = (instance:number)=>{

        
        if(instance !== 0){
            return '';
        }

        const css = `

                /*icons*/
                @font-face {
                font-family: 'searchstack';
                src: url('data:application/octet-stream;base64,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') format('woff'),
                    url('data:application/octet-stream;base64,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') format('truetype');
                }`

        return css;
    }

     private listItemCss = (instance:number)=>{
    
        if(instance !== 0){
            return '';
        }
        
        const css = `
        /* List Item */
        .searchstack-mobile-list-item:hover
        {
            background-color:var(--searchstack-mobile-list-item-background-hover-color,rgba(10, 10, 10, .04)); 
            cursor: var(--searchstack-mobile-list-item-hover-cursor,pointer);
            outline:var(--searchstack-mobile-list-item-hover-outline,0);
        }


        .searchstack-mobile-list-item-focused
        {
            background-color:var(--searchstack-mobile-list-item-background-focused-color,rgba(10, 10, 10, .12)); 
            outline:var(--searchstack-mobile-list-item-focused-outline,0);
        }`;

        return css;
    }       


    private  modualCss = (instance:number)=>{
        
         if(instance !== 0){
            return '';
        }
     
        const css = `
        /* Modal */

        .searchstack-mobile{
            display: flex;
            flex-direction: column;
            visibility:hidden;
            position: fixed; 
            z-index: var(--searchstack-mobile-z-index,9999);  
            left: 0;
            top: 0;
            width: 100%; 
            height: 100%; 
            overflow: clip;
            background-color: var(--searchstack-mobile-background-color,#fefefe); 
        }

        .searchstack-mobile-list{
            margin: 0;
            height: 100%;
            overflow-x: clip;
            overflow-y: scroll;
            margin-bottom:var(--searchstack-mobile-margin-bottom,10px); 
            margin-top:var(--searchstack-mobile-margin-top,0);
            margin-right:var(--searchstack-mobile-margin-right,0);
            margin-left:var(--searchstack-mobile-margin-left,0);
        }

        .searchstack-mobile-list-item,
        .searchstack-mobile-history-item
        {
            padding:0;
            padding-top: var(--searchstack-mobile-list-item-padding-top,5px); 
            padding-bottom: var(--searchstack-mobile-list-item-padding-bottom,5px); 
            padding-right: var(--searchstack-mobile-list-item-padding-right,5px); 
            padding-left: var(--searchstack-mobile-list-item-padding-left,5px); 
  
            
        }

        .searchstack-mobile-history-item
        {
            color: grey;
        }

        .searchstack-history-header
        {
            display:flex;
            align-items:center;
            gap:8px;
            padding:var(--searchstack-mobile-history-header-padding,10px 12px 8px 12px);
            font-size:var(--searchstack-mobile-history-header-font-size,0.8em);
            color:var(--searchstack-mobile-history-header-color,grey);
            text-transform:var(--searchstack-mobile-history-header-text-transform,uppercase);
            letter-spacing:var(--searchstack-mobile-history-header-letter-spacing,0.04em);
            user-select:none;
        }

        .searchstack-history-header-icon
        {
            opacity:0.75;
            flex:0 0 auto;
        }`;

        return css;
    }
    private  bodyCss = (instance:number)=>{
        
         if(instance !== 0){
            return '';
        }
        
        const css = `
        /* Body*/
        .searchstack-mobile-body{
            overflow-y: hidden;
        }`;

        return css;
    }

    private controlsContainerCss = (instance:number)=>{

          if(instance !== 0){
            return '';
        }

        const css = `
        /* Mobile controls container */
        .searchstack-mobile-controls-container
        {
            border-bottom: 1px solid #f1f1f1;
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top:0;
            left: 0;
            background-color: #fff;
        }

        .searchstack-mobile-controls-container-col
        {
            align-self: stretch;
            align-content:center;
        }

        .searchstack-mobile-controls-container-col-1
        {
            width: 3rem;
            text-align: center;
        }

        .searchstack-mobile-controls-container-col-2
        {
            width: 100%;
        }

        .searchstack-mobile-controls-container-col-3
        {
            text-align: center;
            width: 3rem;
        }

    
    .searchstack-mobile-controls-icon 
    {
        font-size: 1.2rem;
        line-height: 1.2rem; 
        font-family: 'searchstack';
        font-style: normal;
        font-weight: normal;
        speak: never;
        display: inline-block;
        text-decoration: inherit;
        width: 1em;
        margin-right: .2em;
        text-align: center;
        font-variant: normal;
        text-transform: none;
        margin-left: .2em;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    /* mobile buttons*/

     .searchstack-mobile-button
    {
        background: none;
        border: none;
        
    }

    .searchstack-mobile-back-icon:before { 
        content: '\\e801'; 
    }
   
    /* mobile back button*/
    .searchstack-mobile-clear-icon:before { 
        content: '\\e800'; 
    }
    .searchstack-mobile-clear-button
    {
        background: none;
        border: none;
        
    } `;

    return css;

    }

    textboxCss = (instance:number)=>{

        if(instance !== 0){
            return '';
        }

        const css = `
        /* mobile textbox */
        .searchstack-mobile-input
        {
            width: 100%;
            font-size: 1.2rem;
            line-height: 1.2rem; 
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .searchstack-mobile-input,
        .searchstack-mobile-input:focus
        {
            border: 0; 
            outline: none;
        }
        `;

        return css;
    };

    public destroy()
    {
        this.textbox.removeEventListener('click', this.handleTextboxActivate, false);
        this.textbox.removeEventListener('keydown', this.handleTextboxActivate, false);
        this.textbox.removeEventListener('paste', this.handleTextboxActivate, false);

        document.body.classList.remove('searchstack-mobile-body');

        this.controlsContainer.destroy();
        this.list.destroy();

        this.modal.remove();
        this.style.remove();
    }
}