import MobileInput from './MobileInput.js';
import Modal from "./Modal.js";

export default class BackButton
{
    private readonly button: HTMLElement = document.createElement('BUTTON');
    public element:HTMLElement = this.button;

    constructor(readonly modal:Modal,readonly input:MobileInput)
    {
        this.build();
    }

    private build = ()=>
    {
        const icon = document.createElement('i');
        icon.className = "searchstack-mobile-controls-icon";
        icon.classList.add('searchstack-mobile-back-icon');

        this.button.insertAdjacentElement('afterbegin',icon);
        this.button.className = "searchstack-mobile-back-button"
        this.button.classList.add('searchstack-mobile-button');

        this.button.addEventListener('click', this.handleClick);
    }

    private handleClick = (e:Event)=>
    {
        this.modal.close();
    };

    public destroy()
    {
       this.button.removeEventListener('click',this.handleClick);
       this.button.remove();
    }
}
