import { useState, useEffect, useRef, useMemo } from "react";

// === INJECT FONTS + BASE CSS ===
(() => {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(l);
  const s = document.createElement('style');
  s.textContent = `
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#0C0E14;--surface:#161A23;--card:#1E2338;--border:#262C3E;
      --accent:#FBA828;--accent-soft:rgba(251,168,40,0.12);
      --accent2:#00C49A;
      --text:#EFF1F8;--text2:#94A8BA;--text3:#5A6888;
      --font:'Manrope',sans-serif;--display:'Manrope',sans-serif;
      --chip:#1E2338;--muted:#161A23;
      --shadow:0 1px 2px rgba(0,0,0,0.4),0 8px 24px rgba(0,0,0,0.32);
    }
    html,body{background:var(--bg);color:var(--text);font-family:var(--font)}
    input:focus{outline:none}
    button{cursor:pointer;font-family:var(--font)}
    ::-webkit-scrollbar{width:6px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#262C3E;border-radius:6px}
  `;
  document.head.appendChild(s);
})();

// ── DATA ──────────────────────────────────────────────────────
const DAYS = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const MEAL_ORDER = ['Colazione','Spuntino mattina','Pranzo','Spuntino pomeriggio','Pre-workout','Cena','Post-workout'];
const MEAL_LABEL = {Colazione:'COL','Spuntino mattina':'SPU',Pranzo:'PRA','Spuntino pomeriggio':'POM','Pre-workout':'PRE',Cena:'CEN','Post-workout':'POST'};
const TYPE_CFG = {
  Riposo: {label:'Riposo', short:'R', icon:'😴', color:'#5A6888'},
  Corsa:  {label:'Corsa',  short:'C', icon:'🏃', color:'#00C49A'},
  Calcio: {label:'Calcio', short:'F', icon:'⚽', color:'#FBA828'},
};

// Tutte le quantità dal foglio "Quantità". Calcio = Corsa (foglio non distingue tipo sport).
const Q = (r,c) => ({Riposo:r, Corsa:c, Calcio:c});

