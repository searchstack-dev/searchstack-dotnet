import { Endpoint, Input, Options, SearchStackClient } from '../core/Types.js';
import MobileList from "./MobileList.js";
import Modal from "./Modal.js";
import MobileSuggester from './MobileSuggester.js';

export default class MobileInput extends Input{

    private readonly suggester:MobileSuggester;

    constructor(
    client: SearchStackClient,
    readonly options:Options,
    readonly list:MobileList,
    modal:Modal,
    endpoint:Endpoint
    ){

        const textbox = document.createElement('INPUT') as HTMLInputElement;

        textbox.className = "searchstack-mobile-input";

        super(textbox,list);

        this.suggester = new MobileSuggester(client,this,options,modal,endpoint);

        this.addEventHandlers();
    }

    public override destroy(){

        this.suggester.destroy();
        super.destroy();
    }

    override handleFocusOut = (event: FocusEvent) =>{



    }


    override handleKeyUp = async (event: KeyboardEvent)=>
    {
       await Input.handleKeyUp(event,this.suggester,this.list);
    };


    override handlePaste = async (event:ClipboardEvent) =>
    {
        await Input.handlePaste(event,this.suggester,this.list);
    }

    override handleDownKey = async(event: KeyboardEvent) => {
        await Input.handleDownKey(event,this.list,this.suggester);
    }

    override handleKeyDownDefault = async(event: KeyboardEvent)=>
    {
        await Input.handleKeyDownDefault(event,this.list,this.suggester);
    }

    override populateList = async() => {
        await Input.populateList(this.suggester,this.list);
    }

    override handleFocus = async (event: FocusEvent)=> {
        await Input.handleFocus(event,this.list,this.suggester,this);
    }

}
