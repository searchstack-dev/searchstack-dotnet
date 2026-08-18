import polyfill from '@oddbird/css-anchor-positioning/fn';
import { Options, Storage, List, SearchStackClient } from '../core/Types.js';
import DesktopList from './DesktopList.js';
import DesktopOptions from './DesktopOptions.js';


class ListCounter
{
    public static lists:List[] = [];

    static add(list:List)
    {
        this.lists.push(list);
    }

}


const attach =  (
textbox_id:string,
account_name:string,
list_or_group_name:string,
version:number | "latest",
is_group:boolean,
options: Partial<DesktopOptions> = {}):Promise<HTMLElement> =>
{

    return new Promise(async (success, error) => {

        if(!textbox_id){
            error(`Not found: ${textbox_id}`);
            return;
        }

        const textboxElement = document.getElementById(textbox_id) as HTMLInputElement;

        if(!textboxElement){
            error(`Not found: ${textbox_id}`);
            return;
        }

        try{

            const fullOptions = new DesktopOptions(options);

            const client = new SearchStackClient({
                apiKey: fullOptions.api_key,
                accessToken: fullOptions.access_token,
                baseUrl: fullOptions.base_url,
            });

            if(!fullOptions.allow_multiple)
            {
                destroy();
            }

            const list = new DesktopList(client,fullOptions,
            textboxElement,ListCounter.lists.length,{
              account_name,
              list_or_group_name,
              version,
              is_group,
            });

            /* the polyfill only processes styles that already exist, so it
               must run after the list has injected its anchor CSS */
            if (!("anchorName" in document.documentElement.style)) {
                await polyfill();
            }

            ListCounter.add(list);

            success(list.element);

            return;
        }
        catch(reason){
            error(reason);
            return;
        }

    });
}


const destroy = ()=>
{
    for(const instance of ListCounter.lists){
        instance.destroy();
    }
    ListCounter.lists = [];
}

const reset = ()=>
{

    ListCounter.lists = [];
}

const clearHistory = ()=>{
    Storage.clear();
}

const removeHistory = (key:string)=>{
    Storage.remove(key);
}


export{attach,Options,destroy, clearHistory,removeHistory,reset,DesktopOptions};
