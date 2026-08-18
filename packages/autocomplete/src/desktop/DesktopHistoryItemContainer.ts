import { StoredData, Input, ItemContainer, Options } from '../core/Types.js';


export default class DesktopHistoryItemContainer extends ItemContainer{

    constructor(
     input:Input,
     readonly storedData:StoredData,
     readonly options:Options,
     index:number)
    {
        super(input,index);

        const templateFunc = options.history_template ?? options.template;

        if(templateFunc){
            this.container.innerHTML = templateFunc(storedData.data);
        }

        this.container.classList.add('searchstack-history-item');


        if(options.history_item_style)
        {
            this.container.setAttribute('style', options.history_item_style);
        }

        this.container.addEventListener('click', this.handleClick);

    }

    override handleEnterKey =  (e: KeyboardEvent)=> {
        e.preventDefault();
        this.dataSelected(this.storedData.data);
        this.input.repopulate = false;
        this.input.setFocus();

    }

     public destroy = ()=>{

        this.container.removeEventListener('click',this.handleClick);
        super.destroy();
    }

    override handleClick  =  (e: Event)=> {
        this.dataSelected(this.storedData.data);
        this.input.repopulate = false;
        this.input.setFocus();
    }

}
