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

  /* ---- hero oscilloscope: buck converter, slow duty sweep ----
     v_sw : PWM switch-node voltage (0 / Vin), duty D(t) sweeps 30 % -> 70 % -> 30 %
     i_L  : inductor current, triangular, avg = D*Vin/R, ripple ~ D(1-D)   (ideal CCM)
     v_o  : output voltage, DC = D*Vin with small parabolic ripple (magnified)
     All three traces share one time axis and the same instantaneous duty. */
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
  var PERIODS=4, SWEEP=10, DMIN=0.3, DMAX=0.7;      /* duty sweep: 10 s period */
  var FSWEEP=7, FDEV=0.3, FPH=1.3;                   /* switching-frequency sweep: 7 s period, +/-30 % */
  function lane(a,b){return {top:H*a,bot:H*b,y:function(v){return H*b-(H*(b-a))*v;}};}
  function frac(x){return x-Math.floor(x);}
  /* per-period waveforms, normalised 0..1 inside each lane */
  /* fr = f_s / f_s0 : inductor ripple ~ 1/f_s, output ripple ~ 1/f_s^2 */
  function iL(p,D,fr){ var tri=p<D?(-1+2*p/D):(1-2*(p-D)/(1-D)); return D+0.85*D*(1-D)*tri/fr; }
  function vO(p,D,fr){ var z=p-D, q=p<D?(-p+p*p/D):(z-z*z/(1-D)); var qm=(1-2*D)/6; return D+0.32*D*(1-D)*(q-qm)*8/(fr*fr); }
  function draw(now){
    var t=reduce?SWEEP/4:(now-t0)/1000;
    var steel=tok('--steel'),copper=tok('--copper'),green=tok('--trace3')||'#2E7D6B',grid=tok('--line-2'),ink3=tok('--ink-3');
    ctx.clearRect(0,0,W,H);
    /* graticule */
    ctx.strokeStyle=grid; ctx.lineWidth=1;
    var gx=W/10,gy=H/8;
    ctx.beginPath();
    for(var i=1;i<10;i++){ctx.moveTo(i*gx+.5,0);ctx.lineTo(i*gx+.5,H);}
    for(var j=1;j<8;j++){ctx.moveTo(0,j*gy+.5);ctx.lineTo(W,j*gy+.5);}
    ctx.stroke();
    var D=(DMIN+DMAX)/2+(DMAX-DMIN)/2*Math.sin(2*Math.PI*t/SWEEP);
    var wf=2*Math.PI/FSWEEP, fr=1+FDEV*Math.sin(wf*t+FPH);          /* relative switching frequency */
    var periods=PERIODS*fr;                                          /* periods visible across the window */
    var phase=0.85*(t-FDEV/wf*Math.cos(wf*t+FPH));                   /* = 0.85 * integral of fr dt, keeps scrolling continuous */
    var Lsw=lane(0.13,0.31), Li=lane(0.38,0.66), Lo=lane(0.73,0.93);
    /* faint baselines for each lane */
    ctx.strokeStyle=ink3; ctx.globalAlpha=.3; ctx.beginPath();
    [Lsw.bot,Li.bot,Lo.bot].forEach(function(y){ctx.moveTo(0,Math.round(y)+.5);ctx.lineTo(W,Math.round(y)+.5);});
    ctx.stroke(); ctx.globalAlpha=1;
    /* v_sw: PWM with exact edges */
    ctx.strokeStyle=steel; ctx.lineWidth=1.6; ctx.beginPath();
    var u0=phase, u1=phase+periods, xOf=function(u){return (u-u0)/periods*W;};
    var v=frac(u0)<D?1:0; ctx.moveTo(0,Lsw.y(v));
    for(var k=Math.floor(u0);k<=Math.ceil(u1);k++){
      var edges=[[k,1],[k+D,0]];
      for(var e=0;e<2;e++){ var u=edges[e][0],nv=edges[e][1]; if(u<=u0||u>=u1)continue; var x=xOf(u); ctx.lineTo(x,Lsw.y(v)); ctx.lineTo(x,Lsw.y(nv)); v=nv; }
    }
    ctx.lineTo(W,Lsw.y(v)); ctx.stroke();
    /* i_L and v_o, sampled per pixel plus exact vertices */
    var xs=[]; for(var px=0;px<=W;px+=1.5)xs.push(u0+px/W*periods);
    for(var k2=Math.floor(u0);k2<=Math.ceil(u1);k2++){[k2,k2+D/2,k2+D,k2+D+(1-D)/2].forEach(function(u){if(u>u0&&u<u1)xs.push(u);});}
    xs.sort(function(a,b){return a-b;});
    ctx.strokeStyle=copper; ctx.lineWidth=2; ctx.beginPath();
    for(var a=0;a<xs.length;a++){var ua=xs[a],ya=Li.y(iL(frac(ua),D,fr)); if(a===0)ctx.moveTo(xOf(ua),ya); else ctx.lineTo(xOf(ua),ya);}
    ctx.stroke();
    ctx.strokeStyle=green; ctx.lineWidth=2; ctx.beginPath();
    for(var b=0;b<xs.length;b++){var ub=xs[b],yb=Lo.y(vO(frac(ub),D,fr)); if(b===0)ctx.moveTo(xOf(ub),yb); else ctx.lineTo(xOf(ub),yb);}
    ctx.stroke();
    /* dashed average / DC level markers */
    ctx.setLineDash([3,6]); ctx.globalAlpha=.45; ctx.lineWidth=1;
    ctx.strokeStyle=copper; ctx.beginPath(); ctx.moveTo(0,Li.y(D)+.5); ctx.lineTo(W,Li.y(D)+.5); ctx.stroke();
    ctx.strokeStyle=green; ctx.beginPath(); ctx.moveTo(0,Lo.y(D)+.5); ctx.lineTo(W,Lo.y(D)+.5); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha=1;
    if(!reduce) requestAnimationFrame(draw);
  }
  size(); requestAnimationFrame(draw);
  window.addEventListener('resize',function(){size(); if(reduce) draw(performance.now());});
  if(window.matchMedia){
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener?mq.addEventListener('change',function(){if(reduce)draw(performance.now());}):null);
  }
})();
