import { Endpoint, List, Options, SearchStackClient } from '../core/Types.js';
import MobileInput from "./MobileInput.js";
import Modal from "./Modal.js";


export default class MobileList extends List{

    public readonly input:MobileInput;
    public override focusedClassName = 'searchstack-mobile-list-item-focused';

    constructor(
     client:SearchStackClient,
     readonly textbox:HTMLInputElement,
     readonly options:Options,
     readonly instance:number,
     modal:Modal,
     endpoint:Endpoint)
    {

        super(options,instance);

        this.list.id = 'searchstack-mobile-list-' + instance;

        this.input = new MobileInput(client,options,this,modal,endpoint);

        this.list.classList.add('searchstack-mobile-list');

        this.innerDiv.classList.add('searchstack-mobile-scroll');

        if(options.list_style)
        {
            this.list.setAttribute('style', options.list_style);
        }

    }


    override setSelectedIndex(index:number)
    {
        List.setSelectedIndex(index,this,this.input);
    }


    override setFocus = (): void => {
        List.setFocus(this.selectedIndex,this,this.input);
    }

    override injectStyle()
    {

        this.list.insertAdjacentElement("beforebegin", this.style);
    }

    public destroy()
    {
        this.input.destroy();
        super.destroy();
    }

}
