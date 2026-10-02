/*
 * kiosk-stats.js  —  She, the Interface
 * Records each visitor's first kiosk choice in Supabase and draws the live pie chart.
 *
 * Data lives in Supabase (table kiosk_choices), not in this website, so editing or
 * replacing the page design never deletes or resets the counts.
 *
 * To keep the counts consistent across redesigns, do NOT change:
 *   - SB_URL / SB_KEY            (where the data is stored)
 *   - the values 'default' / 'alternative'   (what is counted)
 *   - FLAG                        (how a returning browser is recognised; renaming it
 *                                  lets earlier visitors be counted a second time)
 * The page only needs to call KioskStats.choose('default' | 'alternative') when a
 * kiosk button is pressed, KioskStats.hide() on reset, and keep the chart markup ids:
 *   stats, pie, pie-sum, lg-default, lg-alt
 * Add ?test to the page address to try the kiosk without recording a choice.
 */
(function(){
  var SB_URL='https://bfvuwkrjvlgfhqijdvvw.supabase.co';
  var SB_KEY='sb_publishable_NrjynmCuJdTisXRwbPwnlw_E-MnYs-o';
  var HEAD={'apikey':SB_KEY,'Content-Type':'application/json'};
  var TEST=/[?&]test\b/.test(location.search);
  var FLAG='sti-kiosk-choice';
  function stored(){try{return localStorage.getItem(FLAG);}catch(e){return null;}}
  function record(choice){
    if(TEST||stored())return Promise.resolve();
    return fetch(SB_URL+'/rest/v1/kiosk_choices',{method:'POST',headers:Object.assign({'Prefer':'return=minimal'},HEAD),body:JSON.stringify({choice:choice})})
      .then(function(r){
        if(r.ok){try{localStorage.setItem(FLAG,choice);}catch(e){}}
        else{console.warn('[kiosk-stats] could not record choice:',r.status);}
      })
      .catch(function(e){console.warn('[kiosk-stats] could not record choice:',e);});
  }
  function arc(a0,a1){
    var x0=Math.sin(a0),y0=-Math.cos(a0),x1=Math.sin(a1),y1=-Math.cos(a1),big=(a1-a0)>Math.PI?1:0;
    return 'M0 0 L'+x0+' '+y0+' A1 1 0 '+big+' 1 '+x1+' '+y1+' Z';
  }
  function draw(d,a,mine){
    var tot=d+a,svg=document.getElementById('pie');
    if(!svg)return;
    if(!tot){svg.innerHTML='<circle r="1" class="slice-empty"></circle>';document.getElementById('pie-sum').textContent='No visitors counted yet.';document.getElementById('lg-default').textContent='Issue ticket: 0';document.getElementById('lg-alt').textContent='Explored alternatives: 0';document.getElementById('stats').hidden=false;return;}
    var pd=Math.round(d/tot*100),pa=100-pd,html='';
    if(d===0||a===0){html='<circle r="1" class="'+(d?'slice-default':'slice-alt')+'"></circle>';}
    else{var ad=d/tot*2*Math.PI;html='<path class="slice-default" d="'+arc(0,ad)+'"></path><path class="slice-alt" d="'+arc(ad,2*Math.PI)+'"></path>';}
    svg.innerHTML=html;
    document.getElementById('pie-sum').textContent=pd+'% of '+tot+' visitor'+(tot===1?'':'s')+' took the default.';
    var ld=document.getElementById('lg-default'),la=document.getElementById('lg-alt');
    ld.textContent='Issue ticket: '+pd+'% ('+d+')'+(mine==='default'?', including you':'');
    la.textContent='Explored alternatives: '+pa+'% ('+a+')'+(mine==='alternative'?', including you':'');
    ld.className=mine==='default'?'you':'';la.className=mine==='alternative'?'you':'';
    document.getElementById('stats').hidden=false;
  }
  function loadStats(current){
    return fetch(SB_URL+'/rest/v1/rpc/kiosk_stats',{method:'POST',headers:HEAD,body:'{}'})
      .then(function(r){if(!r.ok)throw new Error('status '+r.status);return r.json();})
      .then(function(rows){
        var d=0,a=0;(rows||[]).forEach(function(r){if(r.choice==='default')d=+r.n;if(r.choice==='alternative')a=+r.n;});
        var mine=stored();
        if(TEST){mine=current;if(current==='default')d++;else a++;}  /* preview only, nothing saved */
        draw(d,a,mine);
      }).catch(function(e){console.warn('[kiosk-stats] could not load results:',e);});
  }
  function choose(c){record(c).then(function(){return loadStats(c);});}
  function hide(){var s=document.getElementById('stats');if(s)s.hidden=true;}
  window.KioskStats={choose:choose,hide:hide};
})();
