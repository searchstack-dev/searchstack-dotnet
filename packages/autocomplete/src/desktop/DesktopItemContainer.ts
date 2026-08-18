import { Data, Options, Input, ItemContainer } from '../core/Types.js';


export default class DesktopItemContainer extends ItemContainer{

    constructor(
    input:Input,
    readonly data:Data,
    readonly options:Options,
    index:number)
    {
        super(input,index);

        if(options.template){
            this.container.innerHTML = options.template(data);
        }

        this.container.classList.add('searchstack-list-item');

        if(options.list_item_style)
        {
            this.container.setAttribute('style', options.list_item_style);
        }

        this.container.addEventListener('click', this.handleClick);

    }

    override handleEnterKey =  (e: KeyboardEvent)=> {

        e.preventDefault();
        this.dataSelected(this.data);
        this.input.repopulate = false;
        this.input.setFocus();
    }

    public destroy = ()=>{

        this.container.removeEventListener('click',this.handleClick);
        super.destroy();
    }

    override handleClick =  (e: Event)=> {
        this.dataSelected(this.data);
        this.input.repopulate = false;
        this.input.setFocus();
    }

}
