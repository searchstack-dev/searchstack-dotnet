import { Options } from "../core/Types.js";

export default class DesktopOptions extends Options
{
    enable_repositioning = false;
    full_length = true;


    constructor(options: Partial<DesktopOptions> = {}) {
        super(options);
        Object.assign(this, options);
    }
}
