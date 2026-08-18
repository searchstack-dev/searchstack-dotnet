import { Data, ItemContainer, Options } from "../core/Types.js";
import MobileInput from "./MobileInput.js";
import Modal from "./Modal.js";



export default class MobileItemContainer extends ItemContainer{

    constructor(
    input:MobileInput,
    readonly data:Data,
    readonly options:Options,
    index:number,
    readonly modal:Modal)
    {
        super(input,index);

        const templateFunc = options.template;

        this.container.innerHTML = templateFunc(data);

        this.container.classList.add('searchstack-mobile-list-item');

        if(options.list_item_style)
        {
            this.container.setAttribute('style', options.list_item_style);
        }

        this.container.addEventListener('click', this.handleClick);

    }

    override handleEnterKey = (e: KeyboardEvent)=> {

        e.preventDefault();
        this.dataSelected(this.data);
        this.modal.close();

    }

    public destroy = ()=>{

        this.container.removeEventListener('click',this.handleClick);
        super.destroy();
    }

    override handleClick = (e: Event)=> {

        this.dataSelected(this.data);
        this.modal.close();
    }

}
