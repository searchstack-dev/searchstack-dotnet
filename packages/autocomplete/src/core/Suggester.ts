import { SearchStackClient } from '@searchstack/public-api';
import Options from './Options.js';
import Input from './Input.js';
import Data from './Data.js';
import { Endpoint } from './Types.js';


export default abstract class Suggester{

    protected filterTimer: ReturnType<typeof setTimeout> | undefined;
    private supersededResolve: ((elements:HTMLElement[]|null)=>void) | undefined;
    private generation = 0;


    constructor(
    readonly client:SearchStackClient,
    readonly input:Input,
    readonly options:Options,
    readonly endpoint:Endpoint)
    {

    }

    /**
     * Debounced suggestion elements for the current textbox value. Resolves
     * with null when superseded by a newer call — callers should skip
     * populating the list in that case.
     */
    public suggestions = (fire:boolean):Promise<HTMLElement[]|null>=>{

        return new Promise((success) => {

            const delay = fire? 0 :this.options.delay;
            const generation = ++this.generation;

            clearTimeout(this.filterTimer);

            if(this.supersededResolve){
                this.supersededResolve(null);
            }

            this.supersededResolve = success;

            this.filterTimer = setTimeout(async () =>
            {
                if(this.supersededResolve === success){
                    this.supersededResolve = undefined;
                }

                try{
                    const elements = await this.getElements();

                    if(generation !== this.generation){
                        /* a newer request finished the race — drop this result */
                        success(null);
                        return;
                    }

                    success(elements);
                }
                catch{
                    /* failures are reported via the suggestions-failed event */
                    success(generation === this.generation ? [] : null);
                }

            },delay);
        });
    };

    public destroy = ()=>{

        clearTimeout(this.filterTimer);

        this.generation++;

        if(this.supersededResolve){
            this.supersededResolve(null);
            this.supersededResolve = undefined;
        }
    }

    protected hasMinimumCharacters = (query:string)=>{

        if(!query){
            query = '';
        }
        const minimumCharacters = this.options.minimum_characters ?? 2;
        return query.length >= minimumCharacters;
    };

    abstract getElements():Promise<HTMLElement[]>;

    protected getSuggestions = async (query:string):Promise<Data[]> =>
    {
        try{

            const result = await this.getSuggestionResult(query);

            if(!result.isSuccess)
            {
                const failed = result.toProblem();
                this.input.list?.dispatchSuggestionsFailed(query,failed.status,failed.title);
                throw failed;
            }

            const suggestions = result.toSuccess() as Data[];

            this.input.list?.dispatchSuggestions(query,suggestions);

            return suggestions;
        }
        catch(reason){

            if(reason instanceof Error){
                this.input.list?.dispatchSuggestionsFailed(query,0,reason.message);
            }

            throw reason;
        }
    };

    private getSuggestionResult = async (query:string)=>{

        const suggestionOptions = this.options.suggestion_options ?? {};

        if(this.endpoint.is_group){
            return await this.client.Suggest.group(this.endpoint.account_name,
                this.endpoint.list_or_group_name, this.endpoint.version, query, suggestionOptions);
        }

        // A List endpoint's version is always a concrete number; the "latest" alias is only
        // offered on the group path (attachGroup), so narrow it here for Suggest.list.
        return await this.client.Suggest.list(this.endpoint.account_name,
                this.endpoint.list_or_group_name, this.endpoint.version as number, query, suggestionOptions);
    }

}
