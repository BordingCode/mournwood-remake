// Pacts — each run pairs a Hunter with ONE Pact (a themed mini-set of cards + relics merged
// into the run's offering pools, plus a guaranteed starting relic). 3 hunters × 5 pacts = 15
// distinct builds, and the Pact cards work with any hunter (guaranteed cross-synergy).
export const PACTS = {
  worm: {
    id: 'worm', name: 'Pact of the Worm', icon: '🪱',
    desc: 'Rot. Stack poison and let your prey die from the inside.',
    cards: ['corrode', 'pestilence', 'fester'],
    startRelic: 'rot_sigil', relics: ['plague_censer'],
  },
  iron: {
    id: 'iron', name: 'Pact of Iron', icon: '⛓️',
    desc: 'Thorns & plate. Turtle up and punish every blow they land.',
    cards: ['bulwark', 'bramblemail', 'ironcrush'],
    startRelic: 'iron_carapace', relics: ['barbed_hide'],
  },
  moon: {
    id: 'moon', name: 'Pact of the Moon', icon: '🌙',
    desc: 'Beast-frenzy. Trade blood and breath for raw, growing Strength.',
    cards: ['moonrise', 'bloodmoon', 'frenzystrike'],
    startRelic: 'lunar_fang', relics: ['bloodlust'],
  },
  ash: {
    id: 'ash', name: 'Pact of Ash', icon: '🔥',
    desc: 'Sacrifice. Burn your own life for devastating fire.',
    cards: ['immolate', 'pyre', 'ashenpact'],
    startRelic: 'ember_heart', relics: ['cinder_brand'],
  },
  mist: {
    id: 'mist', name: 'Pact of Mist', icon: '🌫️',
    desc: 'Stealth. Vanish behind Block and weaken the whole pack.',
    cards: ['vanish', 'mistveil', 'ambush'],
    startRelic: 'smoke_bomb', relics: ['ghost_step'],
  },
};

export const PACT_IDS = Object.keys(PACTS);
