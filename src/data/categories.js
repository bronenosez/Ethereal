export const CATEGORIES = [
  { id: "skincare", title: "Skincare", tagline: "Serums, creams and toners for a calm, glowing base." },
  { id: "makeup", title: "Makeup", tagline: "Color that flatters — lips, eyes and complexion." },
  { id: "bodyhair", title: "Body & Hair", tagline: "From shower to styling, softness head to toe." },
];

export const CAT_ALIASES = {
  skincare: "skincare", skin: "skincare", "skin care": "skincare",
  makeup: "makeup", "make up": "makeup", "make-up": "makeup",
  bodyhair: "bodyhair", body: "bodyhair", hair: "bodyhair",
  "body & hair": "bodyhair", "body and hair": "bodyhair",
  bodycare: "bodyhair", "body care": "bodyhair",
};

export const catTitle = (id) => CATEGORIES.find((c) => c.id === id)?.title ?? id;
