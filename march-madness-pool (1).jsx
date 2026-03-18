import { useState, useEffect, useRef, useCallback } from "react";

const EXCLUDED_GAME_IDS = new Set(["401856436"]); // SMU vs Miami (OH) — Jaron Pierre's points don't count

const POOL = {
  Diaz:    ["Darius Acuff","Graham Ike","Keaton Wagler","Donovan Dent","Tyler Tanner","Tavari Johnson","Ja'Kobi Gillespie","Kylan Boswell"],
  Kev:     ["Cam Boozer","Koa Peat","Thijs De Ridder","Robert Wright III","Andy Mara","Cruz Davis","Tamin Lipsey","Xaivian Lee"],
  Liam:    ["Brayden Burries","AJ Dybansta","Labaron Philon","Nick Boyd","Wes Enis","Pryce Sandfort","Alex Karaban","Bruce Thornton"],
  Yarbs:   ["Thomas Haugh","Trey Kaufman-Renn","Milan Momcilovic","Tarris Reed","Motiejus Krivas","Braylon Mullins","Robbie Avila","Lazar Djokovic"],
  Samberg: ["Jaden Bradley","Joshua Jefferson","Emmanuel Sharp","Isaiah Evans","Morez Johnson","Ryan Conwell","Boogie Fland","TJ Power"],
  Timmy:   ["Yaxel Lendeborg","Braden Smith","Zuby Ejiofor","Jeremy Fears","Nate Ament","John Blackwell","David Mirkovic","Terrence Hill"],
  Nick:    ["Kingston Flemmings","Alex Condon","Darryn Peterson","Jaron Pierre","Christian Anderson","Boopie Miller","Andrej Stojakovic","Elliot Cadeau"],
};
const MANAGERS = Object.keys(POOL);
const ALL_POOL_PLAYERS = Object.values(POOL).flat();

const DRAFT_ORDER = (() => {
  const picks = [];
  for (let r = 0; r < 8; r++) {
    const mgrs = r % 2 === 0 ? [...MANAGERS] : [...MANAGERS].reverse();
    mgrs.forEach((m, i) => picks.push({ pick: r*7+i+1, round: r+1, manager: m, player: POOL[m][r] }));
  }
  return picks;
})();

const PLAYER_SCHOOL = {
  "Darius Acuff":"Arkansas",    "Graham Ike":"Gonzaga",         "Keaton Wagler":"Illinois",
  "Donovan Dent":"UCLA",        "Tyler Tanner":"Vanderbilt",    "Tavari Johnson":"Akron",
  "Ja'Kobi Gillespie":"Tennessee","Kylan Boswell":"Illinois",
  "Cam Boozer":"Duke",          "Koa Peat":"Arizona",           "Thijs De Ridder":"Virginia Tech",
  "Robert Wright III":"BYU",    "Andy Mara":"Michigan",         "Cruz Davis":"Hofstra",
  "Tamin Lipsey":"Iowa State",  "Xaivian Lee":"Florida",
  "Brayden Burries":"Arizona",  "AJ Dybansta":"BYU",            "Labaron Philon":"Alabama",
  "Nick Boyd":"Wisconsin",      "Wes Enis":"South Florida",     "Pryce Sandfort":"Nebraska",
  "Alex Karaban":"UConn",       "Bruce Thornton":"Ohio State",
  "Thomas Haugh":"Florida",     "Trey Kaufman-Renn":"Purdue",
  "Milan Momcilovic":"Iowa State","Tarris Reed":"UConn",
  "Motiejus Krivas":"Arizona",  "Braylon Mullins":"UConn",
  "Robbie Avila":"Saint Louis", "Lazar Djokovic":"VCU",
  "Jaden Bradley":"Arizona",    "Joshua Jefferson":"Iowa State",
  "Emmanuel Sharp":"Houston",   "Isaiah Evans":"Duke",
  "Morez Johnson":"Michigan",   "Ryan Conwell":"Louisville",
  "Boogie Fland":"Florida",     "TJ Power":"Penn",
  "Yaxel Lendeborg":"Michigan", "Braden Smith":"Purdue",
  "Zuby Ejiofor":"St. John's",  "Jeremy Fears":"Michigan State",
  "Nate Ament":"Tennessee",     "John Blackwell":"Wisconsin",
  "David Mirkovic":"Illinois",  "Terrence Hill":"VCU",
  "Kingston Flemmings":"Houston","Alex Condon":"Florida",
  "Darryn Peterson":"Kansas",   "Jaron Pierre":"SMU",
  "Christian Anderson":"Texas Tech","Boopie Miller":"Temple",
  "Andrej Stojakovic":"Illinois","Elliot Cadeau":"Michigan",
};

const PLAYER_PPG = {
  "Darius Acuff":22.7,"Graham Ike":18.5,"Keaton Wagler":17.9,"Donovan Dent":20.4,
  "Tyler Tanner":17.5,"Tavari Johnson":20.1,"Ja'Kobi Gillespie":14.0,"Kylan Boswell":13.3,
  "Cam Boozer":22.7,"Koa Peat":16.2,"Thijs De Ridder":19.0,"Robert Wright III":11.0,
  "Andy Mara":12.0,"Cruz Davis":14.5,"Tamin Lipsey":14.2,"Xaivian Lee":13.8,
  "Brayden Burries":15.9,"AJ Dybansta":25.3,"Labaron Philon":21.5,"Nick Boyd":20.6,
  "Wes Enis":11.5,"Pryce Sandfort":13.8,"Alex Karaban":14.3,"Bruce Thornton":17.7,
  "Thomas Haugh":11.5,"Trey Kaufman-Renn":16.5,"Milan Momcilovic":12.8,"Tarris Reed":10.5,
  "Motiejus Krivas":10.2,"Braylon Mullins":13.5,"Robbie Avila":18.5,"Lazar Djokovic":9.8,
  "Jaden Bradley":13.3,"Joshua Jefferson":16.9,"Emmanuel Sharp":14.5,"Isaiah Evans":11.8,
  "Morez Johnson":12.2,"Ryan Conwell":18.7,"Boogie Fland":11.6,"TJ Power":11.2,
  "Yaxel Lendeborg":14.4,"Braden Smith":14.0,"Zuby Ejiofor":16.3,"Jeremy Fears":15.7,
  "Nate Ament":17.5,"John Blackwell":19.0,"David Mirkovic":13.2,"Terrence Hill":14.5,
  "Kingston Flemmings":19.0,"Alex Condon":12.8,"Darryn Peterson":16.0,"Jaron Pierre":18.5,
  "Christian Anderson":18.9,"Boopie Miller":19.2,"Andrej Stojakovic":10.8,"Elliot Cadeau":9.8,
};

const SCHOOL_COLOR = {
  Arkansas:"#9D2235",Gonzaga:"#002469",Illinois:"#E84A27",UCLA:"#2D68C4",
  Vanderbilt:"#866D4B",Akron:"#00285E",Tennessee:"#FF8200",Duke:"#003087",
  Arizona:"#AB0520","Virginia Tech":"#861F41",BYU:"#002E5D",Michigan:"#00274C",
  Hofstra:"#00529B","Iowa State":"#C8102E",Florida:"#0021A5",Alabama:"#9E1B32",
  Wisconsin:"#C5050C",Nebraska:"#E41C38",UConn:"#000E2F","Ohio State":"#BB0000",
  Purdue:"#CEB888","Saint Louis":"#003DA5",VCU:"#FFB300",Houston:"#C8102E",
  Louisville:"#AD0000","Michigan State":"#18453B",Kansas:"#0051A5",
  "Texas Tech":"#CC0000",Temple:"#9D1B2E","North Carolina":"#4B9CD3",
  SMU:"#0033A0",Penn:"#011F5B","South Florida":"#006747","St. John's":"#BA0C2F",
};

