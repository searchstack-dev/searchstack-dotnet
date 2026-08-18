import Data from "./Data.js";

export default class StoredData{
    constructor(
    readonly data:Data,
    readonly timestamp:number)
    {
    }
};
