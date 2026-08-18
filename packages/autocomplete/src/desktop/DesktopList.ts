import { List, Input, SearchStackClient, Endpoint } from '../core/Types.js';
import DesktopInput from "./DesktopInput.js";
import DesktopOptions from './DesktopOptions.js';



export default class DesktopList extends List{

    public readonly input:Input;

    constructor(
    client: SearchStackClient,
    readonly options:DesktopOptions,
    readonly textbox:HTMLInputElement,
    readonly instance:number,
    endpoint:Endpoint)
    {

        super(options,instance);

        this.comboboxElement = textbox;

        const id = 'searchstack-list-' + instance;
        this.list.id = id;

        this.list.setAttribute("data-textbox",textbox.id);

        this.input = new DesktopInput(client,options,textbox,this,endpoint);

        this.list.classList.add('searchstack-list');

        this.innerDiv.classList.add('searchstack-scroll');

        this.textbox.insertAdjacentElement('afterend', this.list);

        if(options.list_style)
        {
            this.list.setAttribute('style', options.list_style);
        }

        this.injectStyle();

        if(options.full_length){
            this.list.style.setProperty('--searchstack-list-min-width', `${textbox.offsetWidth}px`);
        }
    }

    override setSelectedIndex(index:number)
    {
        List.setSelectedIndex(index,this,this.input);
    }

    public setFocus()
    {
        List.setFocus(this.selectedIndex,this,this.input);
    }

    public destroy()
    {
        this.input.destroy();
        super.destroy();
    }


    override injectStyle()
    {

        this.style.appendChild(document.createTextNode(this.textboxCss(this.instance,this.textbox)));
        this.style.appendChild(document.createTextNode(this.listCss(this.instance,this.options,this.list.id)));
        this.style.appendChild(document.createTextNode(this.listItemCss(this.instance)));
        this.list.insertAdjacentElement("beforebegin", this.style);
    }



    private listItemCss = (instance:number)=>{

        if(instance !== 0){
            return '';
        }

        const css = `
        /* List Item */
        .searchstack-list-item:hover,
        .searchstack-history-item:hover
        {
            background-color:var(--searchstack-list-item-background-hover-color,rgba(10, 10, 10, .04));
            cursor: var(--searchstack-list-item-hover-cursor,pointer);
            outline:var(--searchstack-list-item-hover-outline,0);
        }


        .searchstack-list-item-focused
        {
            background-color:var(--searchstack-list-item-background-focused-color,rgba(10, 10, 10, .12));
            outline:var(--searchstack-list-item-focused-outline,0);
        }

        /* History header */
        .searchstack-history-header
        {
            display:flex;
            align-items:center;
            gap:6px;
            padding:var(--searchstack-history-header-padding,6px 15px 8px 10px);
            font-size:var(--searchstack-history-header-font-size,0.78em);
            color:var(--searchstack-history-header-color,#8a8a8a);
            text-transform:var(--searchstack-history-header-text-transform,uppercase);
            letter-spacing:var(--searchstack-history-header-letter-spacing,0.04em);
            user-select:none;
        }

        .searchstack-history-header-icon
        {
            opacity:0.75;
            flex:0 0 auto;
        }`;

        return css;
    }


    private  textboxCss = (instance:number, textbox:HTMLInputElement)=>
    {
        const css = `

            /* textbox */
            #${textbox.id}{
                anchor-name: --anchor-textbox-${instance};
            }
        `;

        return css;
    }


    private  listCss = (instance:number, options:DesktopOptions, listId:string)=>{

        let css = `

            /* list */

            #${listId}{
                position-anchor: --anchor-textbox-${instance};
                top:anchor(bottom);
                left:anchor(left);
            }`;

            if(instance === 0){
            css +=`
                .searchstack-list{
                    position:absolute;
                    visibility:hidden;

                    border-style:var(--searchstack-list-border-style,solid);
                    border-width:var(--searchstack-list-border-width,1px);
                    border-color:var(--searchstack-list-border-color,#ccc);

                    z-index: var(--searchstack-list-z-index,2011);

                    padding-top:var(--searchstack-list-padding-top,12px);
                    padding-bottom:var(--searchstack-list-padding-bottom,12px);
                    padding-left:var(--searchstack-list-padding-left,0);
                    padding-right:var(--searchstack-list-padding-right,0);

                    box-shadow: var(--searchstack-list-box-shadow,0 2px 4px rgba(0, 0, 0, .2));
                    background-color: var(--searchstack-list-background-color,#fff);

                    margin-top:var(--searchstack-list-bottom-margin-top,2px);
                    margin-right:var(--searchstack-list-bottom-margin-right,8px);
                    margin-left:var(--searchstack-list-bottom-margin-left,0);
                    margin-bottom:var(--searchstack-list-bottom-margin-bottom,0);

                    border-radius:var(--searchstack-list-border-radius,6px);
                    font-size: var(--searchstack-list-font-size,0.9em);
                    width: var(--searchstack-list-width,auto);
                    min-width: var(--searchstack-list-min-width,auto);

                }

               .searchstack-scroll{
                    max-height: var(--searchstack-list-max-height,30em);
                    overflow-y: var(--searchstack-list-overflow-y,auto);
               }

                .searchstack-list-item .searchstack-icon,
                .searchstack-history-item .searchstack-icon
                {
                        padding:2px 5px 5px 0px;
                        font-style: normal;
                        font-weight: normal;
                        display: inline-block;
                        width: 2em;
                        text-align: center;
                        font-variant: normal;
                        text-transform: none;
                        line-height: 1em;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                        position: relative;
                        top: 0.1em;
                }

                .searchstack-list-item,
                .searchstack-history-item {
                    padding-top: 5px;
                    padding-bottom: 10px;
                    padding-left: 10px;
                    padding-right: 15px;
                }
                `;
            }



          if(options.enable_repositioning){
            css +=`

            #${listId}{
                position-try-fallbacks: --right ,--top, --left;
            }

            @position-try --right
            {
                inset:auto;
                left:anchor(right);
                top:anchor(top);
                margin:auto;
                margin-left:var(--searchstack-list-right-margin-left,6px);
                margin-right:var(--searchstack-list-right-margin-right,auto);
                margin-top:var(--searchstack-list-right-margin-top,auto);
                margin-bottom:var(--searchstack-list-right-margin-bottom,auto);

                width:var(--searchstack-list-right-width,var(--searchstack-list-width));
                min-width: var(--searchstack-list-right-min-width,auto);
            }

            @position-try --top
            {
                inset:auto;
                left:anchor(left);
                bottom:anchor(top);
                margin:auto;
                margin-bottom:var(--searchstack-list-top-margin-bottom,6px);
                width:var(--searchstack-list-top-width,var(--searchstack-list-width));
                min-width: var(--searchstack-list-top-min-width,auto);
            }

            @position-try --left
            {
                inset:auto;
                right:anchor(left);
                top:anchor(top);
                margin:auto;
                margin-right:var(--searchstack-list-left-margin-right,6px);
                width:var(--searchstack-list-left-width,var(--searchstack-list-width));
                min-width: var(--searchstack-list-left-min-width,auto);
            } `;

          }

        return css;

    };


}
