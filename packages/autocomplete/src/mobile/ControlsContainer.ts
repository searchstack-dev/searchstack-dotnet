import Modal from "./Modal.js";
import BackButton from "./BackButton.js";
import ClearButton from "./ClearButton.js";
import MobileInput from "./MobileInput.js";
import MobileList from "./MobileList.js";

export default class ControlsContainer
{
    private readonly container: HTMLElement = document.createElement('DIV');
    public element:HTMLElement = this.container;

    public readonly input: MobileInput;
    private readonly backButton:BackButton;
    private readonly clearButton:ClearButton;

    constructor(modal:Modal, list:MobileList)
    {
       this.input = list.input;

       this.backButton = new BackButton(modal,this.input);
       this.clearButton = new ClearButton(this.input);

       this.build();
    }

    private build =()=>{

        this.container.className = "searchstack-mobile-controls-container";

        const column1 = document.createElement('DIV');
        column1.className = "searchstack-mobile-controls-container-col-1";
        column1.classList.add("searchstack-mobile-controls-container-col");
        column1.insertAdjacentElement('afterbegin',this.backButton.element);

        const column2 = document.createElement('DIV');
        column2.className = "searchstack-mobile-controls-container-col-2";
        column2.classList.add("searchstack-mobile-controls-container-col");
        column2.insertAdjacentElement('afterbegin',this.input.textbox);

        const column3 = document.createElement('DIV');
        column3.className = "searchstack-mobile-controls-container-col-3";
        column3.classList.add("searchstack-mobile-controls-container-col");

        column3.insertAdjacentElement('afterbegin',this.clearButton.element);

        this.container.insertAdjacentElement('afterbegin',column3);
        this.container.insertAdjacentElement('afterbegin',column2);
        this.container.insertAdjacentElement('afterbegin',column1);
    }

    public focus =()=>{
        this.input.setFocus();
    }

    public destroy()
    {
        this.backButton.destroy();
        this.clearButton.destroy();
        this.input.destroy();
        this.container.remove();
    }
}
