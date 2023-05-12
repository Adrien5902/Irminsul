const Account = require('./accounts');
const Game = require("./games")

function err(message = "Une erreur s'est produite."){
    let err = document.getElementById("error")
    if(!err){
        err = document.createElement("dialog")
        err.id = "error"
        document.body.appendChild(err)
        err.addEventListener("click", e => {
            err.close()
        })
    }
    err.innerHTML = "Erreur: " + message
    err.showModal()
}

let sidebar = document.getElementById("sidebar")

sidebar.querySelectorAll("*").forEach(el => {
    let menuId = el.getAttribute("for")
    let menu = document.getElementById(menuId)
    if(menu){
        el.addEventListener("click", (e)=>{
            let oldMenu = document.querySelectorAll(".focused")
            if(oldMenu){
                oldMenu.forEach(oldEl => {oldEl.classList.remove("focused")})
            }

            el.classList.add("focused")
            menu.classList.add("focused")
        })
    }
})

let accounts = document.getElementById("accounts")

for(let account of Account.get()){
    let div = document.createElement("div")
    
    let mainDiv = document.createElement("div")
    mainDiv.classList.add("account")
    div.appendChild(mainDiv)

    let img = document.createElement("img")
    img.src = "imgs/games/" + account.gameId + ".png"
    img.alt = Game.list[account.gameId].name
    mainDiv.appendChild(img)

    let name = document.createElement("span")
    name.innerHTML = account.name
    mainDiv.appendChild(name)


    let btn = document.createElement("span")
    btn.classList.add("button")
    btn.style.display = "none"
    btn.innerHTML = "Jouer"
    div.appendChild(btn)

    accounts.prepend(div)

    div.addEventListener("click", async(e)=>{
        try {
            account.set()
            let game = new Game(account.gameId)
            await game.isRunning()
            await game.run()
        } catch (error) {
            err(error.message)
            console.error(error)
        }
    })
}

let addAccount = document.getElementById("add-account")
addAccount.addEventListener("click", e => {
    
})