#!/usr/bin/env python3
"""Generate Mournwood (remake) art from Pollinations.ai (free Flux text-to-image).

House style = grim dark-fantasy WOODCUT / linocut, ash & ink, one witchfire-green
accent — to match the remake's locked art direction. Resumable: skips files that
already exist. Saves small WebP into ../assets/.  Run from repo root:

    python3 tools/gen_art.py
"""
import os, io, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

# Cohesive house style appended per kind.
CHAR_STYLE = ("grim dark-fantasy woodcut illustration, heavy black ink linocut, high-contrast "
    "engraving, ash-grey and charcoal palette, a single eerie witchfire-green glow accent, "
    "centered subject, ominous, gnarled, painterly woodblock print, sharp focus, no text, no border")
ENV_STYLE = ("grim dark-fantasy woodcut landscape, black ink linocut engraving, ash-grey and "
    "charcoal palette, eerie witchfire-green glow, atmospheric fog, dying haunted forest, "
    "painterly woodblock print, cinematic, no text, no people in foreground")
CARD_STYLE = ("grim woodcut emblem icon, black ink linocut, high contrast, ash-grey on near-black, "
    "a single witchfire-green accent, one centered object, simple dark background, "
    "woodblock print, no text, no border, no frame")

ENEMIES = {
    "thornwretch":     "a hunched humanoid wretch made of thorny brambles and dead vines",
    "gloomwolf":       "a gaunt shadowy wolf with pale glowing eyes, bristling fur, snarling",
    "bonehusk":        "a hollow skeletal husk creature, cracked bones bound in roots, empty eye sockets",
    "mireling":        "a small dripping bog creature of mud and reeds with glowing eyes",
    "hollowstag":      "a towering eerie stag-skull spirit with enormous antlers, hollow glowing eyes, draped in moss",
    "briarmother":     "a colossal monstrous mother of thorns, a looming plant-witch beast wreathed in roots and brambles, terrifying",
    "bogleech":        "a giant bloated leech rearing up with a ringed maw of teeth, slick swamp parasite",
    "drowned":         "a waterlogged drowned undead figure rising from black swamp water, draped in weeds and chains, hollow eyes",
    "gasbloat":        "a bloated swollen swamp toad-creature leaking toxic gas, distended and sickly",
    "fenstalker":      "a tall gaunt swamp predator on long spindly legs, reeds and slime, stalking through fog",
    "spiderling":      "a small menacing swamp spider with many legs and dripping fangs",
    "mirewidow":       "a huge monstrous swamp widow spider-queen, bloated abdomen, many glowing eyes, webs and bog",
    "fenmaw":          "a vast swamp leviathan, an enormous maw of teeth rising from black water, tentacular roots, terrifying",
    "gloomspawn":      "a writhing mass of living shadow and rot tendrils with glowing cracks, dark forest horror",
    "rotpriest":       "a hooded decaying priest dripping black rot, holding a ceremonial bone staff, sunken glowing eyes",
    "thornhorror":     "a hulking horror of fused thorns, bone and black bark with jagged limbs, monstrous",
    "direwolf":        "a massive corrupted dire wolf with black bark-like fur, glowing eyes and dripping fangs, feral",
    "antleredpenance": "a tall robed penitent figure crowned with vast cruel antlers, bound in chains and thorns, eerie",
    "heartrot":        "the dying wood's heart made flesh, a vast pulsing rotten tree-heart monster wreathed in roots and black sap with a glowing core, final boss, terrifying",
}

PORTRAITS = {  # hunters + the hound, half-body character portraits
    "houndmaster": "a grim hooded monster-hunter ranger with a hunting horn and a leashed beast-hound at his side, leather and fur, scarred, determined",
    "assassin":    "a lithe hooded assassin hunter twirling twin curved daggers, dark wrappings, masked face, deadly poise",
    "tinker":      "a goggled tinker-hunter bristling with brass mechanical contraptions and gadgets on a tool harness, clever and grim",
    "hound":       "a fierce loyal scarred hunting war-hound, bristling fur, glowing eyes, baring fangs",
}

ENV = {
    "ui/title":           ("epic key art: a lone hooded monster-hunter standing before a vast dying haunted forest under a sickly green moon, ash falling, ominous", 1024, 640, (1024, 640)),
    "backgrounds/combat": ("a haunted dying forest clearing battleground, twisted dead black trees, drifting ash and fog, empty foreground with no characters, wide", 1024, 640, (1024, 640)),
}

