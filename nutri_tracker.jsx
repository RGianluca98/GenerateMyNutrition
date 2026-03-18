import { useState, useEffect, useRef } from "react";

// === INJECT FONTS + BASE CSS ===
(() => {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;700&family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(l);
  const s = document.createElement('style');
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#101015;--surface:#17171d;--card:#1d1d24;--border:rgba(255,255,255,0.1);
      --accent:#c17a5a;--accent-soft:rgba(193,122,90,0.14);
      --text:#f2eee7;--text2:#b8afa3;--text3:#7d756b;
      --font:'Inter',sans-serif;--display:'EB Garamond',serif;
      --chip:#24242d;--muted:#22222a;
      --shadow:0 1px 1px rgba(0,0,0,0.3),0 10px 28px rgba(0,0,0,0.24);
    }
    html,body{background:var(--bg);color:var(--text);font-family:var(--font)}
    input:focus{outline:none}
    button{cursor:pointer;font-family:var(--font)}
    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#34343f;border-radius:6px}
  `;
  document.head.appendChild(s);
})();

// ── DATA ──────────────────────────────────────────────────────
const DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const MEAL_ORDER = ['Colazione','Spuntino','Pranzo','Spuntino pom.','Pre-workout','Cena','Post-workout'];
const MEAL_LABEL = {Colazione:'COL',Spuntino:'SPU',Pranzo:'PRA','Spuntino pom.':'POM','Pre-workout':'PRE',Cena:'CEN','Post-workout':'POST'};
const TYPE_CFG = {
  Riposo: {label:'Riposo', short:'R', icon:'😴', color:'#8d9aab'},
  Corsa:  {label:'Corsa',  short:'C', icon:'🏃', color:'#6B8F71'},
  Calcio: {label:'Calcio', short:'F', icon:'⚽', color:'#c17a5a'},
};

// Tutte le quantità dal foglio "Quantità". Calcio = Corsa (foglio non distingue tipo sport).
const Q = (r,c) => ({Riposo:r, Corsa:c, Calcio:c});

const FOOD_DB = {
  protein_equiv_chicken:[
    {name:'Petto di pollo',        qty:Q(160,180), uom:'g', kcal:110, limitKey:'white_meat_fresh'},
    {name:'Merluzzo',              qty:Q(150,180), uom:'g', kcal:82,  limitKey:'fish_fresh'},
    {name:'Salmone',               qty:Q(160,180), uom:'g', kcal:208, limitKey:'fish_fresh'},
    {name:'Orata',                 qty:Q(160,180), uom:'g', kcal:96,  limitKey:'fish_fresh'},
    {name:'Spigola',               qty:Q(160,180), uom:'g', kcal:97,  limitKey:'fish_fresh'},
    {name:'Sgombro',               qty:Q(160,180), uom:'g', kcal:205, limitKey:'fish_fresh'},
    {name:'Sogliola',              qty:Q(160,180), uom:'g', kcal:83,  limitKey:'fish_fresh'},
    {name:'Tonno al naturale',     qty:Q(100,120), uom:'g', kcal:116, limitKey:'tuna_canned'},
    {name:'Salmone affumicato',    qty:Q(75,80),   uom:'g', kcal:142, limitKey:'fish_smoked'},
    {name:'Polpo',                 qty:Q(200,220), uom:'g', kcal:82,  limitKey:'fish_fresh'},
    {name:'Calamari',              qty:Q(220,250), uom:'g', kcal:92,  limitKey:'fish_fresh'},
    {name:'Gamberi sgusciati',     qty:Q(220,250), uom:'g', kcal:85,  limitKey:'fish_fresh'},
    {name:'Seppie',                qty:Q(220,250), uom:'g', kcal:79,  limitKey:'fish_fresh'},
    {name:'Molluschi sgusciati',   qty:Q(220,250), uom:'g', kcal:75,  limitKey:'fish_fresh'},
    {name:'Bresaola',              qty:Q(80,100),  uom:'g', kcal:151, limitKey:'cured_lean'},
    {name:'Prosciutto crudo magro',qty:Q(80,100),  uom:'g', kcal:159, limitKey:'cured_lean'},
    {name:'Uova',                  qty:Q(120,120), uom:'g', kcal:143, limitKey:'eggs'},
    {name:'Albume',                qty:Q(50,50),   uom:'g', kcal:52,  limitKey:'eggs'},
    {name:'Carne rossa magra',     qty:Q(130,150), uom:'g', kcal:158, limitKey:'red_meat'},
    {name:'Vitello',               qty:Q(130,150), uom:'g', kcal:107, limitKey:'red_meat'},
    {name:'Ceci cotti',            qty:Q(150,160), uom:'g', kcal:164, limitKey:'legumes_cooked'},
    {name:'Ceci secchi',           qty:Q(75,80),   uom:'g', kcal:364, limitKey:'legumes_dry'},
    {name:'Fagioli borlotti cotti',qty:Q(150,160), uom:'g', kcal:132, limitKey:'legumes_cooked'},
    {name:'Fagioli cannellini cotti',qty:Q(150,160),uom:'g',kcal:127, limitKey:'legumes_cooked'},
    {name:'Fagioli cotti',         qty:Q(150,160), uom:'g', kcal:130, limitKey:'legumes_cooked'},
    {name:'Lenticchie cotte',      qty:Q(150,160), uom:'g', kcal:116, limitKey:'legumes_cooked'},
    {name:'Lenticchie secche',     qty:Q(75,80),   uom:'g', kcal:353, limitKey:'legumes_dry'},
    {name:'Fagioli secchi',        qty:Q(75,80),   uom:'g', kcal:335, limitKey:'legumes_dry'},
    {name:'Fagioli cannellini secchi',qty:Q(75,80),uom:'g', kcal:335, limitKey:'legumes_dry'},
    {name:'Piselli secchi',        qty:Q(75,80),   uom:'g', kcal:350, limitKey:'legumes_dry'},
    {name:'Piselli cotti',         qty:Q(150,160), uom:'g', kcal:84,  limitKey:'legumes_cooked'},
    {name:'Fiocchi di latte',      qty:Q(150,170), uom:'g', kcal:103, limitKey:'fresh_cheese'},
    {name:'Mozzarella',            qty:Q(150,170), uom:'g', kcal:280, limitKey:'fresh_cheese'},
    {name:'Ricotta',               qty:Q(150,170), uom:'g', kcal:174, limitKey:'fresh_cheese'},
    {name:'Formaggio Linea Osella',qty:Q(150,170), uom:'g', kcal:100, limitKey:'fresh_cheese'},
    {name:'Formaggio stagionato',  qty:Q(120,150), uom:'g', kcal:402, limitKey:'hard_cheese'},
    {name:'Feta',                  qty:Q(80,100),  uom:'g', kcal:264, limitKey:'hard_cheese'},
    {name:'Stracchino light',      qty:Q(120,150), uom:'g', kcal:134, limitKey:'fresh_cheese'},
    {name:'Formaggio fresco snack',qty:Q(40,40),   uom:'g', kcal:134, limitKey:'fresh_cheese'},
    {name:'Yogurt greco',          qty:Q(170,200), uom:'g', kcal:59,  limitKey:'yogurt_skyr'},
  ],
  lunch_carb_pasta:[
    {name:'Pasta integrale', qty:Q(80,90),   uom:'g', kcal:356, limitKey:'pasta_family'},
    {name:'Pasta normale',   qty:Q(80,90),   uom:'g', kcal:352, limitKey:'pasta_family'},
    {name:'Pasta all uovo',  qty:Q(80,100),  uom:'g', kcal:368, limitKey:'pasta_family'},
    {name:'Spaghetti di riso',qty:Q(80,100), uom:'g', kcal:362, limitKey:'pasta_family'},
    {name:'Riso',            qty:Q(80,100),  uom:'g', kcal:360, limitKey:'rice_family'},
    {name:'Riso basmati',    qty:Q(80,100),  uom:'g', kcal:360, limitKey:'rice_family'},
    {name:'Riso jasmine',    qty:Q(80,100),  uom:'g', kcal:360, limitKey:'rice_family'},
    {name:'Farro',           qty:Q(80,100),  uom:'g', kcal:341, limitKey:'grain_alt_family'},
    {name:'Orzo',            qty:Q(80,100),  uom:'g', kcal:354, limitKey:'grain_alt_family'},
    {name:'Quinoa',          qty:Q(80,100),  uom:'g', kcal:368, limitKey:'grain_alt_family'},
    {name:'Miglio',          qty:Q(80,100),  uom:'g', kcal:378, limitKey:'grain_alt_family'},
    {name:'Cous cous',       qty:Q(80,100),  uom:'g', kcal:376, limitKey:'grain_alt_family'},
    {name:'Spatzle',         qty:Q(80,100),  uom:'g', kcal:300, limitKey:'pasta_family'},
    {name:'Gnocchi',         qty:Q(200,225), uom:'g', kcal:109, limitKey:'gnocchi_family'},
    {name:'Piadina',         qty:Q(1,1),     uom:'pz',kcal:290, limitKey:'piadina_family'},
  ],
  dinner_carb_bread:[
    {name:'Pane integrale',    qty:Q(60,80),  uom:'g', kcal:224, limitKey:'bread_family'},
    {name:'Pane bianco',       qty:Q(60,80),  uom:'g', kcal:275, limitKey:'bread_family'},
    {name:'Pane di segale',    qty:Q(60,80),  uom:'g', kcal:259, limitKey:'bread_family'},
    {name:'Patate',            qty:Q(220,250),uom:'g', kcal:77,  limitKey:'potato_family'},
    {name:'Patate dolci',      qty:Q(220,250),uom:'g', kcal:86,  limitKey:'potato_family'},
    {name:'Pure di patate',    qty:Q(220,250),uom:'g', kcal:83,  limitKey:'pure_family'},
    {name:'Crackers integrali',qty:Q(40,50),  uom:'g', kcal:412, limitKey:'crackers_family'},
    {name:'Grissini integrali',qty:Q(40,50),  uom:'g', kcal:380, limitKey:'grissini_family'},
    {name:'Gallette di mais',  qty:Q(8.75,8.75),uom:'pz',kcal:38,limitKey:'gallette_family'},
  ],
  oats_breakfast:[
    {name:'Avena',                     qty:Q(60,60), uom:'g',  kcal:379, limitKey:'oats_family'},
    {name:'Muesli',                    qty:Q(60,60), uom:'g',  kcal:363, limitKey:'oats_family'},
    {name:'Fette biscottate integrali',qty:Q(4,4),   uom:'pz', kcal:38,  limitKey:'fette_family'},
    {name:'Gallette di mais',          qty:Q(8.75,8.75), uom:'pz', kcal:38, limitKey:'gallette_family'},
  ],
  milk_portion:[
    {name:'Latte',      qty:Q(250,250),uom:'ml',kcal:49, limitKey:'milk_default'},
    {name:'Cappuccino', qty:Q(200,200),uom:'ml',kcal:40, limitKey:'milk_default'},
    {name:'Spremuta di arancia',qty:Q(150,150),uom:'ml',kcal:45, limitKey:'juice_portion'},
  ],
  fruit_portion:[
    {name:'Mela',          qty:Q(1,1),    uom:'pz',   kcal:80,  limitKey:'fruit_portion'},
    {name:'Banana',        qty:Q(1,1),    uom:'pz',   kcal:90,  limitKey:'fruit_portion'},
    {name:'Pera',          qty:Q(1,1),    uom:'pz',   kcal:85,  limitKey:'fruit_portion'},
    {name:'Arancia',       qty:Q(1,1),    uom:'pz',   kcal:60,  limitKey:'fruit_portion'},
    {name:'Kiwi',          qty:Q(2,2),    uom:'pz',   kcal:30,  limitKey:'fruit_portion'},
    {name:'Pesche',        qty:Q(2,2),    uom:'pz',   kcal:35,  limitKey:'fruit_portion'},
    {name:'Mandaranci',    qty:Q(2,2),    uom:'pz',   kcal:25,  limitKey:'fruit_portion'},
    {name:'Prugne',        qty:Q(2,2),    uom:'pz',   kcal:20,  limitKey:'fruit_portion'},
    {name:'Clementine',    qty:Q(2,2),    uom:'pz',   kcal:25,  limitKey:'fruit_portion'},
    {name:'Albicocche',    qty:Q(4,4),    uom:'pz',   kcal:15,  limitKey:'fruit_portion'},
    {name:'Fragole',       qty:Q(250,250),uom:'g',    kcal:33,  limitKey:'fruit_portion'},
    {name:'Mirtilli',      qty:Q(150,150),uom:'g',    kcal:57,  limitKey:'fruit_portion'},
    {name:'Frutti di bosco',qty:Q(150,150),uom:'g',   kcal:45,  limitKey:'fruit_portion'},
    {name:'Uva',           qty:Q(130,130),uom:'g',    kcal:67,  limitKey:'fruit_portion'},
    {name:'Ananas',        qty:Q(200,200),uom:'g',    kcal:50,  limitKey:'fruit_portion'},
    {name:'Ciliegie',      qty:Q(150,150),uom:'g',    kcal:63,  limitKey:'fruit_portion'},
    {name:'Anguria',       qty:Q(1,1),    uom:'fetta',kcal:80,  limitKey:'fruit_portion'},
    {name:'Melone',        qty:Q(2,2),    uom:'fetta',kcal:60,  limitKey:'fruit_portion'},
  ],
  yogurt_portion:[
    {name:'Skyr',        qty:Q(170,170),uom:'g',kcal:63, limitKey:'yogurt_skyr'},
    {name:'Yogurt greco',qty:Q(170,200),uom:'g',kcal:59, limitKey:'yogurt_skyr'},
  ],
  nuts_snack:[
    {name:'Mandorle',          qty:Q(20,20),uom:'g',kcal:579, limitKey:'nuts'},
    {name:'Noci',              qty:Q(20,20),uom:'g',kcal:654, limitKey:'nuts'},
    {name:'Nocciole',          qty:Q(20,20),uom:'g',kcal:628, limitKey:'nuts'},
    {name:'Anacardi',          qty:Q(20,20),uom:'g',kcal:553, limitKey:'nuts'},
    {name:'Arachidi non salate',qty:Q(20,20),uom:'g',kcal:567, limitKey:'nuts'},
    {name:'Olive nere',        qty:Q(15,15),uom:'g',kcal:115, limitKey:'olive_default'},
    {name:'Olive verdi',       qty:Q(15,15),uom:'g',kcal:100, limitKey:'olive_default'},
    {name:'Grana snack',       qty:Q(10,10),uom:'g',kcal:402, limitKey:'hard_cheese'},
    {name:'Formaggio fresco snack',qty:Q(40,40),uom:'g',kcal:134, limitKey:'fresh_cheese'},
    {name:'Burro di arachidi', qty:Q(20,20),uom:'g',kcal:588, limitKey:'pb'},
    {name:'Marmellata zero zucc',qty:Q(20,20),uom:'g',kcal:30,  limitKey:'jam_default'},
  ],
  oil_portion:[
    {name:'Olio EVO',qty:Q(10,10),uom:'g',kcal:884,limitKey:'oil_evo'},
  ],
  vegetable_side:[
    {name:'Zucchine',           qty:Q(200,200),uom:'g',kcal:17, limitKey:'vegetable_daily'},
    {name:'Broccoli',           qty:Q(200,200),uom:'g',kcal:34, limitKey:'vegetable_daily'},
    {name:'Spinaci',            qty:Q(200,200),uom:'g',kcal:23, limitKey:'vegetable_daily'},
    {name:'Insalata mista',     qty:Q(200,200),uom:'g',kcal:15, limitKey:'vegetable_daily'},
    {name:'Carote',             qty:Q(200,200),uom:'g',kcal:41, limitKey:'vegetable_daily'},
    {name:'Cavolfiore',         qty:Q(200,200),uom:'g',kcal:25, limitKey:'vegetable_daily'},
    {name:'Fagiolini',          qty:Q(200,200),uom:'g',kcal:31, limitKey:'vegetable_daily'},
    {name:'Peperoni',           qty:Q(200,200),uom:'g',kcal:31, limitKey:'vegetable_daily'},
    {name:'Melanzane',          qty:Q(200,200),uom:'g',kcal:25, limitKey:'vegetable_daily'},
    {name:'Asparagi',           qty:Q(200,200),uom:'g',kcal:20, limitKey:'vegetable_daily'},
    {name:'Pomodori',           qty:Q(200,200),uom:'g',kcal:18, limitKey:'vegetable_daily'},
    {name:'Pomodorini',         qty:Q(200,200),uom:'g',kcal:18, limitKey:'vegetable_daily'},
    {name:'Rucola',             qty:Q(200,200),uom:'g',kcal:25, limitKey:'vegetable_daily'},
    {name:'Finocchi',           qty:Q(200,200),uom:'g',kcal:31, limitKey:'vegetable_daily'},
    {name:'Broccoletti di rapa',qty:Q(200,200),uom:'g',kcal:22, limitKey:'vegetable_daily'},
    {name:'Bieta',              qty:Q(200,200),uom:'g',kcal:19, limitKey:'vegetable_daily'},
    {name:'Zucca',              qty:Q(200,200),uom:'g',kcal:26, limitKey:'vegetable_daily'},
    {name:'Lattuga',            qty:Q(200,200),uom:'g',kcal:15, limitKey:'vegetable_daily'},
    {name:'Sedano',             qty:Q(200,200),uom:'g',kcal:16, limitKey:'vegetable_daily'},
    {name:'Cicoria',            qty:Q(200,200),uom:'g',kcal:23, limitKey:'vegetable_daily'},
    {name:'Rape',               qty:Q(200,200),uom:'g',kcal:22, limitKey:'vegetable_daily'},
    {name:'Funghi',             qty:Q(200,200),uom:'g',kcal:22, limitKey:'vegetable_daily'},
  ],
  pre_run_banana:[{name:'Banana pre-corsa',      qty:{Riposo:0,Corsa:1,Calcio:0},  uom:'pz',kcal:90,  limitKey:'fruit_portion'}],
  pre_run_bread: [{name:'Pane bianco pre-corsa',  qty:{Riposo:0,Corsa:30,Calcio:0}, uom:'g', kcal:275, limitKey:'bread_family'}],
  pre_soccer_bread:[{name:'Pane pre-calcio',      qty:{Riposo:0,Corsa:0,Calcio:60}, uom:'g', kcal:275, limitKey:'bread_family'}],
  pre_soccer_jam:[
    {name:'Marmellata pre-calcio',qty:{Riposo:0,Corsa:0,Calcio:20},uom:'g',kcal:260,limitKey:'jam_default'},
    {name:'Miele pre-calcio',     qty:{Riposo:0,Corsa:0,Calcio:10},uom:'g',kcal:304,limitKey:'honey_default'},
  ],
  post_workout_milk:  [{name:'Latte post-workout',   qty:{Riposo:0,Corsa:250,Calcio:250},uom:'ml',kcal:49, limitKey:'milk_default'}],
  post_workout_banana:[{name:'Banana post-workout',  qty:{Riposo:0,Corsa:1,Calcio:1},   uom:'pz',kcal:90, limitKey:'fruit_portion'}],
  post_workout_avocado:[{name:'Avocado',             qty:{Riposo:0,Corsa:70,Calcio:70}, uom:'g', kcal:160, limitKey:'avocado'}],
};

// ── WEEKEND FOOD GROUPS ───────────────────────────────────────
FOOD_DB.philly_portion = [
  {name:'Philadelphia light', qty:Q(40,40), uom:'g', kcal:130, limitKey:'fresh_cheese'},
  {name:'Ricotta',            qty:Q(40,50), uom:'g', kcal:174, limitKey:'fresh_cheese'},
  {name:'Stracchino light',   qty:Q(40,50), uom:'g', kcal:134, limitKey:'fresh_cheese'},
];
FOOD_DB.sat_bread = [
  {name:'Pane di segale',  qty:Q(80,80), uom:'g', kcal:259, limitKey:'bread_family'},
  {name:'Pane integrale',  qty:Q(80,80), uom:'g', kcal:224, limitKey:'bread_family'},
  {name:'Pane bianco',     qty:Q(80,80), uom:'g', kcal:275, limitKey:'bread_family'},
];
FOOD_DB.sat_protein_lunch = [
  {name:'Uova',              qty:Q(120,120), uom:'g', kcal:143, limitKey:'eggs'},
  {name:'Petto di pollo',    qty:Q(160,180), uom:'g', kcal:110, limitKey:'white_meat_fresh'},
  {name:'Merluzzo',          qty:Q(150,180), uom:'g', kcal:82,  limitKey:'fish_fresh'},
  {name:'Tonno al naturale', qty:Q(100,120), uom:'g', kcal:116, limitKey:'tuna_canned'},
  {name:'Bresaola',          qty:Q(80,100),  uom:'g', kcal:151, limitKey:'cured_lean'},
  {name:'Fiocchi di latte',  qty:Q(150,170), uom:'g', kcal:103, limitKey:'fresh_cheese'},
  {name:'Ricotta',           qty:Q(150,170), uom:'g', kcal:174, limitKey:'fresh_cheese'},
];
FOOD_DB.sat_veg_lunch = [
  {name:'Bietole',       qty:Q(200,200), uom:'g', kcal:19, limitKey:'vegetable_daily'},
  {name:'Spinaci',       qty:Q(200,200), uom:'g', kcal:23, limitKey:'vegetable_daily'},
  {name:'Zucchine',      qty:Q(200,200), uom:'g', kcal:17, limitKey:'vegetable_daily'},
  {name:'Broccoli',      qty:Q(200,200), uom:'g', kcal:34, limitKey:'vegetable_daily'},
  {name:'Insalata mista',qty:Q(200,200), uom:'g', kcal:15, limitKey:'vegetable_daily'},
  {name:'Peperoni',      qty:Q(200,200), uom:'g', kcal:31, limitKey:'vegetable_daily'},
  {name:'Asparagi',      qty:Q(200,200), uom:'g', kcal:20, limitKey:'vegetable_daily'},
];
FOOD_DB.parmigiano_snack = [
  {name:'Parmigiano Reggiano',   qty:Q(30,30), uom:'g', kcal:402, limitKey:'hard_cheese'},
  {name:'Grana snack',           qty:Q(30,30), uom:'g', kcal:402, limitKey:'hard_cheese'},
  {name:'Formaggio fresco snack',qty:Q(40,40), uom:'g', kcal:134, limitKey:'fresh_cheese'},
];
FOOD_DB.free_meal_dinner = [
  {name:'Pizza 🍕 (pasto libero)',      qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Lasagna (pasto libero)',       qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Pasta al pesto (pasto libero)',qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Pasto libero a scelta',        qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
];
FOOD_DB.sun_breakfast_sweet = [
  {name:'Cappuccino',qty:Q(200,200), uom:'ml', kcal:40, limitKey:'milk_default'},
  {name:'Latte',     qty:Q(250,250), uom:'ml', kcal:49, limitKey:'milk_default'},
];
FOOD_DB.sun_biscuits = [
  {name:'Biscotti',                   qty:Q(40,40), uom:'g',  kcal:470, limitKey:'bread_family'},
  {name:'Fette biscottate integrali', qty:Q(4,4),   uom:'pz', kcal:38,  limitKey:'fette_family'},
  {name:'Gallette di mais',           qty:Q(8.75,8.75), uom:'pz', kcal:38, limitKey:'gallette_family'},
];
FOOD_DB.free_meal_lunch = [
  {name:'Lasagna (pasto libero)',          qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Pasta al pesto (pasto libero)',   qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Pasta al ragù (pasto libero)',    qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Risotto (pasto libero)',          qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
  {name:'Pasto libero a scelta',           qty:Q(1,1), uom:'porz', kcal:0, limitKey:null},
];
FOOD_DB.sun_dinner_protein = [
  {name:'Uova',              qty:Q(120,120), uom:'g', kcal:143, limitKey:'eggs'},
  {name:'Petto di pollo',    qty:Q(160,180), uom:'g', kcal:110, limitKey:'white_meat_fresh'},
  {name:'Merluzzo',          qty:Q(150,180), uom:'g', kcal:82,  limitKey:'fish_fresh'},
  {name:'Tonno al naturale', qty:Q(100,120), uom:'g', kcal:116, limitKey:'tuna_canned'},
  {name:'Bresaola',          qty:Q(80,100),  uom:'g', kcal:151, limitKey:'cured_lean'},
  {name:'Fiocchi di latte',  qty:Q(150,170), uom:'g', kcal:103, limitKey:'fresh_cheese'},
];
FOOD_DB.breakfast_dairy = [
  {name:'Yogurt greco',          qty:Q(170,170), uom:'g',  kcal:59,  limitKey:'yogurt_skyr'},
  {name:'Skyr',                  qty:Q(170,170), uom:'g',  kcal:63,  limitKey:'yogurt_skyr'},
  {name:'Kefir',                 qty:Q(200,200), uom:'ml', kcal:52,  limitKey:'yogurt_skyr'},
  {name:'Ricotta',               qty:Q(40,40),   uom:'g',  kcal:174, limitKey:'fresh_cheese'},
  {name:'Fiocchi di latte',      qty:Q(40,40),   uom:'g',  kcal:103, limitKey:'fresh_cheese'},
  {name:'Philadelphia light',    qty:Q(40,40),   uom:'g',  kcal:130, limitKey:'fresh_cheese'},
  {name:'Formaggio Linea Osella',qty:Q(40,40),   uom:'g',  kcal:100, limitKey:'fresh_cheese'},
];
FOOD_DB.breakfast_protein = [
  {name:'Latte',                 qty:Q(250,250), uom:'ml', kcal:49,  limitKey:'milk_default'},
  {name:'Latte di cocco',        qty:Q(200,200), uom:'ml', kcal:230, limitKey:'milk_default'},
  {name:'Latte di riso',         qty:Q(200,200), uom:'ml', kcal:47,  limitKey:'milk_default'},
  {name:'Latte di mandorla',     qty:Q(200,200), uom:'ml', kcal:24,  limitKey:'milk_default'},
  {name:'Yogurt greco',          qty:Q(170,170), uom:'g',  kcal:59,  limitKey:'yogurt_skyr'},
  {name:'Skyr',                  qty:Q(170,170), uom:'g',  kcal:63,  limitKey:'yogurt_skyr'},
  {name:'Kefir',                 qty:Q(200,200), uom:'ml', kcal:52,  limitKey:'yogurt_skyr'},
  {name:'Ricotta',               qty:Q(40,40),   uom:'g',  kcal:174, limitKey:'fresh_cheese'},
  {name:'Fiocchi di latte',      qty:Q(40,40),   uom:'g',  kcal:103, limitKey:'fresh_cheese'},
  {name:'Philadelphia light',    qty:Q(40,40),   uom:'g',  kcal:130, limitKey:'fresh_cheese'},
  {name:'Uova',                  qty:Q(2,2),     uom:'pz', kcal:70,  limitKey:'eggs'},
];
FOOD_DB.breakfast_toppings = [
  {name:'Burro di arachidi',  qty:Q(20,20), uom:'g', kcal:588, limitKey:'pb'},
  {name:'Nocciole',           qty:Q(15,15), uom:'g', kcal:628, limitKey:'nuts'},
  {name:'Noci',               qty:Q(15,15), uom:'g', kcal:654, limitKey:'nuts'},
  {name:'Mandorle',           qty:Q(15,15), uom:'g', kcal:579, limitKey:'nuts'},
  {name:'Cacao amaro',        qty:Q(10,10), uom:'g', kcal:228, limitKey:null},
  {name:'Miele',              qty:Q(10,10), uom:'g', kcal:304, limitKey:'honey_default'},
  {name:'Farina di cocco',    qty:Q(10,10), uom:'g', kcal:604, limitKey:'flour_special'},
  {name:"Sciroppo d'acero",   qty:Q(10,10), uom:'g', kcal:260, limitKey:null},
];
FOOD_DB.speciali_farine = [
  {name:'Farina 0',           qty:Q(20,20), uom:'g', kcal:364, limitKey:'flour_special'},
  {name:'Farina 00',          qty:Q(20,20), uom:'g', kcal:364, limitKey:'flour_special'},
  {name:'Farina integrale',   qty:Q(20,20), uom:'g', kcal:340, limitKey:'flour_special'},
  {name:'Farina di ceci',     qty:Q(30,30), uom:'g', kcal:387, limitKey:'flour_special'},
  {name:'Farina di mais',     qty:Q(20,20), uom:'g', kcal:362, limitKey:'flour_special'},
  {name:'Farina di cocco',    qty:Q(15,15), uom:'g', kcal:604, limitKey:'flour_special'},
  {name:'Farina di mandorla', qty:Q(20,20), uom:'g', kcal:571, limitKey:'flour_special'},
  {name:"Sciroppo d'amaro",   qty:Q(5,5),   uom:'g', kcal:0,   limitKey:'syrup_special'},
];
// Nuovi gruppi per i template feriali personalizzati
FOOD_DB.feta_portion = [
  {name:'Feta',               qty:Q(80,100),  uom:'g', kcal:264, limitKey:'hard_cheese'},
  {name:'Formaggio stagionato',qty:Q(80,100), uom:'g', kcal:402, limitKey:'hard_cheese'},
  {name:'Parmigiano Reggiano', qty:Q(30,30),  uom:'g', kcal:402, limitKey:'hard_cheese'},
];
FOOD_DB.latte_riso_portion = [
  {name:'Latte di riso',     qty:Q(250,250), uom:'ml', kcal:47, limitKey:'milk_default'},
  {name:'Latte',             qty:Q(250,250), uom:'ml', kcal:49, limitKey:'milk_default'},
  {name:'Cappuccino',        qty:Q(200,200), uom:'ml', kcal:40, limitKey:'milk_default'},
];
FOOD_DB.ciocco_snack = [
  {name:'Cioccolato fondente',qty:Q(20,20), uom:'g', kcal:598, limitKey:null},
  {name:'Cacao amaro',        qty:Q(5,5),   uom:'g', kcal:228, limitKey:null},
];
FOOD_DB.ricotta_protein = [
  {name:'Ricotta',         qty:Q(150,170), uom:'g', kcal:174, limitKey:'fresh_cheese'},
  {name:'Fiocchi di latte',qty:Q(150,170), uom:'g', kcal:103, limitKey:'fresh_cheese'},
  {name:'Formaggio Linea Osella',qty:Q(150,170),uom:'g',kcal:100,limitKey:'fresh_cheese'},
];

// ── TEMPLATES FERIALI (Mon–Fri) per tipo giorno ────────────────
// N.B. qtyOverride sovrascrive la quantità del DB per quel singolo item
const TEMPLATES = {
  // ── Riposo — usato solo come fallback, i giorni hanno template per indice
  Riposo:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Mela'}],
    Spuntino:[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[{context:'lunch_carb_pasta',def:'Pasta integrale'},{context:'protein_equiv_chicken',def:'Petto di pollo'},{context:'vegetable_side',def:'Zucchine'},{context:'oil_portion',def:'Olio EVO'}],
    'Pre-workout':[],
    Cena:[{context:'dinner_carb_bread',def:'Pane integrale'},{context:'protein_equiv_chicken',def:'Merluzzo'},{context:'vegetable_side',def:'Broccoli'},{context:'oil_portion',def:'Olio EVO'}],
    'Post-workout':[],
  },
  Corsa:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Banana'}],
    Spuntino:[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[{context:'lunch_carb_pasta',def:'Riso basmati'},{context:'protein_equiv_chicken',def:'Petto di pollo'},{context:'vegetable_side',def:'Zucchine'},{context:'oil_portion',def:'Olio EVO'}],
    'Pre-workout':[{context:'pre_run_banana',def:'Banana pre-corsa'},{context:'pre_run_bread',def:'Pane bianco pre-corsa'}],
    Cena:[{context:'dinner_carb_bread',def:'Patate'},{context:'protein_equiv_chicken',def:'Merluzzo'},{context:'vegetable_side',def:'Broccoli'},{context:'oil_portion',def:'Olio EVO'}],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
  Calcio:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Banana'}],
    Spuntino:[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[{context:'lunch_carb_pasta',def:'Riso basmati'},{context:'protein_equiv_chicken',def:'Petto di pollo'},{context:'vegetable_side',def:'Zucchine'},{context:'oil_portion',def:'Olio EVO'}],
    'Pre-workout':[{context:'pre_soccer_bread',def:'Pane pre-calcio'},{context:'pre_soccer_jam',def:'Marmellata pre-calcio'}],
    Cena:[{context:'dinner_carb_bread',def:'Patate'},{context:'protein_equiv_chicken',def:'Merluzzo'},{context:'vegetable_side',def:'Broccoli'},{context:'oil_portion',def:'Olio EVO'}],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
};

// ── TEMPLATE GIORNALIERI FISSI (Lun–Ven + Weekend) ────────────
// Hanno priorità su TEMPLATES[tipo]. qtyOverride = forza una quantità specifica.
const DAY_TEMPLATES = {
  // ── LUNEDÌ (dayIndex 0) — Corsa ───────────────────────────────
  0:{
    Colazione:[
      {context:'breakfast_dairy',    def:'Yogurt greco'},
      {context:'fruit_portion',      def:'Banana'},
      {context:'oats_breakfast',     def:'Avena'},
      {context:'breakfast_toppings', def:'Burro di arachidi'},
      {context:'breakfast_toppings', def:'Cacao amaro'},
    ],
    Spuntino:[{context:'fruit_portion', def:'Pera'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[
      {context:'lunch_carb_pasta',       def:'Farro'},
      {context:'protein_equiv_chicken',   def:'Feta'},
      {context:'vegetable_side',         def:'Pomodorini'},
      {context:'oil_portion',            def:'Olio EVO'},
    ],
    'Pre-workout':[{context:'pre_run_banana',def:'Banana pre-corsa'},{context:'pre_run_bread',def:'Pane bianco pre-corsa'}],
    Cena:[
      {context:'protein_equiv_chicken',  def:'Petto di pollo'},
      {context:'dinner_carb_bread',      def:'Patate'},
      {context:'oil_portion',            def:'Olio EVO'},
    ],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
  // ── MARTEDÌ (dayIndex 1) — Riposo ─────────────────────────────
  1:{
    Colazione:[
      {context:'breakfast_protein',      def:'Uova'},
      {context:'fruit_portion',          def:'Banana'},
      {context:'fruit_portion',          def:'Mirtilli'},
      {context:'breakfast_toppings',     def:'Miele'},
    ],
    Spuntino:[{context:'breakfast_dairy', def:'Yogurt greco'}],
    'Spuntino pom.':[{context:'fruit_portion',def:'Mela'},{context:'nuts_snack',def:'Noci'}],
    Pranzo:[
      {context:'lunch_carb_pasta',       def:'Riso'},
      {context:'protein_equiv_chicken',  def:'Salmone'},
      {context:'vegetable_side',         def:'Zucchine'},
      {context:'oil_portion',            def:'Olio EVO'},
    ],
    'Pre-workout':[],
    Cena:[
      {context:'protein_equiv_chicken',  def:'Merluzzo'},
      {context:'vegetable_side',         def:'Pomodori'},
      {context:'nuts_snack',             def:'Olive nere'},
      {context:'oil_portion',            def:'Olio EVO'},
    ],
    'Post-workout':[],
  },
  // ── MERCOLEDÌ (dayIndex 2) — Riposo ───────────────────────────
  2:{
    Colazione:[
      {context:'breakfast_protein',     def:'Latte di riso'},
      {context:'oats_breakfast',        def:'Fette biscottate integrali'},
      {context:'breakfast_toppings',    def:'Nocciole'},
      {context:'ciocco_snack',          def:'Cioccolato fondente'},
    ],
    Spuntino:[{context:'fruit_portion', def:'Mela'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[
      {context:'lunch_carb_pasta',      def:'Riso basmati'},
      {context:'protein_equiv_chicken', def:'Lenticchie cotte'},
      {context:'vegetable_side',        def:'Peperoni'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Pre-workout':[],
    Cena:[
      {context:'dinner_carb_bread',     def:'Pane integrale'},
      {context:'protein_equiv_chicken',  def:'Ricotta'},
      {context:'vegetable_side',        def:'Spinaci'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Post-workout':[],
  },
  // ── GIOVEDÌ (dayIndex 3) — Corsa ──────────────────────────────
  3:{
    Colazione:[
      {context:'breakfast_protein',     def:'Yogurt greco'},
      {context:'fruit_portion',         def:'Banana'},
      {context:'oats_breakfast',        def:'Avena'},
      {context:'breakfast_toppings',    def:'Burro di arachidi'},
    ],
    Spuntino:[{context:'fruit_portion', def:'Kiwi'}],
    'Spuntino pom.':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Noci'}],
    Pranzo:[
      {context:'lunch_carb_pasta',      def:'Pasta integrale'},
      {context:'protein_equiv_chicken', def:'Petto di pollo'},
      {context:'vegetable_side',        def:'Broccoli'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Pre-workout':[{context:'pre_run_banana',def:'Banana pre-corsa'},{context:'pre_run_bread',def:'Pane bianco pre-corsa'}],
    Cena:[
      {context:'protein_equiv_chicken', def:'Merluzzo'},
      {context:'vegetable_side',        def:'Zucchine'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
  // ── VENERDÌ (dayIndex 4) — Calcio ─────────────────────────────
  4:{
    Colazione:[
      {context:'dinner_carb_bread',     def:'Pane integrale'},
      {context:'breakfast_dairy',       def:'Ricotta'},
      {context:'breakfast_toppings',    def:'Miele'},
    ],
    Spuntino:[{context:'fruit_portion', def:'Arancia'}],
    'Spuntino pom.':[{context:'nuts_snack',def:'Mandorle'},{context:'fruit_portion',def:'Mela'}],
    Pranzo:[
      {context:'lunch_carb_pasta',      def:'Pasta integrale'},
      {context:'protein_equiv_chicken', def:'Piselli cotti'},
      {context:'protein_equiv_chicken', def:'Tonno al naturale'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Pre-workout':[{context:'pre_soccer_bread',def:'Pane pre-calcio'},{context:'pre_soccer_jam',def:'Marmellata pre-calcio'}],
    Cena:[
      {context:'protein_equiv_chicken', def:'Petto di pollo'},
      {context:'dinner_carb_bread',     def:'Patate'},
      {context:'vegetable_side',        def:'Peperoni'},
      {context:'oil_portion',           def:'Olio EVO'},
    ],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
  // ── SABATO (dayIndex 5) ────────────────────────────────────────
  5:{
    Colazione:[
      {context:'sat_bread',       def:'Pane di segale'},
      {context:'breakfast_dairy', def:'Philadelphia light'},
      {context:'fruit_portion',   def:'Mirtilli'},
    ],
    Spuntino:[
      {context:'fruit_portion',   def:'Mela'},
      {context:'nuts_snack',      def:'Mandorle'},
    ],
    'Spuntino pom.':[{context:'parmigiano_snack',def:'Parmigiano Reggiano'}],
    Pranzo:[
      {context:'sat_protein_lunch',def:'Uova'},
      {context:'sat_veg_lunch',    def:'Bietole'},
      {context:'oil_portion',      def:'Olio EVO'},
    ],
    'Pre-workout':[],
    Cena:[{context:'free_meal_dinner',def:'Pizza 🍕 (pasto libero)'}],
    'Post-workout':[],
  },
  // ── DOMENICA (dayIndex 6) ──────────────────────────────────────
  6:{
    Colazione:[
      {context:'sun_breakfast_sweet', def:'Cappuccino'},
      {context:'sun_biscuits',        def:'Biscotti'},
    ],
    Spuntino:[
      {context:'fruit_portion', def:'Mela'},
      {context:'nuts_snack',    def:'Noci'},
    ],
    'Spuntino pom.':[],
    Pranzo:[{context:'free_meal_lunch',def:'Pasto libero a scelta'}],
    'Pre-workout':[],
    Cena:[
      {context:'protein_equiv_chicken', def:'Uova'},
      {context:'vegetable_side',     def:'Insalata mista'},
      {context:'oil_portion',        def:'Olio EVO'},
    ],
    'Post-workout':[],
  },
};

// Manteniamo WEEKEND_TEMPLATES come alias per compatibilità con il selector badge
const WEEKEND_TEMPLATES = {5:DAY_TEMPLATES[5], 6:DAY_TEMPLATES[6]};

const LIMIT_GROUPS = [
  {key:'white_meat_fresh',label:'Carne bianca',icon:'🍗',val:1200,uom:'g'},
  {key:'red_meat',label:'Carne rossa',icon:'🥩',val:500,uom:'g'},
  {key:'fish_fresh',label:'Pesce fresco',icon:'🐟',val:800,uom:'g'},
  {key:'tuna_canned',label:'Tonno',icon:'🐠',val:360,uom:'g'},
  {key:'eggs',label:'Uova',icon:'🥚',val:660,uom:'g'},
  {key:'yogurt_skyr',label:'Yogurt / Skyr',icon:'🥛',val:1200,uom:'g'},
  {key:'legumes_cooked',label:'Legumi cotti',icon:'🫘',val:600,uom:'g'},
  {key:'rice_family',label:'Riso',icon:'🍚',val:600,uom:'g'},
  {key:'pasta_family',label:'Pasta',icon:'🍝',val:500,uom:'g'},
  {key:'potato_family',label:'Patate',icon:'🥔',val:1500,uom:'g'},
  {key:'bread_family',label:'Pane',icon:'🍞',val:700,uom:'g'},
  {key:'oats_family',label:'Avena / Cereali',icon:'🌾',val:500,uom:'g'},
  {key:'nuts',label:'Frutta secca',icon:'🥜',val:200,uom:'g'},
  {key:'oil_evo',label:'Olio EVO',icon:'🫒',val:250,uom:'ml'},
  {key:'fresh_cheese',label:'Formaggi freschi',icon:'🧀',val:600,uom:'g'},
  {key:'hard_cheese',label:'Formaggi stagionati',icon:'🫕',val:120,uom:'g'},
  {key:'cured_lean',label:'Affettati magri',icon:'🍖',val:350,uom:'g'},
  {key:'fruit_portion',label:'Frutta fresca',icon:'🍎',val:18,uom:'pz'},
  {key:'vegetable_daily',label:'Verdure',icon:'🥦',val:3500,uom:'g'},
];

// ── HELPERS ──────────────────────────────────────────────────
function getWeekStart(d=new Date()){
  const c=new Date(d);const day=c.getDay();c.setDate(c.getDate()+(day===0?-6:1-day));c.setHours(0,0,0,0);return c;
}
function getWeekDates(ws){return Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(d.getDate()+i);return d;});}
function toISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function getDayType(dayTypes,weekPlan,dateISO,dayIndex){
  return dayTypes?.[dateISO]??weekPlan.types[dayIndex];
}
function getFD(context,name){return FOOD_DB[context]?.find(f=>f.name===name);}
function getTemplateForDay(weekPlan, dayIndex){
  const type=weekPlan.types[dayIndex];
  return DAY_TEMPLATES[dayIndex] ?? TEMPLATES[type] ?? {};
}
function getMealSourceItems(weekPlan, dayIndex, meal, dateISO){
  const tmpl=getTemplateForDay(weekPlan,dayIndex);
  const tmplItems=tmpl[meal]||[];
  const base=tmplItems.map(t=>({context:t.context,name:t.def,qtyOverride:t.qtyOverride}));
  return weekPlan.overrides?.[dateISO]?.[meal]||base;
}

function getDayItems(weekPlan, dayIndex, dateISO, dayTypes){
  const type=getDayType(dayTypes,weekPlan,dateISO,dayIndex);
  const result={};
  for(const meal of MEAL_ORDER){
    const src=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const items=src.map((item,i)=>{
      const fd=getFD(item.context,item.name);
      const qty=item.qtyOverride!==undefined?item.qtyOverride:(fd?.qty?.[type]??fd?.qty?.Riposo??0);
      return{key:`${meal}_${i}`,meal,context:item.context,name:item.name,qty,uom:fd?.uom??'g',kcal:fd?.kcal,limitKey:fd?.limitKey};
    }).filter(it=>it.qty>0);
    if(items.length>0)result[meal]=items;
  }
  return result;
}

// ── STYLES HELPERS ────────────────────────────────────────────
const S={
  card:(extra={})=>({background:'var(--card)',borderRadius:'14px',boxShadow:'var(--shadow)',...extra}),
  btn:(color='var(--text2)',extra={})=>({background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',color,padding:'6px 14px',fontSize:'12px',fontWeight:500,...extra}),
};

function NavGlyph({id,active}){
  const stroke=active?'var(--accent)':'var(--text3)';
  if(id==='home'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 7.2L8 3l5.5 4.2v5.8a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V7.2z" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    );
  }
  if(id==='planner'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2.25" y="3" width="11.5" height="10.75" rx="2" stroke={stroke} strokeWidth="1.5"/>
        <line x1="2.5" y1="6.25" x2="13.5" y2="6.25" stroke={stroke} strokeWidth="1.5"/>
      </svg>
    );
  }
  if(id==='dashboard'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <line x1="3" y1="13" x2="3" y2="8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="13" x2="8" y2="5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="13" x2="13" y2="2.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if(id==='calendario'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke={stroke} strokeWidth="1.5"/>
        <line x1="2" y1="6.5" x2="14" y2="6.5" stroke={stroke} strokeWidth="1.5"/>
        <line x1="5.5" y1="1.5" x2="5.5" y2="4.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="10.5" y1="1.5" x2="10.5" y2="4.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="4.5" y="9" width="2" height="2" rx="0.5" fill={stroke}/>
        <rect x="9" y="9" width="2" height="2" rx="0.5" fill={stroke}/>
      </svg>
    );
  }
  return(
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="3" stroke={stroke} strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HomeView({weekDates,selectedDayIndex,dailyLog,weekPlan,dayTypes}){
  const todayISO=toISO(weekDates[selectedDayIndex]);
  const dayItems=getDayItems(weekPlan,selectedDayIndex,toISO(weekDates[selectedDayIndex]),dayTypes);
  const dayLog=dailyLog[todayISO]||{};
  const allItems=MEAL_ORDER.flatMap(m=>dayItems[m]||[]);
  const checked=allItems.filter(it=>dayLog[it.key]?.checked).length;
  const pct=allItems.length?Math.round(checked/allItems.length*100):0;
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      <div style={{...S.card(),padding:'18px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'-30px',top:'-30px',width:'120px',height:'120px',borderRadius:'50%',background:'var(--accent-soft)'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'32px',lineHeight:1,color:'var(--text)',marginBottom:'6px'}}>63 kg</div>
          <div style={{fontSize:'12px',color:'var(--text2)',marginBottom:'14px'}}>Peso attuale</div>
          <div style={{fontSize:'13px',color:'var(--text2)',lineHeight:1.5}}>
            "La costanza batte sempre la perfezione."
          </div>
        </div>
      </div>
      <div style={{...S.card(),padding:'14px'}}>
        <div style={{fontSize:'11px',color:'var(--text2)',letterSpacing:'0.8px',fontWeight:600,marginBottom:'10px'}}>FOCUS DI OGGI</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={{fontSize:'14px',color:'var(--text)'}}>Completamento pasti</div>
          <div style={{fontFamily:'var(--display)',fontSize:'24px',color:'var(--accent)'}}>{pct}%</div>
        </div>
        <div style={{height:'4px',borderRadius:'4px',background:'#2c2a33',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:'var(--accent)'}}/>
        </div>
      </div>
      <div style={{...S.card(),padding:'14px'}}>
        <div style={{fontSize:'11px',color:'var(--text2)',letterSpacing:'0.8px',fontWeight:600,marginBottom:'8px'}}>PROMEMORIA</div>
        <div style={{fontSize:'13px',color:'var(--text2)',lineHeight:1.5}}>
          Bevi acqua durante la giornata, rispetta le porzioni e spunta ogni voce appena completata.
        </div>
      </div>
    </div>
  );
}

// ── PLANNER VIEW ──────────────────────────────────────────────
function PlannerView({weekDates,weekPlan,dailyLog,changeDayType,setSwapModal,expandedDay,setExpandedDay,getDayCompliance,todayISO,resetMeal,dayTypes}){
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'10px'}}>
      {weekDates.map((date,di)=>{
        const iso=toISO(date);const isToday=iso===todayISO;
        const type=getDayType(dayTypes,weekPlan,iso,di);const tc=TYPE_CFG[type];
        const comp=getDayCompliance(iso,di);const expanded=expandedDay===di;
        const dayItems=getDayItems(weekPlan,di,iso,dayTypes);
        return(
          <div key={di} style={{...S.card(),borderLeft:`2px solid ${expanded?'var(--accent)':'transparent'}`,transition:'all 0.2s',overflow:'hidden'}}>
            {/* Day Header */}
            <div style={{display:'flex',alignItems:'center',padding:'14px 14px',gap:'10px',cursor:'pointer'}}
              onClick={()=>setExpandedDay(expanded?null:di)}>
              <div style={{width:'30px',height:'30px',borderRadius:'999px',background:isToday?'var(--accent-soft)':'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:isToday?'var(--accent)':'var(--text2)',flexShrink:0}}>
                {tc.icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{fontWeight:600,fontSize:'14px',color:'var(--text)'}}>{DAYS[di]}</span>
                  {isToday&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--accent)'}}/>}
                </div>
                <div style={{fontSize:'12px',color:'var(--text2)',marginTop:'1px'}}>{date.toLocaleDateString('it-IT',{day:'numeric',month:'short'})}</div>
              </div>
              {/* Tipo giorno badge */}
              {!WEEKEND_TEMPLATES[di] && (
                <div style={{fontSize:'11px',color:'var(--text3)',background:'var(--muted)',
                  borderRadius:'6px',padding:'3px 8px',fontWeight:600,display:'flex',alignItems:'center',gap:'3px'}}>
                  <span>{tc.icon}</span><span>{TYPE_CFG[type].short}</span>
                </div>
              )}
              {WEEKEND_TEMPLATES[di] && (
                <div style={{fontSize:'10px',color:'var(--text2)',background:'var(--muted)',
                  borderRadius:'6px',padding:'3px 8px',fontWeight:600}}>
                  {di===5?'SAB':'DOM'}
                </div>
              )}
              {/* Compliance badge */}
              {comp!==null&&(
                <div style={{fontSize:'12px',fontWeight:600,color:comp>=80?'var(--accent)':'var(--text2)',minWidth:'30px',textAlign:'right'}}>
                  {comp}%
                </div>
              )}
              <div style={{color:'var(--text3)',fontSize:'16px',transform:expanded?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s'}}>▾</div>
            </div>
            {/* Expanded meals */}
            {expanded&&(
              <div style={{padding:'0 14px 14px',borderTop:'1px solid var(--border)'}}>
                {MEAL_ORDER.filter(m=>dayItems[m]).map(meal=>(
                  <div key={meal} style={{marginTop:'12px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>
                        {MEAL_LABEL[meal]} {meal.toUpperCase()}
                      </div>
                      {weekPlan.overrides?.[iso]?.[meal]&&(
                        <button onClick={()=>resetMeal(iso,meal)}
                          title="Ripristina template"
                          style={{background:'none',border:'1px solid var(--border)',borderRadius:'5px',color:'var(--text3)',fontSize:'11px',padding:'1px 6px',cursor:'pointer'}}>
                          ↺ reset
                        </button>
                      )}
                    </div>
                    {dayItems[meal].map((item,ii)=>(
                      <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                        <button onClick={()=>{if(FOOD_DB[item.context]?.length>1)setSwapModal({dateISO:iso,dayIndex:di,meal,itemIndex:ii,context:item.context,currentName:item.name,type});}}
                          style={{background:'none',border:'none',color:FOOD_DB[item.context]?.length>1?'var(--text)':'var(--text2)',
                            textAlign:'left',fontSize:'13px',cursor:FOOD_DB[item.context]?.length>1?'pointer':'default',display:'flex',alignItems:'center',gap:'4px'}}>
                          {item.name}
                          {FOOD_DB[item.context]?.length>1&&<span style={{color:'var(--text3)',fontSize:'10px'}}>⇄</span>}
                        </button>
                        <span style={{fontSize:'12px',color:'var(--text2)',fontWeight:500,background:'var(--chip)',padding:'2px 8px',borderRadius:'999px'}}>
                          {item.qty} {item.uom}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── OGGI VIEW ─────────────────────────────────────────────────
function OggiView({
  weekPlan,weekDates,todayISO,selectedDayIndex,setSelectedDayIndex,dailyLog,
  toggleLogItem,updateLogQty,editQty,setEditQty,setSwapModal,setAddModal,
  setExtraModal,dayTypes,changeDayType
}){
  const di=selectedDayIndex>=0&&selectedDayIndex<7?selectedDayIndex:0;
  const selectedISO=toISO(weekDates[di]);
  const isToday=selectedISO===todayISO;
  const type=getDayType(dayTypes,weekPlan,selectedISO,di);
  const tc=TYPE_CFG[type];
  const dayItems=getDayItems(weekPlan,di,selectedISO,dayTypes);
  const dayLog=dailyLog[selectedISO]||{};
  const allItems=MEAL_ORDER.flatMap(m=>dayItems[m]||[]);
  const checked=allItems.filter(it=>dayLog[it.key]?.checked).length;
  const pct=allItems.length?Math.round(checked/allItems.length*100):0;

  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Day type & progress banner */}
      <div style={{...S.card(),padding:'16px'}}>
        {/* Day selector */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',marginBottom:'12px'}}>
          {weekDates.map((date,idx)=>{
            const iso=toISO(date);
            const active=idx===di;
            const today=iso===todayISO;
            return(
              <button key={idx} onClick={()=>setSelectedDayIndex(idx)}
                style={{
                  border:'1px solid var(--border)',borderRadius:'7px',padding:'6px 0',
                  background:active?'var(--accent-soft)':'var(--surface)',
                  color:active?'var(--accent)':'var(--text2)',fontSize:'10px',fontWeight:active?700:500
                }}>
                {DAYS[idx].slice(0,3).toUpperCase()}{today?'*':''}
              </button>
            );
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div>
            <div style={{fontFamily:'var(--display)',fontSize:'20px',color:'var(--text)',textTransform:'capitalize'}}>
              {weekDates[di].toLocaleDateString('it-IT',{weekday:'long'})}
              {isToday&&<span style={{display:'inline-block',marginLeft:'8px',width:'6px',height:'6px',borderRadius:'50%',background:'var(--accent)'}}/>}
            </div>
            <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'1px'}}>
              {weekDates[di].toLocaleDateString('it-IT',{day:'numeric',month:'long'})}
            </div>
            <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:600,marginTop:'2px'}}>{tc.icon} {type}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'var(--display)',fontSize:'28px',color:pct>=80?'var(--accent)':'var(--text2)'}}>{pct}%</div>
            <div style={{fontSize:'11px',color:'var(--text2)'}}>{checked}/{allItems.length} voci</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{height:'4px',borderRadius:'2px',background:'var(--border)',overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:'var(--accent)',borderRadius:'2px',transition:'width 0.4s'}}/>
        </div>
        {/* Bottoni tipo giorno */}
        <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
          {['Riposo','Corsa','Calcio'].map(t=>{
            const active=type===t;
            const cfg=TYPE_CFG[t];
            return(
              <button key={t} onClick={()=>changeDayType(selectedISO,t)}
                style={{flex:1,padding:'9px 4px',borderRadius:'10px',
                  border:`1.5px solid ${active?'var(--accent)':'var(--border)'}`,
                  background:active?'var(--accent-soft)':'var(--card)',
                  color:active?'var(--accent)':'var(--text2)',
                  fontSize:'12px',fontWeight:600,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
                <span>{cfg.icon}</span><span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meals */}
      {MEAL_ORDER.filter(m=>dayItems[m]).map(meal=>(
        <div key={meal} style={S.card({padding:'12px 14px'})}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>
              {MEAL_LABEL[meal]} {meal.toUpperCase()}
            </div>
            <button
              onClick={()=>{
                const mealContexts=[...new Set([...(dayItems[meal]||[]).map(i=>i.context).filter(Boolean),'vegetable_side','breakfast_protein','breakfast_toppings'])];
                setAddModal({dateISO:selectedISO,dayIndex:di,meal,type,contexts:mealContexts});
              }}
              style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text2)',fontSize:'12px',padding:'2px 8px'}}>
              + aggiungi
            </button>
          </div>
          {dayItems[meal].map((item)=>{
            const logEntry=dayLog[item.key]||{};
            const isChecked=!!logEntry.checked;
            const displayQty=logEntry.qtyOverride??item.qty;
            const isEditing=editQty?.key===item.key;
            return(
              <div key={item.key} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid var(--border)',opacity:isChecked?0.6:1,transition:'opacity 0.2s'}}>
                {/* Checkbox */}
                <button onClick={()=>toggleLogItem(selectedISO,item.key)}
                  style={{width:'22px',height:'22px',borderRadius:'6px',border:'1.5px solid #56505a',
                    background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                  {isChecked&&<span style={{color:'var(--accent)',fontSize:'12px',fontWeight:700}}>✓</span>}
                </button>
                {/* Food name */}
                <button
                  onClick={()=>{
                    if(FOOD_DB[item.context]?.length>1){
                      setSwapModal({dateISO:selectedISO,dayIndex:di,meal,itemIndex:Number(item.key.split('_').pop()),context:item.context,currentName:item.name,type});
                    }
                  }}
                  style={{flex:1,background:'none',border:'none',textAlign:'left',padding:0,fontSize:'13px',
                    color:FOOD_DB[item.context]?.length>1?'var(--text)':'var(--text2)',
                    textDecoration:isChecked?'line-through':'none',display:'flex',alignItems:'center',gap:'4px',
                    cursor:FOOD_DB[item.context]?.length>1?'pointer':'default'}}
                >
                  <span>{item.name}</span>
                  {FOOD_DB[item.context]?.length>1&&<span style={{color:'var(--text3)',fontSize:'10px'}}>⇄</span>}
                </button>
                {/* Qty */}
                {isEditing?(
                  <QtyEditor value={displayQty} uom={item.uom}
                    onSave={v=>{updateLogQty(selectedISO,item.key,v);setEditQty(null);}}
                    onCancel={()=>setEditQty(null)}/>
                ):(
                  <button onClick={()=>setEditQty({key:item.key})}
                    style={{fontSize:'12px',color:'var(--text2)',fontWeight:500,background:'var(--chip)',
                      padding:'3px 10px',borderRadius:'999px',border:'none',minWidth:'56px',textAlign:'center'}}>
                    {displayQty} {item.uom}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
      {(weekPlan.extraMeals?.[selectedISO]||[]).length>0&&(
        <div style={S.card({padding:'12px 14px'})}>
          <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px',marginBottom:'10px'}}>EXTRA</div>
          {(weekPlan.extraMeals[selectedISO]||[]).map((ei,i)=>{
            const food=(FOOD_DB[ei.context]||[]).find(f=>f.name===ei.name);
            if(!food)return null;
            const key=`extra_${selectedISO}_${i}`;
            const le=(dailyLog[selectedISO]||{})[key]||{};
            const qty=le.qtyOverride??food.qty?.[type]??food.qty?.Riposo??0;
            return(
              <div key={key} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid var(--border)',opacity:le.checked?0.6:1}}>
                <button onClick={()=>toggleLogItem(selectedISO,key)}
                  style={{width:'22px',height:'22px',borderRadius:'6px',border:'1.5px solid #56505a',background:'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {le.checked&&<span style={{color:'var(--accent)',fontSize:'12px',fontWeight:700}}>✓</span>}
                </button>
                <span style={{flex:1,fontSize:'13px',color:'var(--text)',textDecoration:le.checked?'line-through':'none'}}>{food.name}</span>
                <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 10px',borderRadius:'999px'}}>{qty} {food.uom}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{padding:'8px 0'}}>
        <button onClick={()=>setExtraModal({dateISO:selectedISO,dayIndex:di,type})}
          style={{width:'100%',padding:'12px',background:'var(--surface)',border:'1px dashed var(--border)',borderRadius:'12px',color:'var(--text2)',fontSize:'13px',fontWeight:500,cursor:'pointer'}}>
          ＋ Pasto extra
        </button>
      </div>
    </div>
  );
}

function QtyEditor({value,uom,onSave,onCancel}){
  const [v,setV]=useState(String(value));
  const ref=useRef();
  useEffect(()=>{ref.current?.focus();ref.current?.select();},[]);
  return(
    <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
      <input ref={ref} value={v} onChange={e=>setV(e.target.value)} type="number"
        style={{width:'56px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',
          color:'var(--text)',fontSize:'12px',padding:'3px 6px',textAlign:'center'}}
        onKeyDown={e=>{if(e.key==='Enter')onSave(Number(v));if(e.key==='Escape')onCancel();}}/>
      <span style={{fontSize:'11px',color:'var(--text2)'}}>{uom}</span>
      <button onClick={()=>onSave(Number(v))} style={{background:'var(--accent)',border:'none',borderRadius:'6px',color:'#fff',fontSize:'11px',padding:'3px 6px'}}>✓</button>
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────
function DashboardView({weeklyTotals,weekDates,weekPlan,dailyLog,getDayCompliance,dayTypes}){
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Daily compliance grid */}
      <div style={S.card({padding:'14px'})}>
        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px',marginBottom:'12px'}}>COMPLIANCE SETTIMANALE</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'6px'}}>
          {weekDates.map((date,di)=>{
            const iso=toISO(date);const isToday=iso===toISO(new Date());
            const comp=getDayCompliance(iso,di);const type=getDayType(dayTypes,weekPlan,iso,di);
            const tc=TYPE_CFG[type];
            return(
              <div key={di} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                <div style={{fontSize:'9px',color:isToday?'var(--accent)':'var(--text3)',fontWeight:isToday?700:400,letterSpacing:'0.3px'}}>
                  {DAYS[di].slice(0,3).toUpperCase()}
                </div>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',
                  background:comp===null?'var(--surface)':comp>=80?'var(--accent-soft)':'var(--muted)',
                  border:`1px solid ${isToday?'var(--accent)':(comp!==null?'#4f4952':'var(--border)')}`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700,
                  color:comp===null?'var(--text3)':comp>=80?'var(--accent)':'var(--text2)'}}>
                  {comp===null?'—':`${comp}`}
                </div>
                <div style={{fontSize:'9px',color:'var(--text3)'}}>{tc.icon}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly limits */}
      <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px',padding:'0 2px'}}>LIMITI SETTIMANALI (consumato)</div>
      {LIMIT_GROUPS.map(g=>{
        const used=weeklyTotals[g.key]||0;
        const pct=Math.min(used/g.val*100,100);
        const high=pct>=80;
        const color=high?'var(--accent)':'#45404a';
        if(used===0&&g.val>100)return null; // hide empty food groups
        return(
          <div key={g.key} style={S.card({padding:'12px 14px'})}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
              <div style={{fontSize:'13px',color:'var(--text)',fontWeight:500,display:'flex',alignItems:'center',gap:'6px'}}>
                <span>{g.icon}</span><span>{g.label}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'12px',color,fontWeight:600}}>{used}</span>
                <span style={{fontSize:'11px',color:'var(--text3)'}}>/ {g.val} {g.uom}</span>
                {high&&<span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--accent)'}}/>}
              </div>
            </div>
            <div style={{height:'3px',borderRadius:'3px',background:'#2c2a33',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:'3px',transition:'width 0.5s'}}/>
            </div>
          </div>
        );
      }).filter(Boolean)}

      {Object.keys(weeklyTotals).length===0&&(
        <div style={{textAlign:'center',padding:'40px 20px',color:'var(--text3)',fontSize:'13px'}}>
          Inizia a spuntare i pasti nel tab <strong style={{color:'var(--text2)'}}>Oggi</strong> per vedere i consumi settimanali
        </div>
      )}
    </div>
  );
}

// ── SWAP MODAL ────────────────────────────────────────────────
function SwapModal({modal,weekPlan,onSwap,onClose}){
  const {dateISO,dayIndex,meal,itemIndex,context,currentName,type}=modal;
  const alternatives=FOOD_DB[context]||[];
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'70vh',overflowY:'auto',boxShadow:'0 -8px 24px rgba(26,26,26,0.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)'}}>Cambia alimento</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'12px',letterSpacing:'0.5px'}}>
          {meal.toUpperCase()} • Stesso gruppo nutrizionale
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {alternatives.map((alt,i)=>{
            const isCurrent=alt.name===currentName;
            const qty=alt.qty[type];
            if(qty===0)return null;
            return(
              <button key={i} onClick={()=>onSwap(dateISO,dayIndex,meal,itemIndex,alt.name)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                  borderRadius:'10px',border:`1px solid ${isCurrent?'var(--accent)':'var(--border)'}`,
                  background:isCurrent?'var(--accent-soft)':'var(--card)',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  {isCurrent&&<span style={{color:'var(--accent)',fontSize:'14px'}}>✓</span>}
                  <span style={{fontSize:'14px',color:isCurrent?'var(--accent)':'var(--text)',fontWeight:isCurrent?600:400}}>{alt.name}</span>
                </div>
                <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                  {qty} {alt.uom}
                </span>
              </button>
            );
          }).filter(Boolean)}
        </div>
      </div>
    </div>
  );
}

function AddFoodModal({modal,onAdd,onClose}){
  const {dateISO,dayIndex,meal,type,contexts}=modal;
  const [context,setContext]=useState(contexts[0]||'');
  const options=(FOOD_DB[context]||[]).filter(f=>(f.qty?.[type]??f.qty?.Riposo??0)>0);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'70vh',overflowY:'auto',boxShadow:'0 -8px 24px rgba(26,26,26,0.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)'}}>Aggiungi alimento</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'10px',letterSpacing:'0.5px'}}>
          {meal.toUpperCase()} • Stessa categoria del pasto
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
          {contexts.map(ctx=>(
            <button key={ctx} onClick={()=>setContext(ctx)}
              style={{
                border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 9px',
                background:context===ctx?'var(--accent-soft)':'var(--card)',
                color:context===ctx?'var(--accent)':'var(--text2)',fontSize:'11px',fontWeight:600
              }}>
              {ctx.replaceAll('_',' ')}
            </button>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {options.map((food,i)=>(
            <button key={i} onClick={()=>onAdd(dateISO,dayIndex,meal,context,food.name)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer'}}>
              <span style={{fontSize:'14px',color:'var(--text)'}}>{food.name}</span>
              <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                {food.qty[type]??food.qty.Riposo} {food.uom}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExtraFoodModal({modal,onAdd,onClose}){
  const {type,dateISO}=modal;
  const allContexts=Object.keys(FOOD_DB);
  const CONTEXT_LABELS={
    protein_equiv_chicken:'Proteine',lunch_carb_pasta:'Carboidrati pranzo',
    dinner_carb_bread:'Carboidrati cena/colazione',oats_breakfast:'Cereali colazione',
    milk_portion:'Latte e bevande',fruit_portion:'Frutta',yogurt_portion:'Yogurt',
    nuts_snack:'Frutta secca e snack',oil_portion:'Olio',vegetable_side:'Verdure',
    breakfast_dairy:'Latticini colazione',breakfast_protein:'Proteine colazione',
    breakfast_toppings:'Topping colazione',speciali_farine:'Farine speciali',
    latte_riso_portion:'Latte e alternative',ciocco_snack:'Cioccolato',
    sat_bread:'Pane',sat_protein_lunch:'Proteine',sat_veg_lunch:'Verdure',
    parmigiano_snack:'Formaggi snack',philly_portion:'Formaggi spalmabili',
    feta_portion:'Formaggi stagionati',
    ricotta_protein:'Ricotta e latticini',
    pre_run_banana:'Pre-corsa',pre_run_bread:'Pre-corsa pane',
    pre_soccer_bread:'Pre-calcio pane',pre_soccer_jam:'Pre-calcio dolce',
    post_workout_milk:'Post-workout latte',post_workout_banana:'Post-workout banana',
    post_workout_avocado:'Post-workout avocado',
    free_meal_dinner:'Pasto libero cena',free_meal_lunch:'Pasto libero pranzo',
    sun_breakfast_sweet:'Colazione domenica',sun_biscuits:'Biscotti',
    sun_dinner_protein:'Proteine domenica',
  };
  const [context,setContext]=useState(allContexts[0]||'');
  const [search,setSearch]=useState('');
  const options=(FOOD_DB[context]||[]).filter(f=>{
    const qty=f.qty?.[type]??f.qty?.Riposo??0;
    if(qty===0)return false;
    if(search)return f.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'80vh',overflowY:'auto',boxShadow:'0 -8px 24px rgba(26,26,26,0.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)'}}>Pasto Extra</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <input placeholder="Cerca alimento..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:'14px',marginBottom:'12px',boxSizing:'border-box'}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
          {allContexts.map(ctx=>(
            <button key={ctx} onClick={()=>{setContext(ctx);setSearch('');}}
              style={{border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 9px',
                background:context===ctx?'var(--accent-soft)':'var(--card)',
                color:context===ctx?'var(--accent)':'var(--text2)',fontSize:'11px',fontWeight:600}}>
              {CONTEXT_LABELS[ctx]||ctx.replaceAll('_',' ')}
            </button>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {options.map((food,i)=>(
            <button key={i} onClick={()=>onAdd(dateISO,context,food.name)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer'}}>
              <span style={{fontSize:'14px',color:'var(--text)'}}>{food.name}</span>
              <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                {food.qty[type]??food.qty.Riposo} {food.uom}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CALENDAR VIEW ─────────────────────────────────────────────
const MONTH_NAMES=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
function CalendarView({dailyLog,dayTypes,weekPlan,setTab,setSelectedDayIndex,setWeekStart}){
  const todayISO=toISO(new Date());
  const [cur,setCur]=useState(()=>{const d=new Date();return{year:d.getFullYear(),month:d.getMonth()};});
  const {year,month}=cur;
  const prevMonth=()=>setCur(c=>c.month===0?{year:c.year-1,month:11}:{year:c.year,month:c.month-1});
  const nextMonth=()=>setCur(c=>c.month===11?{year:c.year+1,month:0}:{year:c.year,month:c.month+1});
  const firstDow=(new Date(year,month,1).getDay()+6)%7; // 0=Lun
  const daysInMonth=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDow;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const getISO=(d)=>`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const getCompliance=(dateISO)=>{
    const d=new Date(dateISO);const di=(d.getDay()+6)%7;
    const items=getDayItems(weekPlan,di,dateISO,dayTypes);
    const dl=dailyLog[dateISO]||{};
    const all=MEAL_ORDER.flatMap(m=>items[m]||[]);
    if(!all.length)return null;
    const c=all.filter(it=>dl[it.key]?.checked).length;
    return Math.round(c/all.length*100);
  };
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Header mese */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 0'}}>
        <button onClick={prevMonth} style={{...S.btn('var(--text3)',{padding:'6px 14px',fontSize:'16px'})}}>‹</button>
        <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)',fontWeight:700}}>
          {MONTH_NAMES[month]} {year}
        </div>
        <button onClick={nextMonth} style={{...S.btn('var(--text3)',{padding:'6px 14px',fontSize:'16px'})}}>›</button>
      </div>
      {/* Intestazioni giorni */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px'}}>
        {['L','M','M','G','V','S','D'].map((d,i)=>(
          <div key={i} style={{textAlign:'center',fontSize:'10px',color:'var(--text3)',fontWeight:600,padding:'4px 0'}}>{d}</div>
        ))}
      </div>
      {/* Griglia giorni */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px'}}>
        {cells.map((d,i)=>{
          if(!d)return<div key={i}/>;
          const dateISO=getISO(d);
          const isFuture=dateISO>todayISO;
          const isToday=dateISO===todayISO;
          const type=dayTypes?.[dateISO];
          const comp=!isFuture?getCompliance(dateISO):null;
          const hasLog=!!(dailyLog[dateISO]&&Object.keys(dailyLog[dateISO]).length>0);
          return(
            <div key={i} onClick={()=>{
                if(isFuture)return;
                const dd=new Date(dateISO);
                setWeekStart(getWeekStart(dd));
                setSelectedDayIndex((dd.getDay()+6)%7);
                setTab('oggi');
              }}
              style={{
                borderRadius:'10px',
                border:`${isToday?'2px':'1px'} solid ${isToday?'var(--accent)':'var(--border)'}`,
                background:hasLog?'var(--card)':'var(--surface)',
                opacity:isFuture?0.3:1,
                padding:'6px 2px',
                textAlign:'center',
                cursor:isFuture?'default':'pointer',
                minHeight:'52px',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1px'
              }}>
              <span style={{fontSize:'11px',color:isToday?'var(--accent)':'var(--text2)',fontWeight:isToday?700:400}}>{d}</span>
              {type&&<span style={{fontSize:'11px'}}>{TYPE_CFG[type].icon}</span>}
              {comp!==null&&<span style={{fontSize:'9px',color:comp>=80?'var(--accent)':'var(--text3)',fontWeight:600}}>{comp}%</span>}
            </div>
          );
        })}
      </div>
      {/* Legenda */}
      <div style={{display:'flex',gap:'16px',justifyContent:'center',padding:'4px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--text3)'}}>
          <span>💤</span><span>Riposo</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--text3)'}}>
          <span>🏃</span><span>Corsa</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--text3)'}}>
          <span>⚽</span><span>Calcio</span>
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────
const APP_PIN='141098';
export default function App(){
  const [unlocked,setUnlocked]=useState(false);
  const [pinInput,setPinInput]=useState('');
  const [pinError,setPinError]=useState(false);

  const handlePin=(digit)=>{
    if(pinError)return;
    const next=pinInput+digit;
    setPinInput(next);
    if(next.length===APP_PIN.length){
      if(next===APP_PIN){setUnlocked(true);}
      else{setPinError(true);setTimeout(()=>{setPinInput('');setPinError(false);},700);}
    }
  };
  const handleDel=()=>{if(!pinError)setPinInput(p=>p.slice(0,-1));};

  const [tab,setTab]=useState('home');
  const [weekStart,setWeekStart]=useState(()=>getWeekStart());
  const [weekPlan,setWeekPlan]=useState({types:['Riposo','Corsa','Riposo','Corsa','Calcio','Corsa','Riposo'],overrides:{}});
  const [dailyLog,setDailyLog]=useState({});
  const [swapModal,setSwapModal]=useState(null);
  const [addModal,setAddModal]=useState(null);
  const [extraModal,setExtraModal]=useState(null);
  const [editQty,setEditQty]=useState(null);
  const [expandedDay,setExpandedDay]=useState(null);
  const [selectedDayIndex,setSelectedDayIndex]=useState(()=>{const g=new Date().getDay();return g===0?6:g-1;});
  const [dayTypes,setDayTypes]=useState({});

  useEffect(()=>{
    (async()=>{
      try{
        const wp=await window.storage.get('nt_weekPlan');
        if(wp?.value)setWeekPlan(JSON.parse(wp.value));
        const dl=await window.storage.get('nt_dailyLog');
        if(dl?.value)setDailyLog(JSON.parse(dl.value));
        const dt=await window.storage.get('nt_dayTypes');
        if(dt?.value)setDayTypes(JSON.parse(dt.value));
      }catch(e){}
    })();
  },[]);

  if(!unlocked){
    return(
      <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'32px',padding:'24px'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>🥗</div>
          <div style={{fontFamily:'var(--display)',fontSize:'26px',color:'var(--text)'}}>NutriTracker</div>
          <div style={{fontSize:'13px',color:'var(--text2)',marginTop:'6px'}}>Inserisci il codice di accesso</div>
        </div>
        {/* Dots */}
        <div style={{display:'flex',gap:'14px'}}>
          {Array.from({length:APP_PIN.length}).map((_,i)=>(
            <div key={i} style={{width:'14px',height:'14px',borderRadius:'50%',
              background:i<pinInput.length?(pinError?'#e05c5c':'var(--accent)'):'var(--border)',
              transition:'background 0.15s',
              boxShadow:i<pinInput.length&&!pinError?'0 0 8px var(--accent)':undefined}}/>
          ))}
        </div>
        {/* Keypad */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',width:'220px'}}>
          {[1,2,3,4,5,6,7,8,9].map(n=>(
            <button key={n} onClick={()=>handlePin(String(n))}
              style={{height:'60px',borderRadius:'14px',border:'1px solid var(--border)',background:'var(--card)',
                color:'var(--text)',fontSize:'22px',fontWeight:600,cursor:'pointer',transition:'background 0.1s'}}>
              {n}
            </button>
          ))}
          <div/>
          <button onClick={()=>handlePin('0')}
            style={{height:'60px',borderRadius:'14px',border:'1px solid var(--border)',background:'var(--card)',
              color:'var(--text)',fontSize:'22px',fontWeight:600,cursor:'pointer'}}>
            0
          </button>
          <button onClick={handleDel}
            style={{height:'60px',borderRadius:'14px',border:'1px solid var(--border)',background:'var(--card)',
              color:'var(--text2)',fontSize:'20px',cursor:'pointer'}}>
            ⌫
          </button>
        </div>
      </div>
    );
  }

  const weekDates=getWeekDates(weekStart);
  const todayISO=toISO(new Date());

  const saveWP=async p=>{setWeekPlan(p);try{await window.storage.set('nt_weekPlan',JSON.stringify(p));}catch(e){}};
  const saveDL=async l=>{setDailyLog(l);try{await window.storage.set('nt_dailyLog',JSON.stringify(l));}catch(e){}};

  const changeDayType=(dateISO,t)=>{
    const newDayTypes={...dayTypes,[dateISO]:t};
    setDayTypes(newDayTypes);
    try{window.storage.set('nt_dayTypes',JSON.stringify(newDayTypes));}catch(e){}
  };

  const setMealOverrides=(dateISO,meal,items)=>{
    saveWP({...weekPlan,overrides:{...weekPlan.overrides,[dateISO]:{...(weekPlan.overrides?.[dateISO]||{}),[meal]:items}}});
  };
  const resetMeal=(dateISO,meal)=>{
    const newOverrides={...weekPlan.overrides};
    if(newOverrides[dateISO]){const d={...newOverrides[dateISO]};delete d[meal];newOverrides[dateISO]=d;}
    saveWP({...weekPlan,overrides:newOverrides});
  };

  const addExtraFood=(dateISO,context,name)=>{
    const cur=weekPlan.extraMeals?.[dateISO]||[];
    saveWP({...weekPlan,extraMeals:{...(weekPlan.extraMeals||{}),[dateISO]:[...cur,{context,name}]}});
    setExtraModal(null);
  };

  const swapFood=(dateISO,dayIndex,meal,ii,newFood)=>{
    const cur=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const upd=cur.map((item,i)=>i===ii?{...item,name:newFood}:item);
    setMealOverrides(dateISO,meal,upd);
    setSwapModal(null);
  };

  const addFood=(dateISO,dayIndex,meal,context,name)=>{
    const cur=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const upd=[...cur,{context,name}];
    setMealOverrides(dateISO,meal,upd);
    setAddModal(null);
  };

  const toggleLog=(date,key)=>{
    const dl=dailyLog[date]||{};const it=dl[key];
    saveDL({...dailyLog,[date]:{...dl,[key]:{...(it||{}),checked:!it?.checked}}});
  };

  const updateQty=(date,key,qty)=>{
    const dl=dailyLog[date]||{};const it=dl[key];
    saveDL({...dailyLog,[date]:{...dl,[key]:{...(it||{}),qtyOverride:qty}}});
  };

  const getWeeklyTotals=()=>{
    const totals={};
    weekDates.forEach((date,di)=>{
      const iso=toISO(date);const dayLog=dailyLog[iso]||{};
      const items=getDayItems(weekPlan,di,iso,dayTypes);
      MEAL_ORDER.forEach(m=>(items[m]||[]).forEach(item=>{
        const le=dayLog[item.key];
        if(le?.checked&&item.limitKey){
          totals[item.limitKey]=(totals[item.limitKey]||0)+(le.qtyOverride??item.qty);
        }
      }));
    });
    return totals;
  };

  const getDayCompliance=(iso,di)=>{
    const items=getDayItems(weekPlan,di,iso,dayTypes);const dl=dailyLog[iso]||{};
    const all=MEAL_ORDER.flatMap(m=>items[m]||[]);
    if(!all.length)return null;
    return Math.round(all.filter(it=>dl[it.key]?.checked).length/all.length*100);
  };

  const weeklyTotals=getWeeklyTotals();

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text)',fontFamily:'var(--font)',paddingBottom:'80px'}}>
      {/* Header */}
      <div style={{padding:'20px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--bg)',zIndex:10}}>
        <div style={{fontFamily:'var(--display)',fontSize:'18px',letterSpacing:'0px',fontWeight:700}}>
          NutriTrack
        </div>
        {tab==='home'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            Il tuo percorso nutrizionale
          </div>
        )}
        {tab==='planner'&&(
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <button onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;})}
              style={{...S.btn('var(--text3)',{padding:'4px 10px',borderRadius:'6px',fontSize:'14px'})}}>‹</button>
            <span style={{fontSize:'11px',color:'var(--text2)',minWidth:'100px',textAlign:'center'}}>
              {weekDates[0].toLocaleDateString('it-IT',{day:'numeric',month:'short'})} – {weekDates[6].toLocaleDateString('it-IT',{day:'numeric',month:'short'})}
            </span>
            <button onClick={()=>setWeekStart(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;})}
              style={{...S.btn('var(--text3)',{padding:'4px 10px',borderRadius:'6px',fontSize:'14px'})}}>›</button>
          </div>
        )}
        {tab==='oggi'&&(
          <div style={{fontSize:'12px',color:'var(--text2)',textTransform:'capitalize'}}>
            {weekDates[selectedDayIndex]?.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}
          </div>
        )}
        {tab==='dashboard'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            {weekDates[0].toLocaleDateString('it-IT',{day:'numeric',month:'short'})} – {weekDates[6].toLocaleDateString('it-IT',{day:'numeric',month:'short'})}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{paddingTop:'12px'}}>
        {tab==='home'&&<HomeView weekDates={weekDates} selectedDayIndex={selectedDayIndex} dailyLog={dailyLog} weekPlan={weekPlan} dayTypes={dayTypes}/>}
        {tab==='planner'&&<PlannerView weekDates={weekDates} weekPlan={weekPlan} dailyLog={dailyLog}
          changeDayType={changeDayType} setSwapModal={setSwapModal} expandedDay={expandedDay}
          setExpandedDay={setExpandedDay} getDayCompliance={getDayCompliance} todayISO={todayISO} resetMeal={resetMeal}
          dayTypes={dayTypes}/>}
        {tab==='oggi'&&<OggiView weekPlan={weekPlan} weekDates={weekDates} todayISO={todayISO}
          selectedDayIndex={selectedDayIndex} setSelectedDayIndex={setSelectedDayIndex}
          dailyLog={dailyLog} toggleLogItem={toggleLog} updateLogQty={updateQty}
          editQty={editQty} setEditQty={setEditQty} setSwapModal={setSwapModal}
          setAddModal={setAddModal} setExtraModal={setExtraModal} dayTypes={dayTypes}
          changeDayType={changeDayType}/>}
        {tab==='calendario'&&<CalendarView dailyLog={dailyLog} dayTypes={dayTypes} weekPlan={weekPlan}
          setTab={setTab} setSelectedDayIndex={setSelectedDayIndex} setWeekStart={setWeekStart}/>}
        {tab==='dashboard'&&<DashboardView weeklyTotals={weeklyTotals} weekDates={weekDates}
          weekPlan={weekPlan} dailyLog={dailyLog} getDayCompliance={getDayCompliance} dayTypes={dayTypes}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[{id:'home',label:'Home'},{id:'oggi',label:'Oggi'},{id:'planner',label:'Planner'},{id:'calendario',label:'Calendario'},{id:'dashboard',label:'Limiti'}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:'10px 0 8px',background:'none',border:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',cursor:'pointer'}}>
            <NavGlyph id={t.id} active={tab===t.id}/>
            <span style={{fontSize:'10px',fontWeight:tab===t.id?600:500,letterSpacing:'0.2px',
              color:tab===t.id?'var(--text)':'var(--text3)'}}>{t.label}</span>
            <span style={{width:'16px',height:'2px',borderRadius:'2px',background:tab===t.id?'var(--accent)':'transparent'}}/>
          </button>
        ))}
      </div>

      {swapModal&&<SwapModal modal={swapModal} weekPlan={weekPlan} onSwap={swapFood} onClose={()=>setSwapModal(null)}/>}
      {addModal&&<AddFoodModal modal={addModal} onAdd={addFood} onClose={()=>setAddModal(null)}/>}
      {extraModal&&<ExtraFoodModal modal={extraModal} onAdd={addExtraFood} onClose={()=>setExtraModal(null)}/>}
    </div>
  );
}
