#!/usr/bin/env python3
"""Build Mournwood's art from game-icons.net (4200+ free CC-BY SVG icons, one cohesive
silhouette style). For each slot we list a few candidate icon names (first that exists
wins), fetch it, strip the black background square, and recolor to the game's palette
(witchfire-green cards, bone monsters/hunters). Saves transparent SVGs into ../assets/.

Free, no API key. Run from repo root:  python3 tools/build_icons.py
Attribution required (CC BY 3.0) — shown in the in-game Codex.
"""
import json, re, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
RAW = "https://raw.githubusercontent.com/game-icons/icons/master/"
WITCH = "#9be38b"   # cards
BONE = "#e7e4d6"    # monsters, hunters, hound

# Fetch the catalog (basename -> author/name.svg). Cached in tools/.iconmap.json.
def catalog():
    cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".iconmap.json")
    if os.path.exists(cache):
        return json.load(open(cache))
    url = "https://api.github.com/repos/game-icons/icons/git/trees/master?recursive=1"
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=60))
    names = {}
    for t in d.get("tree", []):
        p = t["path"]
        if p.endswith(".svg"):
            names.setdefault(os.path.splitext(os.path.basename(p))[0], p)
    json.dump(names, open(cache, "w"))
    return names

NAMES = catalog()

# slot -> list of candidate icon basenames (first existing one is used)
ENEMIES = {
  "thornwretch":     ["thorny-vine", "tangled-vine", "root-tip"],
  "gloomwolf":       ["wolf-head", "wolf-howl"],
  "bonehusk":        ["death-skull", "skeleton", "bone-knife"],
  "mireling":        ["water-drop", "droplet", "splash", "swamp", "frog"],
  "hollowstag":      ["stag-head", "deer-head", "elk", "antlers"],
  "briarmother":     ["evil-tree", "venus-flytrap", "tree-face", "carnivorous-plant"],
  "bogleech":        ["leeching", "worms", "worm", "maggot"],
  "drowned":         ["drowning", "half-dead", "shambling-zombie", "zombie"],
  "gasbloat":        ["poison-cloud", "gas-mask", "toxic-waste", "fart"],
  "fenstalker":      ["long-legged-spider", "mantrap", "crab-claw"],
  "spiderling":      ["spider", "spider-alt", "spider-face"],
  "mirewidow":       ["spider-face", "spider-bot", "masked-spider"],
  "fenmaw":          ["shark-jaws", "fangs", "sharp-lips", "maw"],
  "gloomspawn":      ["tentacurl", "evil-eyes", "tentacle", "octopus"],
  "rotpriest":       ["cultist", "hooded-figure", "pope-crown", "executioner-hood"],
  "thornhorror":     ["minotaur", "troll", "ogre", "monster-grasp"],
  "direwolf":        ["wolf-howl", "wolf-head", "barking-dog"],
  "antleredpenance": ["horned-skull", "elk", "horned-helm", "deer-head"],
  "heartrot":        ["heart-organ", "heart-beats", "anatomy"],
}
HUNTERS = {
  "houndmaster": ["hunting-horn", "wolf-head", "sitting-dog"],
  "assassin":    ["hooded-assassin", "cloak-dagger", "hood", "stiletto"],
  "tinker":      ["gears", "cog", "auto-repair", "spanner"],
  "hound":       ["sitting-dog", "dog-bowl", "wolf-head"],
}
CARDS = {
  # Houndmaster
  "rake": ["claw-slashes", "claws", "claw"],
  "brace": ["round-shield", "shield", "shield-bash"],
  "sicem": ["fangs", "wolf-head", "barking-dog"],
  "feed": ["meat", "steak", "ham-shank", "meal"],
  "maul": ["spiked-mace", "flanged-mace", "mace-head"],
  "rend": ["ripping-claw", "claw", "bleeding-wound"],
  "bloodscent": ["sniffing", "nose-side", "blood", "scent-of-blood"],
  "gut": ["bowie-knife", "cleaver", "guts", "stomach"],
  "packbond": ["paw-print", "paw", "two-shadows", "wolf-head"],
  "frenzy": ["enrage", "wolf-howl", "claw-hammer"],
  "mend": ["heart-plus", "medical-pack", "healing", "bandage-roll"],
  "snare": ["mantrap", "foot-trap", "snare", "wolf-trap"],
  "gorge": ["meat-cleaver", "carnivore-mouth", "meal", "fangs"],
  # Assassin
  "nick": ["plain-dagger", "stiletto", "curvy-knife"],
  "dart": ["thrown-knife", "dart", "thrown-daggers", "throwing-ball"],
  "guard": ["crossed-swords", "sword-clash", "parry"],
  "slip": ["dodging", "dodge", "run"],
  "eviscerate": ["sword-wound", "serrated-blade", "bloody-sword"],
  "shadowstep": ["cloak-dagger", "hood", "shadow-follower", "stealth"],
  "bloodrush": ["card-draw", "card-pickup", "sprint", "fast-arrow"],
  "twinfang": ["crossed-sabres", "two-handed-sword", "daggers", "fangs"],
  "assassinate": ["backstab", "hidden-blade", "spectre", "stiletto"],
  "whirl": ["spinning-blades", "saw-blade", "sword-spin", "twister"],
  "pierce": ["piercing-sword", "thrust", "spear-head"],
  "momentum": ["wingfoot", "sprint", "speedometer", "run"],
  "coupdegrace": ["decapitation", "executioner-hood", "guillotine"],
  "exsang": ["blood", "bleeding-wound", "dripping-knife", "blood-drop"],
  "ambush": ["ambush", "pounce", "trap"],
  # Tinker
  "bolt": ["crossbow", "crossbow-bolt", "arrow"],
  "plating": ["breastplate", "metal-scales", "armor-vest", "metal-plate"],
  "deployturret": ["turret", "gun-turret", "auto-repair"],
  "deploygrinder": ["gears", "cog", "saw-blade", "sawed-off-shotgun"],
  "crank": ["lever", "gear-stick", "spanner", "gear-hammer"],
  "deploybellows": ["bellows", "anvil-impact", "forging"],
  "deployneedler": ["syringe", "needle-drill", "striking-arrows"],
  "megacannon": ["cannon", "mortar-shell", "field-gun"],
  "overclock": ["electrical-crescent", "lightning-arc", "gear-heart", "overdrive"],
  "overdrive": ["clockwork", "cog", "gear-hammer"],
  "scrapblast": ["explosion", "shrapnel-bomb", "wind-hole", "spikeball"],
  "reinforce": ["upgrade", "armor-upgrade", "metal-plate"],
  "piston": ["mechanical-arm", "piston", "fist"],
  # Pacts
  "corrode": ["acid", "corrosion", "acid-blob", "chemical-drop"],
  "pestilence": ["fly", "virus", "death-zone", "biohazard"],
  "fester": ["pus", "open-wound", "bubbling-bowl"],
  "bulwark": ["tower-shield", "round-shield", "shield"],
  "bramblemail": ["spiked-armor", "thorny-vine", "spiked-shoulder-armor"],
  "ironcrush": ["gauntlet", "crush", "fist", "punch-blast"],
  "moonrise": ["crescent-moon", "moon", "half-moon"],
  "bloodmoon": ["evil-moon", "moon-claws", "moon-orbit"],
  "frenzystrike": ["claw", "bear-claw", "ripping-claw"],
  "immolate": ["flame", "fire", "flamer"],
  "pyre": ["bonfire", "campfire", "fire"],
  "ashenpact": ["burning-skull", "pentacle", "fire-silhouette"],
  "vanish": ["smoke-bomb", "hooded-figure", "invisible"],
  "mistveil": ["fog", "windy-stripes", "wind-slap"],
  "ashdoubt": ["broken-skull", "cracked-glass", "tombstone"],
  "taint": ["vile-fluid", "poison", "death-juice", "biohazard"],
}