CARDS = {
    "rake": "three bloody parallel claw slashes",
    "brace": "a battered round wooden shield braced",
    "sicem": "a snarling hound lunging forward on command",
    "feed": "a chunk of raw meat offered to a beast",
    "maul": "a heavy spiked maul hammer crushing armor plate",
    "rend": "two crossed claws tearing dripping flesh",
    "bloodscent": "a hound's nose tracking a trail of blood drops",
    "gut": "a curved gutting knife slicing open, spilling",
    "packbond": "a hunter and hound silhouette bound by a glowing thread",
    "frenzy": "a hound biting twice in a blur of fangs",
    "mend": "a bandaged paw with a glowing healing mark",
    "snare": "a sprung iron jaw trap with a rope",
    "gorge": "a ravenous beast feeding, swelling with power",
    "nick": "a single small quick dagger nick, a cut",
    "dart": "a thrown spinning throwing dart",
    "guard": "a raised parrying dagger deflecting a blow",
    "slip": "a cloaked figure slipping aside in motion",
    "eviscerate": "a long curved blade disemboweling, dramatic",
    "shadowstep": "a figure dissolving into shadow mid-step",
    "bloodrush": "a hand drawing cards fast amid blood drops",
    "twinfang": "two crossed fang-daggers striking together",
    "assassinate": "a dagger plunged into a vital point, killing blow",
    "whirl": "a spinning whirlwind of blades in all directions",
    "pierce": "a thin blade piercing through armor",
    "momentum": "a building blur of motion and speed lines",
    "coupdegrace": "an executioner's final dagger raised for a killing stroke",
    "exsang": "blood draining from a wound into a blade",
    "bolt": "a heavy crossbow bolt loosed",
    "plating": "a riveted iron armor plating segment",
    "deployturret": "a small mounted mechanical turret gun on legs",
    "deploygrinder": "a spinning mechanical grinding-gear shield device",
    "crank": "a turning hand crank lever with gears",
    "deploybellows": "a mechanical bellows pumping forge air",
    "deployneedler": "a mechanical needle-launcher device firing darts",
    "megacannon": "a huge mounted heavy cannon contraption",
    "overclock": "an overheating glowing machine core throwing sparks",
    "overdrive": "gears spinning wildly with bursts of energy",
    "scrapblast": "an explosion of scrap metal and bolts",
    "reinforce": "a machine bolting on extra armor plates",
    "piston": "a mechanical piston fist punching forward",
    "corrode": "a splash of corrosive acid eating through metal",
    "pestilence": "a cloud of plague flies and green miasma",
    "fester": "a festering rotten wound oozing",
    "bulwark": "a great tower shield wall",
    "bramblemail": "body armor woven from thorny brambles",
    "ironcrush": "an iron gauntlet crushing, paired with a shield",
    "moonrise": "a sickly crescent moon rising over a ridge",
    "bloodmoon": "an eclipsed blood-and-green moon",
    "frenzystrike": "a frenzied double clawing strike",
    "immolate": "a figure wreathed in roaring flames",
    "pyre": "a burning sacrificial pyre of flames",
    "ashenpact": "a hand making a dark pact over ash and fire",
    "vanish": "a figure vanishing into smoke and mist",
    "mistveil": "a veil of creeping fog rolling in",
    "ambush": "a hidden dagger striking from darkness by surprise",
    "ashdoubt": "a cracked skull clogged with grey ash, a curse",
    "taint": "creeping black rot spreading like veins, a curse",
}


# Pollinations now requires a (free) Seed-tier token. Get one at https://auth.pollinations.ai
# (free GitHub login, no payment), then either set POLLINATIONS_TOKEN or drop the token
# string into tools/.pollinations_token (gitignored). Rate limit on Seed = 1 req / 5s.
MODEL = os.environ.get("POLLINATIONS_MODEL", "flux")
def _token():
    t = os.environ.get("POLLINATIONS_TOKEN", "").strip()
    if t:
        return t
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pollinations_token")
    if os.path.exists(p):
        return open(p).read().strip()
    return ""
TOKEN = _token()


def fetch(prompt, w, h, seed):
    url = ("https://image.pollinations.ai/prompt/" + urllib.parse.quote(prompt)
           + f"?width={w}&height={h}&seed={seed}&model={MODEL}&nologo=true&enhance=false")
    headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://pollinations.ai/"}
    if TOKEN:
        headers["Authorization"] = "Bearer " + TOKEN
    req = urllib.request.Request(url, headers=headers)
    time.sleep(5.5 if TOKEN else 16)  # respect Seed (5s) / anonymous (15s) rate limit
    return urllib.request.urlopen(req, timeout=180).read()


def make(path, prompt, w, h, seed, final, q=80):
    full = os.path.join(A, path + ".webp")
    if os.path.exists(full) and os.path.getsize(full) > 2000:
        print("  skip (exists):", path); return True
    os.makedirs(os.path.dirname(full), exist_ok=True)
    from PIL import Image
    for attempt in range(4):
        try:
            data = fetch(prompt, w, h, seed)
            img = Image.open(io.BytesIO(data)).convert("RGB")
            if final and img.size != final:
                img = img.resize(final, Image.LANCZOS)
            img.save(full, "WEBP", quality=q, method=6)
            print(f"  ok: {path}.webp  {img.size}  {os.path.getsize(full)//1024}KB")
            return True
        except Exception as e:
            print(f"  retry {attempt+1} {path}: {e}"); time.sleep(3 + attempt * 3)
    print("  FAILED:", path); return False


def seed_of(name):  # stable per-slot seed so reruns are deterministic
    return abs(hash(name)) % 90000 + 1000


def main():
    print("Enemies:")
    for k, core in ENEMIES.items():
        make(f"enemies/{k}", core + ", " + CHAR_STYLE, 768, 768, seed_of("e" + k), (512, 512))
    print("Portraits (hunters + hound):")
    for k, core in PORTRAITS.items():
        make(f"portraits/{k}", "half-body portrait of " + core + ", " + CHAR_STYLE, 640, 768, seed_of("p" + k), (512, 614))
    print("Environments:")
    for path, (core, w, h, final) in ENV.items():
        make(path, core + ", " + ENV_STYLE, w, h, seed_of("v" + path), final)
    print("Cards:")
    for k, core in CARDS.items():
        make(f"cards/{k}", core + ", " + CARD_STYLE, 512, 512, seed_of("c" + k), (320, 320), q=78)
    print("Done.")


if __name__ == "__main__":
    # PYTHONHASHSEED must be fixed for deterministic seeds across runs.
    if os.environ.get("PYTHONHASHSEED") != "0":
        os.environ["PYTHONHASHSEED"] = "0"
        os.execv(__import__("sys").executable, [__import__("sys").executable] + __import__("sys").argv)
    main()
