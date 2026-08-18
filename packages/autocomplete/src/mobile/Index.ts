import Modal from "./Modal.js";
import { Storage, Options, SearchStackClient } from '../core/Types.js';


class ModalCounter
{
    public static modals:Modal[] = [];

    static add(modal:Modal)
    {
        this.modals.push(modal);
    }

}

export const attach =  (
textbox_id:string,
account_name:string,
list_or_group_name:string,
version:number | "latest",
is_group:boolean,
options: Partial<Options> = {}):Promise<HTMLElement> =>
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

            const fullOptions = new Options(options);

            const client = new SearchStackClient({
                apiKey: fullOptions.api_key,
                accessToken: fullOptions.access_token,
                baseUrl: fullOptions.base_url,
            });

            if(!fullOptions.allow_multiple){
                destroy();
            }

            const modal = new Modal(client,fullOptions,ModalCounter.modals.length,
            textboxElement,{
              account_name,
              list_or_group_name,
              version,
              is_group,
            });

            ModalCounter.add(modal);

            success(modal.list.element);

            return;

        }
        catch(reason){
            error(reason);
            return;
        }

    });
}



/**
 * Closes whichever full-screen modal is currently up, if any, handing what was typed
 * back to the page textbox. For another surface that needs the screen — see
 * {@link Modal.standDown}.
 */
export const standDown = ()=>
{
    for(const instance of ModalCounter.modals){
        instance.standDown();
    }
}

/**
 * The box the reader is typing into for this list while a full-screen modal is up —
 * the modal's own input, not the page textbox. Undefined when no modal is showing
 * this list. See {@link Modal.typingIn}.
 */
export const typingIn = (listElement:HTMLElement):HTMLInputElement|undefined =>
{
    for(const instance of ModalCounter.modals){
        const box = instance.typingIn(listElement);
        if(box){ return box; }
    }

    return undefined;
}

export const destroy = ()=>
{
    for(const instance of ModalCounter.modals){
        instance.destroy();
    }
    ModalCounter.modals = [];
}

export const reset = ()=>
{
    ModalCounter.modals = [];
}

export const clearHistory = ()=>{
    Storage.clear();
}

export const removeHistory = (key:string)=>{
    Storage.remove(key);
}
