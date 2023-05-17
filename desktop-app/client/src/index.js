const { Account, Game, DiscordConn, Themes, Save } = require('./functions');

function err(message = "Une erreur s'est produite.", buttons = [], showError = true){
    let err = document.getElementById("error")
    if(!err){
        err = document.createElement("dialog")
        err.id = "error"
        document.body.appendChild(err)
        err.addEventListener("click", e => {
            err.close()
        })
    }
    err.innerHTML = showError ? "Erreur: " + message : message
    err.showModal()

    let buttonDiv = document.createElement("div")
    err.appendChild(buttonDiv)
    for(let button of buttons){
        let btn = document.createElement("button")
        btn.innerHTML = button.text
        btn.addEventListener("click", button.action)
        buttonDiv.appendChild(btn)
        if(button.style){
            btn.style = button.style
        }
    }
}

function addRightClick(el, buttons){
    el.addEventListener("contextmenu", e => {
        e.preventDefault();

        let contextMenu = document.getElementById("context-menu")
        if(contextMenu){
            contextMenu.remove()
        }
    
        const { clientX: mouseX, clientY: mouseY } = e;
    
        contextMenu = document.createElement("div")
        contextMenu.id = "context-menu"
        document.body.appendChild(contextMenu)

        contextMenu.style.top = `${mouseY}px`;
        contextMenu.style.left = `${mouseX}px`;

        for(let button of buttons){
            let btn = document.createElement("span")
            btn.innerHTML = button.text
            if(button.style){
                btn.style = button.style
            }

            btn.addEventListener("click", e => {
                button.action()
                contextMenu.remove()
            })
            
            contextMenu.appendChild(btn)
        }

        let listener = document.body.addEventListener("click", e => {
            contextMenu.remove()
            document.body.removeEventListener("click", listener)
        })
    })
}

let content = document.querySelector("#content")

function refreshAccounts(){
    let accounts = document.getElementById("accounts")

    accounts.remove()
    accounts = document.createElement("div")
    accounts.id = "accounts"
    accounts.classList.add("focused")
    accounts.innerHTML = '<div id="add-account"><div class="account"><img src="imgs/+.png" alt="+"><span>En ajouter un</span></div></div>'
    content.appendChild(accounts)

    let addAccount = document.getElementById("add-account")
    addAccount.addEventListener("click", showAddAccount)

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
            let game = new Game(account.gameId)
            try {
                await account.set()
                await game.run()
            } catch (error) {   
                err(error.message, /* [
                    {
                        text: "Fermer le jeu",
                        action: e => {
                            try{
                                game.close()
                            }catch(error){
                                err(error.message)
                            }
                        }
                    }
                ] */)
            }
        })
        
        addRightClick(div, [
            {
                text: "Renommer", action: () => {
                    let input = document.createElement("input")
                    input.type = "text"
                    input.value = name.innerHTML
                    input.placeholder = "Nom"
                    mainDiv.appendChild(input)
                    input.focus()

                    function rename(){
                        if(input.value != ""){
                            account.rename(input.value)
                            refreshAccounts()
                        }else{
                            err("Le nom ne peut pas être vide")
                            refreshAccounts()
                        }
                    }

                    name.style.display = "none"

                    input.addEventListener("change", e => {rename()})
                    input.addEventListener("focusout", e => {rename()})
                }
            },{
                text: 'Supprimer', style: "color: red;", action: () => {
                    err("Êtes-vous sûr de vouloir supprimer ce compte ?", [
                        {
                            text: "Oui",
                            action: e => {
                                account.remove()
                                refreshAccounts()
                            }
                        },
                        {
                            text: 'Non',
                            style: 'color: white; background: red;',
                            action: e => {}
                        }
                    ], false)
                },
            }
        ])
    }
}

let sidebar = document.getElementById("sidebar")

sidebar.querySelectorAll("[sidebar]").forEach(el => {
    let menuId = el.getAttribute("sidebar")
    let menu = document.getElementById(menuId)
    if(menu){
        el.addEventListener("click", (e)=>{
            let oldMenu = document.querySelectorAll(".focused")
            if(oldMenu){
                oldMenu.forEach(oldEl => {oldEl.classList.remove("focused")})
            }

            if(menuId == "accounts"){
                refreshAccounts()
            }

            el.classList.add("focused")
            menu.classList.add("focused")
        })
    }
})

let addAccountDialog = document.getElementById("add-account-dialog")
let gameSelect = addAccountDialog.querySelector('[name="game"]')

function showAddAccount(e){
    addAccountDialog.showModal()
    
    addAccountDialog.addEventListener("click", e => {
        const dialogDimensions = addAccountDialog.getBoundingClientRect()
        if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
        ) {
            addAccountDialog.close()
        }
    })

    let nameInput = addAccountDialog.querySelector('[name="name"]')

    let submit = addAccountDialog.querySelector('button[type="submit"]')

    submit.addEventListener("click", async e => {
        let game = new Game(gameSelect.value)
        if(await game.isRunning()){
            let name = nameInput.value != "" ? nameInput.value : null
            Account.add(game.id, name)
            .then(acc => {
                refreshAccounts()
            })
        }else{
            err("Veuillez ouvrir le jeu avant d'enregistrer le compte")
        }
    })
}

for (id in Game.list){
    let game = Game.list[id]
    let option = document.createElement("option")
    option.value = id
    option.innerHTML = game.fullname
    gameSelect.appendChild(option)
};

let account = document.getElementById("account");
(()=>{
    try {
        let discordInfo = DiscordConn.getAccountInfo()

        let pdp = document.createElement("img")
        pdp.src = discordInfo.pdp
        account.appendChild(pdp)

        let name = document.createElement("span")
        name.innerText = discordInfo.username
        account.appendChild(name)

        addRightClick(account, [
            {
                text: "Se déconnecter",
                style: "color:red;",
                action: ()=>{
                    let save = Save.read()
                    save.token = null
                    save.discordInfo = null
                    
                    Save.write(save)

                    DiscordConn.auth()
                    .then(({discordInfo, code}) => {
                        createWindow()
                        window.close()
                    })
                }
            }
        ])
    } catch (error) {
        console.error(error)   
    }
})();

document.addEventListener("DOMContentLoaded", e => {
    Themes.go(0)
})

