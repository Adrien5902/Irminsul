import asyncio
import genshin
import json
import sys
from datetime import datetime, timedelta

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, timedelta):
            return obj.total_seconds()
        elif hasattr(obj, '__dict__'):
            return vars(obj)
        elif obj.__dict__ :
            return obj.__dict__
        elif isinstance(obj, (list, tuple)):
            return [self.default(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: self.default(value) for key, value in obj.items()}
        else:
            return super().default(obj)

async def main(server, ltoken, ltuid, arg = "account"):
    try:
        client = genshin.Client({"ltuid": ltuid, "ltoken": ltoken}, lang="fr-fr")
        client.default_game = genshin.Game.GENSHIN
        accounts = await client.get_game_accounts()
        fAcc = False
        info = {"err": "NoInfo"}
        for account in accounts:
            if(account.game_biz == "hk4e_global" and account.server_name == server + " Server"):
                fAcc = account

        if fAcc:
            if arg == "resin":
                notes = await client.get_notes(fAcc.uid)
                info = {"value": notes.current_resin, "max": notes.max_resin},
                info = info[0]
            elif arg == "notes":
                notes = await client.get_notes(fAcc.uid)
                info = notes
            elif arg == "account":
                info = {"ar": fAcc.level, "name": fAcc.nickname,  "uid": fAcc.uid},
                info = info[0]
            elif arg == "info":
                user = await client.get_full_genshin_user(fAcc.uid)
                info = {
                    "ar": fAcc.level,
                    "name": fAcc.nickname,
                    "uid": fAcc.uid,
                    "abyss": {"stars":user.abyss.current.total_stars,"floor":user.stats.spiral_abyss},
                    "achievements": user.stats.achievements,
                    "days_active": user.stats.days_active,
                    "characters": user.stats.characters,
                },
                info = info[0]
            elif arg == "check-in":
                try:
                    info = await client.claim_daily_reward(game="genshin")
                except genshin.AlreadyClaimed:
                    info = {"claimed": True}
            elif arg == "calc":
                characters = await client.get_calculator_characters(uid=fAcc.uid, lang="fr-fr", sync=True, include_traveler=False)
                res = []
                for i in range(len(characters)):
                    character_details = await client.get_character_details(characters[i].id)
                    character_data = {**characters[i].__dict__, **character_details.__dict__}

                    res.append(character_data)
                    
                with open("calcs/"+ltuid+".json", "w") as outfile:
                    outfile.write(json.dumps(res, cls=CustomJSONEncoder))

                    info = {"err": False}
            elif arg == "user":
                user = await client.get_partial_genshin_user(fAcc.uid)
                    
                with open("test.json", "w") as outfile:
                    outfile.write(json.dumps(user, cls=CustomJSONEncoder))

                    info = {"err": False}
            else:
                info = {"err": "Wrong procspawn argument"}
        else:
            info = {"err":"NoAccount"}
    except genshin.errors.TooManyRequests:
        info = {"err":"Ralentis le bot surchaufe!"}

    print(json.dumps(info, cls=CustomJSONEncoder))

asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]))