def pick(cands):
    for c in cands:
        if c in NAMES:
            return c
    return None


def grab(icon, out, color):
    svg = urllib.request.urlopen(RAW + NAMES[icon], timeout=30).read().decode()
    svg = re.sub(r'<path[^>]*d="M0 0h512v512H0[zZ]"[^>]*/>', '', svg)   # drop bg square
    svg = svg.replace("#fff", color).replace("#ffffff", color)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(svg)


def run(group, folder, color):
    misses = []
    for slot, cands in group.items():
        icon = pick(cands)
        if not icon:
            misses.append(slot); print("  MISS", slot, cands); continue
        out = os.path.join(A, folder, slot + ".svg")
        if os.path.exists(out):
            print("  skip", slot); continue
        try:
            grab(icon, out, color); print(f"  ok {slot} <- {icon}")
        except Exception as e:
            misses.append(slot); print("  ERR", slot, repr(e)[:80])
    return misses


if __name__ == "__main__":
    m = []
    print("Enemies:"); m += run(ENEMIES, "enemies", BONE)
    print("Hunters:"); m += run(HUNTERS, "portraits", BONE)
    print("Cards:"); m += run(CARDS, "cards", WITCH)
    print("\nDone." + (f" MISSES ({len(m)}): {m}" if m else " All slots filled."))
