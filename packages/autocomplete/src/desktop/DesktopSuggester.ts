import { Options, Storage, Suggester, SearchStackClient, Endpoint } from '../core/Types.js';
import SuggestionContainer from './DesktopItemContainer.js';
import HistoryContainer from './DesktopHistoryItemContainer.js';
import DesktopInput from './DesktopInput.js';


export default class DesktopSuggester extends Suggester{


    constructor(
    client: SearchStackClient,
    input:DesktopInput,
    options:Options,
    endpoint:Endpoint
    ){
        super(client,input,options,endpoint);
    }


    override getElements = async ():Promise<HTMLElement[]>=>{

        const query = this.input.textbox.value;

        if(this.options.enable_history && !query)
        {
            const storedItems = Storage.list();
            return storedItems.map((storedItem,index)=>{
                return new HistoryContainer(this.input,storedItem,this.options,index).element;
            });
        }

        if(!this.hasMinimumCharacters(query)){
            return [];
        }

        const suggestions = await this.getSuggestions(query);

        return suggestions.map((suggestion,index)=>{
            return new SuggestionContainer(this.input,suggestion,this.options,index).element;
        });
    }


}