const SCHOOL_ESPN_ID = {
  "Arkansas":8,"Gonzaga":2250,"Illinois":356,"UCLA":26,
  "Vanderbilt":238,"Akron":2006,"Tennessee":2633,"Duke":150,
  "Arizona":12,"Virginia Tech":259,"BYU":252,"Michigan":130,
  "Hofstra":2277,"Iowa State":66,"Florida":57,"Alabama":333,
  "Wisconsin":275,"Nebraska":158,"UConn":41,"Ohio State":194,
  "Purdue":2509,"Saint Louis":139,"VCU":2670,"Houston":248,
  "Louisville":97,"Michigan State":127,"Kansas":2305,
  "Texas Tech":2641,"Temple":218,"North Carolina":153,"SMU":2567,
  "TCU":2628,"North Dakota St":2449,"High Point":2275,"South Florida":58,
  "McNeese":2378,"Troy":2737,"Penn":219,"Siena":2561,"Georgia":61,
  "Furman":231,"Cal Baptist":2856,"Hawaii":62,"Wright State":2752,
  "Tennessee State":2534,"Long Island":2374,"Utah State":328,
  "Northern Iowa":2274,"UCF":2116,"UNC Wilmington":2453,"St. John's":2599,
};

const LIVE_SCHOOL_LOGOS = {};
function getSchoolLogo(school) {
  if (LIVE_SCHOOL_LOGOS[school]) return LIVE_SCHOOL_LOGOS[school];
  const id = SCHOOL_ESPN_ID[school];
  return id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png` : null;
}

const MGR_COLORS = {
  Diaz:"#f97316",Kev:"#3b82f6",Liam:"#a855f7",Yarbs:"#ef4444",
  Samberg:"#10b981",Timmy:"#f59e0b",Nick:"#ec4899",
};

const ESPN_IDS = {
  "Darius Acuff":"5142620","Cam Boozer":"5041935","Koa Peat":"5041953",
  "Jaden Bradley":"4432737","Brayden Burries":"5041960","AJ Dybansta":"5104959",
  "Keaton Wagler":"5079478","Yaxel Lendeborg":"4683640","Braden Smith":"4684257",
  "Zuby Ejiofor":"4683055","Isaiah Evans":"5142593","TJ Power":"5079417",
  "John Blackwell":"5142623","Alex Karaban":"4683035","Bruce Thornton":"4683074",
  "Tamin Lipsey":"4683051","Labaron Philon":"5079550","Trey Kaufman-Renn":"4432936",
  "Boogie Fland":"5079360","Kingston Flemmings":"5142574","Darryn Peterson":"5142590",
  "Jaron Pierre":"4703115","Alex Condon":"5041957","Elliot Cadeau":"5079376",
  "Andrej Stojakovic":"5079486","Pryce Sandfort":"4683036","Lazar Djokovic":"4684228",
  "Emmanuel Sharp":"5079464","Joshua Jefferson":"4683063","Morez Johnson":"4684242",
  "Jeremy Fears":"5079534","Nate Ament":"5142647","Ja'Kobi Gillespie":"4683048",
  "Xaivian Lee":"5142655","Motiejus Krivas":"4684254","Kylan Boswell":"4683040",
};

const ESPN_NAME_MAP = {
  "Darius Acuff Jr.":"Darius Acuff","Darius Acuff":"Darius Acuff",
  "Cameron Boozer":"Cam Boozer","Koa Peat":"Koa Peat",
  "Jaden Bradley":"Jaden Bradley","Brayden Burries":"Brayden Burries",
  "A.J. Dybantsa":"AJ Dybansta","AJ Dybantsa":"AJ Dybansta",
  "Keaton Wagler":"Keaton Wagler","Yaxel Lendeborg":"Yaxel Lendeborg",
  "Braden Smith":"Braden Smith","Zuby Ejiofor":"Zuby Ejiofor",
  "Isaiah Evans":"Isaiah Evans","T.J. Power":"TJ Power","TJ Power":"TJ Power",
  "John Blackwell":"John Blackwell","John Blackwell Jr.":"John Blackwell",
  "Alex Karaban":"Alex Karaban",
  "Bruce Thornton Jr.":"Bruce Thornton","Bruce Thornton":"Bruce Thornton",
  "Tamin Lipsey":"Tamin Lipsey","Labaron Philon":"Labaron Philon",
  "Trey Kaufman-Renn":"Trey Kaufman-Renn","Boogie Fland":"Boogie Fland",
  "Kingston Flemings":"Kingston Flemmings","Kingston Flemmings":"Kingston Flemmings",
  "Darryn Peterson":"Darryn Peterson",
  "Jaron Pierre Jr.":"Jaron Pierre","Jaron Pierre":"Jaron Pierre",
  "Alex Condon":"Alex Condon","Elliot Cadeau":"Elliot Cadeau",
  "Andrej Stojakovic":"Andrej Stojakovic","Pryce Sandfort":"Pryce Sandfort",
  "Lazar Djokovic":"Lazar Djokovic","Emmanuel Sharp":"Emmanuel Sharp",
  "Joshua Jefferson":"Joshua Jefferson",
  "Morez Johnson Jr.":"Morez Johnson","Morez Johnson":"Morez Johnson",
  "Jeremy Fears Jr.":"Jeremy Fears","Jeremy Fears":"Jeremy Fears",
  "Nate Ament":"Nate Ament","Ja'Kobi Gillespie":"Ja'Kobi Gillespie",
  "Xaivian Lee":"Xaivian Lee","Motiejus Krivas":"Motiejus Krivas",
  "Kylan Boswell":"Kylan Boswell","Graham Ike":"Graham Ike",
  "Donovan Dent":"Donovan Dent","Tyler Tanner":"Tyler Tanner",
  "Tavari Johnson":"Tavari Johnson","Thomas Haugh":"Thomas Haugh",
  "Milan Momcilovic":"Milan Momcilovic",
  "Tarris Reed Jr.":"Tarris Reed","Tarris Reed":"Tarris Reed",
  "Braylon Mullins":"Braylon Mullins","Robbie Avila":"Robbie Avila",
  "Ryan Conwell":"Ryan Conwell","David Mirkovic":"David Mirkovic",
  "Terrence Hill Jr.":"Terrence Hill","Terrence Hill":"Terrence Hill",
  "Thijs De Ridder":"Thijs De Ridder","Robert Wright III":"Robert Wright III",
  "Andy Mara":"Andy Mara","Cruz Davis":"Cruz Davis","Wes Enis":"Wes Enis",
  "Nick Boyd":"Nick Boyd","Christian Anderson":"Christian Anderson",
  "Boopie Miller":"Boopie Miller",
};

const SCHOOL_ALIASES = {
  "ohio state":"Ohio State","ohio st":"Ohio State","tcu":"TCU","nebraska":"Nebraska",
  "louisville":"Louisville","wisconsin":"Wisconsin","duke":"Duke","vanderbilt":"Vanderbilt",
  "michigan state":"Michigan State","michigan st":"Michigan State","arkansas":"Arkansas",
  "north carolina":"North Carolina","unc":"North Carolina","vcu":"VCU","michigan":"Michigan",
  "byu":"BYU","brigham young":"BYU","illinois":"Illinois","saint louis":"Saint Louis",
  "st. louis":"Saint Louis","gonzaga":"Gonzaga","houston":"Houston","texas tech":"Texas Tech",
  "akron":"Akron","arizona":"Arizona","iowa state":"Iowa State","alabama":"Alabama",
  "hofstra":"Hofstra","tennessee":"Tennessee","ucla":"UCLA","purdue":"Purdue",
  "florida":"Florida","kansas":"Kansas","uconn":"UConn","connecticut":"UConn",
  "smu":"SMU","southern methodist":"SMU","penn":"Penn","pennsylvania":"Penn",
  "south florida":"South Florida","usf":"South Florida",
  "st. john's":"St. John's","st john's":"St. John's","saint john's":"St. John's",
};
function schoolFromEspn(name) {
  if (!name) return null;
  const l = name.toLowerCase().trim();
  if (SCHOOL_ALIASES[l]) return SCHOOL_ALIASES[l];
  for (const [k,v] of Object.entries(SCHOOL_ALIASES)) if (l.includes(k)||k.includes(l)) return v;
  return null;
}
const getSchoolColor = p => SCHOOL_COLOR[PLAYER_SCHOOL[p]] || "#4ade80";
function getPlayerManager(n) {
  for (const [m,ps] of Object.entries(POOL)) if (ps.includes(n)) return m;
  return null;
}
function getPoolPlayersForGame(game) {
  return ALL_POOL_PLAYERS.filter(p => {
    const s = PLAYER_SCHOOL[p];
    return s && (s === game.school1 || s === game.school2);
  });
}

// ── HARDCODED SCHEDULE ────────────────────────────────────────────────────────

const SCHEDULE = [
  // FIRST FOUR — Wed Mar 18
  { id:"ff3",       date:"Wed Mar 18", time:"6:40 PM ET",       tv:"truTV", round:"First Four",   t1:"Prairie View",  s1:16, t2:"Lehigh",          s2:16, school1:null,           school2:null },
  { id:"401856436", date:"Wed Mar 18", time:"9:15 PM ET",       tv:"truTV", round:"First Four",   t1:"Miami (OH)",    s1:11, t2:"SMU",             s2:11, school1:null,           school2:"SMU" },
  // ROUND OF 64 — Thu Mar 19
  { id:"r64_1",  date:"Thu Mar 19", time:"12:15 PM ET", tv:"CBS",   round:"Round of 64", t1:"Ohio State",    s1:8,  t2:"TCU",            s2:9,  school1:"Ohio State",   school2:null },
  { id:"r64_2",  date:"Thu Mar 19", time:"12:40 PM ET", tv:"truTV", round:"Round of 64", t1:"Nebraska",      s1:4,  t2:"Troy",           s2:13, school1:"Nebraska",     school2:null },
  { id:"r64_3",  date:"Thu Mar 19", time:"1:30 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Louisville",    s1:6,  t2:"South Florida",  s2:11, school1:"Louisville",   school2:"South Florida" },
  { id:"r64_4",  date:"Thu Mar 19", time:"1:50 PM ET",  tv:"TBS",   round:"Round of 64", t1:"Wisconsin",     s1:5,  t2:"High Point",     s2:12, school1:"Wisconsin",    school2:null },
  { id:"r64_5",  date:"Thu Mar 19", time:"2:50 PM ET",  tv:"CBS",   round:"Round of 64", t1:"Duke",          s1:1,  t2:"Siena",          s2:16, school1:"Duke",         school2:null },
  { id:"r64_6",  date:"Thu Mar 19", time:"3:15 PM ET",  tv:"truTV", round:"Round of 64", t1:"Vanderbilt",    s1:5,  t2:"McNeese",        s2:12, school1:"Vanderbilt",   school2:null },
  { id:"r64_7",  date:"Thu Mar 19", time:"4:05 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Michigan State",s1:3,  t2:"North Dakota St",s2:14, school1:"Michigan State",school2:null },
  { id:"r64_8",  date:"Thu Mar 19", time:"4:25 PM ET",  tv:"TBS",   round:"Round of 64", t1:"Arkansas",      s1:4,  t2:"Hawaii",         s2:13, school1:"Arkansas",     school2:null },
  { id:"r64_9",  date:"Thu Mar 19", time:"6:50 PM ET",  tv:"TNT",   round:"Round of 64", t1:"North Carolina",s1:6,  t2:"VCU",            s2:11, school1:"North Carolina",school2:"VCU" },
  { id:"r64_10", date:"Thu Mar 19", time:"7:10 PM ET",  tv:"CBS",   round:"Round of 64", t1:"Michigan",      s1:1,  t2:"Howard/UMBC",    s2:16, school1:"Michigan",     school2:null },
  { id:"r64_11", date:"Thu Mar 19", time:"7:25 PM ET",  tv:"TBS",   round:"Round of 64", t1:"BYU",           s1:6,  t2:"Texas/NC State", s2:11, school1:"BYU",          school2:null },
  { id:"r64_12", date:"Thu Mar 19", time:"7:35 PM ET",  tv:"truTV", round:"Round of 64", t1:"Saint Mary's",  s1:7,  t2:"Texas A&M",      s2:10, school1:null,           school2:null },
  { id:"r64_13", date:"Thu Mar 19", time:"9:25 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Illinois",      s1:3,  t2:"Penn",           s2:14, school1:"Illinois",     school2:"Penn" },
  { id:"r64_14", date:"Thu Mar 19", time:"9:45 PM ET",  tv:"CBS",   round:"Round of 64", t1:"Georgia",       s1:8,  t2:"Saint Louis",    s2:9,  school1:null,           school2:"Saint Louis" },
  { id:"r64_15", date:"Thu Mar 19", time:"10:10 PM ET", tv:"truTV", round:"Round of 64", t1:"Gonzaga",       s1:3,  t2:"Idaho",          s2:14, school1:"Gonzaga",      school2:null },
  { id:"r64_16", date:"Thu Mar 19", time:"10:10 PM ET", tv:"truTV", round:"Round of 64", t1:"Houston",       s1:2,  t2:"Idaho St",       s2:15, school1:"Houston",      school2:null },
  // ROUND OF 64 — Fri Mar 20
  { id:"r64_17", date:"Fri Mar 20", time:"12:15 PM ET", tv:"CBS",   round:"Round of 64", t1:"Kentucky",      s1:7,  t2:"Santa Clara",    s2:10, school1:null,           school2:null },
  { id:"r64_18", date:"Fri Mar 20", time:"12:40 PM ET", tv:"truTV", round:"Round of 64", t1:"Texas Tech",    s1:5,  t2:"Akron",          s2:12, school1:"Texas Tech",   school2:"Akron" },
  { id:"r64_19", date:"Fri Mar 20", time:"1:35 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Arizona",       s1:1,  t2:"Long Island",    s2:16, school1:"Arizona",      school2:null },
  { id:"r64_20", date:"Fri Mar 20", time:"1:50 PM ET",  tv:"TBS",   round:"Round of 64", t1:"Virginia",      s1:3,  t2:"Wright State",   s2:14, school1:null,           school2:null },
  { id:"r64_21", date:"Fri Mar 20", time:"2:50 PM ET",  tv:"CBS",   round:"Round of 64", t1:"Iowa State",    s1:2,  t2:"Tennessee State",s2:15, school1:"Iowa State",   school2:null },
  { id:"r64_22", date:"Fri Mar 20", time:"3:15 PM ET",  tv:"truTV", round:"Round of 64", t1:"Alabama",       s1:4,  t2:"Hofstra",        s2:13, school1:"Alabama",      school2:"Hofstra" },
  { id:"r64_23", date:"Fri Mar 20", time:"4:10 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Villanova",     s1:8,  t2:"Utah State",     s2:9,  school1:null,           school2:null },
  { id:"r64_24", date:"Fri Mar 20", time:"4:25 PM ET",  tv:"TBS",   round:"Round of 64", t1:"Tennessee",     s1:6,  t2:"Miami (OH)/SMU", s2:11, school1:"Tennessee",    school2:"SMU" },
  { id:"r64_25", date:"Fri Mar 20", time:"6:50 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Clemson",       s1:8,  t2:"Iowa",           s2:9,  school1:null,           school2:null },
  { id:"r64_26", date:"Fri Mar 20", time:"7:10 PM ET",  tv:"CBS",   round:"Round of 64", t1:"St. John's",    s1:5,  t2:"Northern Iowa",  s2:12, school1:"St. John's",   school2:null },
  { id:"r64_27", date:"Fri Mar 20", time:"7:25 PM ET",  tv:"TBS",   round:"Round of 64", t1:"UCLA",          s1:7,  t2:"UCF",            s2:10, school1:"UCLA",         school2:null },
  { id:"r64_28", date:"Fri Mar 20", time:"7:35 PM ET",  tv:"truTV", round:"Round of 64", t1:"Purdue",        s1:2,  t2:"UNC Wilmington", s2:15, school1:"Purdue",       school2:null },
  { id:"r64_29", date:"Fri Mar 20", time:"9:25 PM ET",  tv:"TNT",   round:"Round of 64", t1:"Florida",       s1:1,  t2:"Prv/Leh Winner", s2:16, school1:"Florida",      school2:null },
  { id:"r64_30", date:"Fri Mar 20", time:"9:45 PM ET",  tv:"CBS",   round:"Round of 64", t1:"Kansas",        s1:4,  t2:"Cal Baptist",    s2:13, school1:"Kansas",       school2:null },
  { id:"r64_31", date:"Fri Mar 20", time:"10:00 PM ET", tv:"TBS",   round:"Round of 64", t1:"UConn",         s1:2,  t2:"Furman",         s2:15, school1:"UConn",        school2:null },
  // ROUND OF 32
  { id:"r32_sat", date:"Sat Mar 21", time:"12:10 PM ET start", tv:"CBS/TBS/TNT/truTV", round:"Round of 32", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  { id:"r32_sun", date:"Sun Mar 22", time:"12:10 PM ET start", tv:"CBS/TBS/TNT/truTV", round:"Round of 32", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  // SWEET 16
  { id:"s16_thu", date:"Thu Mar 26", time:"7:10 PM ET start", tv:"CBS/TBS", round:"Sweet 16", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  { id:"s16_fri", date:"Fri Mar 27", time:"7:10 PM ET start", tv:"CBS/TBS", round:"Sweet 16", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  // ELITE EIGHT
  { id:"e8_sat",  date:"Sat Mar 28", time:"6:09 PM ET start", tv:"TBS",     round:"Elite Eight", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  { id:"e8_sun",  date:"Sun Mar 29", time:"2:15 PM ET start", tv:"CBS",     round:"Elite Eight", t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  // FINAL FOUR
  { id:"ff_sat",  date:"Sat Apr 4",  time:"6:09 PM ET",       tv:"TBS",     round:"Final Four",  t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
  // CHAMPIONSHIP
  { id:"champ",   date:"Mon Apr 6",  time:"8:50 PM ET",       tv:"TBS",     round:"Championship",t1:"TBD", s1:null, t2:"TBD", s2:null, school1:null, school2:null, tbd:true },
];

// ── ESPN API ──────────────────────────────────────────────────────────────────

async function fetchLiveGame(espnId) {
  try {
    const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event=${espnId}`);
    if (!r.ok) return null;
    const data = await r.json();
    const comp = data.header?.competitions?.[0];
    if (!comp) return null;
    const home = comp.competitors?.find(c => c.homeAway === "home");
    const away = comp.competitors?.find(c => c.homeAway === "away");
    const st = comp.status?.type;
    const state = st?.state;
    const playerPts = {};
    for (const teamData of data.boxscore?.players || []) {
      const statKeys = teamData.statistics?.[0]?.keys || [];
      const ptsIdx = statKeys.indexOf("PTS");
      for (const ath of teamData.athletes || []) {
        const pool = ESPN_NAME_MAP[ath.athlete?.displayName];
        if (!pool) continue;
        const val = ptsIdx >= 0 ? parseInt(ath.stats?.[ptsIdx]) : NaN;
        if (!isNaN(val)) playerPts[pool] = val;
      }
    }
    return {
      score1: home ? parseInt(home.score) || 0 : null,
      score2: away ? parseInt(away.score) || 0 : null,
      status: state === "in" ? "live" : state === "post" ? "final" : "scheduled",
      detail: st?.shortDetail || "",
      playerPts,
    };
  } catch { return null; }
}

