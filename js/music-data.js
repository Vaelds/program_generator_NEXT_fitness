/* Curated song suggestions. Spotify searches use the exact title and artist. */
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports)module.exports=api; else root.NextMusicData=api; }(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const phases={warm:'Opvarmning',work:'Hoveddel',cool:'Nedvarmning'};
  const lists={
    'Pop':[
      ['Happy','Pharrell Williams'],["CAN’T STOP THE FEELING!",'Justin Timberlake'],['Levitating','Dua Lipa'],['Watermelon Sugar','Harry Styles'],
      ["Don’t Start Now",'Dua Lipa'],['Physical','Dua Lipa'],['Blinding Lights','The Weeknd'],['Uptown Funk','Mark Ronson, Bruno Mars'],['Shake It Off','Taylor Swift'],['Firework','Katy Perry'],['Roar','Katy Perry'],['Titanium','David Guetta, Sia'],["Can’t Hold Us",'Macklemore & Ryan Lewis, Ray Dalton'],['Shut Up and Dance','WALK THE MOON'],['On The Floor','Jennifer Lopez, Pitbull'],['Break Free','Ariana Grande, Zedd'],
      ['Stay With Me','Sam Smith'],['Someone Like You','Adele'],['All of Me','John Legend'],['Photograph','Ed Sheeran']
    ],
    'Elektronisk':[
      ['Get Lucky','Daft Punk, Pharrell Williams, Nile Rodgers'],['One Kiss','Calvin Harris, Dua Lipa'],['Firestone','Kygo, Conrad Sewell'],['Prayer in C - Robin Schulz Radio Edit','Lilly Wood and The Prick, Robin Schulz'],
      ['Wake Me Up','Avicii'],['Levels','Avicii'],["Don’t You Worry Child",'Swedish House Mafia, John Martin'],['Titanium','David Guetta, Sia'],['Summer','Calvin Harris'],['This Is What You Came For','Calvin Harris, Rihanna'],['Animals','Martin Garrix'],['Intoxicated','Martin Solveig, GTA'],['Gecko (Overdrive)','Oliver Heldens, Becky Hill'],['Lean On','Major Lazer, DJ Snake, MØ'],['Head & Heart','Joel Corry, MNEK'],['Freed From Desire','Gala'],
      ['Sunset Lover','Petit Biscuit'],['Porcelain','Moby'],['Something About Us','Daft Punk'],['Teardrop','Massive Attack']
    ],
    'Hip-hop / R&B':[
      ['Crazy','Gnarls Barkley'],['No Diggity','Blackstreet, Dr. Dre, Queen Pen'],['Rock Your Body','Justin Timberlake'],['Ride Wit Me','Nelly, City Spud'],
      ['Without Me','Eminem'],['Lose Yourself','Eminem'],["Till I Collapse",'Eminem, Nate Dogg'],['Stronger','Kanye West'],['POWER','Kanye West'],['Hey Ya!','Outkast'],['The Way You Move','Outkast, Sleepy Brown'],['Work It','Missy Elliott'],['Lose Control','Missy Elliott, Ciara, Fatman Scoop'],['Yeah!','USHER, Lil Jon, Ludacris'],['Pon de Replay','Rihanna'],['Level Up','Ciara'],
      ["If I Ain’t Got You",'Alicia Keys'],['Ordinary People','John Legend'],['No Ordinary Love','Sade'],['Adorn','Miguel']
    ],
    'Rock':[
      ['Walking on Sunshine','Katrina & The Waves'],['Are You Gonna Be My Girl','Jet'],['The Middle','Jimmy Eat World'],['Learn to Fly','Foo Fighters'],
      ['Eye of the Tiger','Survivor'],['Thunderstruck','AC/DC'],['Back In Black','AC/DC'],["Don’t Stop Me Now",'Queen'],['We Will Rock You','Queen'],["Livin’ On A Prayer",'Bon Jovi'],["It’s My Life",'Bon Jovi'],['Seven Nation Army','The White Stripes'],['Mr. Brightside','The Killers'],['Song 2','Blur'],['Smells Like Teen Spirit','Nirvana'],['The Pretender','Foo Fighters'],
      ['Wish You Were Here','Pink Floyd'],['Nothing Else Matters','Metallica'],['Wild Horses','The Rolling Stones'],['More Than Words','Extreme']
    ],
    "80'er & 90'er":[
      ['Billie Jean','Michael Jackson'],['All Night Long (All Night)','Lionel Richie'],['Walking on Sunshine','Katrina & The Waves'],['Wannabe','Spice Girls'],
      ['I Wanna Dance with Somebody (Who Loves Me)','Whitney Houston'],['Wake Me Up Before You Go-Go','Wham!'],['Take on Me','a-ha'],['Footloose','Kenny Loggins'],['You Spin Me Round (Like a Record)','Dead Or Alive'],['Jump','Van Halen'],['Rhythm Is a Dancer','SNAP!'],['What Is Love','Haddaway'],['No Limit','2 Unlimited'],['Gonna Make You Sweat (Everybody Dance Now)','C+C Music Factory'],['The Rhythm of the Night','Corona'],["Everybody (Backstreet’s Back)",'Backstreet Boys'],
      ['True','Spandau Ballet'],['Time After Time','Cyndi Lauper'],['Right Here Waiting','Richard Marx'],['Torn','Natalie Imbruglia']
    ],
    'Danske hits':[
      ['STOR MAND','Tobias Rahim, Andreas Odbjerg'],['Hjem Fra Fabrikken','Andreas Odbjerg'],['De første kærester på månen','tv-2'],['Kom tilbage nu','Danser Med Drenge'],
      ['Kun For Mig','Medina'],['Vi To','Medina'],['Hot!','Nik & Jay'],['Boing!','Nik & Jay'],['En dag tilbage','Nik & Jay'],['Engel','Rasmus Seebach'],['Natteravn','Rasmus Seebach'],["Gi’ mig Danmark tilbage",'Natasja'],['Fuld af nattens stjerner','Lis Sørensen'],['Superliga','Nephew'],['BLÅ HIMMEL','Tobias Rahim'],['Midt om natten','Kim Larsen'],
      ['Om lidt','Kim Larsen'],['Papirsklip','Kim Larsen'],['Den jeg elsker, elsker jeg','Søs Fenger, Thomas Helmig'],['Lyse nætter','Alberte Winding, Aske Bentzon']
    ]
  };
  const catalog=Object.fromEntries(Object.entries(lists).map(([genre,items],g)=>[genre,items.map(([title,artist],i)=>({id:`music-${g+1}-${i+1}`,title,artist,phase:i<4?'warm':i<16?'work':'cool'}))]));
  const href=track=>'https://open.spotify.com/search/'+encodeURIComponent(track.title+' '+track.artist);
  const defaults=genre=>(catalog[genre]||catalog.Pop).filter((_,i)=>[0,1,4,5,6,7,8,9,16,17].includes(i)).map(t=>({id:t.id,phase:t.phase}));
  function sanitize(raw){
    const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
    Object.keys(catalog).forEach(genre=>{if(!Object.hasOwn(raw,genre)||!Array.isArray(raw[genre]))return;const seen=new Set();out[genre]=raw[genre].slice(0,100).filter(x=>x&&typeof x==='object'&&catalog[genre].some(t=>t.id===x.id)&&Object.hasOwn(phases,x.phase)&&!seen.has(x.id)&&seen.add(x.id)).slice(0,20).map(x=>({id:x.id,phase:x.phase}));});return out;
  }
  function selection(state){
    if(!Object.hasOwn(catalog,state.music))state.music='Pop';
    state.musicSelections=sanitize(state.musicSelections);
    if(!Object.hasOwn(state.musicSelections,state.music))state.musicSelections[state.music]=defaults(state.music);
    return state.musicSelections[state.music];
  }
  function selected(state){return selection(state).map(x=>({...catalog[state.music].find(t=>t.id===x.id),phase:x.phase}));}
  function ordered(state){const all=selected(state);return Object.keys(phases).flatMap(p=>all.filter(t=>t.phase===p));}
  function minutes(state,phase){return state.program.filter(b=>phase==='warm'?(b.clock?.kind==='warmup'||b.id==='warmup'):phase==='cool'?(b.clock?.kind==='cooldown'||b.id==='cooldown'):!['briefing','warmup','cooldown'].includes(b.clock?.kind)&&!['arrival','warmup','cooldown'].includes(b.id)).reduce((n,b)=>n+Number(b.duration),0);}
  return {catalog,phases,href,defaults,sanitize,selection,selected,ordered,minutes};
}));
