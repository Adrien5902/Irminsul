
function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + (d == 1 ? " jours " : " jours ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? "h" : "h") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? "m" : "m") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? "s" : "s") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

class Resin{
    constructor(count, max, remaining_time){
        this.count = count
        this.max = max
        this.remaining_time = remaining_time
        this.fullDate = new Date(Date.now() + (remaining_time * 1000));
    }

    update(){
        if(this.count < this.max){
            let now = new Date(Date.now())

            this.remaining_time = (this.fullDate.getTime() - now.getTime())/1000
            this.count = this.max - (this.remaining_time /(8*60))
        }
    }
}

let expeditionsDiv = document.getElementById("expeditions")
class Expedition{
    constructor(data){
        Object.assign(this, data)
        this.fullDate = new Date(Date.now() + (this.remaining_time * 1000));
        this.el = document.createElement("li")
        expeditionsDiv.appendChild(this.el)
    }

    toHTML(){
        let ended
        if(this.remaining_time <= 0){
            ended = "✅"
        }else{
            ended = "<br>Temps restant : <br>" + secondsToDhms(this.remaining_time)
        }

        return '<img src="'+ this.character.icon +'">' + this.character.name + " " + ended
    }

    update(){
        let now = new Date(Date.now())
        if(Math.floor(this.fullDate.getTime()) >= Math.floor(now.getTime())){
            this.remaining_time = (this.fullDate.getTime() - now.getTime())/1000
        }
        this.el.innerHTML = this.toHTML()
    }
}

class RealmCurrency{
    constructor(count, max, remaining_time){
        this.count = count
        this.max = max
        this.remaining_time = remaining_time
        this.fullDate = new Date(Date.now() + (remaining_time * 1000));
    }

    update(){
        if(this.remaining_time > 0){
            let now = new Date(Date.now())
            this.remaining_time = (this.fullDate.getTime() - now.getTime())/1000
        }
    }
}

function formatToDate(inputDate){
    const [year, month, day] = inputDate.split('-');
    return new Date(year, month - 1, day);
}

function dateToFrenchFromat(date){
    const formattedDay = date.getDate().toString().padStart(2, '0');
    const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const formattedYear = date.getFullYear().toString();

    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}

function getYYYYMMDD(inputDate){
    let date = new Date(inputDate.valueOf());
    return date.toISOString().slice(0, 10)
}

function addDays(inputDate, days) {
    let date = new Date(inputDate.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

class GenshinEvent {
    constructor(data){
        Object.assign(this, data)
    }

    node(){
        let el = document.createElement("li")
        let icon = document.createElement("img")
        el.appendChild(icon)

        let texts = document.createElement("div")
        el.appendChild(texts)

        icon.style.width = "13%"
        if(this.type == "event" || this.type == "banner"){
            icon.src = this.value.icon
        }else if(true){
            icon.src = "imgs/events/" + this.type + ".png"
        }

        if(this.type == "abyss_reset" || this.type == "event" || this.type == "version"){
            icon.style.borderRadius = "100%"
        }

        let date = document.createElement("p")
        let d = formatToDate(this.date)
        texts.appendChild(date)
        date.innerHTML = dateToFrenchFromat(d)

        date.innerHTML += " - "

        let today = new Date(Date.now())
        if(this.date == getYYYYMMDD(addDays(today, 0))){
            date.innerHTML += "Aujourd'hui"
        }else if(this.date == getYYYYMMDD(addDays(today, 1))){
            date.innerHTML += "Demain"
        }else if(this.date == getYYYYMMDD(addDays(today, 2))){
            date.innerHTML += "Après demain"
        }else{
            let d = new Date(this.date)
            let dayCount = Math.ceil(new Date(d.getTime() - today.getTime()).getTime()/(24*60*60*1000))
            date.innerHTML += "Dans " + dayCount + " jours"
        }

        let p = document.createElement("p")
        let text = ""
        texts.appendChild(p)
        if(this.type == "shop_reset"){
            text = "Rotation du shop de paimon <br> Personnages : <br>" + this.value.characters[0] + " et " + this.value.characters[1] + "<br> Armes " + this.value.weapons
        }else if(this.type == "abyss_reset"){
            text = "Reset des abysses"
        }else if(this.type == "banner"){
            text = "Bannière de " + this.value.name
        }else if(this.type == "live"){
            text = "Programme spécial de la " + this.value
        }else if(this.type == "version"){
            text = "Mise à jour " + this.value
        }else if(this.type == "event"){
            if(this.value.type == "event"){
                text = "Événement " + this.value.name
            }else{
                text = this.value.name
            }
        }

        p.innerHTML = text

        return el
    }
}