const ESPNID_CACHE = {};
const LIVE_DATA = {};

async function refreshLiveScores() {
  const today = new Date();
  const dates = [];
  for (let d = -1; d <= 1; d++) {
    const dt = new Date(today); dt.setDate(dt.getDate() + d);
    const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,"0"), day = String(dt.getDate()).padStart(2,"0");
    dates.push(`${y}${m}${day}`);
  }
  for (const date of dates) {
    try {
      const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}&groups=100&limit=20`);
      if (!r.ok) continue;
      const data = await r.json();
      for (const ev of data.events || []) {
        const comp = ev.competitions?.[0]; if (!comp) continue;
        const home = comp.competitors?.find(c=>c.homeAway==="home");
        const away = comp.competitors?.find(c=>c.homeAway==="away");
        if (!home||!away) continue;
        const homeSchool = schoolFromEspn(home.team?.location||home.team?.displayName);
        const awaySchool = schoolFromEspn(away.team?.location||away.team?.displayName);
        if (homeSchool && home.team?.logo) LIVE_SCHOOL_LOGOS[homeSchool] = home.team.logo;
        if (awaySchool && away.team?.logo) LIVE_SCHOOL_LOGOS[awaySchool] = away.team.logo;
        const homeName = (home.team?.location||"").toLowerCase();
        const awayName = (away.team?.location||"").toLowerCase();
        // Match to static schedule by ESPN event ID first, then by team name
        let match = SCHEDULE.find(g => g.id === ev.id);
        if (!match) {
          match = SCHEDULE.find(g => {
            if (g.tbd) return false;
            const gt1 = g.t1.toLowerCase(), gt2 = g.t2.toLowerCase();
            return (homeName.includes(gt1.split(" ")[0]) || gt1.includes(homeName.split(" ")[0])) &&
                   (awayName.includes(gt2.split(" ")[0]) || gt2.includes(awayName.split(" ")[0]));
          });
          if (match) ESPNID_CACHE[match.id] = ev.id;
        }
        if (!match) continue;
        const st = comp.status?.type, state = st?.state;
        if (state === "in" || state === "post") {
          const liveData = await fetchLiveGame(ev.id);
          if (liveData) LIVE_DATA[match.id] = liveData;
        }
      }
    } catch {}
  }
}

// ── LIVE STATS ENGINE (leaderboard / players) ─────────────────────────────────

function useLiveStats() {
  const [playerPoints, setPlayerPoints] = useState({});
  const [gamePoints, setGamePoints] = useState({});
  const [lastPoll, setLastPoll] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const polling = useRef(false);
  const gpRef = useRef({});

  const poll = useCallback(async () => {
    if (polling.current) return;
    polling.current = true; setIsPolling(true);
    try {
      // Fetch all tournament dates
      const TOURNAMENT_DATES = ["20260317","20260318","20260319","20260320","20260321","20260322","20260326","20260327","20260328","20260329","20260404","20260406"];
      const allGames = [];
      for (const date of TOURNAMENT_DATES) {
        try {
          const r = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}&groups=100&limit=20`);
          if (!r.ok) continue;
          const data = await r.json();
          for (const ev of data.events||[]) {
            const comp=ev.competitions?.[0]; if(!comp) continue;
            const home=comp.competitors?.find(c=>c.homeAway==="home");
            const away=comp.competitors?.find(c=>c.homeAway==="away");
            if(!home||!away) continue;
            const st=comp.status?.type,state=st?.state;
            allGames.push({id:ev.id,state,home,away});
          }
        } catch {}
      }
      const newGP = {...gpRef.current};
      await Promise.all(allGames.filter(g=>g.state==="in"||g.state==="post").map(async g=>{
        const box = await fetchLiveGame(g.id);
        if (!box) return;
        const merged = {...box.playerPts};
        if (EXCLUDED_GAME_IDS.has(g.id)) ALL_POOL_PLAYERS.forEach(p=>{merged[p]=0;});
        newGP[g.id] = merged;
      }));
      gpRef.current = newGP;
      setGamePoints({...newGP});
      const totals = {};
      ALL_POOL_PLAYERS.forEach(p=>{totals[p]=0;});
      Object.entries(newGP).forEach(([,gp])=>Object.entries(gp).forEach(([p,v])=>{if(totals[p]!==undefined)totals[p]+=v;}));
      setPlayerPoints(totals);
      setLastPoll(new Date());
    } catch(e){console.error(e);}
    polling.current=false; setIsPolling(false);
  },[]);

  useEffect(()=>{ poll(); const iv=setInterval(poll,30000); return()=>clearInterval(iv); },[poll]);

  const playerStats = ALL_POOL_PLAYERS.map(p=>({
    name:p, points:playerPoints[p]||0, games:0, eliminated:false
  }));
  return {playerStats,lastPoll,isPolling,gamePoints};
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function EspnHeadshot({ player, size=48, style: ex={} }) {
  const id=ESPN_IDS[player], color=getSchoolColor(player);
  const initials=player.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const [failed,setFailed]=useState(false);
  const base={width:size,height:size,borderRadius:"50%",flexShrink:0,...ex};
  if(!id||failed) return <div style={{...base,background:`linear-gradient(135deg,${color}cc,${color}44)`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Bebas Neue',cursive",fontSize:size*0.33,color:"#fff",letterSpacing:1}}>{initials}</div>;
  return <img src={`https://a.espncdn.com/i/headshots/mens-college-basketball/players/full/${id}.png`} alt={player} onError={()=>setFailed(true)} style={{...base,border:`2px solid ${color}`,objectFit:"cover",background:"#111"}} />;
}

function PulsingDot() {
  return <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#ef4444",marginRight:5,animation:"pulse 1.2s infinite"}}><style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}`}</style></span>;
}

function TickerBar({ playerStats }) {
  const scores=MANAGERS.map(m=>({m,total:POOL[m].reduce((s,p)=>s+(playerStats.find(x=>x.name===p)?.points||0),0)})).sort((a,b)=>b.total-a.total);
  const ref=useRef(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    let x=0; let raf;
    const tick=()=>{x-=0.5;if(x<-el.scrollWidth/2)x=0;el.style.transform=`translateX(${x}px)`;raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick); return()=>cancelAnimationFrame(raf);
  },[scores.map(s=>s.total).join(",")]);
  const medals=["🥇","🥈","🥉"];
  const items=scores.map((s,i)=>(
    <span key={s.m} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"0 28px",borderRight:"1px solid #222",whiteSpace:"nowrap"}}>
      <span style={{fontSize:13}}>{medals[i]||`#${i+1}`}</span>
      <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,letterSpacing:1,color:MGR_COLORS[s.m]}}>{s.m.toUpperCase()}</span>
      <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,color:"#fff"}}>{s.total}</span>
      <span style={{fontSize:10,color:"#555"}}>PTS</span>
    </span>
  ));
  return (
    <div style={{background:"#0d0d0d",borderBottom:"1px solid #1a1a1a",overflow:"hidden",height:34,display:"flex",alignItems:"center",position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:50,background:"linear-gradient(90deg,#0d0d0d,transparent)",zIndex:2}}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:50,background:"linear-gradient(270deg,#0d0d0d,transparent)",zIndex:2}}/>
      <div ref={ref} style={{display:"inline-flex",alignItems:"center",willChange:"transform"}}>{items}{items}</div>
    </div>
  );
}

