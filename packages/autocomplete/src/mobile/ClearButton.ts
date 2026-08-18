import MobileInput from "./MobileInput.js";

export default class ClearButton
{
    private readonly button: HTMLElement = document.createElement('BUTTON');
    public element:HTMLElement = this.button;

    constructor(readonly input:MobileInput)
    {
        this.build();
    }

    private build = ()=>
    {
        this.element.setAttribute('disabled','');

        const icon = document.createElement('i');
        icon.className = "searchstack-mobile-controls-icon";
        icon.classList.add('searchstack-mobile-clear-icon');

        this.button.insertAdjacentElement('afterbegin',icon);
        this.button.className = "searchstack-mobile-clear-button"
        this.button.classList.add('searchstack-mobile-button');


        this.input.textbox.addEventListener('input',this.handleTextInput);
        this.input.textbox.addEventListener('focus', this.handleFocus);

        this.button.addEventListener('click', this.handleClick);
    }

    private handleTextInput = (e:Event)=>{
        this.setDisabled();
    }

     private handleFocus = (e:Event)=>{
        this.setDisabled();
    }



    public setDisabled = ()=>
    {
        if(this.input.textbox.value){
            this.element.removeAttribute('disabled');
        }
        else{
            this.element.setAttribute('disabled','');
        }
    }

    private handleClick = (e:Event)=>{

        this.input.clear();
        this.input.setFocus();
        this.setDisabled();
    };

    public destroy()
    {
       this.button.removeEventListener('click',this.handleClick);
       this.input.textbox.removeEventListener('input',this.handleTextInput);
       this.input.textbox.removeEventListener('focus', this.handleFocus);
       this.button.remove();
    }
}
