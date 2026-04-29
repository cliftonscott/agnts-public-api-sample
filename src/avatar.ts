const AVATAAARS_MAPPING_VERSION = 1;
const AVATAAARS_BASE_URL = "https://avataaars.io/";

const TOP_TYPES = [
  "NoHair",
  "Eyepatch",
  "Hat",
  "Hijab",
  "Turban",
  "WinterHat1",
  "WinterHat2",
  "WinterHat3",
  "WinterHat4",
  "LongHairBigHair",
  "LongHairBob",
  "LongHairBun",
  "LongHairCurly",
  "LongHairCurvy",
  "LongHairDreads",
  "LongHairFrida",
  "LongHairFro",
  "LongHairFroBand",
  "LongHairNotTooLong",
  "LongHairShavedSides",
  "LongHairMiaWallace",
  "LongHairStraight",
  "LongHairStraight2",
  "LongHairStraightStrand",
  "ShortHairDreads01",
  "ShortHairDreads02",
  "ShortHairFrizzle",
  "ShortHairShaggyMullet",
  "ShortHairShortCurly",
  "ShortHairShortFlat",
  "ShortHairShortRound",
  "ShortHairShortWaved",
  "ShortHairSides",
  "ShortHairTheCaesar",
  "ShortHairTheCaesarSidePart"
];

const ACCESSORIES_TYPES = [
  "Blank",
  "Kurt",
  "Prescription01",
  "Prescription02",
  "Round",
  "Sunglasses",
  "Wayfarers"
];

const HAIR_COLORS = [
  "Auburn",
  "Black",
  "Blonde",
  "BlondeGolden",
  "Brown",
  "BrownDark",
  "PastelPink",
  "Blue",
  "Platinum",
  "Red",
  "SilverGray"
];

const FACIAL_HAIR_TYPES = [
  "Blank",
  "BeardMedium",
  "BeardLight",
  "BeardMajestic",
  "MoustacheFancy",
  "MoustacheMagnum"
];

const FACIAL_HAIR_COLORS = [
  "Auburn",
  "Black",
  "Blonde",
  "BlondeGolden",
  "Brown",
  "BrownDark",
  "Platinum",
  "Red"
];

const CLOTHE_TYPES = [
  "BlazerShirt",
  "BlazerSweater",
  "CollarSweater",
  "GraphicShirt",
  "Hoodie",
  "Overall",
  "ShirtCrewNeck",
  "ShirtScoopNeck",
  "ShirtVNeck"
];

const CLOTHE_COLORS = [
  "Black",
  "Blue01",
  "Blue02",
  "Blue03",
  "Gray01",
  "Gray02",
  "Heather",
  "PastelBlue",
  "PastelGreen",
  "PastelOrange",
  "PastelRed",
  "PastelYellow",
  "Pink",
  "Red",
  "White"
];

const EYE_TYPES = [
  "Close",
  "Cry",
  "Default",
  "EyeRoll",
  "Happy",
  "Hearts",
  "Side",
  "Squint",
  "Surprised"
];

const EYEBROW_TYPES = [
  "Angry",
  "AngryNatural",
  "Default",
  "DefaultNatural",
  "FlatNatural",
  "RaisedExcited",
  "RaisedExcitedNatural",
  "SadConcerned",
  "SadConcernedNatural",
  "UnibrowNatural",
  "UpDown",
  "UpDownNatural"
];

const MOUTH_TYPES = [
  "Concerned",
  "Default",
  "Disbelief",
  "Eating",
  "Grimace",
  "Sad",
  "ScreamOpen",
  "Serious",
  "Smile",
  "Tongue",
  "Twinkle",
  "Vomit"
];

const SKIN_COLORS = [
  "Tanned",
  "Yellow",
  "Pale",
  "Light",
  "Brown",
  "DarkBrown",
  "Black"
];

const avatarUrlCache = new Map<string, Promise<string>>();

function pick(values: readonly string[], rand: () => number): string {
  const index = Math.floor(rand() * values.length);
  return values[Math.min(Math.max(index, 0), values.length - 1)] ?? values[0] ?? "";
}

function createMulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state ^ (state >>> 15);
    t = Math.imul(t, t | 1) >>> 0;
    return t / 4294967296;
  };
}

function fallbackSeedState(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function seedState(seed: string): Promise<number> {
  if (!globalThis.crypto?.subtle) {
    return fallbackSeedState(seed);
  }

  const material = `avataaarsMappingVersion=${AVATAAARS_MAPPING_VERSION}|seed=${seed}`;
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material)
  );
  const view = new DataView(digest);
  return view.getUint32(0, true);
}

function buildUrlFromState(state: number): string {
  const rand = createMulberry32(state);
  const topType = pick(TOP_TYPES, rand);
  const skinColor = pick(SKIN_COLORS, rand);
  const hairColor = pick(HAIR_COLORS, rand);
  const clotheType = pick(CLOTHE_TYPES, rand);
  const clotheColor = pick(CLOTHE_COLORS, rand);
  const derivedEyeType = pick(EYE_TYPES, rand);
  const eyebrowType = pick(EYEBROW_TYPES, rand);
  const mouthType = pick(MOUTH_TYPES, rand);
  const eyeType = derivedEyeType === "Surprised" ? "Default" : derivedEyeType;
  const accessoriesType = rand() < 0.3 ? pick(ACCESSORIES_TYPES.slice(1), rand) : "Blank";
  const facialHairType = rand() < 0.2 ? pick(FACIAL_HAIR_TYPES.slice(1), rand) : "Blank";

  const query = new URLSearchParams({
    accessoriesType,
    avatarStyle: "Transparent",
    clotheColor,
    clotheType,
    eyebrowType,
    eyeType,
    facialHairType,
    hairColor,
    mouthType,
    skinColor,
    topType
  });

  if (facialHairType !== "Blank") {
    query.set("facialHairColor", pick(FACIAL_HAIR_COLORS, rand));
  }

  query.sort();
  return `${AVATAAARS_BASE_URL}?${query.toString()}`;
}

export function deriveAgentAvatarUrl(seed: string): Promise<string> {
  const normalizedSeed = seed.trim();
  const cached = avatarUrlCache.get(normalizedSeed);
  if (cached) return cached;

  const promise = seedState(normalizedSeed).then(buildUrlFromState);
  avatarUrlCache.set(normalizedSeed, promise);
  return promise;
}
