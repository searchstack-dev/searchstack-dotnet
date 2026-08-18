import { ItemContainer, StoredData, Options } from '../core/Types.js';
import Modal from './Modal.js';
import MobileInput from './MobileInput.js';



export default class MobileHistoryItemContainer extends ItemContainer{

    constructor(
     input:MobileInput,
     readonly storedData:StoredData,
     readonly options:Options,
     index:number,readonly modal:Modal)
    {
        super(input,index);

        const templateFunc = options.history_template ?? options.template;

        this.container.innerHTML = templateFunc(storedData.data);

        this.container.classList.add('searchstack-history-item');

        this.container.classList.add('searchstack-mobile-history-item');

        this.container.addEventListener('click', this.handleClick);

        if(options.history_item_style)
        {
            this.container.setAttribute('style', options.history_item_style);
        }

    }

    override handleEnterKey = (e: KeyboardEvent)=> {

         e.preventDefault();
         this.dataSelected(this.storedData.data);
         this.modal.close();
    }

    public destroy = ()=>{

        this.container.removeEventListener('click',this.handleClick);
        super.destroy();
    };

    override handleClick = (e: Event)=> {

       this.dataSelected(this.storedData.data);
       this.modal.close();
    }

}