function Nav({ page, setPage }) {
  const tabs=[{id:"leaderboard",label:"🏆 Leaderboard"},{id:"players",label:"🏀 Players"},{id:"scores",label:"📺 Scores"},{id:"draft",label:"📋 Draft"}];
  return (
    <nav style={{display:"flex",gap:4,borderBottom:"1px solid #1f1f1f",padding:"0 16px",overflowX:"auto"}}>
      {tabs.map(t=><button key={t.id} onClick={()=>setPage(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Bebas Neue',cursive",fontSize:15,letterSpacing:1,color:page===t.id?"#4ade80":"#666",borderBottom:page===t.id?"2px solid #4ade80":"2px solid transparent",padding:"14px 16px",whiteSpace:"nowrap",transition:"color .2s"}}>{t.label}</button>)}
    </nav>
  );
}

function RosterDrawer({ mgr, playerStats, onClose }) {
  const color=MGR_COLORS[mgr];
  useEffect(()=>{const fn=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn);},[onClose]);
  const players=[...POOL[mgr]].sort((a,b)=>(playerStats.find(s=>s.name===b)?.points||0)-(playerStats.find(s=>s.name===a)?.points||0));
  const total=POOL[mgr].reduce((s,p)=>s+(playerStats.find(x=>x.name===p)?.points||0),0);
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",right:0,top:0,bottom:0,width:"min(420px,100vw)",background:"#0d0d0d",borderLeft:`2px solid ${color}`,zIndex:101,overflowY:"auto",display:"flex",flexDirection:"column",animation:"drawerIn .2s ease"}}>
        <style>{`@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #1a1a1a",display:"flex",justifyContent:"space-between",alignItems:"center",background:`linear-gradient(135deg,${color}15,transparent)`}}>
          <div><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,color,letterSpacing:3}}>{mgr.toUpperCase()}</div><div style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>8 players · Esc or click outside to close</div></div>
          <button onClick={onClose} style={{background:"#1a1a1a",border:"1px solid #333",color:"#888",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        <div style={{padding:16,flex:1,display:"flex",flexDirection:"column",gap:8}}>
          {players.map((player,i)=>{
            const stat=playerStats.find(s=>s.name===player),pts=stat?.points||0,elim=stat?.eliminated||false;
            const sc=getSchoolColor(player),school=PLAYER_SCHOOL[player],ppg=PLAYER_PPG[player];
            return (
              <div key={player} style={{background:"#151515",border:`1px solid ${elim?"#1f1f1f":"#252525"}`,borderRadius:10,padding:"11px 14px",display:"flex",gap:12,alignItems:"center",opacity:elim?0.45:1}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:14,color:"#333",width:18,textAlign:"center"}}>{i+1}</div>
                <EspnHeadshot player={player} size={50}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:"#fff",letterSpacing:.5,lineHeight:1.2}}>{player}</div>
                  <div style={{fontSize:11,color:"#666",fontFamily:"monospace",marginTop:3}}>{school}{ppg!=null&&<span style={{color:"#555"}}> · {ppg} ppg</span>}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:30,color:sc,lineHeight:1}}>{pts}</div>
                  <div style={{fontSize:9,color:"#444",textAlign:"center"}}>PTS</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{margin:"0 16px 20px",padding:"14px 18px",background:`${color}12`,border:`1px solid ${color}33`,borderRadius:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:14,color:"#666",letterSpacing:2}}>TEAM TOTAL</span>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:36,color}}>{total}</span>
            <span style={{fontSize:13,color:"#555"}}>PTS</span>
          </div>
        </div>
      </div>
    </>
  );
}

function LeaderboardPage({ playerStats, isPolling, lastPoll }) {
  const [openMgr,setOpenMgr]=useState(null);
  const scores=MANAGERS.map(mgr=>{let t=0,a=0;POOL[mgr].forEach(p=>{const s=playerStats.find(x=>x.name===p);t+=s?.points||0;if(!s?.eliminated)a++;});return{mgr,total:t,active:a};}).sort((a,b)=>b.total-a.total);
  const max=scores[0]?.total||1;
  return (
    <>
      <div style={{padding:24,maxWidth:700,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
          <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,color:"#4ade80",letterSpacing:2,margin:0}}>STANDINGS</h2>
          <div style={{fontSize:10,color:isPolling?"#ef4444":"#444",fontFamily:"monospace",display:"flex",alignItems:"center",gap:4}}>
            {isPolling&&<PulsingDot/>}{isPolling?"UPDATING…":lastPoll?`${lastPoll.toLocaleTimeString()}`:""}
          </div>
        </div>
        <p style={{color:"#555",fontSize:12,marginBottom:24,fontFamily:"monospace"}}>Live from ESPN · auto-refreshes every 30s · click to view roster</p>
        {scores.map((s,i)=>(
          <div key={s.mgr} onClick={()=>setOpenMgr(s.mgr)}
            style={{background:"#111",border:`1px solid ${i===0?"#4ade80":"#1f1f1f"}`,borderRadius:12,padding:16,marginBottom:12,display:"flex",alignItems:"center",gap:16,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=MGR_COLORS[s.mgr];e.currentTarget.style.background=`${MGR_COLORS[s.mgr]}0a`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=i===0?"#4ade80":"#1f1f1f";e.currentTarget.style.background="#111";}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,width:36,textAlign:"center",color:i===0?"#4ade80":i===1?"#a78bfa":i===2?"#fb923c":"#444"}}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"baseline"}}>
                <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:22,color:MGR_COLORS[s.mgr],letterSpacing:1}}>{s.mgr.toUpperCase()}</span>
                <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                  <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:28,color:"#fff"}}>{s.total}</span>
                  <span style={{fontSize:12,color:"#555"}}>PTS</span>
                  <span style={{fontSize:14,color:"#333"}}>›</span>
                </div>
              </div>
              <div style={{background:"#1a1a1a",borderRadius:4,height:6,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,transition:"width .6s ease",background:`linear-gradient(90deg,${MGR_COLORS[s.mgr]},${MGR_COLORS[s.mgr]}66)`,width:`${(s.total/max)*100}%`}}/>
              </div>
              <div style={{marginTop:5,fontSize:11,color:"#555",fontFamily:"monospace"}}>{s.active} players still active</div>
            </div>
          </div>
        ))}
      </div>
      {openMgr&&<RosterDrawer mgr={openMgr} playerStats={playerStats} onClose={()=>setOpenMgr(null)}/>}
    </>
  );
}

function PlayersPage({ playerStats }) {
  const all = Object.entries(POOL)
    .flatMap(([mgr, ps]) => ps.map(p => ({ mgr, player: p })))
    .sort((a, b) => (playerStats.find(s=>s.name===b.player)?.points||0) - (playerStats.find(s=>s.name===a.player)?.points||0));

  return (
    <div style={{padding:24, maxWidth:700, margin:"0 auto"}}>
      <h2 style={{fontFamily:"'Bebas Neue',cursive", fontSize:32, color:"#4ade80", letterSpacing:2, marginBottom:4}}>PLAYER LEADERBOARD</h2>
      <p style={{color:"#555", fontSize:12, marginBottom:24, fontFamily:"monospace"}}>All 56 pool players ranked by tournament points scored</p>
      <div style={{display:"flex", flexDirection:"column", gap:6}}>
        {all.map(({mgr, player}, i) => {
          const pts = playerStats.find(s=>s.name===player)?.points || 0;
          const elim = playerStats.find(s=>s.name===player)?.eliminated || false;
          const color = getSchoolColor(player);
          const school = PLAYER_SCHOOL[player];
          const ppg = PLAYER_PPG[player];
          const mgrColor = MGR_COLORS[mgr];
          const rankColor = i===0?"#4ade80":i===1?"#a78bfa":i===2?"#fb923c":"#444";
          return (
            <div key={player} style={{
              background:"#111", border:"1px solid #1f1f1f", borderRadius:10,
              padding:"10px 14px", display:"flex", alignItems:"center", gap:12,
              opacity: elim ? 0.45 : 1,
            }}>
              {/* Rank */}
              <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:18, color:rankColor, width:28, textAlign:"center", flexShrink:0}}>
                {i+1}
              </div>
              {/* Headshot */}
              <EspnHeadshot player={player} size={42}/>
              {/* Name + school + manager */}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:15, color:"#fff", letterSpacing:.5, lineHeight:1.2}}>
                  {player}
                  {elim && <span style={{fontSize:9, color:"#ef4444", background:"#ef444418", padding:"1px 5px", borderRadius:3, marginLeft:6}}>OUT</span>}
                </div>
                <div style={{fontSize:10, color:"#666", fontFamily:"monospace", marginTop:2}}>
                  {school}{ppg!=null && <span style={{color:"#555"}}> · {ppg} ppg</span>}
                  <span style={{color:mgrColor, marginLeft:8}}>{mgr}</span>
                </div>
              </div>
              {/* Points */}
              <div style={{textAlign:"right", flexShrink:0}}>
                <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:26, color: pts>0 ? color : "#333", lineHeight:1}}>{pts}</div>
                <div style={{fontSize:9, color:"#555", fontFamily:"monospace"}}>PTS</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoresPage({ playerStats }) {
  const [liveData, setLiveData] = useState({});
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLiveScores();
    setLiveData({...LIVE_DATA});
    setLastRefresh(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => { doRefresh(); const iv=setInterval(doRefresh,30000); return()=>clearInterval(iv); }, [doRefresh]);

  const byDate = {};
  for (const game of SCHEDULE) {
    if (!byDate[game.date]) byDate[game.date] = [];
    byDate[game.date].push(game);
  }

  const liveGames = SCHEDULE.filter(g => !g.tbd && liveData[g.id]?.status === "live");

  const renderGame = (game, forceKey) => {
    const live = liveData[game.id] || {};
    const status = live.status || "scheduled";
    const isLive = status === "live";
    const isFinal = status === "final";
    const isScheduled = !isLive && !isFinal;
    const poolPlayers = getPoolPlayersForGame(game);
    const isExcluded = EXCLUDED_GAME_IDS.has(game.id);

    if (game.tbd) return (
      <div key={forceKey||game.id} style={{background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontSize:10,fontFamily:"monospace",color:"#444"}}>{game.round}</span>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:"#444",marginTop:2}}>Matchups TBD after previous round</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,fontFamily:"monospace",color:"#444"}}>{game.time}</div>
          <div style={{fontSize:9,color:"#333",fontFamily:"monospace"}}>{game.tv}</div>
        </div>
      </div>
    );

    return (
      <div key={forceKey||game.id} style={{background:isLive?"#130a0a":"#111",border:`1px solid ${isLive?"#ef4444":isFinal?"#1a2a1a":"#1f1f1f"}`,borderRadius:12,padding:14,marginBottom:10,boxShadow:isLive?"0 0 24px #ef444430":"none"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:10,fontFamily:"monospace",color:"#555"}}>{game.round}</span>
            {game.tv&&<span style={{fontSize:9,color:"#444",background:"#1a1a1a",padding:"1px 5px",borderRadius:3,fontFamily:"monospace"}}>{game.tv}</span>}
          </div>
          <div>
            {isLive
              ? <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:14,color:"#ef4444",display:"flex",alignItems:"center",gap:4,letterSpacing:1}}><PulsingDot/>{live.detail||"LIVE"}</span>
              : isFinal
                ? <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:13,color:"#4ade80",letterSpacing:1}}>FINAL</span>
                : <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:13,color:"#888"}}>{game.time}</span>
            }
          </div>
        </div>
        {/* Score row */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:isLive?22:19,color:isScheduled?"#aaa":"#fff",lineHeight:1.1}}>
              {game.s1&&game.s1<99&&<span style={{fontSize:11,color:"#555",marginRight:4}}>({game.s1})</span>}{game.t1}
            </div>
          </div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:isScheduled?15:isLive?32:26,color:isScheduled?"#444":"#fff",padding:"0 14px",letterSpacing:2,textAlign:"center",minWidth:70}}>
            {isScheduled?"vs":`${live.score1??"–"} – ${live.score2??"–"}`}
          </div>
          <div style={{flex:1,textAlign:"right"}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:isLive?22:19,color:isScheduled?"#aaa":"#fff",lineHeight:1.1}}>
              {game.t2}{game.s2&&game.s2<99&&<span style={{fontSize:11,color:"#555",marginLeft:4}}>({game.s2})</span>}
            </div>
          </div>
        </div>
        {/* Pool players */}
        {poolPlayers.length>0&&(
          <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${isLive?"#2a1010":"#1a1a1a"}`}}>
            <div style={{fontSize:10,color:isLive?"#ef444488":"#555",fontFamily:"monospace",marginBottom:7,letterSpacing:1}}>
              {isLive?"🏀 POOL PLAYERS — LIVE POINTS":"POOL PLAYERS IN THIS GAME"}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {poolPlayers.map(p=>{
                const mgr=getPlayerManager(p);
                const mc=MGR_COLORS[mgr]||"#4ade80", sc=getSchoolColor(p);
                const ppg=PLAYER_PPG[p], school=PLAYER_SCHOOL[p];
                const inGamePts=live.playerPts?.[p];
                const showPts=(isLive||isFinal)&&inGamePts!=null&&!isExcluded;
                const totalTourney=playerStats.find(s=>s.name===p)?.points||0;
                return (
                  <div key={p} style={{display:"flex",alignItems:"center",gap:8,background:isLive?`${mc}28`:`${mc}18`,border:`1px solid ${isLive?mc:mc+"44"}`,borderRadius:10,padding:"7px 10px 7px 7px"}}>
                    <EspnHeadshot player={p} size={isLive?40:36} style={{border:"none"}}/>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:isLive?14:13,color:mc,letterSpacing:.5,whiteSpace:"nowrap"}}>{p}</div>
                      <div style={{fontSize:10,color:"#777",fontFamily:"monospace",marginTop:1}}>{school}{ppg!=null&&<span style={{color:"#555"}}> · {ppg} ppg</span>}</div>
                      <div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>{mgr}</div>
                    </div>
                    <div style={{textAlign:"center",minWidth:42}}>
                      {isExcluded?(
                        <><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#444",lineHeight:1}}>{inGamePts??"–"}</div><div style={{fontSize:8,color:"#ef4444",fontFamily:"monospace"}}>excl.</div></>
                      ):showPts?(
                        <><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:isLive?28:22,color:sc,lineHeight:1}}>{inGamePts}</div><div style={{fontSize:8,color:isLive?"#ef444488":"#555",fontFamily:"monospace"}}>{isFinal?"this gm":"PTS"}</div></>
                      ):isScheduled?(
                        <><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:"#555",lineHeight:1}}>{totalTourney||"–"}</div><div style={{fontSize:8,color:"#444",fontFamily:"monospace"}}>tourney</div></>
                      ):(
                        <><div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:"#555",lineHeight:1}}>–</div><div style={{fontSize:8,color:"#444",fontFamily:"monospace"}}>pts</div></>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{padding:24,maxWidth:780,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,color:"#4ade80",letterSpacing:2,margin:0}}>NCAA TOURNAMENT</h2>
        <button onClick={doRefresh} disabled={refreshing} style={{background:"#111",border:"1px solid #333",color:"#666",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"'Bebas Neue',cursive",fontSize:13,letterSpacing:1,display:"flex",alignItems:"center",gap:6,opacity:refreshing?0.6:1}}>
          {refreshing&&<PulsingDot/>}↻ REFRESH
        </button>
      </div>
      <div style={{fontSize:10,color:"#444",fontFamily:"monospace",marginBottom:20}}>
        Schedule always shown · live scores auto-refresh every 30s{lastRefresh?` · ${lastRefresh.toLocaleTimeString()}`:""}
      </div>

      {/* LIVE NOW — pinned at top */}
      {liveGames.length>0&&(
        <div style={{marginBottom:32}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:18,letterSpacing:2,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <PulsingDot/><span style={{color:"#ef4444"}}>LIVE NOW</span>
            <span style={{fontSize:13,color:"#555"}}>— {liveGames.length} game{liveGames.length!==1?"s":""} in progress</span>
            <div style={{height:1,flex:1,background:"#2a1010"}}/>
          </div>
          {liveGames.map(g=>renderGame(g, g.id+"_top"))}
        </div>
      )}

      {/* Full schedule grouped by date */}
      {Object.entries(byDate).map(([date,games])=>{
        const liveIds=new Set(liveGames.map(g=>g.id));
        return (
          <div key={date} style={{marginBottom:28}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:17,color:"#4ade80",letterSpacing:2,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              {date}
              <div style={{height:1,flex:1,background:"#1f1f1f"}}/>
              <span style={{fontSize:11,color:"#555",fontFamily:"monospace"}}>{games.filter(g=>!g.tbd).length} game{games.filter(g=>!g.tbd).length!==1?"s":""}</span>
            </div>
            {games.map(game=>{
              if (liveIds.has(game.id)) return (
                <div key={game.id} style={{background:"#130a0a",border:"1px solid #ef444433",borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <PulsingDot/>
                    <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:15,color:"#ef4444"}}>{game.t1} vs {game.t2} — LIVE</span>
                  </div>
                  <span style={{fontSize:10,color:"#ef444488",fontFamily:"monospace"}}>↑ pinned above</span>
                </div>
              );
              return renderGame(game);
            })}
          </div>
        );
      })}
    </div>
  );
}

