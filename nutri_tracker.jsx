import { useState, useEffect, useRef } from "react";

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
  ],
  oats_breakfast:[
    {name:'Avena',                     qty:Q(60,60), uom:'g',  kcal:379, limitKey:'oats_family'},
    {name:'Muesli',                    qty:Q(60,60), uom:'g',  kcal:363, limitKey:'oats_family'},
    {name:'Fette biscottate integrali',qty:Q(4,4),   uom:'pz', kcal:38,  limitKey:'fette_family'},
    {name:'Gallette di mais',          qty:Q(8.75,8.75), uom:'pz', kcal:38, limitKey:'gallette_family'},
  ],
  milk_portion:[
    {name:'Latte',      qty:Q(250,250),uom:'ml',kcal:64, limitKey:'milk_default'},
    {name:'Cappuccino', qty:Q(200,200),uom:'ml',kcal:40, limitKey:'milk_default'},
    {name:'Spremuta di arancia',qty:Q(150,150),uom:'ml',kcal:45, limitKey:'juice_portion'},
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
  {name:'Latte',                         qty:Q(250,250), uom:'ml', kcal:64, limitKey:'milk_default'},
  {name:'Latte di cocco',                qty:Q(200,200), uom:'ml', kcal:230, limitKey:'milk_default'},
  {name:'Latte di riso',                 qty:Q(200,200), uom:'ml', kcal:47,  limitKey:'milk_default'},
  {name:'Latte di mandorla',             qty:Q(200,200), uom:'ml', kcal:24,  limitKey:'milk_default'},
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
  {name:"Sciroppo d'amaro",   qty:Q(5,5),   uom:'g', kcal:0,   limitKey:'syrup_special'},
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
      return{key:`${meal}_${i}`,meal,context:item.context,name:item.name,qty,uom:fd?.uom??'g',kcal:fd?.kcal,limitKey:fd?.limitKey};
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

function HomeView({weekDates,selectedDayIndex,dailyLog,weekPlan,dayTypes}){
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
  setExtraModal,dayTypes,changeDayType,removeFood
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
        </div>
      </div>

      {/* Meals */}
      {MEAL_ORDER.filter(m=>dayItems[m]).map(meal=>{
        const mealKcal=(dayItems[meal]||[]).reduce((sum,item)=>sum+(calcKcal(item)||0),0);
        return(
        <div key={meal} style={S.card({padding:'12px 14px'})}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>
                {meal.toUpperCase()}
              </div>
              {mealKcal>0&&<span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600}}>{mealKcal} kcal</span>}
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

// ── TRAININGS VIEW ─────────────────────────────────────────────
const STRAVA_CLIENT_ID_PLACEHOLDER='YOUR_CLIENT_ID'; // sostituito da Netlify env
const STRAVA_SCOPE='activity:read_all';
const STRAVA_REDIRECT=typeof window!=='undefined'?`${window.location.origin}/strava-callback`:'';

function TrainingsView({stravaTokens,setStravaTokens,dailyLog,weekPlan,dayTypes}){
  const [activities,setActivities]=useState([]);
  const [loadingAct,setLoadingAct]=useState(false);
  const [expandedActivity,setExpandedActivity]=useState(null);
  const [activityDetails,setActivityDetails]=useState({});
  const [loadingDetail,setLoadingDetail]=useState(null);
  const [chatMessages,setChatMessages]=useState([]);
  const [chatInput,setChatInput]=useState('');
  const [chatLoading,setChatLoading]=useState(false);
  const [error,setError]=useState('');

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
      const res=await fetch('/.netlify/functions/strava-activities?per_page=20',{
        headers:{Authorization:`Bearer ${token}`}
      });
      const data=await res.json();
      if(Array.isArray(data))setActivities(data);
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
    setStravaTokens(null);setActivities([]);setChatMessages([]);
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
      const res=await fetch('/.netlify/functions/ai-chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:newMessages,activities})
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

      {/* Attività */}
      {isConnected&&(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2px'}}>
            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,letterSpacing:'0.8px'}}>ULTIME ATTIVITÀ</div>
            <button onClick={()=>fetchActivities(stravaTokens.access_token)}
              style={{fontSize:'11px',color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>
              {loadingAct?'...':'↻ Aggiorna'}
            </button>
          </div>
          {loadingAct&&<div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:'13px'}}>Caricamento...</div>}
          {!loadingAct&&activities.length===0&&<div style={{textAlign:'center',padding:'20px',color:'var(--text3)',fontSize:'13px'}}>Nessuna attività trovata</div>}
          {activities.map(a=>{
            const date=new Date(a.start_date).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});
            const time=new Date(a.start_date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
            const dist=a.distance?(a.distance/1000).toFixed(2)+' km':'';
            const dur=a.moving_time?fmtTime(a.moving_time):'';
            const pace=a.distance&&a.moving_time?fmtPace(a.distance/a.moving_time):'';
            const isExpanded=expandedActivity===a.id;
            const detail=activityDetails[a.id];
            const kcalVal=detail?.calories??a.calories;
            const kcal=kcalVal?Math.round(kcalVal)+' kcal':'';
            return(
              <div key={a.id} style={{borderRadius:'12px',background:'var(--card)',border:`1px solid ${isExpanded?'var(--accent)':'var(--border)'}`,overflow:'hidden'}}>
                {/* Header card */}
                <div onClick={()=>toggleActivity(a.id)} style={{padding:'12px 14px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer'}}>
                  <div style={{fontSize:'22px'}}>{actTypeIcon(a.type)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>{date} · {time}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px',flexShrink:0}}>
                    <div style={{display:'flex',gap:'8px'}}>
                      {dist&&<span style={{fontSize:'12px',color:'var(--text)',fontWeight:700}}>{dist}</span>}
                      {dur&&<span style={{fontSize:'12px',color:'var(--text2)',fontWeight:600}}>{dur}</span>}
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      {pace&&<span style={{fontSize:'11px',color:'var(--text3)'}}>⏱ {pace}/km</span>}
                      {kcal&&<span style={{fontSize:'11px',color:'var(--accent)',fontWeight:600}}>{kcal}</span>}
                    </div>
                  </div>
                  <span style={{color:'var(--text3)',fontSize:'12px',marginLeft:'4px'}}>{isExpanded?'▲':'▼'}</span>
                </div>
                {/* Dettaglio espanso */}
                {isExpanded&&(
                  <div style={{borderTop:'1px solid var(--border)',padding:'12px 14px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    {loadingDetail===a.id&&<div style={{textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>Caricamento dettagli...</div>}
                    {detail&&(
                      <>
                        {/* Stats generali */}
                        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                          {detail.calories&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--accent)',fontWeight:600}}>🔥 {Math.round(detail.calories)} kcal</span>}
                          {detail.average_heartrate&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--text2)'}}>❤️ {Math.round(detail.average_heartrate)} bpm medio</span>}
                          {detail.max_heartrate&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--text2)'}}>❤️‍🔥 {Math.round(detail.max_heartrate)} bpm max</span>}
                          {detail.total_elevation_gain>0&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--text2)'}}>↑ {Math.round(detail.total_elevation_gain)} m</span>}
                          {detail.suffer_score&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--text2)'}}>💪 Suffer: {detail.suffer_score}</span>}
                          {detail.average_cadence&&<span style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',background:'var(--surface)',color:'var(--text2)'}}>👟 {Math.round(detail.average_cadence*2)} passi/min</span>}
                        </div>
                        {/* Laps */}
                        {detail.laps?.length>0&&(
                          <div>
                            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>LAPS</div>
                            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                              {detail.laps.map(lap=>(
                                <div key={lap.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',padding:'6px 8px',borderRadius:'8px',background:'var(--surface)'}}>
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
                        {/* Splits */}
                        {detail.splits_metric?.length>0&&(
                          <div>
                            <div style={{fontSize:'11px',color:'var(--text2)',fontWeight:600,marginBottom:'6px',letterSpacing:'0.5px'}}>SPLITS (km)</div>
                            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                              {detail.splits_metric.map((s,i)=>(
                                <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',padding:'6px 8px',borderRadius:'8px',background:'var(--surface)'}}>
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
  const {dateISO,dayIndex,meal,itemIndex,context,currentName,type}=modal;
  const allContexts=Object.keys(FOOD_DB);
  const [selCtx,setSelCtx]=useState(context||allContexts[0]||'');
  const [search,setSearch]=useState('');
  const options=(FOOD_DB[selCtx]||[]).filter(f=>{
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
          <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)'}}>Cambia alimento</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text2)',fontSize:'20px'}}>×</button>
        </div>
        <input placeholder="Cerca alimento..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',color:'var(--text)',fontSize:'14px',marginBottom:'12px',boxSizing:'border-box'}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
          {allContexts.map(ctx=>(
            <button key={ctx} onClick={()=>{setSelCtx(ctx);setSearch('');}}
              style={{border:'1px solid var(--border)',borderRadius:'7px',padding:'5px 9px',
                background:selCtx===ctx?'var(--accent-soft)':'var(--card)',
                color:selCtx===ctx?'var(--accent)':'var(--text2)',fontSize:'11px',fontWeight:600}}>
              {CONTEXT_LABELS[ctx]||ctx.replaceAll('_',' ')}
            </button>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
          {options.map((alt,i)=>{
            const isCurrent=alt.name===currentName;
            const qty=alt.qty?.[type]??alt.qty?.Riposo;
            const altKcal=calcKcal({...alt,qty});
            return(
              <button key={i} onClick={()=>onSwap(dateISO,dayIndex,meal,itemIndex,alt.name,selCtx)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                  borderRadius:'10px',border:`1px solid ${isCurrent?'var(--accent)':'var(--border)'}`,
                  background:isCurrent?'var(--accent-soft)':'var(--card)',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  {isCurrent&&<span style={{color:'var(--accent)',fontSize:'14px'}}>✓</span>}
                  <span style={{fontSize:'14px',color:isCurrent?'var(--accent)':'var(--text)',fontWeight:isCurrent?600:400}}>{alt.name}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                  <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                    {qty} {alt.uom}
                  </span>
                  {altKcal!=null&&<span style={{fontSize:'10px',color:'var(--text3)'}}>{altKcal} kcal</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddFoodModal({modal,onAdd,onClose}){
  const {dateISO,dayIndex,meal,type,contexts}=modal;
  const allContexts=Object.keys(FOOD_DB);
  const [context,setContext]=useState(contexts[0]||allContexts[0]||'');
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
          <div style={{fontFamily:'var(--display)',fontSize:'18px',color:'var(--text)'}}>Aggiungi alimento</div>
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
          {options.map((food,i)=>{
            const fqty=food.qty?.[type]??food.qty?.Riposo;
            const fKcal=calcKcal({...food,qty:fqty});
            return(
            <button key={i} onClick={()=>onAdd(dateISO,dayIndex,meal,context,food.name)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer'}}>
              <span style={{fontSize:'14px',color:'var(--text)'}}>{food.name}</span>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                  {fqty} {food.uom}
                </span>
                {fKcal!=null&&<span style={{fontSize:'10px',color:'var(--text3)'}}>{fKcal} kcal</span>}
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExtraFoodModal({modal,onAdd,onClose}){
  const {type,dateISO}=modal;
  const allContexts=Object.keys(FOOD_DB);
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
          {options.map((food,i)=>{
            const fqty=food.qty?.[type]??food.qty?.Riposo;
            const fKcal=calcKcal({...food,qty:fqty});
            return(
            <button key={i} onClick={()=>onAdd(dateISO,context,food.name)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',
                borderRadius:'10px',border:'1px solid var(--border)',background:'var(--card)',cursor:'pointer'}}>
              <span style={{fontSize:'14px',color:'var(--text)'}}>{food.name}</span>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'2px'}}>
                <span style={{fontSize:'12px',color:'var(--text2)',background:'var(--chip)',padding:'3px 8px',borderRadius:'999px'}}>
                  {fqty} {food.uom}
                </span>
                {fKcal!=null&&<span style={{fontSize:'10px',color:'var(--text3)'}}>{fKcal} kcal</span>}
              </div>
            </button>
            );
          })}
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
  const [weightLog,setWeightLog]=useState([]);
  const saveWeightLog=async log=>{setWeightLog(log);try{await window.storage.set('nt_weightLog',JSON.stringify(log));}catch(e){}};

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
      }catch(e){}
    })();
  },[]);

  if(!unlocked){
    return(
      <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'28px',padding:'24px'}}>
        <div style={{textAlign:'center'}}>
          <svg width="80" height="80" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginBottom:'14px'}}>
            <circle cx="36" cy="36" r="34" fill="#FBA828" opacity="0.08"/>
            <circle cx="36" cy="36" r="28" fill="none" stroke="#FBA828" strokeWidth="2.5"/>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i)=>{
              const rad=deg*Math.PI/180;
              const x1=36+25*Math.sin(rad), y1=36-25*Math.cos(rad);
              const x2=36+(i%3===0?19:22)*Math.sin(rad), y2=36-(i%3===0?19:22)*Math.cos(rad);
              return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FBA828" strokeWidth={i%3===0?2:1} strokeLinecap="round"/>;
            })}
            <line x1="36" y1="17" x2="36" y2="36" stroke="#EFF1F8" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="36" y1="36" x2="50" y2="30" stroke="#FBA828" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="36" cy="36" r="3" fill="#EFF1F8"/>
            <circle cx="50" cy="20" r="3" fill="#00C49A"/>
            <path d="M50 23 L48 30 L44 36" stroke="#00C49A" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M48 30 L53 34" stroke="#00C49A" strokeWidth="2" strokeLinecap="round"/>
            <path d="M44 36 L42 42 M44 36 L48 41" stroke="#00C49A" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div style={{fontFamily:'var(--display)',fontSize:'30px',fontWeight:800,color:'var(--text)',letterSpacing:'5px'}}>KRONOS</div>
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

  const weeklyTotals=getWeeklyTotals();

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text)',fontFamily:'var(--font)',paddingBottom:'80px'}}>
      {/* Header */}
      <div style={{padding:'20px 20px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'var(--bg)',zIndex:10}}>
        <div style={{fontFamily:'var(--display)',fontSize:'18px',letterSpacing:'0px',fontWeight:700}}>
          KRONOS
        </div>
        {tab==='home'&&(
          <div style={{fontSize:'12px',color:'var(--text2)'}}>
            Il tuo percorso
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
          setExpandedDay={setExpandedDay} getDayConsumedKcal={getDayConsumedKcal} todayISO={todayISO} resetMeal={resetMeal}
          dayTypes={dayTypes} removeFood={removeFood}/>}
        {tab==='oggi'&&<OggiView weekPlan={weekPlan} weekDates={weekDates} todayISO={todayISO}
          selectedDayIndex={selectedDayIndex} setSelectedDayIndex={setSelectedDayIndex}
          dailyLog={dailyLog} toggleLogItem={toggleLog} updateLogQty={updateQty}
          editQty={editQty} setEditQty={setEditQty} setSwapModal={setSwapModal}
          setAddModal={setAddModal} setExtraModal={setExtraModal} dayTypes={dayTypes}
          changeDayType={changeDayType} removeFood={removeFood}/>}
        {tab==='calendario'&&<CalendarView dailyLog={dailyLog} dayTypes={dayTypes} weekPlan={weekPlan}
          setTab={setTab} setSelectedDayIndex={setSelectedDayIndex} setWeekStart={setWeekStart}/>}
        {tab==='dashboard'&&<DashboardView weeklyTotals={weeklyTotals} weekDates={weekDates}
          weekPlan={weekPlan} dailyLog={dailyLog} getDayConsumedKcal={getDayConsumedKcal} dayTypes={dayTypes}/>}
        {tab==='trainings'&&<TrainingsView stravaTokens={stravaTokens} setStravaTokens={setStravaTokens}
          dailyLog={dailyLog} weekPlan={weekPlan} dayTypes={dayTypes}/>}
        {tab==='peso'&&<PesoView weightLog={weightLog} saveWeightLog={saveWeightLog}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--surface)',borderTop:'1px solid var(--border)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[{id:'home',label:'Home'},{id:'oggi',label:'Oggi'},{id:'peso',label:'Peso'},{id:'planner',label:'Planner'},{id:'calendario',label:'Calendario'},{id:'dashboard',label:'Limiti'},{id:'trainings',label:'Sport'}].map(t=>(
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
