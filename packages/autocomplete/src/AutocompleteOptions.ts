import DesktopOptions from './desktop/DesktopOptions.js';

export default class AutocompleteOptions extends DesktopOptions
{
    full_screen_on_mobile = true;
    mobile_max_screen_width = 500;

    constructor(options: Partial<AutocompleteOptions> = {}) {
        super(options);
        Object.assign(this, options);
    }
}
