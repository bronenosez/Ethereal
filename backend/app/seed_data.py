"""Demo products used to seed an empty database on first startup.

Mirrors the frontend's src/data/seed.js so a fresh install shows the same
storefront it always did — only now the cards live in PostgreSQL.
"""

SEED_PRODUCTS = [
    {"name": "Vitamin C Glow Serum", "price": 19.99, "cat": "skincare",
     "desc": "Brightening serum with 10% vitamin C and hyaluronic acid for dull, tired skin."},
    {"name": "Hydracloud Gel Cream", "price": 14.5, "cat": "skincare",
     "desc": "Ultra-light gel-cream that delivers deep hydration without heaviness."},
    {"name": "Rose Water Toner", "price": 9.9, "cat": "skincare",
     "desc": "Alcohol-free toner that calms redness and preps skin for serums."},
    {"name": "Snail Repair Essence", "price": 16.8, "cat": "skincare",
     "desc": "K-beauty favorite for smoothing texture and fading marks."},
    {"name": "Velvet Matte Lipstick", "price": 8.5, "cat": "makeup",
     "desc": "Long-wear matte lipstick in a warm rose that doesn’t dry lips out."},
    {"name": "Silk Skin Tint SPF20", "price": 13.2, "cat": "makeup",
     "desc": "Sheer, breathable coverage with a natural satin finish."},
    {"name": "Cloud Blush Duo", "price": 11, "cat": "makeup",
     "desc": "Buildable cream blush in two complementary shades."},
    {"name": "Featherlift Mascara", "price": 9.4, "cat": "makeup",
     "desc": "Lengthens and lifts without clumps; removes with warm water."},
    {"name": "Shea Body Butter", "price": 12, "cat": "bodyhair",
     "desc": "Rich whipped shea butter for very dry skin — melts in on contact."},
    {"name": "Argan Repair Hair Oil", "price": 10.6, "cat": "bodyhair",
     "desc": "Lightweight argan blend that tames frizz and adds shine."},
    {"name": "Cactus Oasis Cream", "price": 15.3, "cat": "bodyhair",
     "desc": "Cooling body cream with cactus extract for after-sun softness."},
    {"name": "Milk Cloud Body Wash", "price": 7.8, "cat": "bodyhair",
     "desc": "Low-pH creamy wash that leaves skin soft, never squeaky."},
]
