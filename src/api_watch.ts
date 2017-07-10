import {EventEmitter} from 'events';

//from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min:number, max:number):number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

//this class watches the API for changes
export default class APIWatcher extends EventEmitter{

    constructor(public url:string, public interval:number){
        super();
        this.check = this.check.bind(this);
    };

    private isWatching : boolean = false;
    //starts watching process
    startWatching(){
        setTimeout(this.check, this.interval);
    }

    //starts watching process
    stopWatching(){
        this.isWatching = false;
    }


    //gets result from API
    check(){//TODO: make me execute a request
        if (this.isWatching){
            console.log("requesting to " + this.url);
            let res = Math.random();// process request

            //emit the watch event to give the result to whoever needs it
            this.emit("watch",res);

            //continue watching process
            this.startWatching();
        }
    }
};