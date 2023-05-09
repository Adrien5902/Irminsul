const fs = require('fs');

exports.execute = async function (interaction){
    const item = interaction.message.embeds[0].fields[0].name
    let content = ""
    let fup = ""
    const path = "F:/xampp/htdocs/genshin-impact/imgs/map/"+item

    let shopFiles = []
    let fupFiles = []
    if (fs.existsSync(path)) {
        const maps = fs.readdirSync(path);
        const mapAdress = "https://adrien5902.ddns.net/genshin-impact/imgs/map/"
        let nShop = 0
        let nMaps = 0
        let shopMaps = []
        let iMaps = []
        for(let map of maps){
            if(map.includes("shop")){
                nShop++
                shopMaps.push(map)
            }else{
                nMaps++
                iMaps.push(map)
            }
        }
        if(nShop > 0){
            content += nShop + " PNJ vend/vendent *" + item + "* :"
            for(let map of shopMaps){
                shopFiles.push(mapAdress + item.replaceAll(" ", "%20") + "/" + map)
            }
        }else{
            content += "Aucun PNJ ne vend *" + item + "*"
        }

        if(nMaps > 0){
            fup += "Carte Interactive :"
            for(let map of iMaps){
                fupFiles.push(mapAdress + item.replaceAll(" ", "%20") + "/" + map)
            }
        }else{
            fup += "Maps introuvables pour : *" + item + "*"
        }
    }else{
        content += "Maps introuvables pour : *" + item + "*"
    }

    await interaction.reply({content:content, ephemeral:true, files:shopFiles})
    if(fup != ""){
        await interaction.followUp({content:fup, ephemeral:true, files:fupFiles})
    }
}