function DraftPage() {
  const [view,setView]=useState("board");
  return (
    <div style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:32,color:"#4ade80",letterSpacing:2}}>DRAFT RECAP</h2>
        <div style={{display:"flex",gap:8}}>{["board","list"].map(v=><button key={v} onClick={()=>setView(v)} style={{background:view===v?"#4ade80":"#111",border:"1px solid #333",color:view===v?"#000":"#666",borderRadius:6,padding:"6px 14px",cursor:"pointer",fontFamily:"'Bebas Neue',cursive",fontSize:13,letterSpacing:1}}>{v.toUpperCase()}</button>)}</div>
      </div>
      {view==="board"?(
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",minWidth:700,width:"100%"}}>
            <thead><tr>
              <th style={{padding:"8px 12px",fontFamily:"'Bebas Neue',cursive",fontSize:13,color:"#555",textAlign:"center",borderBottom:"1px solid #1f1f1f",letterSpacing:1}}>RD</th>
              {MANAGERS.map(m=><th key={m} style={{padding:"8px 12px",fontFamily:"'Bebas Neue',cursive",fontSize:15,color:MGR_COLORS[m],textAlign:"center",borderBottom:"1px solid #1f1f1f",letterSpacing:1}}>{m.toUpperCase()}</th>)}
            </tr></thead>
            <tbody>
              {Array.from({length:8},(_,rd)=>{
                const mgrs=rd%2===0?[...MANAGERS]:[...MANAGERS].reverse(),cells={};
                mgrs.forEach((mgr,i)=>{cells[mgr]={player:POOL[mgr][rd],pick:rd*7+i+1};});
                return (
                  <tr key={rd} style={{background:rd%2===0?"#0d0d0d":"#111"}}>
                    <td style={{padding:"10px 12px",fontFamily:"'Bebas Neue',cursive",fontSize:18,color:"#333",textAlign:"center"}}>{rd+1}</td>
                    {MANAGERS.map(mgr=>{const{player,pick}=cells[mgr]||{};return(
                      <td key={mgr} style={{padding:"8px 10px",textAlign:"center"}}>
                        {player&&<div style={{background:`${MGR_COLORS[mgr]}11`,border:`1px solid ${MGR_COLORS[mgr]}33`,borderRadius:8,padding:"8px 6px"}}>
                          <div style={{fontSize:10,color:"#444",fontFamily:"monospace",marginBottom:4}}>#{pick}</div>
                          <div style={{display:"flex",justifyContent:"center",marginBottom:5}}><EspnHeadshot player={player} size={38}/></div>
                          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:11,color:"#ddd",letterSpacing:.3,lineHeight:1.2}}>{player}</div>
                          <div style={{fontSize:9,color:"#666",marginTop:2}}>{PLAYER_SCHOOL[player]}{PLAYER_PPG[player]!=null&&<span style={{color:"#555"}}> · {PLAYER_PPG[player]}</span>}</div>
                        </div>}
                      </td>
                    );})}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {DRAFT_ORDER.map(({pick,round,manager,player})=>(
            <div key={pick} style={{background:"#111",border:"1px solid #1f1f1f",borderRadius:8,padding:"10px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:20,color:"#333",width:32,textAlign:"center"}}>{pick}</div>
              <EspnHeadshot player={player} size={40}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color:"#fff",letterSpacing:.5}}>{player}</div>
                <div style={{fontSize:11,color:"#666",fontFamily:"monospace",marginTop:2}}>{PLAYER_SCHOOL[player]}{PLAYER_PPG[player]!=null&&<span style={{color:"#555"}}> · {PLAYER_PPG[player]} ppg</span>}</div>
              </div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:14,letterSpacing:1,color:MGR_COLORS[manager],background:`${MGR_COLORS[manager]}15`,border:`1px solid ${MGR_COLORS[manager]}44`,borderRadius:6,padding:"3px 10px"}}>{manager.toUpperCase()}</div>
              <div style={{fontSize:10,color:"#444",fontFamily:"monospace"}}>Rd {round}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page,setPage]=useState("leaderboard");
  const {playerStats,lastPoll,isPolling}=useLiveStats();
  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#fff",fontFamily:"system-ui"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet"/>
      <TickerBar playerStats={playerStats}/>
      <div style={{background:"linear-gradient(180deg,#0f1a0f 0%,#0a0a0a 100%)",borderBottom:"1px solid #1a2a1a",padding:"14px 24px 0"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12}}>
            <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:"clamp(24px,5vw,42px)",color:"#4ade80",margin:0,letterSpacing:3}}>MARCH MADNESS POOL</h1>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:16,color:"#1f5c1f",letterSpacing:2}}>2026</span>
          </div>
          <div style={{fontSize:11,color:"#333",fontFamily:"monospace",marginTop:2,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            {isPolling&&<PulsingDot/>}
            {isPolling?"Syncing with ESPN…":lastPoll?`Live · ${lastPoll.toLocaleTimeString()}`:"Loading…"}
            {" · "}<span style={{color:"#1a4a1a"}}>7 managers · 56 players · 1 pt per point scored</span>
          </div>
        </div>
        <Nav page={page} setPage={setPage}/>
      </div>
      <div style={{minHeight:"calc(100vh - 120px)"}}>
        {page==="leaderboard"&&<LeaderboardPage playerStats={playerStats} isPolling={isPolling} lastPoll={lastPoll}/>}
        {page==="players"&&<PlayersPage playerStats={playerStats}/>}
        {page==="scores"&&<ScoresPage playerStats={playerStats}/>}
        {page==="draft"&&<DraftPage/>}
      </div>
    </div>
  );
}
