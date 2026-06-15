#!/usr/bin/env python3
"""Generate Mournwood (remake) art via a free Hugging Face public Space (Flux, no API
key / no signup). House style = grim dark-fantasy WOODCUT / linocut, ash & ink, one
witchfire-green accent. Resumable: skips files that already exist. Saves small WebP
into ../assets/.  Run from repo root:

    python3 tools/gen_art.py

Needs: pip install --break-system-packages gradio_client
"""
import os, io, time, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")

# Cohesive house style appended per kind.
NOFRAME = "full bleed, fills the frame edge to edge, no text, no border, no frame, no signature, no watermark"
CHAR_STYLE = ("grim dark-fantasy woodcut illustration, heavy black ink linocut, high-contrast "
    "engraving, ash-grey and charcoal palette, a single eerie witchfire-green glow accent, "
    "centered subject, ominous, gnarled, painterly woodblock print, sharp focus, " + NOFRAME)
ENV_STYLE = ("grim dark-fantasy woodcut landscape, black ink linocut engraving, ash-grey and "
    "charcoal palette, eerie witchfire-green glow, atmospheric fog, dying haunted forest, "
    "painterly woodblock print, cinematic, no people in foreground, " + NOFRAME)
CARD_STYLE = ("grim woodcut emblem icon, black ink linocut, high contrast, ash-grey on near-black, "
    "a single witchfire-green accent, one centered object, simple dark background, "
    "woodblock print, " + NOFRAME)

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


# Two free backends. BACKEND=cf → Cloudflare Workers AI (recommended: free daily allowance,
# best quality, no rate-limit pain). BACKEND=hf → a public Hugging Face Flux Space (truly no
# signup, but anonymous ZeroGPU caps at ~2 images/day — needs HF_TOKEN to go further).
BACKEND = os.environ.get("ART_BACKEND", "cf")
HF_SPACE = os.environ.get("HF_SPACE", "KingNish/Realtime-FLUX")
HF_TOKEN = os.environ.get("HF_TOKEN", "").strip()
CF_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
CF_ACCT = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
CF_MODEL = os.environ.get("CF_MODEL", "@cf/black-forest-labs/flux-1-schnell")

_client = None
def hf_client(fresh=False):
    global _client
    if _client is None or fresh:
        from gradio_client import Client
        _client = Client(HF_SPACE, hf_token=HF_TOKEN or None, verbose=False)
    return _client


def produce(prompt, w, h, seed):
    """Return a PIL.Image for the prompt using the selected free backend."""
    from PIL import Image
    if BACKEND == "cf":
        import json, base64, urllib.request
        url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCT}/ai/run/{CF_MODEL}"
        body = json.dumps({"prompt": prompt, "steps": 6, "seed": int(seed)}).encode()
        req = urllib.request.Request(url, data=body, method="POST", headers={
            "Authorization": "Bearer " + CF_TOKEN, "Content-Type": "application/json"})
        data = urllib.request.urlopen(req, timeout=180).read()
        d = json.loads(data)
        if not d.get("success"):
            raise RuntimeError(str(d.get("errors")))
        return Image.open(io.BytesIO(base64.b64decode(d["result"]["image"]))).convert("RGB")
    # hf
    res = hf_client().predict(prompt=prompt, seed=float(seed), width=float(w), height=float(h),
                              api_name="/generate_image")
    img = res[0] if isinstance(res, (list, tuple)) else res
    p = (img.get("path") or img.get("url")) if isinstance(img, dict) else img
    if isinstance(p, str) and p.startswith("http"):
        import urllib.request
        tmp = "/tmp/_artdl"; urllib.request.urlretrieve(p, tmp); p = tmp
    return Image.open(p).convert("RGB")


def make(path, prompt, w, h, seed, final, q=80):
    full = os.path.join(A, path + ".webp")
    if os.path.exists(full) and os.path.getsize(full) > 2000:
        print("  skip (exists):", path); return True
    os.makedirs(os.path.dirname(full), exist_ok=True)
    for attempt in range(5):
        try:
            img = produce(prompt, w, h, seed)
            if final and img.size != final:
                img = img.resize(final, __import__("PIL").Image.LANCZOS)
            img.save(full, "WEBP", quality=q, method=6)
            print(f"  ok: {path}.webp  {img.size}  {os.path.getsize(full)//1024}KB")
            time.sleep(1)
            return True
        except Exception as e:
            print(f"  retry {attempt+1} {path}: {repr(e)[:140]}")
            time.sleep(4 + attempt * 4)
            if BACKEND == "hf":
                try: hf_client(fresh=True)
                except Exception: pass
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