const FOOD_DB = {
  protein_equiv_chicken:[
    {name:'Petto di pollo',        qty:Q(160,180), uom:'g', kcal:105, limitKey:'white_meat_fresh'},
    {name:'Sovracosce di pollo',   qty:Q(150,180), uom:'g', kcal:206, limitKey:'white_meat_fresh'},
    {name:'Merluzzo',              qty:Q(150,180), uom:'g', kcal:71,  limitKey:'fish_fresh'},
    {name:'Salmone',               qty:Q(160,180), uom:'g', kcal:195, limitKey:'fish_fresh'},
    {name:'Orata',                 qty:Q(160,180), uom:'g', kcal:121, limitKey:'fish_fresh'},
    {name:'Spigola',               qty:Q(160,180), uom:'g', kcal:97,  limitKey:'fish_fresh'},
    {name:'Sgombro',               qty:Q(160,180), uom:'g', kcal:170, limitKey:'fish_fresh'},
    {name:'Sogliola',              qty:Q(160,180), uom:'g', kcal:83,  limitKey:'fish_fresh'},
    {name:'Tonno al naturale',     qty:Q(100,120), uom:'g', kcal:100, limitKey:'tuna_canned'},
    {name:'Salmone affumicato',    qty:Q(75,80),   uom:'g', kcal:142, limitKey:'fish_smoked'},
    {name:'Polpo',                 qty:Q(200,220), uom:'g', kcal:82,  limitKey:'fish_fresh'},
    {name:'Calamari',              qty:Q(220,250), uom:'g', kcal:78,  limitKey:'fish_fresh'},
    {name:'Gamberi sgusciati',     qty:Q(220,250), uom:'g', kcal:71,  limitKey:'fish_fresh'},
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
    {name:'Fiocchi di latte',      qty:Q(150,170), uom:'g', kcal:103, limitKey:'cheese_all'},
    {name:'Mozzarella',            qty:Q(150,170), uom:'g', kcal:253, limitKey:'cheese_all'},
    {name:'Ricotta',               qty:Q(150,170), uom:'g', kcal:146, limitKey:'cheese_all'},
    {name:'Formaggio Linea Osella',qty:Q(150,170), uom:'g', kcal:100, limitKey:'cheese_all'},
    {name:'Formaggio stagionato',  qty:Q(120,150), uom:'g', kcal:402, limitKey:'cheese_all'},
    {name:'Feta',                  qty:Q(150,170), uom:'g', kcal:264, limitKey:'cheese_all'},
    {name:'Stracchino light',      qty:Q(120,150), uom:'g', kcal:134, limitKey:'cheese_all'},
    {name:'Formaggio fresco snack',qty:Q(40,40),   uom:'g', kcal:134, limitKey:'cheese_all'},
    {name:'Yogurt Greco 0% Bianco',        qty:Q(170,200), uom:'g', kcal:53, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Senza Lattosio',qty:Q(170,200), uom:'g', kcal:53, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Vaniglia',      qty:Q(170,200), uom:'g', kcal:84, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Frutti di Bosco',qty:Q(170,200),uom:'g', kcal:74, limitKey:'yogurt_skyr'},
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
    {name:'Orzo',            qty:Q(80,100),  uom:'g', kcal:319, limitKey:'grain_alt_family'},
    {name:'Quinoa',          qty:Q(80,100),  uom:'g', kcal:368, limitKey:'grain_alt_family'},
    {name:'Miglio',          qty:Q(80,100),  uom:'g', kcal:378, limitKey:'grain_alt_family'},
    {name:'Cous cous',       qty:Q(80,100),  uom:'g', kcal:376, limitKey:'grain_alt_family'},
    {name:'Spatzle',         qty:Q(80,100),  uom:'g', kcal:300, limitKey:'pasta_family'},
    {name:'Gnocchi',         qty:Q(200,225), uom:'g', kcal:135, limitKey:'gnocchi_family'},
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
    {name:'Wasa',              qty:Q(40,50),  uom:'g', kcal:357, limitKey:'crackers_family'},
  ],
  oats_breakfast:[
    {name:'Avena',                     qty:Q(60,60), uom:'g',  kcal:379, limitKey:'oats_family'},
    {name:'Muesli',                    qty:Q(60,60), uom:'g',  kcal:363, limitKey:'oats_family'},
    {name:'Fette biscottate integrali',qty:Q(4,4),   uom:'pz', kcal:38,  limitKey:'fette_family'},
    {name:'Gallette di mais',          qty:Q(8.75,8.75), uom:'pz', kcal:38, limitKey:'gallette_family'},
  ],
  milk_portion:[
    {name:'Latte',                      qty:Q(250,250),uom:'ml',kcal:64,  limitKey:'milk_default'},
    {name:'Latte senza lattosio',        qty:Q(250,250),uom:'ml',kcal:64,  limitKey:'milk_default'},
    {name:'Latte di cocco',              qty:Q(200,200),uom:'ml',kcal:230, limitKey:'milk_default'},
    {name:'Latte di cocco e riso',       qty:Q(200,200),uom:'ml',kcal:80,  limitKey:'milk_default'},
    {name:'Latte di riso',               qty:Q(200,200),uom:'ml',kcal:47,  limitKey:'milk_default'},
    {name:'Latte di mandorla',           qty:Q(200,200),uom:'ml',kcal:24,  limitKey:'milk_default'},
    {name:'Latte di soia',               qty:Q(200,200),uom:'ml',kcal:54,  limitKey:'milk_default'},
    {name:'Cappuccino',                  qty:Q(200,200),uom:'ml',kcal:40,  limitKey:'milk_default'},
    {name:'Spremuta di arancia',         qty:Q(150,150),uom:'ml',kcal:45,  limitKey:'juice_portion'},
  ],
  fruit_portion:[
    {name:'Mela',          qty:Q(1,1),    uom:'pz',   kcal:80,  limitKey:null},
    {name:'Banana',        qty:Q(1,1),    uom:'pz',   kcal:105, limitKey:null},
    {name:'Pera',          qty:Q(1,1),    uom:'pz',   kcal:85,  limitKey:null},
    {name:'Arancia',       qty:Q(1,1),    uom:'pz',   kcal:60,  limitKey:null},
    {name:'Kiwi',          qty:Q(2,2),    uom:'pz',   kcal:46,  limitKey:null},
    {name:'Pesche',        qty:Q(2,2),    uom:'pz',   kcal:35,  limitKey:null},
    {name:'Mandaranci',    qty:Q(2,2),    uom:'pz',   kcal:25,  limitKey:null},
    {name:'Prugne',        qty:Q(2,2),    uom:'pz',   kcal:20,  limitKey:null},
    {name:'Clementine',    qty:Q(2,2),    uom:'pz',   kcal:25,  limitKey:null},
    {name:'Albicocche',    qty:Q(4,4),    uom:'pz',   kcal:15,  limitKey:null},
    {name:'Fragole',       qty:Q(250,250),uom:'g',    kcal:27,  limitKey:null},
    {name:'Mirtilli',      qty:Q(150,150),uom:'g',    kcal:57,  limitKey:null},
    {name:'Frutti di bosco',qty:Q(150,150),uom:'g',   kcal:45,  limitKey:null},
    {name:'Uva',           qty:Q(130,130),uom:'g',    kcal:67,  limitKey:null},
    {name:'Ananas',        qty:Q(200,200),uom:'g',    kcal:40,  limitKey:null},
    {name:'Ciliegie',      qty:Q(150,150),uom:'g',    kcal:48,  limitKey:null},
    {name:'Anguria',       qty:Q(1,1),    uom:'fetta',kcal:80,  limitKey:null},
    {name:'Melone',        qty:Q(2,2),    uom:'fetta',kcal:60,  limitKey:null},
  ],
  yogurt_portion:[
    {name:'Skyr',                          qty:Q(170,170),uom:'g',kcal:66, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Bianco',        qty:Q(170,200),uom:'g',kcal:53, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Senza Lattosio',qty:Q(170,200),uom:'g',kcal:53, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Vaniglia',      qty:Q(170,200),uom:'g',kcal:84, limitKey:'yogurt_skyr'},
    {name:'Yogurt Greco 0% Frutti di Bosco',qty:Q(170,200),uom:'g',kcal:74, limitKey:'yogurt_skyr'},
  ],
  nuts_snack:[
    {name:'Mandorle',          qty:Q(20,20),uom:'g',kcal:603, limitKey:'nuts'},
    {name:'Noci',              qty:Q(20,20),uom:'g',kcal:654, limitKey:'nuts'},
    {name:'Nocciole',          qty:Q(20,20),uom:'g',kcal:628, limitKey:'nuts'},
    {name:'Anacardi',          qty:Q(20,20),uom:'g',kcal:553, limitKey:'nuts'},
    {name:'Arachidi non salate',qty:Q(20,20),uom:'g',kcal:594, limitKey:'nuts'},
    {name:'Olive nere',        qty:Q(15,15),uom:'g',kcal:115, limitKey:'olive_default'},
    {name:'Olive verdi',       qty:Q(15,15),uom:'g',kcal:100, limitKey:'olive_default'},
    {name:'Grana snack',       qty:Q(10,10),uom:'g',kcal:402, limitKey:'cheese_all'},
    {name:'Formaggio fresco snack',qty:Q(40,40),uom:'g',kcal:134, limitKey:'cheese_all'},
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
  pre_run_banana:[{name:'Banana pre-corsa',      qty:{Riposo:0,Corsa:1,Calcio:0},  uom:'pz',kcal:105, limitKey:null}],
  pre_run_bread: [{name:'Pane bianco pre-corsa',  qty:{Riposo:0,Corsa:30,Calcio:0}, uom:'g', kcal:275, limitKey:'bread_family'}],
  pre_soccer_bread:[{name:'Pane pre-calcio',      qty:{Riposo:0,Corsa:0,Calcio:60}, uom:'g', kcal:275, limitKey:'bread_family'}],
  pre_soccer_jam:[
    {name:'Marmellata pre-calcio',qty:{Riposo:0,Corsa:0,Calcio:20},uom:'g',kcal:260,limitKey:'jam_default'},
    {name:'Miele pre-calcio',     qty:{Riposo:0,Corsa:0,Calcio:10},uom:'g',kcal:304,limitKey:'honey_default'},
  ],
  post_workout_milk:  [{name:'Latte post-workout',   qty:{Riposo:0,Corsa:250,Calcio:250},uom:'ml',kcal:64, limitKey:'milk_default'}],
  post_workout_banana:[{name:'Banana post-workout',  qty:{Riposo:0,Corsa:1,Calcio:1},   uom:'pz',kcal:105, limitKey:null}],
  post_workout_avocado:[{name:'Avocado',             qty:{Riposo:0,Corsa:70,Calcio:70}, uom:'g', kcal:160, limitKey:'avocado'}],
};

// ── WEEKEND FOOD GROUPS ───────────────────────────────────────
FOOD_DB.philly_portion = [
  {name:'Philadelphia light', qty:Q(40,40), uom:'g', kcal:130, limitKey:'cheese_all'},
  {name:'Ricotta',            qty:Q(40,50), uom:'g', kcal:146, limitKey:'cheese_all'},
  {name:'Stracchino light',   qty:Q(40,50), uom:'g', kcal:134, limitKey:'cheese_all'},
];
FOOD_DB.sat_bread = [
  {name:'Pane di segale',  qty:Q(80,80), uom:'g', kcal:259, limitKey:'bread_family'},
  {name:'Pane integrale',  qty:Q(80,80), uom:'g', kcal:224, limitKey:'bread_family'},
  {name:'Pane bianco',     qty:Q(80,80), uom:'g', kcal:275, limitKey:'bread_family'},
];
FOOD_DB.sat_protein_lunch = [
  {name:'Uova',              qty:Q(120,120), uom:'g', kcal:143, limitKey:'eggs'},
  {name:'Petto di pollo',    qty:Q(160,180), uom:'g', kcal:105, limitKey:'white_meat_fresh'},
  {name:'Merluzzo',          qty:Q(150,180), uom:'g', kcal:71,  limitKey:'fish_fresh'},
  {name:'Tonno al naturale', qty:Q(100,120), uom:'g', kcal:100, limitKey:'tuna_canned'},
  {name:'Bresaola',          qty:Q(80,100),  uom:'g', kcal:151, limitKey:'cured_lean'},
  {name:'Fiocchi di latte',  qty:Q(150,170), uom:'g', kcal:103, limitKey:'cheese_all'},
  {name:'Ricotta',           qty:Q(150,170), uom:'g', kcal:146, limitKey:'cheese_all'},
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
  {name:'Parmigiano Reggiano',   qty:Q(30,30), uom:'g', kcal:402, limitKey:'cheese_all'},
  {name:'Grana snack',           qty:Q(30,30), uom:'g', kcal:402, limitKey:'cheese_all'},
  {name:'Formaggio fresco snack',qty:Q(40,40), uom:'g', kcal:134, limitKey:'cheese_all'},
];
FOOD_DB.free_meal_dinner = [
  {name:'Pizza 🍕 (pasto libero)',      qty:Q(1,1), uom:'porz', kcal:850, limitKey:null},
  {name:'Lasagna (pasto libero)',       qty:Q(1,1), uom:'porz', kcal:700, limitKey:null},
  {name:'Pasta al pesto (pasto libero)',qty:Q(1,1), uom:'porz', kcal:550, limitKey:null},
  {name:'Pasto libero a scelta',        qty:Q(1,1), uom:'porz', kcal:700, limitKey:null},
];
FOOD_DB.sun_breakfast_sweet = [
  {name:'Cappuccino',qty:Q(200,200), uom:'ml', kcal:40, limitKey:'milk_default'},
  {name:'Latte',     qty:Q(250,250), uom:'ml', kcal:64, limitKey:'milk_default'},
];
FOOD_DB.sun_biscuits = [
  {name:'Biscotti',                   qty:Q(40,40), uom:'g',  kcal:470, limitKey:'bread_family'},
  {name:'Fette biscottate integrali', qty:Q(4,4),   uom:'pz', kcal:38,  limitKey:'fette_family'},
  {name:'Gallette di mais',           qty:Q(8.75,8.75), uom:'pz', kcal:38, limitKey:'gallette_family'},
];
FOOD_DB.free_meal_lunch = [
  {name:'Lasagna (pasto libero)',          qty:Q(1,1), uom:'porz', kcal:700, limitKey:null},
  {name:'Pasta al pesto (pasto libero)',   qty:Q(1,1), uom:'porz', kcal:550, limitKey:null},
  {name:'Pasta al ragù (pasto libero)',    qty:Q(1,1), uom:'porz', kcal:600, limitKey:null},
  {name:'Risotto (pasto libero)',          qty:Q(1,1), uom:'porz', kcal:580, limitKey:null},
  {name:'Pasto libero a scelta',           qty:Q(1,1), uom:'porz', kcal:700, limitKey:null},
];
FOOD_DB.sun_dinner_protein = [
  {name:'Uova',              qty:Q(120,120), uom:'g', kcal:143, limitKey:'eggs'},
  {name:'Petto di pollo',    qty:Q(160,180), uom:'g', kcal:105, limitKey:'white_meat_fresh'},
  {name:'Merluzzo',          qty:Q(150,180), uom:'g', kcal:71,  limitKey:'fish_fresh'},
  {name:'Tonno al naturale', qty:Q(100,120), uom:'g', kcal:100, limitKey:'tuna_canned'},
  {name:'Bresaola',          qty:Q(80,100),  uom:'g', kcal:151, limitKey:'cured_lean'},
  {name:'Fiocchi di latte',  qty:Q(150,170), uom:'g', kcal:103, limitKey:'cheese_all'},
];
FOOD_DB.breakfast_dairy = [
  {name:'Yogurt Greco 0% Bianco',        qty:Q(170,170), uom:'g',  kcal:53, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Senza Lattosio',qty:Q(170,170), uom:'g',  kcal:53, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Vaniglia',      qty:Q(170,170), uom:'g',  kcal:84, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Frutti di Bosco',qty:Q(170,170),uom:'g',  kcal:74, limitKey:'yogurt_skyr'},
  {name:'Skyr',                          qty:Q(170,170), uom:'g',  kcal:66, limitKey:'yogurt_skyr'},
  {name:'Kefir',                         qty:Q(200,200), uom:'ml', kcal:40, limitKey:'yogurt_skyr'},
  {name:'Ricotta',                       qty:Q(40,40),   uom:'g',  kcal:146, limitKey:'cheese_all'},
  {name:'Fiocchi di latte',      qty:Q(40,40),   uom:'g',  kcal:103, limitKey:'cheese_all'},
  {name:'Philadelphia light',    qty:Q(40,40),   uom:'g',  kcal:130, limitKey:'cheese_all'},
  {name:'Formaggio Linea Osella',qty:Q(40,40),   uom:'g',  kcal:100, limitKey:'cheese_all'},
];
FOOD_DB.breakfast_protein = [
  {name:'Latte',                         qty:Q(250,250), uom:'ml', kcal:64,  limitKey:'milk_default'},
  {name:'Latte senza lattosio',          qty:Q(250,250), uom:'ml', kcal:64,  limitKey:'milk_default'},
  {name:'Latte di cocco',                qty:Q(200,200), uom:'ml', kcal:230, limitKey:'milk_default'},
  {name:'Latte di cocco e riso',         qty:Q(200,200), uom:'ml', kcal:80,  limitKey:'milk_default'},
  {name:'Latte di riso',                 qty:Q(200,200), uom:'ml', kcal:47,  limitKey:'milk_default'},
  {name:'Latte di mandorla',             qty:Q(200,200), uom:'ml', kcal:24,  limitKey:'milk_default'},
  {name:'Latte di soia',                 qty:Q(200,200), uom:'ml', kcal:54,  limitKey:'milk_default'},
  {name:'Yogurt Greco 0% Bianco',        qty:Q(170,170), uom:'g',  kcal:53, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Senza Lattosio',qty:Q(170,170), uom:'g',  kcal:53, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Vaniglia',      qty:Q(170,170), uom:'g',  kcal:84, limitKey:'yogurt_skyr'},
  {name:'Yogurt Greco 0% Frutti di Bosco',qty:Q(170,170),uom:'g',  kcal:74, limitKey:'yogurt_skyr'},
  {name:'Skyr',                          qty:Q(170,170), uom:'g',  kcal:66, limitKey:'yogurt_skyr'},
  {name:'Kefir',                         qty:Q(200,200), uom:'ml', kcal:40, limitKey:'yogurt_skyr'},
  {name:'Ricotta',                       qty:Q(40,40),   uom:'g',  kcal:146, limitKey:'cheese_all'},
  {name:'Fiocchi di latte',      qty:Q(40,40),   uom:'g',  kcal:103, limitKey:'cheese_all'},
  {name:'Philadelphia light',    qty:Q(40,40),   uom:'g',  kcal:130, limitKey:'cheese_all'},
  {name:'Uova',                  qty:Q(2,2),     uom:'pz', kcal:70,  limitKey:'eggs'},
];
FOOD_DB.breakfast_toppings = [
  {name:'Burro di arachidi',  qty:Q(20,20), uom:'g', kcal:588, limitKey:'pb'},
  {name:'Nocciole',           qty:Q(15,15), uom:'g', kcal:628, limitKey:'nuts'},
  {name:'Noci',               qty:Q(15,15), uom:'g', kcal:654, limitKey:'nuts'},
  {name:'Mandorle',           qty:Q(15,15), uom:'g', kcal:603, limitKey:'nuts'},
  {name:'Cacao amaro',        qty:Q(10,10), uom:'g', kcal:355, limitKey:null},
  {name:'Miele',              qty:Q(10,10), uom:'g', kcal:304, limitKey:'honey_default'},
  {name:'Farina di cocco',    qty:Q(10,10), uom:'g', kcal:604, limitKey:'flour_special'},
  {name:"Sciroppo d'acero",   qty:Q(10,10), uom:'g', kcal:260, limitKey:null},
];
FOOD_DB.speciali_farine = [
  {name:'Farina 0',           qty:Q(20,20), uom:'g', kcal:345, limitKey:'flour_special'},
  {name:'Farina 00',          qty:Q(20,20), uom:'g', kcal:340, limitKey:'flour_special'},
  {name:'Farina integrale',   qty:Q(20,20), uom:'g', kcal:340, limitKey:'flour_special'},
  {name:'Farina di ceci',     qty:Q(30,30), uom:'g', kcal:387, limitKey:'flour_special'},
  {name:'Farina di mais',     qty:Q(20,20), uom:'g', kcal:362, limitKey:'flour_special'},
  {name:'Farina di cocco',    qty:Q(15,15), uom:'g', kcal:604, limitKey:'flour_special'},
  {name:'Farina di mandorla', qty:Q(20,20), uom:'g', kcal:571, limitKey:'flour_special'},
  {name:'Farina di riso',     qty:Q(20,20), uom:'g', kcal:362, limitKey:'flour_special'},
  {name:"Sciroppo d'amaro",   qty:Q(5,5),   uom:'g', kcal:0,   limitKey:'syrup_special'},
];
FOOD_DB.condimenti = [
  {name:'Salsa di soia',      qty:Q(15,15), uom:'ml', kcal:63, limitKey:null},
  {name:'Gamberetti',         qty:Q(100,120), uom:'g', kcal:71, limitKey:'fish_fresh'},
  {name:'Pangrattato',        qty:Q(15,20), uom:'g', kcal:354, limitKey:null},
];
// Nuovi gruppi per i template feriali personalizzati
FOOD_DB.feta_portion = [
  {name:'Feta',               qty:Q(80,100),  uom:'g', kcal:264, limitKey:'cheese_all'},
  {name:'Formaggio stagionato',qty:Q(80,100), uom:'g', kcal:402, limitKey:'cheese_all'},
  {name:'Parmigiano Reggiano', qty:Q(30,30),  uom:'g', kcal:402, limitKey:'cheese_all'},
];
FOOD_DB.latte_riso_portion = [
  {name:'Latte di riso',     qty:Q(250,250), uom:'ml', kcal:47, limitKey:'milk_default'},
  {name:'Latte',             qty:Q(250,250), uom:'ml', kcal:64, limitKey:'milk_default'},
  {name:'Cappuccino',        qty:Q(200,200), uom:'ml', kcal:40, limitKey:'milk_default'},
];
FOOD_DB.ciocco_snack = [
  {name:'Cioccolato fondente',qty:Q(20,20), uom:'g', kcal:515, limitKey:null},
  {name:'Cacao amaro',        qty:Q(5,5),   uom:'g', kcal:355, limitKey:null},
];
FOOD_DB.ricotta_protein = [
  {name:'Ricotta',         qty:Q(150,170), uom:'g', kcal:146, limitKey:'cheese_all'},
  {name:'Fiocchi di latte',qty:Q(150,170), uom:'g', kcal:103, limitKey:'cheese_all'},
  {name:'Formaggio Linea Osella',qty:Q(150,170),uom:'g',kcal:100,limitKey:'cheese_all'},
];

// ── TEMPLATES FERIALI (Mon–Fri) per tipo giorno ────────────────
// N.B. qtyOverride sovrascrive la quantità del DB per quel singolo item
const TEMPLATES = {
  // ── Riposo — usato solo come fallback, i giorni hanno template per indice
  Riposo:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Mela'}],
    'Spuntino mattina':[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[{context:'lunch_carb_pasta',def:'Pasta integrale'},{context:'protein_equiv_chicken',def:'Petto di pollo'},{context:'vegetable_side',def:'Zucchine'},{context:'oil_portion',def:'Olio EVO'}],
    'Pre-workout':[],
    Cena:[{context:'dinner_carb_bread',def:'Pane integrale'},{context:'protein_equiv_chicken',def:'Merluzzo'},{context:'vegetable_side',def:'Broccoli'},{context:'oil_portion',def:'Olio EVO'}],
    'Post-workout':[],
  },
  Corsa:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Banana'}],
    'Spuntino mattina':[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
    Pranzo:[{context:'lunch_carb_pasta',def:'Riso basmati'},{context:'protein_equiv_chicken',def:'Petto di pollo'},{context:'vegetable_side',def:'Zucchine'},{context:'oil_portion',def:'Olio EVO'}],
    'Pre-workout':[{context:'pre_run_banana',def:'Banana pre-corsa'},{context:'pre_run_bread',def:'Pane bianco pre-corsa'}],
    Cena:[{context:'dinner_carb_bread',def:'Patate'},{context:'protein_equiv_chicken',def:'Merluzzo'},{context:'vegetable_side',def:'Broccoli'},{context:'oil_portion',def:'Olio EVO'}],
    'Post-workout':[{context:'post_workout_milk',def:'Latte post-workout'},{context:'post_workout_banana',def:'Banana post-workout'},{context:'post_workout_avocado',def:'Avocado'}],
  },
  Calcio:{
    Colazione:[{context:'oats_breakfast',def:'Avena'},{context:'milk_portion',def:'Latte'},{context:'fruit_portion',def:'Banana'}],
    'Spuntino mattina':[{context:'fruit_portion',def:'Mela'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
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
      {context:'breakfast_dairy',    def:'Yogurt Greco 0% Bianco'},
      {context:'fruit_portion',      def:'Banana'},
      {context:'oats_breakfast',     def:'Avena'},
      {context:'breakfast_toppings', def:'Burro di arachidi'},
      {context:'breakfast_toppings', def:'Cacao amaro'},
    ],
    'Spuntino mattina':[{context:'fruit_portion', def:'Pera'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
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
    'Spuntino mattina':[{context:'breakfast_dairy', def:'Yogurt Greco 0% Bianco'}],
    'Spuntino pomeriggio':[{context:'fruit_portion',def:'Mela'},{context:'nuts_snack',def:'Noci'}],
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
    'Spuntino mattina':[{context:'fruit_portion', def:'Mela'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Mandorle'}],
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
      {context:'breakfast_protein',     def:'Yogurt Greco 0% Bianco'},
      {context:'fruit_portion',         def:'Banana'},
      {context:'oats_breakfast',        def:'Avena'},
      {context:'breakfast_toppings',    def:'Burro di arachidi'},
    ],
    'Spuntino mattina':[{context:'fruit_portion', def:'Kiwi'}],
    'Spuntino pomeriggio':[{context:'breakfast_dairy',def:'Skyr'},{context:'nuts_snack',def:'Noci'}],
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
    'Spuntino mattina':[{context:'fruit_portion', def:'Arancia'}],
    'Spuntino pomeriggio':[{context:'nuts_snack',def:'Mandorle'},{context:'fruit_portion',def:'Mela'}],
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
    'Spuntino mattina':[
      {context:'fruit_portion',   def:'Mela'},
      {context:'nuts_snack',      def:'Mandorle'},
    ],
    'Spuntino pomeriggio':[{context:'parmigiano_snack',def:'Parmigiano Reggiano'}],
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
    'Spuntino mattina':[
      {context:'fruit_portion', def:'Mela'},
      {context:'nuts_snack',    def:'Noci'},
    ],
    'Spuntino pomeriggio':[{context:'fruit_portion',def:'Arancia'},{context:'nuts_snack',def:'Mandorle'}],
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
  {key:'cheese_all',label:'Formaggi',icon:'🧀',val:500,uom:'g'},
  {key:'cured_lean',label:'Affettati magri',icon:'🍖',val:350,uom:'g'},
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
  const override=weekPlan.overrides?.[dateISO]?.[meal];
  return (override&&override.length>0)?override:base;
}

function getDayItems(weekPlan, dayIndex, dateISO, dayTypes){
  const type=getDayType(dayTypes,weekPlan,dateISO,dayIndex);
  const result={};
  for(const meal of MEAL_ORDER){
    const src=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const items=src.map((item,i)=>{
      const fd=getFD(item.context,item.name);
      const qty=item.qtyOverride!==undefined?item.qtyOverride:(fd?.qty?.[type]??fd?.qty?.Riposo??0);
      // kcal e uom: usa FOOD_DB se disponibile, altrimenti fallback dagli override (es. ricette)
      const kcal=fd?.kcal??item.kcal??null;
      const uom=fd?.uom??item.uom??'g';
      return{key:`${meal}_${i}`,meal,context:item.context,name:item.name,qty,uom,kcal,limitKey:fd?.limitKey};
    }).filter(it=>it.qty>0);
    if(items.length>0)result[meal]=items;
  }
  return result;
}

function calcKcal(item){
  if(item.kcal==null||item.qty==null||item.qty===0)return null;
  return Math.round(['g','ml'].includes(item.uom)?(item.kcal*item.qty/100):(item.kcal*item.qty));
}

// ── STYLES HELPERS ────────────────────────────────────────────
const S={
  card:(extra={})=>({background:'var(--card)',borderRadius:'14px',boxShadow:'var(--shadow)',...extra}),
  btn:(color='var(--text2)',extra={})=>({background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'8px',color,padding:'6px 14px',fontSize:'12px',fontWeight:500,...extra}),
};

// ── RUNNING ANALYTICS ─────────────────────────────────────────

/** Normalizza un'attività Strava Run in un modello dati uniforme.
 *  Restituisce null se l'attività non è una corsa o non ha distanza. */
function normalizeRun(activity, detail) {
  if (activity.type !== 'Run' || !activity.distance) return null;
  const distanceKm = activity.distance / 1000;
  const movingTimeMin = activity.moving_time / 60;
  const elapsedTimeMin = activity.elapsed_time / 60;
  const avgPaceMinKm = movingTimeMin / distanceKm; // min/km come float
  return {
    id: activity.id,
    date: activity.start_date_local?.slice(0, 10) ?? activity.start_date?.slice(0, 10) ?? '',
    title: activity.name ?? 'Corsa',
    distanceKm,
    movingTimeMin,
    elapsedTimeMin,
    avgPaceMinKm,
    avgSpeedKmh: (activity.average_speed ?? 0) * 3.6,
    maxSpeedKmh: (detail?.max_speed ?? activity.max_speed ?? 0) * 3.6,
    avgHeartRate: detail?.average_heartrate ?? activity.average_heartrate ?? null,
    maxHeartRate: detail?.max_heartrate ?? activity.max_heartrate ?? null,
    elevationGain: detail?.total_elevation_gain ?? activity.total_elevation_gain ?? 0,
    splits: detail?.splits_metric ?? [],
    laps: detail?.laps ?? [],
    calories: detail?.calories ?? activity.calories ?? null,
    source: 'strava',
    raw: { activity, detail },
  };
}

/** Converte minuti decimali in stringa "M:SS" per la visualizzazione del passo. */
function _paceStr(minKm) {
  if (!minKm || !isFinite(minKm)) return '--';
  const m = Math.floor(minKm);
  const s = Math.round((minKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Converte minuti totali in stringa "H:MM:SS". */
function _timeStr(totalMin) {
  if (!totalMin || !isFinite(totalMin)) return '--';
  const h = Math.floor(totalMin / 60);
  const m = Math.floor(totalMin % 60);
  const s = Math.round((totalMin - Math.floor(totalMin)) * 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** Calcola la varianza del passo (min/km) sui km-split di un'attività.
 *  Usata come indicatore di uniformità/irregolarità dello sforzo. */
function _splitVariance(run) {
  const validSplits = run.splits.filter(s => s.distance > 500);
  if (validSplits.length < 3) return 0;
  const paces = validSplits.map(s => (s.elapsed_time / 60) / (s.distance / 1000));
  const mean = paces.reduce((a, b) => a + b, 0) / paces.length;
  return paces.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / paces.length;
}

/** Rileva progressione: slope lineare negativo sui split indica accelerazione. */
function _isProgression(run) {
  const validSplits = run.splits.filter(s => s.distance > 500);
  if (validSplits.length < 4) return false;
  const paces = validSplits.map(s => (s.elapsed_time / 60) / (s.distance / 1000));
  const n = paces.length;
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = paces.reduce((a, b) => a + b, 0);
  const sumXY = paces.reduce((acc, p, i) => acc + i * p, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  // Slope < -0.08 min/km per split = si accelera chiaramente
  if (slope >= -0.08) return false;
  // Verifica extra: ultimi 3 split mediamente più veloci dei primi 3
  const firstAvg = (paces[0] + paces[1] + paces[2]) / 3;
  const lastAvg = (paces[n - 3] + paces[n - 2] + paces[n - 1]) / 3;
  return firstAvg - lastAvg > 0.2;
}

/** Classifica un'attività normalizzata in un tipo di allenamento.
 *  Restituisce { workoutType, confidence, notes }. */
function classifyRun(run) {
  const titleLow = (run.title ?? '').toLowerCase();
  const notes = [];

  // Priorità 1: keyword nel titolo (più affidabile dell'euristica)
  const titleMap = [
    [/gara|race|competizione/i, 'race_pace'],
    [/interval|ripetute|fartlek/i, 'interval'],
    [/recupero|recovery/i, 'recovery'],
    [/lungo|long.?run/i, 'long_run'],
    [/tempo|soglia|threshold/i, 'tempo'],
    [/progress/i, 'progression'],
  ];
  for (const [re, type] of titleMap) {
    if (re.test(titleLow)) {
      notes.push(`Titolo contiene keyword "${re.source}"`);
      return { workoutType: type, confidence: 0.85, notes };
    }
  }

  const variance = _splitVariance(run);
  const pace = run.avgPaceMinKm;
  const dist = run.distanceKm;
  const hr = run.avgHeartRate;

  notes.push(`Distanza ${dist.toFixed(1)}km, passo ${_paceStr(pace)}/km`);
  if (hr) notes.push(`FC media ${hr} bpm`);
  if (run.splits.length >= 3) notes.push(`Varianza split ${variance.toFixed(2)}`);

  // Calcola score per ogni tipo
  const scores = {};

  // Progressione (alta priorità se rilevata)
  if (_isProgression(run)) {
    scores['progression'] = 0.78;
    notes.push('Accelerazione progressiva rilevata');
  }

  // Interval: varianza split alta
  if (variance > 0.50) {
    scores['interval'] = 0.60 + (variance > 1.0 ? 0.20 : 0) + (run.maxHeartRate > 175 ? 0.10 : 0);
  }

  // Recovery: corto e lento
  if (dist < 8 && pace > 6.0) {
    scores['recovery'] = 0.60 + (hr && hr < 135 ? 0.15 : 0) + (dist < 5 ? 0.10 : 0);
  }

  // Long run: distanza > 15km
  if (dist >= 15) {
    scores['long_run'] = 0.60 + (dist >= 20 ? 0.20 : 0) + (pace > 5.8 ? 0.10 : 0) - (pace < 5.0 ? 0.10 : 0);
  }

  // Threshold: corto e veloce
  if (dist >= 3 && dist < 8 && pace < 5.0) {
    scores['threshold'] = 0.60 + (variance < 0.15 ? 0.10 : 0) + (hr && hr >= 155 ? 0.10 : 0);
  }

  // Tempo: distanza media e passo sostenuto
  if (dist >= 5 && dist <= 15 && pace >= 4.5 && pace < 5.5) {
    scores['tempo'] = 0.60 + (variance < 0.10 ? 0.15 : 0) + (hr && hr >= 160 ? 0.10 : 0) - (variance > 0.40 ? 0.10 : 0);
  }

  // Race pace: veloce su distanza significativa
  if (pace < 5.0 && dist >= 10) {
    scores['race_pace'] = 0.60 + (dist >= 20 ? 0.15 : 0) + (variance < 0.15 ? 0.10 : 0);
  }

  // Easy: ritmo moderato, distanza media
  if (dist >= 5 && dist < 15 && pace >= 5.5 && pace < 6.5) {
    scores['easy'] = 0.60
      + (hr && hr >= 135 && hr <= 155 ? 0.15 : 0)
      + (variance < 0.15 ? 0.10 : 0)
      - (variance > 0.50 ? 0.10 : 0);
  }

  // Vince il tipo con score più alto
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 0.50) {
    return { workoutType: best[0], confidence: Math.min(1, best[1]), notes };
  }

  // Fallback: classifica generica per distanza/passo
  if (dist >= 15) return { workoutType: 'long_run', confidence: 0.45, notes };
  if (pace > 6.0) return { workoutType: 'recovery', confidence: 0.40, notes };
  if (pace < 5.5) return { workoutType: 'easy', confidence: 0.35, notes };
  return { workoutType: 'unknown', confidence: 0.20, notes };
}

/** Calcola metriche aggregate su un array di run classificati.
 *  Richiede che ogni run abbia un campo `classification.workoutType`. */
function calcTrainingMetrics(classifiedRuns) {
  const now = new Date();
  const ms7  = 7  * 86400000;
  const ms14 = 14 * 86400000;
  const ms30 = 30 * 86400000;
  const ms60 = 60 * 86400000;
  const ms90 = 90 * 86400000;

  const inWindow = (run, msAgo) => new Date(run.date) >= new Date(now - msAgo);
  const between  = (run, msFrom, msTo) => {
    const d = new Date(run.date);
    return d >= new Date(now - msFrom) && d < new Date(now - msTo);
  };

  const runs7  = classifiedRuns.filter(r => inWindow(r, ms7));
  const runs30 = classifiedRuns.filter(r => inWindow(r, ms30));
  const runs60 = classifiedRuns.filter(r => inWindow(r, ms60));
  const runs7prev = classifiedRuns.filter(r => between(r, ms14, ms7));

  const sumDist = arr => arr.reduce((s, r) => s + r.distanceKm, 0);
  const avgPaceOf = (arr, types) => {
    const filtered = arr.filter(r => types.includes(r.classification?.workoutType));
    if (!filtered.length) return null;
    return filtered.reduce((s, r) => s + r.avgPaceMinKm, 0) / filtered.length;
  };

  const weeklyVolumeKm  = Math.round(sumDist(runs7) * 10) / 10;
  const monthlyVolumeKm = Math.round(sumDist(runs30) * 10) / 10;
  const prevWeekVol     = sumDist(runs7prev);

  // Consistency: quante delle ultime 8 settimane hanno almeno 1 run
  const weeksWithRun = new Set();
  classifiedRuns.filter(r => inWindow(r, 8 * 7 * 86400000)).forEach(r => {
    const d = new Date(r.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    weeksWithRun.add(`${d.getFullYear()}-W${weekNum}`);
  });
  const consistencyScore = Math.min(10, Math.round((weeksWithRun.size / 8) * 10));

  // Fatigue trend
  let fatigueTrend = 'stable';
  if (prevWeekVol > 0) {
    const ratio = weeklyVolumeKm / prevWeekVol;
    if (ratio < 0.80) fatigueTrend = 'improving';
    else if (ratio > 1.30) fatigueTrend = 'declining';
  }

  // Pace medie per tipo
  const avgEasyPace      = avgPaceOf(runs30, ['easy']);
  const avgLongRunPace   = avgPaceOf(runs60, ['long_run']);
  const avgRacePaceWorkout = avgPaceOf(runs30, ['tempo', 'threshold', 'race_pace']);

  // Recent progress: confronto easy pace ultimi 30gg vs 31-90gg
  const easyOld = avgPaceOf(classifiedRuns.filter(r => between(r, ms90, ms30)), ['easy']);
  let recentProgress = null;
  if (avgEasyPace && easyOld) {
    const deltaSec = Math.round((easyOld - avgEasyPace) * 60);
    if (deltaSec > 5)  recentProgress = `Migliorato di ${deltaSec}s/km rispetto ai mesi precedenti`;
    else if (deltaSec < -5) recentProgress = `Ritmo facile rallentato di ${Math.abs(deltaSec)}s/km recentemente`;
  }

  // Stime performance con formula di Riegel: T2 = T1 * (D2/D1)^1.06
  let estimated10kTime = null;
  let estimatedHalfMarathonPace = null;
  let estimatedHalfMarathonTime = null;

  const qualityRuns = runs60.filter(r =>
    ['tempo', 'threshold', 'race_pace', 'interval'].includes(r.classification?.workoutType)
    && r.distanceKm >= 5  // soglia minima: proiettare da < 5km a 21km è troppo speculativo
  );
  if (qualityRuns.length > 0) {
    // Prendi il run con il miglior "effort score" = dist / pace (più km a passo più veloce)
    const best = qualityRuns.sort((a, b) => (b.distanceKm / b.avgPaceMinKm) - (a.distanceKm / a.avgPaceMinKm))[0];
    const t1 = best.movingTimeMin;
    const d1 = best.distanceKm;
    // Riegel proietta in avanti: usare solo se d2 > d1
    const riegelFn = (d2) => t1 * Math.pow(d2 / d1, 1.06);
    estimated10kTime          = d1 < 10 ? riegelFn(10) : null;
    // Se l'utente ha già corso una mezza, usa il suo tempo reale (più preciso di Riegel)
    estimatedHalfMarathonTime = d1 < 21.0975 ? riegelFn(21.0975) : best.movingTimeMin;
    estimatedHalfMarathonPace = estimatedHalfMarathonTime / 21.0975;
  }

  return {
    weeklyVolumeKm,
    monthlyVolumeKm,
    runsLast7Days:  runs7.length,
    runsLast30Days: runs30.length,
    avgEasyPace,
    avgLongRunPace,
    avgRacePaceWorkout,
    consistencyScore,
    fatigueTrend,
    recentProgress,
    estimated10kTime,
    estimatedHalfMarathonPace,
    estimatedHalfMarathonTime,
  };
}

/** Genera insight di coaching basati su run classificati e metriche aggregate. */
function generateCoachingInsights(classifiedRuns, metrics) {
  const {
    monthlyVolumeKm, weeklyVolumeKm, runsLast7Days, consistencyScore,
    fatigueTrend, avgEasyPace, avgLongRunPace, avgRacePaceWorkout,
    estimated10kTime, estimatedHalfMarathonTime, estimatedHalfMarathonPace
  } = metrics;

  const now = new Date();
  const ms30 = 30 * 86400000;
  const inLast30 = r => new Date(r.date) >= new Date(now - ms30);

  const recentRuns = classifiedRuns.filter(inLast30);
  const hasQuality = recentRuns.some(r => ['tempo','threshold','interval','race_pace'].includes(r.classification?.workoutType));
  const hasLongRun = recentRuns.some(r => r.classification?.workoutType === 'long_run');

  // Punti di forza
  const strengths = [];
  if (monthlyVolumeKm >= 80)     strengths.push(`Volume mensile solido (${monthlyVolumeKm} km)`);
  if (consistencyScore >= 7)     strengths.push(`Allenamento costante (${consistencyScore}/10 su 8 settimane)`);
  if (hasLongRun)                strengths.push('Uscite lunghe regolari nel mese');
  if (runsLast7Days >= 3)        strengths.push(`Alta frequenza settimanale (${runsLast7Days} uscite)`);
  if (avgEasyPace && avgEasyPace < 6.0) strengths.push(`Ritmo base efficiente (${_paceStr(avgEasyPace)}/km)`);
  if (hasQuality)                strengths.push('Presenza di lavoro di qualità (tempo/ripetute)');

  // Aree di miglioramento
  const weaknesses = [];
  if (consistencyScore < 5)  weaknesses.push('Frequenza di allenamento irregolare nelle ultime 8 settimane');
  if (monthlyVolumeKm < 30)  weaknesses.push('Volume mensile basso (< 30 km)');
  if (!hasQuality)           weaknesses.push('Nessun allenamento di qualità (tempo/ripetute) negli ultimi 30 giorni');
  if (!hasLongRun)           weaknesses.push('Nessuna uscita lunga (>15 km) negli ultimi 30 giorni');
  if (fatigueTrend === 'declining') weaknesses.push('Volume in forte aumento rispetto alla settimana scorsa — attenzione al recupero');

  // Osservazioni
  const observations = [];
  if (metrics.recentProgress) observations.push(metrics.recentProgress);
  if (estimatedHalfMarathonTime) {
    observations.push(`Stima mezza maratona: ${_timeStr(estimatedHalfMarathonTime)} (ritmo ${_paceStr(estimatedHalfMarathonPace)}/km)`);
  }
  if (fatigueTrend === 'improving') observations.push('Questa settimana hai ridotto il carico: buona scelta per il recupero');
  else if (fatigueTrend === 'declining') observations.push('Carico settimanale in forte crescita rispetto alla settimana precedente');
  const typeCounts = {};
  classifiedRuns.filter(inLast30).forEach(r => {
    const t = r.classification?.workoutType ?? 'unknown';
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  });
  const dominantType = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  if (dominantType && dominantType !== 'unknown') {
    observations.push(`Tipo di allenamento prevalente nell'ultimo mese: ${dominantType.replace('_', ' ')}`);
  }

  // Messaggio coach
  let coachMessage = '';
  if (weaknesses.length === 0 && strengths.length >= 2) {
    coachMessage = `Ottimo lavoro! Stai mantenendo costanza e volume. Considera di aumentare il volume del 10% nella prossima settimana.`;
  } else if (!hasQuality && avgEasyPace) {
    coachMessage = `Corri principalmente a ritmo facile. Inserisci un allenamento di qualità questa settimana: un tempo run di 6-8 km a ${_paceStr(avgEasyPace - 0.7)}-${_paceStr(avgEasyPace - 0.5)}/km.`;
  } else if (!hasLongRun) {
    const target = avgEasyPace ? `a ${_paceStr(avgEasyPace)}/km` : 'a ritmo confortevole';
    coachMessage = `Ti manca un'uscita lunga. Pianifica una corsa di 18-22 km ${target} nel weekend.`;
  } else if (fatigueTrend === 'declining') {
    coachMessage = `Il volume è aumentato molto rapidamente. Questa settimana mantieni il ritmo ma riduci i km del 20% per assorbire il carico.`;
  } else if (consistencyScore < 5) {
    coachMessage = `La costanza è la base di tutto. Cerca di uscire almeno 3 volte a settimana, anche solo per 30-40 minuti. Ogni uscita conta.`;
  } else {
    coachMessage = `Continua così. Alterna uscite facili con almeno un allenamento di qualità a settimana per progredire.`;
  }

  return {
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    observations: observations.slice(0, 4),
    coachMessage,
    // suggestedNextWorkouts è ora derivato da weeklyPlan nel pannello UI
    // per evitare incoerenze tra le due sorgenti
  };
}

/** Calcola le zone di ritmo personalizzate basate sulla stima di ritmo mezza maratona.
 *  Usa la formula di Daniels: le zone sono offset dal ritmo gara target (HMP).
 *  Ogni zona include range passo (min/km) e velocità (km/h) per il Garmin. */
function calcPaceZones(metrics) {
  // HMP = Half Marathon Pace (min/km come float)
  // Fallback: se non c'è stima, si approssima da avgEasyPace
  const hmp = metrics.estimatedHalfMarathonPace
    ?? (metrics.avgEasyPace ? metrics.avgEasyPace - 0.9 : null);
  if (!hmp || !isFinite(hmp) || hmp <= 0) return null;

  const zone = (minOffset, maxOffset, label, desc, type) => {
    const pMin = hmp + minOffset;
    const pMax = hmp + maxOffset;
    // velocità km/h = 60 / passo_min_km
    return {
      label, desc, type,
      paceMin: pMin, paceMax: pMax,
      speedMin: Math.round((60 / pMax) * 10) / 10,  // velocità min (passo più lento)
      speedMax: Math.round((60 / pMin) * 10) / 10,  // velocità max (passo più veloce)
    };
  };

  return {
    recovery:    zone(1.8,  2.5,  'Rigenerativa',   'Recupero attivo, conversazione facile',          'recovery'),
    easy:        zone(0.9,  1.7,  'Facile',          'Base aerobica, respiro controllato',             'easy'),
    longRun:     zone(0.6,  1.5,  'Lungo',           'Fondo lungo, ultimo terzo leggermente più veloce','long_run'),
    marathon:    zone(0.2,  0.5,  'Ritmo Maratona',  'Ritmo maratona (riferimento progressione)',      'progression'),
    halfMarathon:zone(-0.05, 0.1, 'Ritmo Mezza ★',  'Ritmo gara obiettivo — mezza maratona',          'race_pace'),
    tempo:       zone(-0.4, -0.1, 'Tempo/Soglia',   '20-40 min continui a sforzo sostenuto',          'tempo'),
    interval:    zone(-1.2, -0.5, 'Ripetute',        'Ripetizioni brevi (400-1200m) con recupero',     'interval'),
    hmp, // esposto per uso nei componenti
  };
}

/** Piano di allenamento periodizzato verso la Mezza Maratona di Genova (19 aprile 2026).
 *
 *  Sessioni reali settimana per settimana, con zone di ritmo FISSE calibrate sull'atleta.
 *  Le zone calcolate da calcPaceZones vengono ignorate internamente (parametro mantenuto
 *  per compatibilità con i chiamanti).
 *
 *  Fasi:
 *  - load      (> 14gg): Settimana 4 (30 marzo – 5 aprile)
 *  - taper     (7–14gg): Settimana 5 (6–12 aprile)
 *  - race_week (< 7gg):  Settimana gara (13–19 aprile)
 *  - post_race (< 0):    Dopo la gara
 */
function buildWeeklyPlan(metrics, insights, paceZones, classifiedRuns) {
  // ── Zone di ritmo FISSE (valori assoluti calibrati sull'atleta) ──
  // NON derivate da paceZones — sovrascrivono qualsiasi calcolo dinamico.
  const ZONES = {
    recovery:   { label: 'Recovery',    paceRange: '5:45–6:00/km', speedRange: '10.0–10.4 km/h', fc: 'FC < 145' },
    easy:       { label: 'Easy',        paceRange: '5:30–5:45/km', speedRange: '10.4–10.9 km/h', fc: 'FC 140–150' },
    long_run:   { label: 'Lungo',       paceRange: '5:20–5:35/km', speedRange: '10.7–11.3 km/h', fc: 'FC 145–152' },
    race_pace:  { label: 'Ritmo mezza', paceRange: '5:00–5:05/km', speedRange: '11.8–12.0 km/h', fc: 'FC 150–158' },
    tempo:      { label: 'Soglia',      paceRange: '4:50–4:58/km', speedRange: '12.1–12.4 km/h', fc: 'FC 158–165' },
    interval:   { label: 'Ripetute',    paceRange: '4:25–4:35/km', speedRange: '13.1–13.6 km/h', fc: 'FC fino a 169' },
  };

  // ── Fase periodizzazione ──
  const now       = new Date();
  const RACE_DATE = new Date('2026-04-19T00:00:00');
  const daysToRace = Math.round((RACE_DATE - now) / 86400000);
  const phase = daysToRace > 14 ? 'load' : daysToRace > 7 ? 'taper' : daysToRace > 0 ? 'race_week' : 'post_race';

  const dayNames = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];

  // Helper: restituisce il nome del giorno per una data offset da oggi
  const dayLabel = (offsetDays) => {
    const d = new Date(now.getTime() + offsetDays * 86400000);
    return dayNames[d.getDay()];
  };

  // Helper: calcola daysFromNow per una data ISO 'YYYY-MM-DD'
  const daysFrom = (isoDate) => {
    const target = new Date(isoDate + 'T00:00:00');
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - todayMidnight) / 86400000);
  };

  // ── Piano completo hardcoded (sessioni reali fino al 19 aprile) ──
  // Struttura: { isoDate, type, title, totalKm, structure[], garminNote, rationale }
  const ALL_SESSIONS = [
    // ═══════════════════════════════════════════════════════════════
    // SETTIMANA 4 (30 marzo – 5 aprile) — FASE CARICO
    // ═══════════════════════════════════════════════════════════════
    {
      isoDate: '2026-03-30', type: 'recovery',
      title: 'Recovery jog',
      totalKm: 6.5,
      structure: [
        { phase: 'Recovery 6-7km', km: 6.5, pace: ZONES.recovery.paceRange, speed: ZONES.recovery.speedRange },
      ],
      garminNote: 'Recovery run 6-7km. FC < 145. Lentissima — assorbimento post-lungo.',
      rationale: 'Assorbire il lungo da 20km di ieri. Gambe pesanti: tieni il ritmo basso.',
    },
    {
      isoDate: '2026-03-31', type: 'rest',
      title: 'Riposo / mobilità',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Recupero tendinoso completo. Mobilità e stretching se vuoi.',
    },
    {
      isoDate: '2026-04-01', type: 'tempo',
      title: 'W4-A2 — Threshold + HM blend',
      totalKm: 10,
      structure: [
        { phase: 'Riscaldamento', km: 2, pace: '5:37/km', speed: '10.7 km/h' },
        { phase: '3×2km soglia', km: 6, pace: `${ZONES.tempo.paceRange} (12.0–12.4 km/h)`, recovery: 'rec: 2min jog @ 6:00/km' },
        { phase: 'Defaticamento', km: 2, pace: '5:37/km', speed: '10.7 km/h' },
      ],
      garminNote: 'Interval: 3 reps × 2km. Rec: 2min jog. FC zona 3-4.',
      rationale: 'Specifico mezza: soglia + sensazione ritmo gara. Non forzare — passo sostenuto ma controllato.',
    },
    {
      isoDate: '2026-04-02', type: 'recovery',
      title: 'Easy/Recovery post-soglia',
      totalKm: 5.5,
      structure: [
        { phase: 'Easy/Recovery 5-6km', km: 5.5, pace: ZONES.recovery.paceRange, speed: ZONES.recovery.speedRange },
      ],
      garminNote: 'Rigenerativa 5-6km. FC < 145. Se le gambe sono pesanti, riposo totale.',
      rationale: 'Recupero dopo mercoledì di soglia. Ascolta il corpo: se pesante, salta e riposa.',
    },
    {
      isoDate: '2026-04-03', type: 'easy',
      title: 'Easy aerobico',
      totalKm: 8,
      structure: [
        { phase: 'Easy 8km', km: 8, pace: ZONES.easy.paceRange, speed: ZONES.easy.speedRange },
      ],
      garminNote: 'Corsa facile 8km. FC 140–150. Ritmo conversazionale.',
      rationale: 'Volume aerobico di base. Preparazione al lungo domenicale.',
    },
    {
      isoDate: '2026-04-04', type: 'rest',
      title: 'Riposo',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Riposo pre-lungo. Gambe fresche per domenica.',
    },
    {
      isoDate: '2026-04-05', type: 'long_run',
      title: 'W4-A4 — Medio-lungo progressivo',
      totalKm: 14,
      structure: [
        { phase: 'Km 1-8 base', km: 8, pace: '5:25–5:30/km', speed: '10.9–11.1 km/h' },
        { phase: 'Km 9-12 progressione', km: 4, pace: '5:10–5:15/km', speed: '11.4–11.6 km/h' },
        { phase: 'Km 13-14 ritmo gara', km: 2, pace: ZONES.race_pace.paceRange, speed: ZONES.race_pace.speedRange },
      ],
      garminNote: 'Lungo progressivo 14km. 8km lungo facile → 4km progressione → 2km HM pace. Gel/acqua a km 7.',
      rationale: 'Ultimo lungo della fase carico. La progressione finale insegna al corpo a correre veloce a fine gara.',
    },

    // ═══════════════════════════════════════════════════════════════
    // SETTIMANA 5 (6–12 aprile) — TAPERING INIZIALE
    // ═══════════════════════════════════════════════════════════════
    {
      isoDate: '2026-04-06', type: 'rest',
      title: 'Riposo',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Riposo dopo il lungo. Inizio tapering.',
    },
    {
      isoDate: '2026-04-07', type: 'interval',
      title: 'W5-A1 — Ripetute 6×800m',
      totalKm: 10,
      structure: [
        { phase: 'Riscaldamento', km: 2, pace: '5:37/km', speed: '10.7 km/h' },
        { phase: '6×800m ripetute', km: 4.8, pace: `${ZONES.interval.paceRange} (13.1–13.6 km/h)`, recovery: 'rec: 400m jog @ 5:45–6:00/km' },
        { phase: 'Defaticamento', km: 2, pace: '5:37/km', speed: '10.7 km/h' },
      ],
      garminNote: 'Interval: 6 reps × 800m @ 4:25–4:30/km. Rec: 400m jog. FC zona 4-5.',
      rationale: 'Ultima sessione di velocità pre-gara. Mantieni la sharpness senza esaurire.',
    },
    {
      isoDate: '2026-04-08', type: 'rest',
      title: 'Riposo / mobilità',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Recupero dopo ripetute. Stretching, foam roller.',
    },
    {
      isoDate: '2026-04-09', type: 'easy',
      title: 'Easy tapering',
      totalKm: 8,
      structure: [
        { phase: 'Easy 8km', km: 8, pace: '5:40–5:55/km', speed: '10.2–10.6 km/h' },
      ],
      garminNote: 'Easy 8km. FC 140–148. Più lento del solito — tapering attivo.',
      rationale: 'Volume ridotto, intensità bassa. Il corpo si ricarica per la gara.',
    },
    {
      isoDate: '2026-04-10', type: 'rest',
      title: 'Riposo',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Riposo pre-sessione ritmo gara.',
    },
    {
      isoDate: '2026-04-11', type: 'race_pace',
      title: 'W5-A3 — HM pace 10km',
      totalKm: 10,
      structure: [
        { phase: 'Riscaldamento easy', km: 2, pace: ZONES.easy.paceRange, speed: ZONES.easy.speedRange },
        { phase: '6km @ ritmo gara', km: 6, pace: ZONES.race_pace.paceRange, speed: ZONES.race_pace.speedRange },
        { phase: 'Defaticamento easy', km: 2, pace: ZONES.easy.paceRange, speed: ZONES.easy.speedRange },
      ],
      garminNote: `Medio 10km: 2km easy + 6km @ ${ZONES.race_pace.paceRange} + 2km easy. FC 150–158. Non forzare.`,
      rationale: 'Memorizza il ritmo gara. Deve sentirsi sostenuto ma non massimale — prova generale.',
    },
    {
      isoDate: '2026-04-12', type: 'long_run',
      title: 'Long easy tapering',
      totalKm: 12,
      structure: [
        { phase: 'Lungo easy 12km', km: 12, pace: '5:25–5:40/km', speed: '10.5–11.1 km/h' },
      ],
      garminNote: 'Lungo easy 12km. FC 145–150. Nessuna progressione — solo volume leggero.',
      rationale: 'Ultimo lungo prima della race week. Mantieni le gambe attive senza caricare.',
    },

    // ═══════════════════════════════════════════════════════════════
    // SETTIMANA GARA (13–19 aprile) — RACE WEEK
    // ═══════════════════════════════════════════════════════════════
    {
      isoDate: '2026-04-13', type: 'rest',
      title: 'Riposo o 5km molto easy',
      totalKm: 0,
      structure: [
        { phase: 'Opzionale: 5km easy', km: 5, pace: '5:50–6:05/km', speed: '9.8–10.3 km/h' },
      ],
      garminNote: 'Opzionale: 5km @ 5:50–6:05/km. Gambe leggere. Riposo totale se preferisci.',
      rationale: 'Primo giorno race week. Priorità: recupero psico-fisico.',
    },
    {
      isoDate: '2026-04-14', type: 'interval',
      title: 'RW-A1 — Sharpening 4×400m',
      totalKm: 6,
      structure: [
        { phase: 'Riscaldamento', km: 2, pace: '5:37/km', speed: '10.7 km/h' },
        { phase: '4×400m sharpening', km: 1.6, pace: '4:30–4:35/km (13.1–13.3 km/h)', recovery: 'rec: 400m jog' },
        { phase: 'Defaticamento', km: 1.5, pace: '5:37/km', speed: '10.7 km/h' },
      ],
      garminNote: 'Sharpening: 4×400m @ 4:30–4:35/km. Rec: 400m jog. Breve e sveglio.',
      rationale: 'Mantieni la velocità nelle gambe senza affaticare. Breve, intenso, sveglio.',
    },
    {
      isoDate: '2026-04-15', type: 'rest',
      title: 'Riposo',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Recupero pre-reminder. Mangia bene, dormi.',
    },
    {
      isoDate: '2026-04-16', type: 'race_pace',
      title: 'RW-A2 — HM pace reminder',
      totalKm: 5,
      structure: [
        { phase: 'Easy', km: 2, pace: ZONES.easy.paceRange, speed: ZONES.easy.speedRange },
        { phase: '3km @ ritmo gara', km: 3, pace: ZONES.race_pace.paceRange, speed: ZONES.race_pace.speedRange },
      ],
      garminNote: `5km: 2km easy + 3km @ ${ZONES.race_pace.paceRange}. Sensazione = ok per domenica.`,
      rationale: 'Conferma che il ritmo gara è fresco e comodo. Deve sembrare facile.',
    },
    {
      isoDate: '2026-04-17', type: 'rest',
      title: 'Riposo',
      totalKm: 0,
      structure: [],
      garminNote: '',
      rationale: 'Riposo totale. Idratazione, preparazione zaino gara, riposo mentale.',
    },
    {
      isoDate: '2026-04-18', type: 'recovery',
      title: 'Shakeout opzionale',
      totalKm: 0,
      structure: [
        { phase: 'Opzionale: 20min easy + 4 strides', km: 3.5, pace: '5:45–6:00/km', speed: '10.0–10.4 km/h' },
      ],
      garminNote: 'Shakeout: 20min easy + 4 strides rilassati. Oppure riposo totale — decidi in base a come ti senti.',
      rationale: 'Pre-gara: muovi le gambe se senti rigidità. Riposo totale è ugualmente valido.',
    },
    {
      isoDate: '2026-04-19', type: 'race',
      title: 'GARA — Mezza Maratona di Genova',
      totalKm: 21.1,
      structure: [
        { phase: 'Km 1-5 (conservativo)', km: 5, pace: '5:08–5:10/km', speed: '11.5–11.7 km/h' },
        { phase: 'Km 6-15 (ritmo gara)', km: 10, pace: '5:03–5:05/km', speed: '11.8–11.9 km/h' },
        { phase: 'Km 15-21.1 (by feel)', km: 6.1, pace: '4:58–5:03/km by feel', speed: '11.9–12.1 km/h' },
      ],
      garminNote: 'Race day. Warm-up 10-15min easy. Fuel: gel km 7-8 e km 14-15. Parti conservativo!',
      rationale: 'Obiettivo: completare in controllo. Km 1-5 conservativo, poi gestisci il ritmo. Ultimi 6km by feel.',
    },
  ];

  // ── Filtra le sessioni da mostrare (domani → +7 giorni + gara se entro 21gg) ──
  const sessions = ALL_SESSIONS
    .map(s => {
      const dfn = daysFrom(s.isoDate);
      return { ...s, day: dayLabel(dfn), daysFromNow: dfn };
    })
    .filter(s => {
      if (s.type === 'race') return s.daysFromNow >= 1 && s.daysFromNow <= 21;
      return s.daysFromNow >= 1 && s.daysFromNow <= 7;
    })
    .sort((a, b) => a.daysFromNow - b.daysFromNow);

  // ── weekTarget = somma km sessioni non-riposo della settimana corrente ──
  const weekTarget = sessions
    .filter(s => s.type !== 'rest' && s.daysFromNow >= 1 && s.daysFromNow <= 7)
    .reduce((sum, s) => sum + (s.totalKm || 0), 0);

  // ── Nota di fase ──
  const phaseNote = phase === 'load'
    ? `Fase carico — ${daysToRace} giorni alla gara. Ultimo blocco di stimoli prima del tapering.`
    : phase === 'taper'
    ? `Tapering — ${daysToRace} giorni alla gara. Volume ridotto, freschezza in aumento.`
    : phase === 'race_week'
    ? `Settimana gara! ${daysToRace} giorni alla Mezza di Genova. Gambe fresche, mente pronta.`
    : `Post gara — recupero completo. Ben fatto!`;

  return {
    sessions,
    weekTarget: Math.round(weekTarget),
    phase,
    daysToRace,
    note: phaseNote,
  };
}

/** Costruisce una stringa di contesto sintetica da passare al system prompt di Claude. */
function buildRunningContext(classifiedRuns, metrics, insights, paceZones, weeklyPlan) {
  const {
    weeklyVolumeKm, monthlyVolumeKm, runsLast7Days, runsLast30Days,
    consistencyScore, fatigueTrend, estimated10kTime,
    estimatedHalfMarathonTime, estimatedHalfMarathonPace
  } = metrics;

  const recentLabels = classifiedRuns.slice(0, 5).map(r => {
    const type = r.classification?.workoutType ?? 'unknown';
    return `- ${r.date} "${r.title}": ${type} ${r.distanceKm.toFixed(1)}km @${_paceStr(r.avgPaceMinKm)}/km`;
  }).join('\n');

  const stime = estimatedHalfMarathonTime
    ? `Mezza: ${_timeStr(estimatedHalfMarathonTime)} @${_paceStr(estimatedHalfMarathonPace)}/km${estimated10kTime ? ` | 10km: ${_timeStr(estimated10kTime)}` : ''}`
    : 'Dati insufficienti per stime di gara';

  const zoneStr = paceZones
    ? `ZONE DI RITMO (target mezza):
Rigenerativa: ${_paceStr(paceZones.recovery.paceMin)}–${_paceStr(paceZones.recovery.paceMax)}/km
Facile: ${_paceStr(paceZones.easy.paceMin)}–${_paceStr(paceZones.easy.paceMax)}/km
Lungo: ${_paceStr(paceZones.longRun.paceMin)}–${_paceStr(paceZones.longRun.paceMax)}/km
Ritmo mezza: ${_paceStr(paceZones.halfMarathon.paceMin)}–${_paceStr(paceZones.halfMarathon.paceMax)}/km
Soglia/Tempo: ${_paceStr(paceZones.tempo.paceMin)}–${_paceStr(paceZones.tempo.paceMax)}/km
Ripetute: ${_paceStr(paceZones.interval.paceMin)}–${_paceStr(paceZones.interval.paceMax)}/km`
    : '';

  const pianStr = weeklyPlan
    ? `PIANO SETTIMANA — Fase: ${weeklyPlan.phase ?? 'load'} (${weeklyPlan.daysToRace ?? '?'}gg alla gara) — Target: ${weeklyPlan.weekTarget}km\n` +
      weeklyPlan.sessions.map(s =>
        `${s.day}: ${s.title} ${s.totalKm}km — ${s.structure.map(p => `${p.phase} ${p.pace}`).join(' → ')}`
      ).join('\n')
    : '';

  return `=== ANALISI CORSA ===
Volume: ${weeklyVolumeKm}km/sett | ${monthlyVolumeKm}km/mese | Uscite: ${runsLast7Days}(7gg) | Costanza: ${consistencyScore}/10 | Carico: ${fatigueTrend}
ULTIME 5 CORSE:
${recentLabels}
STIME: ${stime}
${zoneStr}
${pianStr}
FORZE: ${insights.strengths.join(' | ') || 'nessuna'}
AREE: ${insights.weaknesses.join(' | ') || 'nessuna'}`.slice(0, 1800);
}

// ── PESO VIEW ─────────────────────────────────────────────────
function PesoView({weightLog,saveWeightLog}){
  const todayISO=toISO(new Date());
  const [inputDate,setInputDate]=useState(todayISO);
  const [inputWeight,setInputWeight]=useState('');
  const [editingDate,setEditingDate]=useState(null);

  const sorted=[...weightLog].sort((a,b)=>a.date.localeCompare(b.date));

  const handleSave=()=>{
    const w=parseFloat(inputWeight.replace(',','.'));
    if(!w||!inputDate)return;
    const newLog=weightLog.filter(e=>e.date!==inputDate);
    newLog.push({date:inputDate,weight:w});
    newLog.sort((a,b)=>a.date.localeCompare(b.date));
    saveWeightLog(newLog);
    setInputWeight('');
    setInputDate(todayISO);
    setEditingDate(null);
  };

  const handleEdit=(entry)=>{
    setInputDate(entry.date);
    setInputWeight(String(entry.weight));
    setEditingDate(entry.date);
  };

  const handleDelete=(date)=>{
    saveWeightLog(weightLog.filter(e=>e.date!==date));
    if(editingDate===date){setInputDate(todayISO);setInputWeight('');setEditingDate(null);}
  };

  // Grafico SVG
  const W=300,H=120,PAD={t:16,r:16,b:24,l:36};
  const chartW=W-PAD.l-PAD.r,chartH=H-PAD.t-PAD.b;
  const renderChart=sorted.length>=2?(()=>{
    const weights=sorted.map(e=>e.weight);
    const minW=Math.min(...weights)-1,maxW=Math.max(...weights)+1;
    const dates=sorted.map(e=>new Date(e.date).getTime());
    const minD=Math.min(...dates),maxD=Math.max(...dates);
    const xOf=d=>PAD.l+((new Date(d).getTime()-minD)/(maxD-minD||1))*chartW;
    const yOf=w=>PAD.t+chartH-((w-minW)/(maxW-minW||1))*chartH;
    const pts=sorted.map(e=>`${xOf(e.date).toFixed(1)},${yOf(e.weight).toFixed(1)}`).join(' ');
    const yLabels=[minW,minW+(maxW-minW)/2,maxW].map(v=>Math.round(v*10)/10);
    return(
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>
        {/* Griglie Y */}
        {yLabels.map((v,i)=>{
          const y=yOf(v);
          return(<g key={i}>
            <line x1={PAD.l} y1={y} x2={W-PAD.r} y2={y} stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3"/>
            <text x={PAD.l-4} y={y+4} fontSize="8" fill="var(--text3)" textAnchor="end">{v}</text>
          </g>);
        })}
        {/* Linea */}
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Punti e label */}
        {sorted.map((e,i)=>{
          const x=xOf(e.date),y=yOf(e.weight);
          const labelY=y>PAD.t+12?y-6:y+14;
          return(<g key={i}>
            <circle cx={x} cy={y} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5"/>
            <text x={x} y={labelY} fontSize="8" fill="var(--accent)" textAnchor="middle" fontWeight="600">{e.weight}</text>
          </g>);
        })}
      </svg>
    );
  })():null;

  const fmtDate=iso=>{const d=new Date(iso);return d.toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});};
  const delta=sorted.length>=2?(sorted[sorted.length-1].weight-sorted[0].weight).toFixed(1):null;

  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px',paddingBottom:'100px'}}>
      {/* Form inserimento */}
      <div style={{background:'var(--card)',borderRadius:'16px',padding:'16px',border:'1px solid var(--border)'}}>
        <div style={{fontFamily:'var(--display)',fontSize:'16px',color:'var(--text)',marginBottom:'12px'}}>
          {editingDate?'Modifica misurazione':'Nuova misurazione'}
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
          <input type="date" value={inputDate} onChange={e=>setInputDate(e.target.value)}
            style={{flex:1,padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontSize:'14px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'4px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',flex:'0 0 auto'}}>
            <input type="text" inputMode="decimal" value={inputWeight} onChange={e=>setInputWeight(e.target.value)}
              placeholder="78.5"
              style={{width:'52px',background:'none',border:'none',color:'var(--text)',fontSize:'14px',outline:'none',textAlign:'right'}}/>
            <span style={{fontSize:'13px',color:'var(--text3)'}}>kg</span>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={handleSave}
            style={{flex:1,padding:'10px',borderRadius:'10px',background:'var(--accent)',color:'#fff',border:'none',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>
            Salva
          </button>
          {editingDate&&(
            <button onClick={()=>{setEditingDate(null);setInputDate(todayISO);setInputWeight('');}}
              style={{padding:'10px 14px',borderRadius:'10px',background:'var(--surface)',color:'var(--text2)',border:'1px solid var(--border)',fontSize:'14px',cursor:'pointer'}}>
              Annulla
            </button>
          )}
        </div>
      </div>

      {/* Grafico */}
      {sorted.length>=2&&(
        <div style={{background:'var(--card)',borderRadius:'16px',padding:'16px',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
            <div style={{fontFamily:'var(--display)',fontSize:'15px',color:'var(--text)'}}>Andamento</div>
            {delta!=null&&(
              <span style={{fontSize:'12px',fontWeight:600,color:parseFloat(delta)<=0?'#4caf50':'#e05252',background:'var(--surface)',padding:'3px 8px',borderRadius:'999px'}}>
                {parseFloat(delta)>0?'+':''}{delta} kg
              </span>
            )}
          </div>
          {renderChart}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
            <span style={{fontSize:'10px',color:'var(--text3)'}}>{fmtDate(sorted[0].date)}</span>
            <span style={{fontSize:'10px',color:'var(--text3)'}}>{fmtDate(sorted[sorted.length-1].date)}</span>
          </div>
        </div>
      )}

      {/* Lista misurazioni */}
      {sorted.length>0&&(
        <div style={{background:'var(--card)',borderRadius:'16px',padding:'16px',border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'15px',color:'var(--text)',marginBottom:'10px'}}>Storico</div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            {[...sorted].reverse().map((entry,i)=>(
              <div key={entry.date} onClick={()=>handleEdit(entry)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',
                  borderRadius:'10px',background:editingDate===entry.date?'var(--accent-soft)':'var(--surface)',
                  border:`1px solid ${editingDate===entry.date?'var(--accent)':'var(--border)'}`,cursor:'pointer'}}>
                <span style={{fontSize:'13px',color:'var(--text2)'}}>{fmtDate(entry.date)}</span>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'15px',fontWeight:700,color:'var(--text)'}}>{entry.weight} kg</span>
                  {i<sorted.length-1&&(()=>{
                    const prev=sorted[sorted.length-1-i-1];
                    const d=(entry.weight-prev.weight).toFixed(1);
                    return <span style={{fontSize:'11px',color:parseFloat(d)<=0?'#4caf50':'#e05252'}}>{parseFloat(d)>0?'+':''}{d}</span>;
                  })()}
                  <button onClick={e=>{e.stopPropagation();handleDelete(entry.date);}}
                    style={{background:'none',border:'none',color:'#e05252',fontSize:'16px',cursor:'pointer',padding:'0 2px',lineHeight:1}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length===0&&(
        <div style={{textAlign:'center',padding:'40px 16px',color:'var(--text3)',fontSize:'14px'}}>
          Inserisci la tua prima misurazione
        </div>
      )}
    </div>
  );
}

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
  if(id==='trainings'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke={stroke} strokeWidth="1.5"/>
        <path d="M5.5 8.5l1.5 1.5 3.5-3.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  if(id==='peso'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="7" width="12" height="7" rx="1.5" stroke={stroke} strokeWidth="1.5"/>
        <path d="M5 7c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="9" x2="8" y2="11" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="6.5" y1="10" x2="9.5" y2="10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  if(id==='ricette'){
    return(
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="1.5" width="10" height="13" rx="1.5" stroke={stroke} strokeWidth="1.5"/>
        <line x1="4.5" y1="5" x2="9.5" y2="5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4.5" y1="10" x2="7.5" y2="10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
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

const FRASI=[
  'La costanza batte sempre la perfezione.',
  'Ogni pasto è una scelta, ogni scelta è un passo.',
  'Non serve essere perfetti, serve essere presenti.',
  'Il corpo si ricorda di ogni cosa che gli dai.',
  'Piccoli gesti ogni giorno costruiscono grandi risultati.',
  'Mangia bene, muoviti bene, dormi bene.',
  'La disciplina è libertà.',
  'Nutrì il corpo come se fosse l\'unico che hai.',
];

// ── RICETTE DEFAULT ───────────────────────────────────────────
const RECIPE_CATEGORIES=[
  {id:'colazione',label:'Colazione',icon:'🌅'},
  {id:'pranzo',label:'Pranzo',icon:'🥗'},
  {id:'cena',label:'Cena',icon:'🍽️'},
  {id:'dolci',label:'Dolci',icon:'🍫'},
  {id:'altre',label:'Altre',icon:'🥣'},
];


function calcRecipeKcal(ingredients){
  return Math.round(ingredients.reduce((s,i)=>{
    if(!i.kcal||!i.qty)return s;
    return s+(i.uom==='g'||i.uom==='ml'?i.kcal*i.qty/100:i.kcal*i.qty);
  },0));
}

// ── RECIPES VIEW ──────────────────────────────────────────────
function RecipesView({userRecipes,saveRecipes,weekDates,setTab,setSelectedDayIndex,setWeekStart,setMealOverrides}){
  const [catFilter,setCatFilter]=useState('tutte');
  const [useModal,setUseModal]=useState(null);
  const [createModal,setCreateModal]=useState(false);
  const [useDayIdx,setUseDayIdx]=useState(0);
  const [useMeal,setUseMeal]=useState(MEAL_ORDER[0]);

  const filtered=catFilter==='tutte'?userRecipes:userRecipes.filter(r=>r.category===catFilter);

  const deleteRecipe=(id)=>{
    saveRecipes(userRecipes.filter(r=>r.id!==id));
  };

  const applyRecipe=(recipe,dayIdx,meal)=>{
    const dateISO=toISO(weekDates[dayIdx]);
    const items=recipe.ingredients.map(ing=>({
      context:'recipe',
      name:ing.name,
      qtyOverride:ing.qty,
      kcal:ing.kcal,
      uom:ing.uom,
    }));
    setMealOverrides(dateISO,meal,items);
    setUseModal(null);
    setSelectedDayIndex(dayIdx);
    setTab('oggi');
  };

  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px',paddingBottom:'8px'}}>
      {/* Category filter */}
      <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px',paddingTop:'4px'}}>
        <button onClick={()=>setCatFilter('tutte')}
          style={{flexShrink:0,padding:'5px 12px',borderRadius:'999px',border:'1px solid var(--border)',
            background:catFilter==='tutte'?'var(--accent-soft)':'var(--surface)',
            color:catFilter==='tutte'?'var(--accent)':'var(--text2)',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
          Tutte
        </button>
        {RECIPE_CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>setCatFilter(c.id)}
            style={{flexShrink:0,padding:'5px 12px',borderRadius:'999px',border:'1px solid var(--border)',
              background:catFilter===c.id?'var(--accent-soft)':'var(--surface)',
              color:catFilter===c.id?'var(--accent)':'var(--text2)',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Add button */}
      <button onClick={()=>setCreateModal(true)}
        style={{padding:'11px',borderRadius:'12px',border:'1.5px dashed var(--border)',
          background:'none',color:'var(--text2)',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>
        + Crea nuova ricetta
      </button>

      {/* Recipe cards */}
      {filtered.length===0&&(
        <div style={{textAlign:'center',color:'var(--text3)',fontSize:'13px',padding:'32px 0'}}>
          Nessuna ricetta in questa categoria
        </div>
      )}
      {filtered.map(recipe=>{
        const kcal=calcRecipeKcal(recipe.ingredients);
        const cat=RECIPE_CATEGORIES.find(c=>c.id===recipe.category);
        return(
          <div key={recipe.id} style={{...S.card(),padding:'14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div style={{fontWeight:700,fontSize:'15px',color:'var(--text)'}}>{recipe.name}</div>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--accent)'}}>{kcal} kcal</div>
            </div>
            <div style={{marginBottom:'8px'}}>
              <span style={{fontSize:'11px',background:'var(--card)',color:'var(--text2)',padding:'2px 8px',borderRadius:'999px',border:'1px solid var(--border)'}}>
                {cat?.icon} {cat?.label}
              </span>
            </div>
            <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'10px',lineHeight:1.6}}>
              {recipe.ingredients.map(i=>`${i.name} ${i.qty}${i.uom}`).join(' · ')}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>{setUseModal(recipe);setUseDayIdx(0);setUseMeal(MEAL_ORDER[0]);}}
                style={{flex:1,padding:'8px',borderRadius:'8px',background:'var(--accent-soft)',border:'none',
                  color:'var(--accent)',fontSize:'12px',fontWeight:600,cursor:'pointer'}}>
                Usa nel pasto
              </button>
              <button onClick={()=>deleteRecipe(recipe.id)}
                style={{padding:'8px 12px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)',
                  color:'var(--text3)',fontSize:'12px',cursor:'pointer'}}>
                Elimina
              </button>
            </div>
          </div>
        );
      })}

      {/* Usa nel pasto modal */}
      {useModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
          <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px 16px 32px'}}>
            <div style={{fontWeight:700,fontSize:'16px',marginBottom:'4px',color:'var(--text)'}}>{useModal.name}</div>
            <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'16px'}}>Scegli giorno e pasto</div>
            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>GIORNO</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',marginBottom:'14px'}}>
              {weekDates.map((d,idx)=>(
                <button key={idx} onClick={()=>setUseDayIdx(idx)}
                  style={{padding:'6px 2px',borderRadius:'8px',border:`1.5px solid ${useDayIdx===idx?'var(--accent)':'var(--border)'}`,
                    background:useDayIdx===idx?'var(--accent-soft)':'var(--card)',
                    color:useDayIdx===idx?'var(--accent)':'var(--text2)',fontSize:'10px',fontWeight:600,cursor:'pointer'}}>
                  {DAYS[idx].slice(0,3)}
                </button>
              ))}
            </div>
            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>PASTO</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'16px'}}>
              {MEAL_ORDER.map(m=>(
                <button key={m} onClick={()=>setUseMeal(m)}
                  style={{padding:'9px 12px',borderRadius:'8px',border:`1.5px solid ${useMeal===m?'var(--accent)':'var(--border)'}`,
                    background:useMeal===m?'var(--accent-soft)':'var(--card)',
                    color:useMeal===m?'var(--accent)':'var(--text)',fontSize:'13px',fontWeight:useMeal===m?700:400,
                    cursor:'pointer',textAlign:'left'}}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setUseModal(null)}
                style={{flex:1,padding:'12px',borderRadius:'12px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text2)',fontSize:'14px',cursor:'pointer'}}>
                Annulla
              </button>
              <button onClick={()=>applyRecipe(useModal,useDayIdx,useMeal)}
                style={{flex:2,padding:'12px',borderRadius:'12px',border:'none',background:'var(--accent)',color:'#0C0E14',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
                Applica ricetta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crea nuova ricetta modal */}
      {createModal&&<CreateRecipeModal onSave={(r)=>{saveRecipes([...userRecipes,r]);setCreateModal(false);}} onClose={()=>setCreateModal(false)}/>}
    </div>
  );
}

// ── CREATE RECIPE MODAL ────────────────────────────────────────
function CreateRecipeModal({onSave,onClose}){
  const [name,setName]=useState('');
  const [category,setCategory]=useState('colazione');
  const [ingredients,setIngredients]=useState([]);
  const [search,setSearch]=useState('');
  const [showSearch,setShowSearch]=useState(false);

  const addIngredient=(item)=>{
    const qty=item.qty?.Riposo??item.qty??100;
    setIngredients(prev=>[...prev,{name:item.name,qty:typeof qty==='number'?qty:100,uom:item.uom||'g',kcal:item.kcal||0}]);
    setSearch('');setShowSearch(false);
  };

  const removeIng=(idx)=>setIngredients(prev=>prev.filter((_,i)=>i!==idx));
  const updateQtyIng=(idx,val)=>setIngredients(prev=>prev.map((it,i)=>i===idx?{...it,qty:Number(val)||it.qty}:it));

  const totalKcal=calcRecipeKcal(ingredients);

  const handleSave=()=>{
    if(!name.trim()||ingredients.length===0)return;
    onSave({id:'u_'+Date.now(),name:name.trim(),category,ingredients,isDefault:false});
  };

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px 16px 32px',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{fontWeight:700,fontSize:'16px',marginBottom:'16px',color:'var(--text)'}}>Nuova ricetta</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome ricetta"
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',
            color:'var(--text)',fontSize:'14px',marginBottom:'10px'}}/>
        <select value={category} onChange={e=>setCategory(e.target.value)}
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',
            color:'var(--text)',fontSize:'14px',marginBottom:'14px'}}>
          {RECIPE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>

        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.5px',marginBottom:'8px'}}>INGREDIENTI {totalKcal>0&&<span style={{color:'var(--accent)'}}> · {totalKcal} kcal totali</span>}</div>
        {ingredients.map((ing,idx)=>(
          <div key={idx} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
            <div style={{flex:1,fontSize:'13px',color:'var(--text)'}}>{ing.name}</div>
            <input type="number" value={ing.qty} onChange={e=>updateQtyIng(idx,e.target.value)}
              style={{width:'60px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'6px',padding:'4px 6px',color:'var(--text)',fontSize:'12px',textAlign:'center'}}/>
            <span style={{fontSize:'11px',color:'var(--text3)'}}>{ing.uom}</span>
            <button onClick={()=>removeIng(idx)}
              style={{background:'none',border:'none',color:'var(--text3)',fontSize:'16px',cursor:'pointer',padding:'0 4px'}}>×</button>
          </div>
        ))}
        <button onClick={()=>setShowSearch(s=>!s)}
          style={{width:'100%',marginTop:'10px',padding:'9px',borderRadius:'8px',border:'1.5px dashed var(--border)',
            background:'none',color:'var(--text2)',fontSize:'13px',cursor:'pointer'}}>
          + Aggiungi ingrediente
        </button>
        {showSearch&&(
          <div style={{marginTop:'8px'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca alimento..."
              autoFocus
              style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 10px',
                color:'var(--text)',fontSize:'13px',marginBottom:'6px'}}/>
            <div style={{maxHeight:'200px',overflowY:'auto',border:'1px solid var(--border)',borderRadius:'8px',background:'var(--card)'}}>
              <AllFoodList type="Riposo" search={search} onSelect={(ctx,name)=>{
                const fd=getFD(ctx,name);
                if(fd)addIngredient({...fd,ctx});
              }}/>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:'10px',marginTop:'18px'}}>
          <button onClick={onClose}
            style={{flex:1,padding:'12px',borderRadius:'12px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text2)',fontSize:'14px',cursor:'pointer'}}>
            Annulla
          </button>
          <button onClick={handleSave}
            disabled={!name.trim()||ingredients.length===0}
            style={{flex:2,padding:'12px',borderRadius:'12px',border:'none',
              background:name.trim()&&ingredients.length>0?'var(--accent)':'var(--border)',
              color:name.trim()&&ingredients.length>0?'#0C0E14':'var(--text3)',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
            Salva ricetta
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SAVE AS RECIPE MODAL ───────────────────────────────────────
function SaveAsRecipeModal({meal,items,onSave,onClose}){
  const [name,setName]=useState(meal);
  const [category,setCategory]=useState('colazione');
  const ingredients=items.map(it=>({
    name:it.name,
    qty:typeof it.qty==='object'?(it.qty?.Riposo??100):it.qty??100,
    uom:it.uom||'g',
    kcal:it.kcal||0,
  }));
  const totalKcal=calcRecipeKcal(ingredients);

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px 16px 32px'}}>
        <div style={{fontWeight:700,fontSize:'16px',marginBottom:'4px',color:'var(--text)'}}>Salva come ricetta</div>
        <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'14px'}}>{ingredients.length} ingredienti · {totalKcal} kcal</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome ricetta"
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',
            color:'var(--text)',fontSize:'14px',marginBottom:'10px'}}/>
        <select value={category} onChange={e=>setCategory(e.target.value)}
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'10px',padding:'10px 12px',
            color:'var(--text)',fontSize:'14px',marginBottom:'16px'}}>
          {RECIPE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'16px',lineHeight:1.6}}>
          {ingredients.map(i=>`${i.name} ${i.qty}${i.uom}`).join(' · ')}
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={onClose}
            style={{flex:1,padding:'12px',borderRadius:'12px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text2)',fontSize:'14px',cursor:'pointer'}}>
            Annulla
          </button>
          <button onClick={()=>onSave({id:'u_'+Date.now(),name:name.trim()||meal,category,ingredients,isDefault:false})}
            style={{flex:2,padding:'12px',borderRadius:'12px',border:'none',background:'var(--accent)',color:'#0C0E14',fontSize:'14px',fontWeight:700,cursor:'pointer'}}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView({weekDates,selectedDayIndex,dailyLog,weekPlan,dayTypes,setTab,setSelectedDayIndex,setWeekStart}){
  const iso=toISO(weekDates[selectedDayIndex]);
  const di=selectedDayIndex;
  const type=getDayType(dayTypes,weekPlan,iso,di);
  const dayItems=getDayItems(weekPlan,di,iso,dayTypes);
  const dayLog=dailyLog[iso]||{};
  const allItems=MEAL_ORDER.flatMap(m=>dayItems[m]||[]);
  const checkedItems=allItems.filter(it=>dayLog[it.key]?.checked);
  const consumedKcal=checkedItems.reduce((s,it)=>{
    const qty=dayLog[it.key]?.qtyOverride??it.qty;
    return s+(calcKcal({...it,qty})||0);
  },0);
  const targetKcal=(type==='Corsa'||type==='Calcio')?2300:2100;
  const kcalPct=Math.min(consumedKcal/targetKcal,1);

  // proteine stimate: items con kcal proteiche (pollo, pesce, uova, latticini) — approssimazione con FOOD_DB
  const estimatedProtein=checkedItems.reduce((s,it)=>{
    const qty=dayLog[it.key]?.qtyOverride??it.qty;
    // stima grezza: 25% kcal da proteine per item proteici (context contiene 'protein' o 'chicken')
    const isProtein=it.context&&(it.context.includes('protein')||it.context.includes('chicken')||it.context.includes('yogurt')||it.context.includes('dairy'));
    if(!isProtein)return s;
    const kcal=calcKcal({...it,qty})||0;
    return s+Math.round(kcal*0.25/4); // kcal → g proteina
  },0);

  // meal strip
  const mealLabels={Colazione:'Col','Spuntino mattina':'Mat',Pranzo:'Pra','Spuntino pomeriggio':'Pom',
    'Pre-workout':'Pre',Cena:'Cen','Post-workout':'Post'};
  const activeMeals=MEAL_ORDER.filter(m=>dayItems[m]&&dayItems[m].length>0);

  // SVG arc
  const R=40,CX=50,CY=50;
  const circ=2*Math.PI*R;
  const arcFull=circ*0.78;
  const arcOffset=circ*(1-0.78)+circ*0.78*(1-kcalPct);
  const arcStart=circ*(1-0.78)/2;

  // badge tipo
  const typeCfg={
    Corsa:{bg:'rgba(74,178,107,0.15)',color:'#4ab26b',icon:'🏃'},
    Calcio:{bg:'rgba(74,130,210,0.15)',color:'#4a82d2',icon:'⚽'},
    Riposo:{bg:'var(--chip)',color:'var(--text3)',icon:'😴'},
  }[type]||{bg:'var(--chip)',color:'var(--text3)',icon:'·'};

  const giorni=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
  const mesi=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const d=weekDates[selectedDayIndex];
  const dataLabel=`${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]}`;
  const frase=FRASI[d.getDay()%FRASI.length];

  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px',paddingBottom:'8px'}}>

      {/* Header giorno */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'4px'}}>
        <div>
          <div style={{fontFamily:'var(--display)',fontSize:'22px',color:'var(--text)',lineHeight:1.1}}>{dataLabel}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'6px',background:typeCfg.bg,padding:'5px 10px',borderRadius:'999px'}}>
          <span style={{fontSize:'13px'}}>{typeCfg.icon}</span>
          <span style={{fontSize:'12px',fontWeight:600,color:typeCfg.color}}>{type}</span>
        </div>
      </div>

      {/* Card kcal con arco SVG */}
      <div style={{...S.card(),padding:'18px 20px',display:'flex',alignItems:'center',gap:'20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'-20px',bottom:'-20px',width:'100px',height:'100px',borderRadius:'50%',background:'var(--accent-soft)',opacity:0.5}}/>
        {/* Arc */}
        <div style={{flexShrink:0}}>
          <svg viewBox="0 0 100 100" width="90" height="90">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--chip)" strokeWidth="7"
              strokeDasharray={`${arcFull} ${circ}`}
              strokeDashoffset={-arcStart}
              strokeLinecap="round" transform="rotate(-90 50 50)" style={{transformOrigin:'50% 50%'}}/>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--accent)" strokeWidth="7"
              strokeDasharray={`${(arcFull*kcalPct).toFixed(1)} ${circ}`}
              strokeDashoffset={-arcStart}
              strokeLinecap="round" transform="rotate(-90 50 50)" style={{transformOrigin:'50% 50%'}}/>
            <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="var(--font)">{consumedKcal.toLocaleString('it-IT')}</text>
            <text x="50" y="59" textAnchor="middle" fontSize="8" fill="var(--text3)" fontFamily="var(--font)">kcal</text>
          </svg>
        </div>
        {/* Info destra */}
        <div style={{position:'relative',flex:1,minWidth:0}}>
          <div style={{fontSize:'11px',color:'var(--text3)',letterSpacing:'0.6px',fontWeight:600,marginBottom:'4px'}}>CALORIE</div>
          <div style={{display:'flex',alignItems:'baseline',gap:'4px',marginBottom:'2px'}}>
            <span style={{fontFamily:'var(--display)',fontSize:'28px',lineHeight:1,color:'var(--text)'}}>{consumedKcal.toLocaleString('it-IT')}</span>
          </div>
          <div style={{fontSize:'12px',color:'var(--text3)'}}>di {targetKcal.toLocaleString('it-IT')} kcal obiettivo</div>
          <div style={{marginTop:'10px',height:'3px',borderRadius:'3px',background:'var(--chip)',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${Math.round(kcalPct*100)}%`,background:'var(--accent)',borderRadius:'3px',transition:'width 0.4s'}}/>
          </div>
          <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'4px'}}>{Math.round(kcalPct*100)}% del target giornaliero</div>
        </div>
      </div>

      {/* Meal strip */}
      {activeMeals.length>0&&(
        <div style={{...S.card(),padding:'14px'}}>
          <div style={{fontSize:'11px',color:'var(--text3)',letterSpacing:'0.6px',fontWeight:600,marginBottom:'10px'}}>PASTI DI OGGI</div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {activeMeals.map(meal=>{
              const items=dayItems[meal]||[];
              const done=items.filter(it=>dayLog[it.key]?.checked).length;
              const total=items.length;
              const pct=total?done/total:0;
              const full=pct===1,partial=pct>0&&pct<1;
              return(
                <div key={meal} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',flex:'1 1 0',minWidth:'36px'}}>
                  <div style={{width:'100%',height:'5px',borderRadius:'3px',background:full?'var(--accent)':partial?'rgba(193,122,90,0.4)':'var(--chip)'}}/>
                  <span style={{fontSize:'9px',color:full?'var(--accent)':partial?'var(--text2)':'var(--text3)',fontWeight:full?600:400,textAlign:'center',letterSpacing:'0.2px'}}>
                    {mealLabels[meal]||meal.slice(0,3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
        <div style={{...S.card(),padding:'14px'}}>
          <div style={{fontSize:'10px',color:'var(--text3)',letterSpacing:'0.6px',fontWeight:600,marginBottom:'6px'}}>PASTI</div>
          <div style={{fontFamily:'var(--display)',fontSize:'26px',lineHeight:1,color:'var(--text)'}}>{checkedItems.length}<span style={{fontSize:'14px',color:'var(--text3)',fontFamily:'var(--font)'}}>/{allItems.length}</span></div>
          <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>alimenti spuntati</div>
        </div>
        <div style={{...S.card(),padding:'14px'}}>
          <div style={{fontSize:'10px',color:'var(--text3)',letterSpacing:'0.6px',fontWeight:600,marginBottom:'6px'}}>PROTEINE EST.</div>
          <div style={{fontFamily:'var(--display)',fontSize:'26px',lineHeight:1,color:'var(--text)'}}>~{estimatedProtein}<span style={{fontSize:'14px',color:'var(--text3)',fontFamily:'var(--font)'}}>g</span></div>
          <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>da fonti proteiche</div>
        </div>
      </div>

      {/* Frase del giorno */}
      <div style={{...S.card(),padding:'16px 18px',borderLeft:'3px solid var(--accent)'}}>
        <div style={{fontFamily:'var(--display)',fontSize:'15px',color:'var(--text2)',lineHeight:1.6,fontStyle:'italic'}}>
          "{frase}"
        </div>
      </div>

      {/* Calendario mensile */}
      <CalendarView
        dailyLog={dailyLog}
        dayTypes={dayTypes}
        weekPlan={weekPlan}
        setTab={setTab}
        setSelectedDayIndex={setSelectedDayIndex}
        setWeekStart={setWeekStart}
      />

    </div>
  );
}

// ── PLANNER VIEW ──────────────────────────────────────────────
function PlannerView({weekDates,weekPlan,dailyLog,changeDayType,setSwapModal,expandedDay,setExpandedDay,getDayConsumedKcal,todayISO,resetMeal,dayTypes,removeFood}){
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'10px'}}>
      {weekDates.map((date,di)=>{
        const iso=toISO(date);const isToday=iso===todayISO;
        const type=getDayType(dayTypes,weekPlan,iso,di);const tc=TYPE_CFG[type];
        const kcal=getDayConsumedKcal(iso,di);const expanded=expandedDay===di;
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
              {/* Kcal consumate badge */}
              {kcal>0&&(
                <div style={{fontSize:'12px',fontWeight:600,color:'var(--accent)',minWidth:'30px',textAlign:'right'}}>
                  {kcal}
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
                        {meal.toUpperCase()}
                      </div>
                      {weekPlan.overrides?.[iso]?.[meal]&&(
                        <button onClick={()=>resetMeal(iso,meal)}
                          title="Ripristina template"
                          style={{background:'none',border:'1px solid var(--border)',borderRadius:'5px',color:'var(--text3)',fontSize:'11px',padding:'1px 6px',cursor:'pointer'}}>
                          ↺ reset
                        </button>
                      )}
                    </div>
                    {dayItems[meal].map((item)=>{
                      const idx=Number(item.key.split('_').pop());
                      return(
                      <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'4px',flex:1,minWidth:0}}>
                          <button onClick={()=>{if(FOOD_DB[item.context]?.length>1)setSwapModal({dateISO:iso,dayIndex:di,meal,itemIndex:idx,context:item.context,currentName:item.name,type});}}
                            style={{background:'none',border:'none',color:FOOD_DB[item.context]?.length>1?'var(--text)':'var(--text2)',
                              textAlign:'left',fontSize:'13px',cursor:FOOD_DB[item.context]?.length>1?'pointer':'default',display:'flex',alignItems:'center',gap:'4px',padding:0}}>
                            {item.name}
                            {FOOD_DB[item.context]?.length>1&&<span style={{color:'var(--text3)',fontSize:'10px'}}>⇄</span>}
                          </button>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <span style={{fontSize:'12px',color:'var(--text2)',fontWeight:500,background:'var(--chip)',padding:'2px 8px',borderRadius:'999px'}}>
                            {item.qty} {item.uom}
                          </span>
                          <button onClick={()=>removeFood(iso,di,meal,idx)}
                            style={{background:'none',border:'none',color:'#e05252',fontSize:'14px',cursor:'pointer',padding:'0 2px',lineHeight:1}}>×</button>
                        </div>
                      </div>
                      );
                    })}
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
  setExtraModal,dayTypes,changeDayType,removeFood,onSaveRecipe,stravaKcalForDay
}){
  const di=selectedDayIndex>=0&&selectedDayIndex<7?selectedDayIndex:0;
  const selectedISO=toISO(weekDates[di]);
  const isToday=selectedISO===todayISO;
  const type=getDayType(dayTypes,weekPlan,selectedISO,di);
  const tc=TYPE_CFG[type];
  const dayItems=getDayItems(weekPlan,di,selectedISO,dayTypes);
  const dayLog=dailyLog[selectedISO]||{};
  const allItems=MEAL_ORDER.flatMap(m=>dayItems[m]||[]);
  const totalKcal=allItems.reduce((sum,item)=>sum+(calcKcal(item)||0),0);
  const consumedKcal=allItems.filter(item=>dayLog[item.key]?.checked).reduce((sum,item)=>{
    const qty=dayLog[item.key]?.qtyOverride??item.qty;
    return sum+(calcKcal({...item,qty})||0);
  },0);

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
        <div style={{marginBottom:'12px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'20px',color:'var(--text)',textTransform:'capitalize'}}>
            {weekDates[di].toLocaleDateString('it-IT',{weekday:'long'})}
            {isToday&&<span style={{display:'inline-block',marginLeft:'8px',width:'6px',height:'6px',borderRadius:'50%',background:'var(--accent)'}}/>}
          </div>
          <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'1px'}}>
            {weekDates[di].toLocaleDateString('it-IT',{day:'numeric',month:'long'})}
          </div>
          <div style={{fontSize:'12px',color:'var(--text2)',fontWeight:600,marginTop:'2px'}}>{tc.icon} {type}</div>
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
        <div style={{marginTop:'10px'}}>
          <div style={{fontSize:'13px',color:'var(--accent)',fontWeight:600}}>
            {consumedKcal.toLocaleString('it-IT')} / {((type==='Corsa'||type==='Calcio')?2300:2100).toLocaleString('it-IT')} kcal
          </div>
          {stravaKcalForDay>0&&(
            <div style={{marginTop:'6px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
              <span style={{fontSize:'12px',color:'var(--accent2)',fontWeight:600}}>
                🔥 Bruciate: {stravaKcalForDay.toLocaleString('it-IT')} kcal
              </span>
              <span style={{fontSize:'12px',color:(consumedKcal-stravaKcalForDay)<0?'var(--accent2)':'var(--text2)',fontWeight:600}}>
                Bilancio: {(consumedKcal-stravaKcalForDay).toLocaleString('it-IT')} kcal
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Meals */}
      {MEAL_ORDER.filter(m=>dayItems[m]).map(meal=>{
        const mealKcal=(dayItems[meal]||[]).filter(item=>dayLog[item.key]?.checked).reduce((sum,item)=>{const qty=dayLog[item.key]?.qtyOverride??item.qty;return sum+(calcKcal({...item,qty})||0);},0);
        return(
        <div key={meal} style={S.card({padding:'12px 14px'})}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>
                {meal.toUpperCase()}
              </div>
              {mealKcal>0&&<span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600}}>{mealKcal} kcal</span>}
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <button onClick={()=>onSaveRecipe&&onSaveRecipe(meal,dayItems[meal]||[])}
                style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text3)',fontSize:'11px',padding:'2px 7px'}}
                title="Salva come ricetta">
                💾
              </button>
              <button
                onClick={()=>{
                  const mealContexts=[...new Set([...(dayItems[meal]||[]).map(i=>i.context).filter(Boolean),'vegetable_side','breakfast_protein','breakfast_toppings'])];
                  setAddModal({dateISO:selectedISO,dayIndex:di,meal,type,contexts:mealContexts});
                }}
                style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--text2)',fontSize:'12px',padding:'2px 8px'}}>
                + aggiungi
              </button>
            </div>
          </div>
          {dayItems[meal].map((item)=>{
            const logEntry=dayLog[item.key]||{};
            const isChecked=!!logEntry.checked;
            const displayQty=logEntry.qtyOverride??item.qty;
            const isEditing=editQty?.key===item.key;
            const itemKcal=calcKcal({...item,qty:displayQty});
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
                {/* Qty + remove */}
                {isEditing?(
                  <QtyEditor value={displayQty} uom={item.uom}
                    onSave={v=>{updateLogQty(selectedISO,item.key,v);setEditQty(null);}}
                    onCancel={()=>setEditQty(null)}/>
                ):(
                  <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                      <button onClick={()=>setEditQty({key:item.key})}
                        style={{fontSize:'12px',color:'var(--text2)',fontWeight:500,background:'var(--chip)',
                          padding:'3px 10px',borderRadius:'999px',border:'none',minWidth:'56px',textAlign:'center'}}>
                        {displayQty} {item.uom}
                      </button>
                      {itemKcal!=null&&<span style={{fontSize:'10px',color:'var(--text3)'}}>{itemKcal} kcal</span>}
                    </div>
                    <button onClick={()=>removeFood(selectedISO,di,meal,Number(item.key.split('_').pop()))}
                      style={{background:'none',border:'none',color:'#e05252',fontSize:'16px',cursor:'pointer',padding:'0 2px',lineHeight:1,flexShrink:0}}>×</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        );
      })}
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

// ── RUNNING COACH COMPONENTS ───────────────────────────────────

/** Leggenda visiva delle zone di ritmo, calibrata sulla stima mezza maratona. */
function PaceZonesCard({ paceZones }) {
  if (!paceZones) return null;

  const zones = [
    { key: 'recovery',    color: '#5A6888' },
    { key: 'easy',        color: '#00C49A' },
    { key: 'longRun',     color: '#FBA828' },
    { key: 'marathon',    color: '#9b59b6' },
    { key: 'halfMarathon',color: '#FF6B35' },
    { key: 'tempo',       color: '#e05c5c' },
    { key: 'interval',    color: '#4c8cde' },
  ];

  return (
    <div style={{background:'var(--card)',borderRadius:'16px',border:'1px solid var(--border)',padding:'14px'}}>
      <div style={{fontSize:'10px',fontWeight:700,color:'var(--text2)',letterSpacing:'0.8px',marginBottom:'4px'}}>
        ZONE DI RITMO — TARGET: MEZZA MARATONA
      </div>
      <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'10px'}}>
        Basato su stima gara: <span style={{color:'var(--accent)',fontWeight:700}}>
          {_paceStr(paceZones.hmp)}/km
        </span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
        {zones.map(({key,color})=>{
          const z = paceZones[key];
          if (!z) return null;
          const isTarget = key === 'halfMarathon';
          return (
            <div key={key} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'7px 10px', borderRadius:'10px',
              background: isTarget ? 'var(--accent-soft)' : 'var(--surface)',
              border: isTarget ? '1px solid var(--accent)' : '1px solid transparent',
            }}>
              {/* Barra colorata */}
              <div style={{width:'4px',height:'36px',borderRadius:'2px',background:color,flexShrink:0}}/>
              {/* Nome zona */}
              <div style={{minWidth:'110px'}}>
                <div style={{fontSize:'12px',fontWeight:700,color: isTarget ? 'var(--accent)' : 'var(--text)'}}>
                  {z.label}
                </div>
                <div style={{fontSize:'10px',color:'var(--text3)',lineHeight:'1.3'}}>{z.desc}</div>
              </div>
              {/* Range passo */}
              <div style={{flex:1,textAlign:'right'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>
                  {_paceStr(z.paceMin)}–{_paceStr(z.paceMax)}<span style={{fontSize:'10px',fontWeight:400,color:'var(--text3)'}}>/km</span>
                </div>
                <div style={{fontSize:'10px',color:'var(--text3)',fontVariantNumeric:'tabular-nums'}}>
                  {z.speedMin}–{z.speedMax} km/h
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'8px',lineHeight:'1.5'}}>
        Le zone si ricalcolano automaticamente ad ogni nuova attività. Inserisci la velocità in km/h sul Garmin.
      </div>
    </div>
  );
}

/** Piano di allenamento settimanale con sessioni dettagliate per Garmin. */
function WeeklyPlanCard({ weeklyPlan }) {
  if (!weeklyPlan) return null;
  const [openIdx, setOpenIdx] = React.useState(null);

  const typeColors = {
    interval:'#4c8cde', tempo:'#e05c5c', easy:'#00C49A',
    long_run:'#FBA828', recovery:'#5A6888', race_pace:'#FF6B35',
    progression:'#9b59b6', threshold:'#c44c9a',
  };
  const typeLabels = {
    interval:'Ripetute', tempo:'Tempo', easy:'Facile',
    long_run:'Lungo', recovery:'Recovery', race_pace:'Gara',
    progression:'Progressione', threshold:'Soglia',
  };

  return (
    <div style={{background:'var(--card)',borderRadius:'16px',border:'1px solid var(--border)',padding:'14px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
        <div style={{fontSize:'10px',fontWeight:700,color:'var(--text2)',letterSpacing:'0.8px'}}>
          PIANO SETTIMANA
        </div>
        <div style={{fontSize:'11px',color:'var(--text3)'}}>
          Target: <span style={{color:'var(--accent)',fontWeight:700}}>{weeklyPlan.weekTarget} km</span>
        </div>
      </div>
      {weeklyPlan.note && (
        <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'10px',padding:'6px 10px',background:'var(--surface)',borderRadius:'8px',lineHeight:'1.4'}}>
          💡 {weeklyPlan.note}
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {weeklyPlan.sessions.map((s, i) => {
          const isOpen = openIdx === i;
          const color = typeColors[s.type] ?? '#5A6888';
          return (
            <div key={i} style={{borderRadius:'12px',border:`1px solid ${isOpen ? color : 'var(--border)'}`,overflow:'hidden'}}>
              {/* Header sessione */}
              <div onClick={()=>setOpenIdx(isOpen ? null : i)}
                style={{padding:'10px 12px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',
                  background: isOpen ? 'var(--surface)' : 'transparent'}}>
                <span style={{fontSize:'10px',fontWeight:700,color:'#fff',background:color,
                  borderRadius:'6px',padding:'2px 7px',whiteSpace:'nowrap'}}>
                  {typeLabels[s.type]??s.type}
                </span>
                <div style={{flex:1,minWidth:0}}>
                  <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)'}}>{s.day} — {s.title}</span>
                </div>
                <span style={{fontSize:'12px',color:'var(--accent)',fontWeight:700,whiteSpace:'nowrap'}}>{s.totalKm} km</span>
                <span style={{fontSize:'11px',color:'var(--text3)',marginLeft:'4px'}}>{isOpen?'▲':'▼'}</span>
              </div>
              {/* Dettaglio sessione */}
              {isOpen && (
                <div style={{borderTop:`1px solid var(--border)`,padding:'12px',display:'flex',flexDirection:'column',gap:'8px',background:'var(--surface)'}}>
                  {/* Struttura fasi */}
                  <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                    {s.structure.map((ph, j) => (
                      <div key={j} style={{padding:'7px 10px',borderRadius:'8px',background:'var(--card)',display:'flex',flexDirection:'column',gap:'3px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'11px',fontWeight:700,color:'var(--text2)',minWidth:'120px'}}>{ph.phase}</span>
                          <span style={{fontSize:'12px',fontWeight:700,color:'var(--text)',fontVariantNumeric:'tabular-nums'}}>{ph.pace}</span>
                          {ph.speed && <span style={{fontSize:'11px',color:'var(--text3)',fontVariantNumeric:'tabular-nums'}}>{ph.speed}</span>}
                          {ph.km && <span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600,marginLeft:'auto'}}>{typeof ph.km === 'number' ? ph.km.toFixed(1) : ph.km} km</span>}
                        </div>
                        {ph.recovery && (
                          <div style={{fontSize:'11px',color:'#FBA828',paddingLeft:'4px'}}>
                            ↩ Recupero: {ph.recovery}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Note Garmin */}
                  <div style={{padding:'8px 10px',borderRadius:'8px',background:'#1a2040',border:'1px solid #2a3060'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:'#4c8cde',letterSpacing:'0.5px',marginBottom:'3px'}}>📍 GARMIN</div>
                    <div style={{fontSize:'11px',color:'var(--text)',lineHeight:'1.5'}}>{s.garminNote}</div>
                  </div>
                  {/* Obiettivo */}
                  <div style={{fontSize:'11px',color:'var(--text3)',lineHeight:'1.4'}}>
                    💡 <span style={{color:'var(--text2)'}}>{s.rationale}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RUNNING INSIGHTS PANEL ─────────────────────────────────────
const WORKOUT_COLORS = {
  easy:'#00C49A', recovery:'#5A6888', long_run:'#FBA828',
  tempo:'#e05c5c', threshold:'#c44c9a', interval:'#4c8cde',
  race_pace:'#FF6B35', progression:'#9b59b6', unknown:'#5A6888',
};
const WORKOUT_LABELS = {
  easy:'Easy', recovery:'Recovery', long_run:'Lungo',
  tempo:'Tempo', threshold:'Soglia', interval:'Interval',
  race_pace:'Gara', progression:'Progressione', unknown:'?',
};

function RunningInsightsPanel({ runs, metrics, insights, paceZones, weeklyPlan }) {
  const {
    weeklyVolumeKm, monthlyVolumeKm, runsLast7Days,
    consistencyScore, estimatedHalfMarathonTime, estimatedHalfMarathonPace,
    estimated10kTime, fatigueTrend,
  } = metrics;

  const cardStyle = {
    background:'var(--card)', borderRadius:'16px',
    border:'1px solid var(--border)', padding:'14px',
  };
  const chipStyle = (bg) => ({
    background: bg ?? 'var(--surface)',
    borderRadius:'10px', padding:'8px 12px',
    display:'flex', flexDirection:'column', alignItems:'center', gap:'2px',
    flex:1, minWidth:0,
  });
  const badgeStyle = (type) => ({
    background: WORKOUT_COLORS[type] ?? '#5A6888',
    color:'#fff', fontSize:'10px', fontWeight:700,
    borderRadius:'6px', padding:'2px 6px', letterSpacing:'0.5px',
    whiteSpace:'nowrap',
  });
  const fatigueLabelMap = { improving:'↓ In recupero', stable:'→ Stabile', declining:'↑ In crescita' };
  const fatigueColorMap = { improving:'var(--accent)', stable:'var(--text2)', declining:'#e05c5c' };

  return (
    <details open style={{display:'flex',flexDirection:'column',gap:'0'}}>
      <summary style={{
        listStyle:'none', cursor:'pointer',
        fontSize:'11px', fontWeight:700, color:'var(--text2)',
        letterSpacing:'0.8px', padding:'4px 2px 10px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span>ANALISI CORSA 🏃</span>
        <span style={{fontSize:'10px', color:'var(--text3)', fontWeight:500}}>tocca per espandere/comprimere</span>
      </summary>

      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        {/* Stats row */}
        <div style={{display:'flex',gap:'8px'}}>
          <div style={chipStyle('var(--surface)')}>
            <div style={{fontSize:'16px',fontWeight:800,color:'var(--accent)'}}>{weeklyVolumeKm}</div>
            <div style={{fontSize:'10px',color:'var(--text3)',fontWeight:500}}>km/settimana</div>
          </div>
          <div style={chipStyle('var(--surface)')}>
            <div style={{fontSize:'16px',fontWeight:800,color:'var(--text)'}}>{monthlyVolumeKm}</div>
            <div style={{fontSize:'10px',color:'var(--text3)',fontWeight:500}}>km/mese</div>
          </div>
          <div style={chipStyle('var(--surface)')}>
            <div style={{fontSize:'16px',fontWeight:800,color:'var(--text)'}}>{runsLast7Days}</div>
            <div style={{fontSize:'10px',color:'var(--text3)',fontWeight:500}}>uscite 7gg</div>
          </div>
          <div style={chipStyle('var(--surface)')}>
            <div style={{fontSize:'14px',fontWeight:800,color:fatigueColorMap[fatigueTrend]??'var(--text2)'}}>
              {fatigueLabelMap[fatigueTrend]??'–'}
            </div>
            <div style={{fontSize:'10px',color:'var(--text3)',fontWeight:500}}>carico</div>
          </div>
        </div>

        {/* Stima mezza maratona */}
        {estimatedHalfMarathonTime && (
          <div style={{...cardStyle, background:'var(--accent-soft)', border:'1px solid var(--accent)'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--accent)',letterSpacing:'0.8px',marginBottom:'6px'}}>STIMA PRESTAZIONE</div>
            <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:'11px',color:'var(--text3)'}}>Mezza Maratona (21,1 km)</div>
                <div style={{fontSize:'20px',fontWeight:800,color:'var(--text)'}}>{_timeStr(estimatedHalfMarathonTime)}</div>
                <div style={{fontSize:'11px',color:'var(--text2)'}}>@ {_paceStr(estimatedHalfMarathonPace)}/km</div>
              </div>
              {estimated10kTime && (
                <div>
                  <div style={{fontSize:'11px',color:'var(--text3)'}}>10 km</div>
                  <div style={{fontSize:'20px',fontWeight:800,color:'var(--text)'}}>{_timeStr(estimated10kTime)}</div>
                </div>
              )}
            </div>
            <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'4px'}}>Stima tramite formula di Riegel — indicativa</div>
          </div>
        )}

        {/* Zone di ritmo */}
        <PaceZonesCard paceZones={paceZones} />

        {/* Piano settimanale */}
        <WeeklyPlanCard weeklyPlan={weeklyPlan} />

        {/* Ultime 5 corse classificate */}
        <div style={cardStyle}>
          <div style={{fontSize:'10px',fontWeight:700,color:'var(--text2)',letterSpacing:'0.8px',marginBottom:'8px'}}>ULTIME CORSE</div>
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            {runs.slice(0, 5).map(r => {
              const type = r.classification?.workoutType ?? 'unknown';
              return (
                <div key={r.id} style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                  <span style={badgeStyle(type)}>{WORKOUT_LABELS[type]??type}</span>
                  <span style={{fontSize:'12px',color:'var(--text)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</span>
                  <span style={{fontSize:'11px',color:'var(--text2)',whiteSpace:'nowrap'}}>{r.distanceKm.toFixed(1)}km</span>
                  <span style={{fontSize:'11px',color:'var(--text3)',whiteSpace:'nowrap'}}>{_paceStr(r.avgPaceMinKm)}/km</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forze e debolezze */}
        {(insights.strengths.length > 0 || insights.weaknesses.length > 0) && (
          <div style={{display:'flex',gap:'8px'}}>
            {insights.strengths.length > 0 && (
              <div style={{...cardStyle,flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',fontWeight:700,color:'#00C49A',letterSpacing:'0.8px',marginBottom:'6px'}}>PUNTI DI FORZA</div>
                {insights.strengths.map((s,i) => (
                  <div key={i} style={{fontSize:'11px',color:'var(--text)',lineHeight:'1.5',marginBottom:'3px'}}>✓ {s}</div>
                ))}
              </div>
            )}
            {insights.weaknesses.length > 0 && (
              <div style={{...cardStyle,flex:1,minWidth:0}}>
                <div style={{fontSize:'10px',fontWeight:700,color:'#e05c5c',letterSpacing:'0.8px',marginBottom:'6px'}}>AREE DI LAVORO</div>
                {insights.weaknesses.map((w,i) => (
                  <div key={i} style={{fontSize:'11px',color:'var(--text)',lineHeight:'1.5',marginBottom:'3px'}}>△ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messaggio coach */}
        {insights.coachMessage && (
          <div style={{...cardStyle, borderLeft:'3px solid var(--accent)'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--accent)',letterSpacing:'0.8px',marginBottom:'6px'}}>CONSIGLIO COACH</div>
            <div style={{fontSize:'12px',color:'var(--text)',lineHeight:'1.6'}}>{insights.coachMessage}</div>
          </div>
        )}

        {/* Prossimi allenamenti — derivati direttamente dal piano settimanale */}
        {weeklyPlan && weeklyPlan.sessions.length > 0 && (
          <div style={cardStyle}>
            <div style={{fontSize:'10px',fontWeight:700,color:'var(--text2)',letterSpacing:'0.8px',marginBottom:'8px'}}>PROSSIMI ALLENAMENTI</div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {weeklyPlan.sessions.slice(0, 2).map((s, i) => {
                const daysLabel = s.daysFromNow === 1 ? 'domani'
                  : s.daysFromNow === 7 ? 'domenica prossima'
                  : `tra ${s.daysFromNow} giorni`;
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    <span style={badgeStyle(s.type)}>{WORKOUT_LABELS[s.type]??s.type}</span>
                    <span style={{fontSize:'12px',color:'var(--text)',flex:1}}>{s.day} — {s.title}</span>
                    <span style={{fontSize:'11px',color:'var(--text3)',whiteSpace:'nowrap'}}>{daysLabel}</span>
                    <span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600,whiteSpace:'nowrap'}}>{s.totalKm} km</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

// ── TRAININGS VIEW ─────────────────────────────────────────────
const STRAVA_CLIENT_ID_PLACEHOLDER='YOUR_CLIENT_ID'; // sostituito da Netlify env
const STRAVA_SCOPE='activity:read_all';
const STRAVA_REDIRECT=typeof window!=='undefined'?`${window.location.origin}/strava-callback`:'';

function TrainingsView({stravaTokens,setStravaTokens,dailyLog,weekPlan,dayTypes,stravaActivities,setStravaActivities,activityDetails,setActivityDetails}){
  const [loadingAct,setLoadingAct]=useState(false);
  const [expandedActivity,setExpandedActivity]=useState(null);
  const [loadingDetail,setLoadingDetail]=useState(null);
  const [activityTab,setActivityTab]=useState('Run'); // categoria aperta di default
  const [chatMessages,setChatMessages]=useState([]);
  const [chatInput,setChatInput]=useState('');
  const [chatLoading,setChatLoading]=useState(false);
  const [error,setError]=useState('');

  // ── Analisi corsa (reattiva ai dati Strava) ──
  const normalizedRuns = useMemo(() =>
    stravaActivities
      .filter(a => a.type === 'Run')
      .map(a => normalizeRun(a, activityDetails[a.id] || null))
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [stravaActivities, activityDetails]);

  const classifiedRuns = useMemo(() =>
    normalizedRuns.map(r => ({ ...r, classification: classifyRun(r) })),
    [normalizedRuns]);

  const trainingMetrics = useMemo(() =>
    classifiedRuns.length >= 1 ? calcTrainingMetrics(classifiedRuns) : null,
    [classifiedRuns]);

  const coachingInsights = useMemo(() =>
    trainingMetrics ? generateCoachingInsights(classifiedRuns, trainingMetrics) : null,
    [classifiedRuns, trainingMetrics]);

  const paceZones = useMemo(() =>
    trainingMetrics ? calcPaceZones(trainingMetrics) : null,
    [trainingMetrics]);

  const weeklyPlan = useMemo(() =>
    trainingMetrics && paceZones ? buildWeeklyPlan(trainingMetrics, coachingInsights, paceZones, classifiedRuns) : null,
    [trainingMetrics, paceZones, coachingInsights, classifiedRuns]);

  // Legge il ?code= dall'URL dopo il redirect OAuth Strava
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const code=params.get('code');
    if(code&&!stravaTokens?.access_token){
      window.history.replaceState({},'',window.location.pathname);
      exchangeCode(code);
    }
  },[]);

  // Se abbiamo tokens e il token è scaduto, lo rinnoviamo
  useEffect(()=>{
    if(stravaTokens?.access_token){
      const expired=stravaTokens.expires_at&&(stravaTokens.expires_at*1000)<Date.now();
      if(expired)refreshToken();
      else fetchActivities(stravaTokens.access_token);
    }
  },[stravaTokens?.access_token]);

  const exchangeCode=async(code)=>{
    setLoadingAct(true);setError('');
    try{
      const res=await fetch('/.netlify/functions/strava-token',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({code,grant_type:'authorization_code'})
      });
      const data=await res.json();
      if(data.access_token){
        const tokens={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at,athlete:data.athlete};
        setStravaTokens(tokens);
        try{await window.storage.set('nt_stravaTokens',JSON.stringify(tokens));}catch(e){}
      }else{setError('Errore connessione Strava: '+(data.message||JSON.stringify(data)));}
    }catch(e){setError('Errore: '+e.message);}
    setLoadingAct(false);
  };

  const refreshToken=async()=>{
    try{
      const res=await fetch('/.netlify/functions/strava-token',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({grant_type:'refresh_token',refresh_token:stravaTokens.refresh_token})
      });
      const data=await res.json();
      if(data.access_token){
        const tokens={...stravaTokens,access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at};
        setStravaTokens(tokens);
        try{await window.storage.set('nt_stravaTokens',JSON.stringify(tokens));}catch(e){}
        fetchActivities(data.access_token);
      }
    }catch(e){}
  };

  const fetchActivities=async(token)=>{
    setLoadingAct(true);setError('');
    try{
      const res=await fetch('/.netlify/functions/strava-activities?per_page=50',{
        headers:{Authorization:`Bearer ${token}`}
      });
      const data=await res.json();
      if(Array.isArray(data))setStravaActivities(data);
      else setError('Errore caricamento attività');
    }catch(e){setError('Errore: '+e.message);}
    setLoadingAct(false);
  };

  const fetchActivityDetail=async(id)=>{
    if(activityDetails[id])return;
    setLoadingDetail(id);
    try{
      const res=await fetch(`/.netlify/functions/strava-activities?activity_id=${id}`,{
        headers:{Authorization:`Bearer ${stravaTokens.access_token}`}
      });
      const data=await res.json();
      if(!data.errors)setActivityDetails(prev=>({...prev,[id]:data}));
    }catch(e){}
    setLoadingDetail(null);
  };

  const toggleActivity=(id)=>{
    if(expandedActivity===id){setExpandedActivity(null);return;}
    setExpandedActivity(id);
    fetchActivityDetail(id);
  };

  const fmtTime=(secs)=>{
    if(!secs)return'—';
    const h=Math.floor(secs/3600);const m=Math.floor((secs%3600)/60);const s=secs%60;
    if(h>0)return`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return`${m}:${String(s).padStart(2,'0')}`;
  };

  const fmtPace=(mps)=>{
    if(!mps||mps<=0)return'—';
    const secPerKm=1000/mps;const m=Math.floor(secPerKm/60);const s=Math.round(secPerKm%60);
    return`${m}'${String(s).padStart(2,'0')}"`;
  };

  const disconnect=async()=>{
    setStravaTokens(null);setStravaActivities([]);setActivityDetails({});setChatMessages([]);
    try{await window.storage.set('nt_stravaTokens','null');}catch(e){}
  };

  const connectStrava=async()=>{
    // Recupera il client_id dalla function (così non sta nel frontend)
    try{
      const res=await fetch('/.netlify/functions/strava-token',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({grant_type:'get_client_id'})
      });
      const data=await res.json();
      const clientId=data.client_id;
      if(!clientId){setError('Configurazione Strava mancante. Verifica le env vars su Netlify.');return;}
      const url=`https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=${STRAVA_SCOPE}`;
      window.location.href=url;
    }catch(e){setError('Errore: '+e.message);}
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const userMsg={role:'user',content:chatInput.trim()};
    const newMessages=[...chatMessages,userMsg];
    setChatMessages(newMessages);setChatInput('');setChatLoading(true);setError('');
    try{
      const runningContext = classifiedRuns.length>=3 && trainingMetrics && coachingInsights
        ? buildRunningContext(classifiedRuns, trainingMetrics, coachingInsights, paceZones, weeklyPlan) : null;
      const res=await fetch('/.netlify/functions/ai-chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:newMessages,activities:stravaActivities,runningContext})
      });
      const rawText=await res.text();
      let data;try{data=JSON.parse(rawText);}catch(e){setError('Risposta non JSON: '+rawText.slice(0,200));setChatLoading(false);return;}
      if(data.content?.[0]?.text){
        setChatMessages(prev=>[...prev,{role:'assistant',content:String(data.content[0].text)}]);
      }else{
        setError('Errore: '+(data.error||rawText.slice(0,300)));
      }
    }catch(e){setError('Errore AI: '+e.message);}
    setChatLoading(false);
  };

  const actTypeIcon=(type)=>({Run:'🏃',Ride:'🚴',Walk:'🚶',Swim:'🏊',Soccer:'⚽',Football:'⚽',Workout:'💪',Hike:'🥾'})[type]||'🏅';

  const isConnected=!!(stravaTokens?.access_token);

  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Strava connection card */}
      <div style={{...{borderRadius:'16px',background:'var(--card)',border:'1px solid var(--border)',padding:'16px'},display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'#FC4C02',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px'}}>🏃</div>
          <div>
            <div style={{fontSize:'14px',fontWeight:700,color:'var(--text)'}}>Strava</div>
            <div style={{fontSize:'12px',color:isConnected?'var(--accent)':'var(--text3)'}}>
              {isConnected?(stravaTokens.athlete?`Connesso come ${stravaTokens.athlete.firstname} ${stravaTokens.athlete.lastname}`:'Connesso'):'Non connesso'}
            </div>
          </div>
        </div>
        <button onClick={isConnected?disconnect:connectStrava}
          style={{padding:'8px 16px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:600,
            background:isConnected?'var(--muted)':'#FC4C02',color:isConnected?'var(--text2)':'#fff'}}>
          {isConnected?'Disconnetti':'Connetti'}
        </button>
      </div>

      {error&&<div style={{fontSize:'12px',color:'#e05c5c',padding:'8px 12px',background:'#2c1a1a',borderRadius:'10px'}}>{error}</div>}

      {/* Attività divise per categoria */}
      {isConnected&&(()=>{
        // Raggruppa le attività per tipo
        const typeGroups={};
        stravaActivities.forEach(a=>{
          const t=a.type||'Altro';
          if(!typeGroups[t])typeGroups[t]=[];
          typeGroups[t].push(a);
        });
        // Ordine preferito dei tab
        const typeOrder=['Run','Ride','Walk','Hike','Swim','Soccer','Football','Workout'];
        const allTypes=[...typeOrder.filter(t=>typeGroups[t]),...Object.keys(typeGroups).filter(t=>!typeOrder.includes(t))];

        const tabIcon={Run:'🏃',Ride:'🚴',Walk:'🚶',Hike:'🥾',Swim:'🏊',Soccer:'⚽',Football:'⚽',Workout:'💪'};
        const tabLabel={Run:'Corsa',Ride:'Ciclismo',Walk:'Camminata',Hike:'Escursione',Swim:'Nuoto',Soccer:'Calcio',Football:'Calcio',Workout:'Workout'};

        return(
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {/* Header con refresh */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2px'}}>
              <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>LE TUE ATTIVITÀ</div>
              <button onClick={()=>fetchActivities(stravaTokens.access_token)}
                style={{fontSize:'11px',color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>
                {loadingAct?'...':'↻ Aggiorna'}
              </button>
            </div>
            {loadingAct&&<div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:'13px'}}>Caricamento...</div>}
            {!loadingAct&&stravaActivities.length===0&&<div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:'13px'}}>Nessuna attività trovata</div>}
            {!loadingAct&&allTypes.length>0&&allTypes.map(type=>{
              const acts=typeGroups[type];
              const icon=tabIcon[type]||'🏅';
              const label=tabLabel[type]||type;
              const totalKm=acts.filter(a=>a.distance).reduce((s,a)=>s+(a.distance/1000),0);
              const isOpen=activityTab===type;
              return(
                <div key={type} style={{borderRadius:'14px',background:'var(--card)',border:`1px solid ${isOpen?'var(--accent)':'var(--border)'}`,overflow:'hidden'}}>
                  {/* Tab header — clicca per aprire/chiudere la categoria */}
                  <div onClick={()=>setActivityTab(isOpen?null:type)}
                    style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',userSelect:'none'}}>
                    <div style={{fontSize:'24px',lineHeight:1}}>{icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'14px',fontWeight:700,color:'var(--text)'}}>{label}</div>
                      <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>
                        {acts.length} {acts.length===1?'attività':'attività'}
                        {totalKm>0&&` · ${totalKm.toFixed(1)} km totali`}
                      </div>
                    </div>
                    <span style={{color:'var(--text3)',fontSize:'13px'}}>{isOpen?'▲':'▼'}</span>
                  </div>
                  {/* Lista attività della categoria */}
                  {isOpen&&(
                    <div style={{borderTop:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:'0'}}>
                      {acts.map((a,idx)=>{
                        const date=new Date(a.start_date).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});
                        const time=new Date(a.start_date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
                        const dist=a.distance?(a.distance/1000).toFixed(2)+' km':'';
                        const dur=a.moving_time?fmtTime(a.moving_time):'';
                        const pace=a.distance&&a.moving_time?fmtPace(a.distance/a.moving_time):'';
                        const isExpanded=expandedActivity===a.id;
                        const detail=activityDetails[a.id];
                        const kcalVal=detail?.calories??a.calories;
                        const kcal=kcalVal?Math.round(kcalVal)+' kcal':'';
                        // Classificazione per le Run
                        const runClass=a.type==='Run'?classifiedRuns.find(r=>r.id===a.id)?.classification:null;
                        return(
                          <div key={a.id} style={{borderTop:idx>0?'1px solid var(--border)':'none'}}>
                            {/* Riga attività */}
                            <div onClick={()=>toggleActivity(a.id)}
                              style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',
                                background:isExpanded?'var(--surface)':'transparent'}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                                  <span style={{fontSize:'13px',fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'160px'}}>{a.name}</span>
                                  {runClass&&runClass.workoutType!=='unknown'&&(
                                    <span style={{fontSize:'10px',fontWeight:700,color:'#fff',background:WORKOUT_COLORS[runClass.workoutType]??'#5A6888',borderRadius:'5px',padding:'1px 5px',whiteSpace:'nowrap'}}>
                                      {WORKOUT_LABELS[runClass.workoutType]??runClass.workoutType}
                                    </span>
                                  )}
                                </div>
                                <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>{date} · {time}</div>
                              </div>
                              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px',flexShrink:0}}>
                                <div style={{display:'flex',gap:'8px'}}>
                                  {dist&&<span style={{fontSize:'12px',color:'var(--text)',fontWeight:700}}>{dist}</span>}
                                  {dur&&<span style={{fontSize:'12px',color:'var(--text2)',fontWeight:600}}>{dur}</span>}
                                </div>
                                <div style={{display:'flex',gap:'6px'}}>
                                  {pace&&<span style={{fontSize:'11px',color:'var(--text3)'}}>⏱ {pace}/km</span>}
                                  {kcal&&<span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600}}>{kcal}</span>}
                                </div>
                              </div>
                              <span style={{color:'var(--text3)',fontSize:'11px',marginLeft:'2px'}}>{isExpanded?'▲':'▼'}</span>
                            </div>
                            {/* Dettaglio espanso */}
                            {isExpanded&&(
                              <div style={{borderTop:'1px solid var(--border)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:'10px',background:'var(--surface)'}}>
                                {loadingDetail===a.id&&<div style={{textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>Caricamento dettagli...</div>}
                                {!detail&&loadingDetail!==a.id&&<div style={{textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>Espandi per caricare i dettagli</div>}
                                {detail&&(
                                  <>
                                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                                      {detail.calories&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--accent)',fontWeight:600}}>🔥 {Math.round(detail.calories)} kcal</span>}
                                      {detail.average_heartrate&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>❤️ {Math.round(detail.average_heartrate)} bpm medio</span>}
                                      {detail.max_heartrate&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>❤️‍🔥 {Math.round(detail.max_heartrate)} bpm max</span>}
                                      {detail.total_elevation_gain>0&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>↑ {Math.round(detail.total_elevation_gain)} m</span>}
                                      {detail.suffer_score&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>💪 Suffer: {detail.suffer_score}</span>}
                                      {detail.average_cadence&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>👟 {Math.round(detail.average_cadence*2)} passi/min</span>}
                                      {detail.max_speed>0&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--card)',color:'var(--text2)'}}>⚡ {(detail.max_speed*3.6).toFixed(1)} km/h max</span>}
                                    </div>
                                    {/* Note classificazione corsa */}
                                    {runClass&&runClass.notes?.length>0&&(
                                      <div style={{fontSize:'11px',color:'var(--text3)',lineHeight:'1.5'}}>
                                        {runClass.notes.join(' · ')}
                                      </div>
                                    )}
                                    {/* Laps */}
                                    {detail.laps?.length>0&&(
                                      <div>
                                        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>LAPS</div>
                                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                                          {detail.laps.map(lap=>(
                                            <div key={lap.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',padding:'6px 8px',borderRadius:'8px',background:'var(--card)'}}>
                                              <span style={{color:'var(--text3)',minWidth:'18px',fontWeight:600}}>#{lap.lap_index}</span>
                                              <span style={{color:'var(--text)',fontWeight:600,minWidth:'52px'}}>{(lap.distance/1000).toFixed(2)}km</span>
                                              <span style={{color:'var(--text2)',minWidth:'42px'}}>{fmtTime(lap.elapsed_time)}</span>
                                              <span style={{color:'var(--text3)',minWidth:'52px'}}>{fmtPace(lap.average_speed)}/km</span>
                                              {lap.average_heartrate&&<span style={{color:'#e05c5c',marginLeft:'auto'}}>❤️ {Math.round(lap.average_heartrate)}</span>}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Splits km */}
                                    {detail.splits_metric?.length>0&&(
                                      <div>
                                        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>SPLITS (km)</div>
                                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                                          {detail.splits_metric.map((s,i)=>(
                                            <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',padding:'6px 8px',borderRadius:'8px',background:'var(--card)'}}>
                                              <span style={{color:'var(--text3)',minWidth:'18px',fontWeight:600}}>{i+1}</span>
                                              <span style={{color:'var(--text)',fontWeight:600,minWidth:'52px'}}>{(s.distance/1000).toFixed(2)}km</span>
                                              <span style={{color:'var(--text2)',minWidth:'42px'}}>{fmtTime(s.elapsed_time)}</span>
                                              <span style={{color:'var(--text3)',minWidth:'52px'}}>{fmtPace(s.distance/s.elapsed_time)}/km</span>
                                              {s.average_heartrate&&<span style={{color:'#e05c5c',marginLeft:'auto'}}>❤️ {Math.round(s.average_heartrate)}</span>}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Running Insights Panel */}
      {isConnected && classifiedRuns.length >= 3 && trainingMetrics && coachingInsights && (
        <RunningInsightsPanel runs={classifiedRuns} metrics={trainingMetrics} insights={coachingInsights} paceZones={paceZones} weeklyPlan={weeklyPlan}/>
      )}

      {/* Chat AI */}
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px',padding:'0 2px'}}>COACH AI 🤖</div>
        <div style={{borderRadius:'14px',background:'var(--card)',border:'1px solid var(--border)',padding:'12px',display:'flex',flexDirection:'column',gap:'8px',minHeight:'120px',maxHeight:'320px',overflowY:'auto'}}>
          {chatMessages.length===0&&(
            <div style={{color:'var(--text3)',fontSize:'12px',textAlign:'center',padding:'20px 0'}}>
              Chiedi al tuo coach AI come programmare gli allenamenti{isConnected?' basandosi sulle tue attività Strava':''}
            </div>
          )}
          {chatMessages.map((m,i)=>{
            const txt=typeof m.content==='string'?m.content:JSON.stringify(m.content);
            return(
              <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'85%',padding:'8px 12px',borderRadius:'12px',fontSize:'13px',lineHeight:'1.6',
                  background:m.role==='user'?'var(--accent-soft)':'var(--surface)',
                  color:m.role==='user'?'var(--accent)':'var(--text)',whiteSpace:'pre-wrap',
                  borderBottomRightRadius:m.role==='user'?'4px':undefined,
                  borderBottomLeftRadius:m.role==='assistant'?'4px':undefined}}>
                  {txt}
                </div>
              </div>
            );
          })}
          {chatLoading&&(
            <div style={{display:'flex',justifyContent:'flex-start'}}>
              <div style={{padding:'8px 12px',borderRadius:'12px',background:'var(--surface)',fontSize:'13px',color:'var(--text3)'}}>...</div>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <input
            type='text'
            value={chatInput}
            onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&sendChat()}
            placeholder='Es: programma la settimana prossima...'
            style={{flex:1,padding:'10px 14px',borderRadius:'12px',border:'1.5px solid var(--border)',
              background:'var(--surface)',color:'var(--text)',fontSize:'13px',outline:'none'}}/>
          <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
            style={{padding:'10px 18px',borderRadius:'12px',border:'none',cursor:'pointer',
              background:'var(--accent)',color:'#fff',fontSize:'13px',fontWeight:600,
              opacity:chatLoading||!chatInput.trim()?0.5:1}}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────
function DashboardView({weeklyTotals,weekDates,weekPlan,dailyLog,getDayConsumedKcal,dayTypes}){
  return(
    <div style={{padding:'0 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Daily compliance grid */}
      <div style={S.card({padding:'14px'})}>
        <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px',marginBottom:'12px'}}>COMPLIANCE SETTIMANALE</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'6px'}}>
          {weekDates.map((date,di)=>{
            const iso=toISO(date);const isToday=iso===toISO(new Date());
            const kcal=getDayConsumedKcal(iso,di);const type=getDayType(dayTypes,weekPlan,iso,di);
            const tc=TYPE_CFG[type];
            return(
              <div key={di} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                <div style={{fontSize:'9px',color:isToday?'var(--accent)':'var(--text3)',fontWeight:isToday?700:400,letterSpacing:'0.3px'}}>
                  {DAYS[di].slice(0,3).toUpperCase()}
                </div>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',
                  background:kcal>0?'var(--accent-soft)':'var(--surface)',
                  border:`1px solid ${isToday?'var(--accent)':(kcal>0?'#4f4952':'var(--border)')}`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:700,
                  color:kcal>0?'var(--accent)':'var(--text3)'}}>
                  {kcal>0?kcal:'—'}
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

function SwapModal({modal,weekPlan,onSwap,onClose}){
  const {dateISO,dayIndex,meal,itemIndex,currentName,type}=modal;
  const [search,setSearch]=useState('');
  // Build deduplicated sorted list, highlight current
  const seen=new Set();
  const all=[];
  for(const ctx of Object.keys(FOOD_DB)){
    for(const f of FOOD_DB[ctx]){
      if(seen.has(f.name))continue;
      const qty=f.qty?.[type]??f.qty?.Riposo??0;
      if(qty===0)continue;
      seen.add(f.name);
      all.push({...f,ctx});
    }
  }
  all.sort((a,b)=>a.name.localeCompare(b.name,'it'));
  const filtered=search?all.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())):all;
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',fontWeight:700,color:'var(--text)'}}>Cambia alimento</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <input placeholder="Cerca alimento..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus
          style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:'14px',marginBottom:'12px',boxSizing:'border-box'}}/>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {filtered.map((alt,i)=>{
            const isCurrent=alt.name===currentName;
            const qty=alt.qty?.[type]??alt.qty?.Riposo;
            const altKcal=calcKcal({...alt,qty});
            return(
              <button key={i} onClick={()=>onSwap(dateISO,dayIndex,meal,itemIndex,alt.name,alt.ctx)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                  borderRadius:'10px',border:`1px solid ${isCurrent?'var(--accent)':'var(--border)'}`,
                  background:isCurrent?'var(--accent-soft)':'var(--card)',cursor:'pointer',textAlign:'left'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  {isCurrent&&<span style={{color:'var(--accent)',fontSize:'14px'}}>✓</span>}
                  <span style={{fontSize:'14px',color:isCurrent?'var(--accent)':'var(--text)',fontWeight:isCurrent?600:400}}>{alt.name}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                  <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                    {qty} {alt.uom}
                  </span>
                  {altKcal!=null&&<span style={{fontSize:'10px',color:'var(--accent)'}}>{altKcal} kcal</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AllFoodList({type,search,onSelect}){
  // Deduplica per nome, prende il primo contesto trovato
  const seen=new Set();
  const all=[];
  for(const ctx of Object.keys(FOOD_DB)){
    for(const f of FOOD_DB[ctx]){
      if(seen.has(f.name))continue;
      const qty=f.qty?.[type]??f.qty?.Riposo??0;
      if(qty===0)continue;
      seen.add(f.name);
      all.push({...f,ctx});
    }
  }
  all.sort((a,b)=>a.name.localeCompare(b.name,'it'));
  const filtered=search?all.filter(f=>f.name.toLowerCase().includes(search.toLowerCase())):all;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
      {filtered.map((food,i)=>{
        const fqty=food.qty?.[type]??food.qty?.Riposo;
        const fKcal=calcKcal({...food,qty:fqty});
        return(
          <button key={i} onClick={()=>onSelect(food.ctx,food.name)}
            style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
              borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer',textAlign:'left'}}>
            <span style={{fontSize:'14px',color:'var(--text)'}}>{food.name}</span>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
              <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                {fqty} {food.uom}
              </span>
              {fKcal!=null&&<span style={{fontSize:'10px',color:'var(--accent)'}}>{fKcal} kcal</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AddFoodModal({modal,onAdd,onClose}){
  const {dateISO,dayIndex,meal,type}=modal;
  const [search,setSearch]=useState('');
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',fontWeight:700,color:'var(--text)'}}>Aggiungi alimento</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <input placeholder="Cerca alimento..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus
          style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:'14px',marginBottom:'12px',boxSizing:'border-box'}}/>
        <AllFoodList type={type} search={search} onSelect={(ctx,name)=>{onAdd(dateISO,dayIndex,meal,ctx,name);}}/>
      </div>
    </div>
  );
}

function ExtraFoodModal({modal,onAdd,onClose}){
  const {type,dateISO}=modal;
  const [search,setSearch]=useState('');
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:200,display:'flex',alignItems:'flex-end'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:'100%',background:'var(--surface)',borderRadius:'20px 20px 0 0',padding:'20px',maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
          <div style={{fontFamily:'var(--display)',fontSize:'18px',fontWeight:700,color:'var(--text)'}}>Pasto Extra</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <input placeholder="Cerca alimento..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus
          style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:'14px',marginBottom:'12px',boxSizing:'border-box'}}/>
        <AllFoodList type={type} search={search} onSelect={(ctx,name)=>{onAdd(dateISO,ctx,name);}}/>
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
  const getDayConsumedKcal=(dateISO)=>{
    const d=new Date(dateISO);const di=(d.getDay()+6)%7;
    const items=getDayItems(weekPlan,di,dateISO,dayTypes);
    const dl=dailyLog[dateISO]||{};
    const all=MEAL_ORDER.flatMap(m=>items[m]||[]);
    return all.filter(it=>dl[it.key]?.checked).reduce((sum,it)=>{
      const qty=dl[it.key]?.qtyOverride??it.qty;
      return sum+(calcKcal({...it,qty})||0);
    },0);
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
              {!isFuture&&(()=>{const k=getDayConsumedKcal(dateISO);return k>0?<span style={{fontSize:'9px',color:'var(--accent)',fontWeight:600}}>{k}</span>:null;})()}
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
  const [stravaTokens,setStravaTokens]=useState(null);
  const [stravaActivities,setStravaActivities]=useState([]);
  const [activityDetails,setActivityDetails]=useState({});
  const [weightLog,setWeightLog]=useState([]);
  const saveWeightLog=async log=>{setWeightLog(log);try{await window.storage.set('nt_weightLog',JSON.stringify(log));}catch(e){}};
  const [userRecipes,setUserRecipes]=useState([]);
  const saveRecipes=async list=>{setUserRecipes(list);try{await window.storage.set('nt_recipes',JSON.stringify(list));}catch(e){}};
  const [saveRecipeModal,setSaveRecipeModal]=useState(null); // {meal, items}

  useEffect(()=>{
    (async()=>{
      try{
        const SCHEMA_VERSION=3; // incrementa ogni volta che i template cambiano in modo incompatibile
        const wp=await window.storage.get('nt_weekPlan');
        if(wp?.value){
          const parsed=JSON.parse(wp.value);
          // Se la versione schema è vecchia, cancella gli override così i template aggiornati
          // si applicano a tutti i giorni. Le personalizzazioni manuali vanno rifatte.
          if((parsed._schemaVersion||0)<SCHEMA_VERSION){
            parsed.overrides={};
            parsed._schemaVersion=SCHEMA_VERSION;
            try{await window.storage.set('nt_weekPlan',JSON.stringify(parsed));}catch(e){}
          }
          setWeekPlan(parsed);
        }
        const dl=await window.storage.get('nt_dailyLog');
        if(dl?.value)setDailyLog(JSON.parse(dl.value));
        const dt=await window.storage.get('nt_dayTypes');
        if(dt?.value)setDayTypes(JSON.parse(dt.value));
        const st=await window.storage.get('nt_stravaTokens');
        if(st?.value){const v=JSON.parse(st.value);if(v)setStravaTokens(v);}
        const wl=await window.storage.get('nt_weightLog');
        if(wl?.value)setWeightLog(JSON.parse(wl.value));
        const rr=await window.storage.get('nt_recipes');
        if(rr?.value)setUserRecipes(JSON.parse(rr.value));
      }catch(e){}
    })();
  },[]);

  // Carica automaticamente le attività Strava al boot (non richiede di visitare la tab Sport)
  useEffect(()=>{
    if(!stravaTokens?.access_token)return;
    const expired=stravaTokens.expires_at&&(stravaTokens.expires_at*1000)<Date.now();
    if(expired)return; // il refresh avviene dentro TrainingsView
    fetch('/.netlify/functions/strava-activities?per_page=50',{
      headers:{Authorization:`Bearer ${stravaTokens.access_token}`}
    }).then(r=>r.json()).then(data=>{
      if(Array.isArray(data))setStravaActivities(data);
    }).catch(()=>{});
  },[stravaTokens?.access_token]);

  if(!unlocked){
    return(
      <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'28px',padding:'24px'}}>
        <div style={{textAlign:'center'}}>
          <img src="./logo_kronos.png" alt="KRONOS" style={{width:'110px',height:'auto',display:'block',margin:'0 auto 14px',mixBlendMode:'screen'}}/>
          <div style={{fontFamily:'var(--display)',fontSize:'32px',fontWeight:900,color:'var(--accent)',letterSpacing:'3px'}}>KRONOS</div>
          <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'6px',letterSpacing:'0.5px'}}>Keep Records Of Nutrition, Objectives &amp; Sport</div>
        </div>
        {/* Dots */}
        <div style={{display:'flex',gap:'14px',marginTop:'4px'}}>
          {Array.from({length:APP_PIN.length}).map((_,i)=>(
            <div key={i} style={{width:'13px',height:'13px',borderRadius:'50%',
              background:i<pinInput.length?(pinError?'#E05C5C':'var(--accent)'):'var(--border)',
              transition:'background 0.15s',
              boxShadow:i<pinInput.length&&!pinError?'0 0 0 3px rgba(251,168,40,0.25)':undefined}}/>
          ))}
        </div>
        {/* Keypad */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',width:'216px'}}>
          {[1,2,3,4,5,6,7,8,9].map(n=>(
            <button key={n} onClick={()=>handlePin(String(n))}
              style={{height:'58px',borderRadius:'16px',border:'1.5px solid var(--border)',background:'var(--surface)',
                color:'var(--text)',fontSize:'22px',fontWeight:600,cursor:'pointer',
                boxShadow:'0 1px 3px rgba(0,0,0,0.3)',transition:'background 0.1s'}}>
              {n}
            </button>
          ))}
          <div/>
          <button onClick={()=>handlePin('0')}
            style={{height:'58px',borderRadius:'16px',border:'1.5px solid var(--border)',background:'var(--surface)',
              color:'var(--text)',fontSize:'22px',fontWeight:600,cursor:'pointer',
              boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}>
            0
          </button>
          <button onClick={handleDel}
            style={{height:'58px',borderRadius:'16px',border:'1.5px solid var(--border)',background:'var(--surface)',
              color:'var(--text2)',fontSize:'20px',cursor:'pointer',
              boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}>
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

  const swapFood=(dateISO,dayIndex,meal,ii,newFood,newCtx)=>{
    const cur=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const upd=cur.map((item,i)=>i===ii?{...item,name:newFood,context:newCtx??item.context}:item);
    setMealOverrides(dateISO,meal,upd);
    setSwapModal(null);
  };

  const removeFood=(dateISO,dayIndex,meal,ii)=>{
    const cur=getMealSourceItems(weekPlan,dayIndex,meal,dateISO);
    const upd=cur.filter((_,i)=>i!==ii);
    if(upd.length===0){resetMeal(dateISO,meal);}
    else{setMealOverrides(dateISO,meal,upd);}
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

  const getDayConsumedKcal=(iso,di)=>{
    const items=getDayItems(weekPlan,di,iso,dayTypes);const dl=dailyLog[iso]||{};
    const all=MEAL_ORDER.flatMap(m=>items[m]||[]);
    return all.filter(it=>dl[it.key]?.checked).reduce((sum,it)=>{
      const qty=dl[it.key]?.qtyOverride??it.qty;
      return sum+(calcKcal({...it,qty})||0);
    },0);
  };

  const getStravaKcalForDay=(isoDate)=>{
    return stravaActivities
      .filter(a=>a.start_date_local?.slice(0,10)===isoDate)
      .reduce((sum,a)=>{
        const kcal=activityDetails[a.id]?.calories??a.calories??0;
        return sum+Math.round(kcal);
      },0);
  };

  const weeklyTotals=getWeeklyTotals();

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text)',fontFamily:'var(--font)',paddingBottom:'80px'}}>
      {/* Header */}
      <div style={{padding:'20px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--bg)',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <img src="./logo_kronos.png" alt="" style={{width:'28px',height:'auto',mixBlendMode:'screen'}}/>
          <span style={{fontFamily:'var(--display)',fontSize:'18px',letterSpacing:'2px',fontWeight:900,color:'var(--accent)'}}>KRONOS</span>
        </div>
        {tab==='home'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            Il tuo percorso
          </div>
        )}
        {tab==='oggi'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            Nutri Tracker
          </div>
        )}
        {tab==='ricette'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            Ricettario
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
        {tab==='home'&&<HomeView weekDates={weekDates} selectedDayIndex={selectedDayIndex} dailyLog={dailyLog} weekPlan={weekPlan} dayTypes={dayTypes} setTab={setTab} setSelectedDayIndex={setSelectedDayIndex} setWeekStart={setWeekStart}/>}
        {tab==='oggi'&&<OggiView weekPlan={weekPlan} weekDates={weekDates} todayISO={todayISO}
          selectedDayIndex={selectedDayIndex} setSelectedDayIndex={setSelectedDayIndex}
          dailyLog={dailyLog} toggleLogItem={toggleLog} updateLogQty={updateQty}
          editQty={editQty} setEditQty={setEditQty} setSwapModal={setSwapModal}
          setAddModal={setAddModal} setExtraModal={setExtraModal} dayTypes={dayTypes}
          changeDayType={changeDayType} removeFood={removeFood}
          onSaveRecipe={(meal,items)=>setSaveRecipeModal({meal,items})}
          stravaKcalForDay={getStravaKcalForDay(toISO(weekDates[selectedDayIndex>=0&&selectedDayIndex<7?selectedDayIndex:0]))}/>}
        {tab==='ricette'&&<RecipesView userRecipes={userRecipes} saveRecipes={saveRecipes}
          weekDates={weekDates} setTab={setTab} setSelectedDayIndex={setSelectedDayIndex}
          setWeekStart={setWeekStart} setMealOverrides={setMealOverrides}/>}
        {tab==='dashboard'&&<DashboardView weeklyTotals={weeklyTotals} weekDates={weekDates}
          weekPlan={weekPlan} dailyLog={dailyLog} getDayConsumedKcal={getDayConsumedKcal} dayTypes={dayTypes}/>}
        {tab==='trainings'&&<TrainingsView stravaTokens={stravaTokens} setStravaTokens={setStravaTokens}
          dailyLog={dailyLog} weekPlan={weekPlan} dayTypes={dayTypes}
          stravaActivities={stravaActivities} setStravaActivities={setStravaActivities}
          activityDetails={activityDetails} setActivityDetails={setActivityDetails}/>}
        {tab==='peso'&&<PesoView weightLog={weightLog} saveWeightLog={saveWeightLog}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[{id:'home',label:'Home'},{id:'trainings',label:'Sport'},{id:'ricette',label:'Ricette'},{id:'peso',label:'Weight Tracker'},{id:'oggi',label:'Nutri Tracker'},{id:'dashboard',label:'Weekly food portions'}].map(t=>(
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
      {saveRecipeModal&&<SaveAsRecipeModal meal={saveRecipeModal.meal} items={saveRecipeModal.items}
        onSave={(r)=>{saveRecipes([...userRecipes,r]);setSaveRecipeModal(null);}}
        onClose={()=>setSaveRecipeModal(null)}/>}
    </div>
  );
}
