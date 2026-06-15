#!/usr/bin/env python3
"""Compose Mournwood's title + combat BACKGROUND scenes as woodcut SVGs, reusing
game-icons.net tree/moon silhouettes (free, CC BY 3.0) layered over hand-built sky/
fog gradients. Saves assets/ui/title.svg and assets/backgrounds/combat.svg.

Free, no API key. Run from repo root:  python3 tools/build_backgrounds.py
"""
import json, re, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets")
RAW = "https://raw.githubusercontent.com/game-icons/icons/master/"
NAMES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".iconmap.json")))

def inner(icon):
    """Fetch an icon, drop its bg square, strip fills → reusable <symbol> body (512x512)."""
    svg = urllib.request.urlopen(RAW + NAMES[icon], timeout=30).read().decode()
    svg = re.sub(r'<path[^>]*d="M0 0h512v512H0[zZ]"[^>]*/>', '', svg)
    svg = re.sub(r'\sfill="#[fF]{3,6}"', '', svg)            # let <use fill> drive color
    m = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S)
    return m.group(1) if m else svg

ICONS = ["dead-wood", "pine-tree", "oak", "tombstone", "evil-moon"]
SYMS = {ic: inner(ic) for ic in ICONS}

def tree(ic, x, y, w, fill, op=1):
    # inline the icon's paths in a transformed <g> (robust inside a CSS background SVG)
    s = w / 512.0
    return f'<g transform="translate({x},{y}) scale({s:.4f})" fill="{fill}" opacity="{op}">{SYMS[ic]}</g>'

DARK = "#040504"; DARK2 = "#0a0d09"; WITCH = "#9be38b"; BONE = "#cfd8c2"

# Portrait orientation (phone-first): key elements kept away from the extreme top/bottom
# so background-size:cover crops gracefully on tall screens.
W, H = 768, 1280

def title_svg():
    defs = f'''<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0a0f0a"/><stop offset="50%" stop-color="#0b0e0b"/>
        <stop offset="100%" stop-color="#0e150d"/></linearGradient>
      <radialGradient id="moonglow" cx="50%" cy="22%" r="38%">
        <stop offset="0" stop-color="#9be38b" stop-opacity="0.55"/>
        <stop offset="55%" stop-color="#3f7a45" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#3f7a45" stop-opacity="0"/></radialGradient>
      <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#11160f" stop-opacity="0"/>
        <stop offset="100%" stop-color="#10180e" stop-opacity="0.85"/></linearGradient>
      <radialGradient id="horizon" cx="50%" cy="100%" r="75%">
        <stop offset="0" stop-color="#2c4a2a" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="#1a2a18" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#1a2a18" stop-opacity="0"/></radialGradient></defs>'''
    moon = f'<rect width="{W}" height="{H}" fill="url(#moonglow)"/>' \
           f'{tree("evil-moon", 254, 120, 260, WITCH, 0.85)}'
    glow = f'<rect y="{H-560}" width="{W}" height="560" fill="url(#horizon)"/>'
    # back treeline (smaller, dimmer) then front treeline (bigger, darker), in the lower half
    back = "".join(tree("pine-tree", x, H - 470, 200, DARK2, 0.7) for x in range(-40, W + 60, 150))
    treeset = ["dead-wood", "oak", "pine-tree", "dead-wood", "oak", "dead-wood"]
    widths = [340, 300, 280, 360, 320, 340]
    front, x = "", -90
    for ic, w in zip(treeset, widths):
        front += tree(ic, x, H - w + 40, w, DARK)
        x += int(w * 0.62)
    fog = f'<rect y="{H-420}" width="{W}" height="420" fill="url(#fog)"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="xMidYMid slice">{defs}'
            f'<rect width="{W}" height="{H}" fill="url(#sky)"/>{moon}{glow}{back}{fog}{front}</svg>')

def combat_svg():
    shafts = "".join(
        f'<polygon points="{220+i*150},0 {290+i*150},0 {120+i*150},{H} {40+i*150},{H}" '
        f'fill="#9be38b" opacity="0.05"/>' for i in range(3))
    defs = f'''<defs>
      <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d130c"/><stop offset="55%" stop-color="#0b0e0b"/>
        <stop offset="100%" stop-color="#0f160d"/></linearGradient>
      <radialGradient id="haze" cx="50%" cy="12%" r="55%">
        <stop offset="0" stop-color="#3f7a45" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#3f7a45" stop-opacity="0"/></radialGradient>
      <linearGradient id="fog2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#10180e" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0c120b" stop-opacity="0.92"/></linearGradient>
      <radialGradient id="horizon2" cx="50%" cy="92%" r="70%">
        <stop offset="0" stop-color="#2c4a2a" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#1a2a18" stop-opacity="0"/></radialGradient></defs>'''
    # tall trees frame both edges, centre kept clear for the fighters
    left = (tree("dead-wood", -180, 120, 520, DARK) + tree("pine-tree", -40, 360, 360, DARK2, 0.8)
            + tree("oak", -120, 520, 420, DARK))
    right = (tree("dead-wood", W - 340, 120, 520, DARK) + tree("pine-tree", W - 320, 360, 360, DARK2, 0.8)
             + tree("oak", W - 300, 520, 420, DARK))
    stones = tree("tombstone", 120, H - 220, 150, DARK2, 0.6) + tree("tombstone", W - 260, H - 200, 140, DARK2, 0.6)
    fog = f'<rect y="{H-460}" width="{W}" height="460" fill="url(#fog2)"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="xMidYMid slice">{defs}'
            f'<rect width="{W}" height="{H}" fill="url(#sky2)"/>'
            f'<rect width="{W}" height="{H}" fill="url(#haze)"/>'
            f'<rect y="{H-560}" width="{W}" height="560" fill="url(#horizon2)"/>'
            f'{shafts}{left}{right}{stones}{fog}</svg>')

if __name__ == "__main__":
    os.makedirs(os.path.join(A, "ui"), exist_ok=True)
    os.makedirs(os.path.join(A, "backgrounds"), exist_ok=True)
    open(os.path.join(A, "ui/title.svg"), "w").write(title_svg())
    open(os.path.join(A, "backgrounds/combat.svg"), "w").write(combat_svg())
    print("wrote assets/ui/title.svg + assets/backgrounds/combat.svg")
