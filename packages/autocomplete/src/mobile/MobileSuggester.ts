import { Suggester, Storage, Options, SearchStackClient, Endpoint } from '../core/Types.js';
import MobileInput from './MobileInput.js';
import Modal from './Modal.js';
import MobileHistoryItemContainer from './MobileHistoryItemContainer.js';
import MobileItemContainer from './MobileItemContainer.js';


export default class MobileSuggester extends Suggester{


    constructor(
    client:SearchStackClient,
    readonly input:MobileInput,
    options:Options,
    readonly modal:Modal,
    endpoint:Endpoint){
        super(client,input,options,endpoint);
    }


    override getElements = async ():Promise<HTMLElement[]>=>{

        const query = this.input.textbox.value;

        if(this.options.enable_history && !this.hasMinimumCharacters(query))
        {
            const storedItems = Storage.list();
            return storedItems.map((storedItem,index)=>{
                return new MobileHistoryItemContainer(this.input,storedItem,this.options,index,this.modal).element;
            });
        }

        if(!this.hasMinimumCharacters(query)){
            return [];
        }

        const suggestions = await this.getSuggestions(query);
        return suggestions.map((suggestion,index)=>{
            return new MobileItemContainer(this.input,suggestion,this.options,index,this.modal).element;
        });
    }

}
