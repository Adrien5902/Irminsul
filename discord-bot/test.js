const {getFarming} = require("./farming.js")

getFarming({discordId: "535555445398437888"}, true, 80)
.then((value)=>{
    for(i = 0; i < 30; i++){
        console.log(value[i], i)
    }
})
.catch((err)=>{
    console.error(err)
})