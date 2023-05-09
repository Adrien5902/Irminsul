const storage = window.localStorage
let authcode = storage.getItem("authcode")
const requests = "https://adrien5902.ddns.net:3002/genshin-impact/irminsul/requests/"

let content = document.getElementById("content")

let resinCount = document.getElementById("resin-count")
let resinTimer = document.getElementById("resin-timer")
let realmCurrencyCount = document.getElementById("realmCurrency-count")
let realmCurrencyTimer = document.getElementById("realmCurrency-timer")
let transformerTimer = document.getElementById("transformer")

function updateTimers(resin, expeditions, realmCurrency){
    resin.update()
    resinCount.innerHTML = Math.floor(resin.count) + "/" + resin.max
    if (resin.count < resin.max){
        resinTimer.innerHTML = "Plein dans : " + secondsToDhms(resin.remaining_time)
    }else{
        resinTimer.innerHTML = "Votre résine est pleine!"
    }

    for(let expedition of expeditions){
        expedition.update()
    }

    realmCurrency.update()
    if(realmCurrency.remaining_time > 0){
        realmCurrencyTimer.innerHTML = "Plein dans : " + secondsToDhms(realmCurrency.remaining_time)
    }

    setTimeout(()=>{
        updateTimers(resin, expeditions, realmCurrency)
    }, 1000)
}

function displayLogin(){
    let discordLogin = document.getElementById("discord-login")
    discordLogin.addEventListener("click", function(e){
        let win = window.open("https://adrien5902.ddns.net/genshin-impact/irminsul/hoyolab/check.php")
        window.onmessage = function (e) {
            authcode = e.data.authcode
            let discordInfo = e.data.discord
            storage.setItem("authcode", authcode)
            storage.setItem("discordAvatar", "https://cdn.discordapp.com/avatars/"+discordInfo.id+"/"+discordInfo.avatar+".webp?size=1024")

            displayMain()
        };
    })

    conn.classList.toggle("hide", false)
    content.classList.toggle("hide", true)
}

let autoCheckInEnabled = null
let conn = document.getElementById("discord")
function displayMain(){
    conn.classList.toggle("hide", true)
    content.classList.toggle("hide", false)

    let pdp = document.getElementById("pdp")
    pdp.src = storage.getItem("discordAvatar")
    pdp.classList.remove("hide")

    fetch(requests+"notes?authcode="+authcode)
    .then(res => res.json())
    .then(data => {
        if(!data.err){
            let resin = new Resin(data.current_resin, data.max_resin, data.remaining_resin_recovery_time)
            let realmCurrency = new RealmCurrency(data.current_realm_currency,data.max_realm_currency,data.remaining_realm_currency_recovery_time)
            
            let expeditions = []
            for(let expedition of data.expeditions){
                let ex = new Expedition(expedition)
                expeditions.push(ex)
                ex.el.innerHTML = ex.toHTML()
            }
            document.getElementById("expeditions-count").innerHTML = "Expéditions : "+data.expeditions.length+"/"+data.max_expeditions
    
            document.getElementById("expeditions-getting").classList.add("hide")
            
            realmCurrencyCount.innerHTML = realmCurrency.count + "/" + realmCurrency.max
            
            let transformer = data.remaining_transformer_recovery_time
            if (transformer > 0){
                transformerTimer.innerHTML = "Temps restant : "+secondsToDhms(transformer)
            }else{
                transformerTimer.innerHTML = "✅"
            }
            
            updateTimers(resin, expeditions, realmCurrency)
        }else{
            let err = data.err
            if (err == "USERNOTFOUND"){
                displayLogin()
            }
        }
    })

    fetch(requests+"birthday")
    .then(res => res.json())
    .then(data => {
        let birthday = document.getElementById("birthday")
        let icon = document.getElementById("birthday-icon")
        let text = document.getElementById("birthday-text")

        if(data){
            if(data.character){
                text.innerHTML = "Aujourd'hui c'est l'anniversaire de "+data.character+" 🎂!"
                icon.src = data.icon
            }
            birthday.classList.toggle("hide", !data.character)
        }
    })

    fetch(requests+"autoCheckIn?authcode="+authcode)
    .then(res => res.json())
    .then(data => {
        if(!data.err){
            autoCheckInEnabled = data.enabled
            let autoCheckIn = document.getElementById("auto-checkin")
            if(data.enabled){
                autoCheckIn.innerHTML = "✅"
            }else{
                autoCheckIn.innerHTML = "❌"
            }
            autoCheckIn.addEventListener("click", ()=>{
                if(autoCheckInEnabled !== null){
                    let action
                    if(autoCheckInEnabled){
                        action = "disable"
                    }else{
                        action = "enable"
                    }

                    autoCheckIn.innerHTML = "🔄️"
                    autoCheckInEnabled = null

                    fetch(requests+"autoCheckIn?action=" + action+"&authcode="+authcode)
                    .then(res => res.json())
                    .then(data => {
                        if(!data.err){
                            autoCheckInEnabled = data.enabled
                            if(data.enabled){
                                autoCheckIn.innerHTML = "✅"
                            }else{
                                autoCheckIn.innerHTML = "❌"
                            }
                        }else{
                            console.error(data.err)
                        }
                    })
                }
            })
        }else{
            console.error(data.err)
        }
    })

    fetch(requests+"events?day=10")
    .then(res => res.json())
    .then(data => {
        if(!data.err){
            const d = data.data
            let events = document.getElementById("events")
            for(let event of d){
                let ev = new GenshinEvent(event)
                events.appendChild(ev.node())
            }
        }else{
            content.innerHTML = data.err
        }
    })
}

if(!authcode){
    displayLogin()
}else{
    displayMain()
}

let dropdowns = document.querySelectorAll(".dropdown")
for(let dropdown of dropdowns){
    let drop = dropdown.getAttribute("drop")
    let menu = document.getElementById(drop)
    
    menu.classList.add("hide")
    
    dropdown.addEventListener("click", (e)=>{
        menu.classList.toggle("hide")
        let deg = menu.classList.contains("hide") ? 0 : 90
        dropdown.style.transform = `rotate(${deg}deg)`
    })
}

let as = document.querySelectorAll("[browse]")
as.forEach((el) => {
    let link = el.getAttribute("browse")
    el.addEventListener("click", (e) => {
        window.open(link)
    })
})