import Data from "./Data.js";
import StoredData from "./StoredData.js";


export default class Storage{

    private static key = "searchstack_local_data";
    private static maxEntries = 6;
    private static maxAgeDays = 7;

    public static save = (data:Data)=>
    {
        const key = data.id ?? data.name;

        if(key == null){
            return;
        }

        const map = Storage.load();

        map.delete(key);

        if(map.size >= Storage.maxEntries)
        {
            const storedEntries = [...map.entries()].sort((a,b) => {

                const data1 = a[1] as StoredData;
                const data2 = b[1] as StoredData;
                return  data1.timestamp - data2.timestamp;
            });

            map.delete(storedEntries[0][0]);
        }

        map.set(key, new StoredData(data, new Date().getTime()));
        Storage.persist(map);
    }

    public static list = ():StoredData[]=>{

        const map = Storage.load();

        if(Storage.pruneExpired(map)){
            Storage.persist(map);
        }

        const entries = [...map.values()].map(sa => sa as StoredData);

        return entries.reverse();
    };

    public static clear = ()=>{

        localStorage.removeItem(this.key);
    };

    public static clearExpired = ()=>{

        const map = Storage.load();

        if(Storage.pruneExpired(map)){
            Storage.persist(map);
        }
    }

    /** Removes entries older than `maxAgeDays` from the given map in place.
     *  Returns true if anything was removed. */
    private static pruneExpired = (map:Map<any,any>):boolean=>{

        if(map.size === 0)
        {
            return false;
        }

        const today = new Date();
        const priorDate = new Date(new Date().setDate(today.getDate() - Storage.maxAgeDays));

        let hasExpiredEntries = false;
        map.forEach((sa:any,key:any)=>{
            const storedData = sa as StoredData;

            if(priorDate.getTime() > storedData.timestamp)
            {
                map.delete(key);
                hasExpiredEntries = true;
            }
        });

        return hasExpiredEntries;
    }

    public static remove = (key:string)=>{

        const map = Storage.load();

        if(map.delete(key)){
            Storage.persist(map);
        }
    }

    private static load = ():Map<any,any>=>{

        const savedData = localStorage.getItem(this.key);

        if(!savedData || Storage.isObjectEmpty(savedData))
        {
            return new Map();
        }

        try{
            return new Map(JSON.parse(savedData));
        }
        catch{
            localStorage.removeItem(this.key);
            return new Map();
        }
    }

    private static persist = (map:Map<any,any>)=>{

        if(map.size > 0){
            localStorage.setItem(this.key, JSON.stringify([...map]));
        }
        else{
            localStorage.removeItem(this.key);
        }
    }

    static isObjectEmpty = (obj:string) => {
        if(!obj)
        {
            return true;
        }
        return obj === "{}" || obj === '"{}"';
    };
}
