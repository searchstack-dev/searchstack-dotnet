import { Options, Input, SearchStackClient, Endpoint } from '../core/Types.js';
import DesktopSuggester from "./DesktopSuggester.js";
import DesktopList from "./DesktopList.js";

export default class DesktopInput extends Input{


    private readonly suggester:DesktopSuggester;

    constructor(
    client:SearchStackClient,
    readonly options:Options,
    readonly textbox:HTMLInputElement,
    readonly list:DesktopList,
    endpoint:Endpoint){

        super(textbox,list);

        this.suggester = new DesktopSuggester(client,this,options,endpoint);

        this.addEventHandlers();
    }

    public override destroy(){

        this.suggester.destroy();
        super.destroy();
    }

    override handleFocusOut = (event: FocusEvent) =>{

        setTimeout(() => {
                if(!this.list.containsActiveElement() && this.list.getSelectedIndex() == -1 )
                {
                    this.clearList(0);
                }
            }, 50);
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
