(function(){
  /* ---- mobile menu ---- */
  var toggle=document.getElementById('menuToggle'),menu=document.getElementById('menu');
  function syncMenu(){ if(window.innerWidth>720){menu.hidden=false;toggle.setAttribute('aria-expanded','false');} else if(toggle.getAttribute('aria-expanded')!=='true'){menu.hidden=true;} }
  toggle.addEventListener('click',function(){
    var open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!open)); menu.hidden=open;
  });
  menu.addEventListener('click',function(e){ if(e.target.tagName==='A'&&window.innerWidth<=720){menu.hidden=true;toggle.setAttribute('aria-expanded','false');} });
  window.addEventListener('resize',syncMenu); syncMenu();

  /* ---- active nav on scroll ---- */
  var links=[].slice.call(document.querySelectorAll('[data-nav]'));
  var targets=links.map(function(a){return document.querySelector(a.getAttribute('href'));});
  var notice=document.getElementById('notice');
  function setActive(){
    var y=window.scrollY+90,idx=0;
    targets.forEach(function(t,i){ if(t&&t.offsetTop<=y) idx=i; });
    if(notice&&notice.offsetTop<=y&&targets[1].offsetTop>y) idx=0;
    links.forEach(function(a,i){a.classList.toggle('active',i===idx);});
  }
  window.addEventListener('scroll',setActive,{passive:true}); setActive();

  /* ---- publication filter ---- */
  var btns=document.querySelectorAll('.filters button'),groups=document.querySelectorAll('.pub-group');
  var KEY='pelab.pubfilter';
  function applyFilter(f){
    btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.filter===f));});
    groups.forEach(function(g){g.hidden=!(f==='all'||g.dataset.group===f);});
    try{localStorage.setItem(KEY,f);}catch(e){}
  }
  btns.forEach(function(b){b.addEventListener('click',function(){applyFilter(b.dataset.filter);});});
  var saved='all'; try{saved=localStorage.getItem(KEY)||'all';}catch(e){}
  applyFilter(saved);

  /* ---- hero oscilloscope: gate drive + resonant tank current ---- */
  var cv=document.getElementById('scope'),ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W,H,dpr;
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,2);
    var r=cv.getBoundingClientRect(); W=Math.max(1,Math.floor(r.width)); H=Math.max(1,Math.floor(r.height));
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function tok(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
  var t0=performance.now();
  function draw(now){
    var t=reduce?0:(now-t0)/1000;
    var steel=tok('--steel'),copper=tok('--copper'),grid=tok('--line-2'),ink3=tok('--ink-3');
    ctx.clearRect(0,0,W,H);
    /* graticule */
    ctx.strokeStyle=grid; ctx.lineWidth=1;
    var gx=W/10,gy=H/8;
    ctx.beginPath();
    for(var i=1;i<10;i++){ctx.moveTo(i*gx+.5,0);ctx.lineTo(i*gx+.5,H);}
    for(var j=1;j<8;j++){ctx.moveTo(0,j*gy+.5);ctx.lineTo(W,j*gy+.5);}
    ctx.stroke();
    ctx.strokeStyle=ink3; ctx.globalAlpha=.35;
    ctx.beginPath(); ctx.moveTo(0,H/2+.5); ctx.lineTo(W,H/2+.5); ctx.stroke(); ctx.globalAlpha=1;

    var periods=3, phase=t*0.9;
    /* gate drive: 50% duty square wave */
    ctx.strokeStyle=steel; ctx.lineWidth=1.6; ctx.beginPath();
    var hi=H*0.22, lo=H*0.42;
    for(var x=0;x<=W;x++){
      var u=(x/W)*periods+phase/(2*Math.PI);
      var s=(u%1)<0.5?hi:lo;
      if(x===0)ctx.moveTo(x,s); else ctx.lineTo(x,s);
    }
    ctx.stroke();
    /* resonant current: sine with gentle amplitude envelope (light-load morphing) */
    var env=0.32+0.08*Math.sin(t*0.5);
    ctx.strokeStyle=copper; ctx.lineWidth=2; ctx.beginPath();
    for(var x2=0;x2<=W;x2++){
      var th=(x2/W)*periods*2*Math.PI+phase;
      var y=H*0.68 - Math.sin(th)*H*env*0.5;
      if(x2===0)ctx.moveTo(x2,y); else ctx.lineTo(x2,y);
    }
    ctx.stroke();
    /* ZVS marker dots at the i_Lr zero crossings */
    ctx.fillStyle=copper;
    for(var k=0;k<periods*2;k++){
      var xs=((k*Math.PI-phase)/(periods*2*Math.PI))*W; while(xs<0)xs+=W/periods; xs=xs%W;
      ctx.beginPath(); ctx.arc(xs,H*0.68,2.6,0,Math.PI*2); ctx.fill();
    }
    if(!reduce) requestAnimationFrame(draw);
  }
  size(); requestAnimationFrame(draw);
  window.addEventListener('resize',function(){size(); if(reduce) draw(performance.now());});
  if(window.matchMedia){
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener?mq.addEventListener('change',function(){if(reduce)draw(performance.now());}):null);
  }
})();
