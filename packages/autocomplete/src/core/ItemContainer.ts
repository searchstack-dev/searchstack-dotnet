import Data from './Data.js';
import Input from './Input.js';
import Storage from './Storage.js';


export default abstract class ItemContainer{

    protected readonly container: HTMLElement = document.createElement('DIV');
    public element:HTMLElement = this.container;

    constructor(
    readonly input:Input,
    readonly index:number)
    {
        this.container.addEventListener('keydown', this.handleKeyDown);
        this.container.addEventListener('focus', this.handleFocus);

        this.container.setAttribute('role', 'option');
        this.container.setAttribute('aria-selected', 'false');

        this.container.tabIndex = -1; /* important*/

    }

    public destroy(){

        this.container.removeEventListener('keydown', this.handleKeyDown);
        this.container.removeEventListener('focus', this.handleFocus);

        this.container.remove();
    };

    private handleFocus =  (event:FocusEvent) => {
        this.input.list.setSelectedIndex(this.index);
    }


    private handleKeyDown = (event: KeyboardEvent)=>{

        switch (event.key) {
            case "ArrowUp":
                this.handleUpKey(event);
                break;
            case "ArrowDown":
                this.handleDownKey(event);
                break;
            case "Enter":
                this.handleEnterKey(event);
                break;

        }
    };



    abstract handleEnterKey (e:KeyboardEvent):void;



    handleDownKey = (event: KeyboardEvent) => {

        this.input.list.setSelectedIndex(this.index +1);
        event.preventDefault();
    }

    handleUpKey = (event: KeyboardEvent) => {

        this.input.list.setSelectedIndex(this.index -1);
        event.preventDefault();
    }

    abstract handleClick (e:Event):void;

    dataSelected = (data:Data)=>
    {
        ItemContainer.dataSelected(this.input,data);
    }

    static dataSelected = (input:Input,data:Data)=>{

        if(input.list.options.enable_history){
            Storage.save(data);
        }

        input.dispatchSelected(data);
        input.clearList();

    }


}
