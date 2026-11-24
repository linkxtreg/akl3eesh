// Bread Run UI kit.  make(name, opts) -> element.  Art comes from ui/art/<name>.png; text is real, editable HTML.
//   make('counter-bread', {text:'18 / 36', height:64})
//   make('meter-bread', {value:0.6})          set later with el.setValue(0.4)
//   make('btn-green', {text:'ابدأ التوصيل', onClick})
//   el.setText('0:41')
import META from './art/meta.js';
const BASE = new URL('./art/', import.meta.url).href;

// how each piece's labels look by default
const STYLE = {
  'counter-bread':{cls:'dark ltr', size:.95, text:'18 / 36'}, 'counter-timer':{cls:'dark ltr', size:.95, text:'0:43'}, 'counter-coins':{cls:'dark ltr', size:.95, text:'125'},
  'pop-coin':{cls:'dark ltr', size:.9, text:'+50'},
  'btn-green':{cls:'light', size:.8, text:'ابدأ التوصيل', press:1}, 'btn-blue':{cls:'light', size:.8, text:'تغيير الدرّاجة', press:1},
  'btn-orange':{cls:'dark', size:.8, text:'المتجر', press:1}, 'btn-cream':{cls:'dark', size:.8, text:'القائمة الرئيسية', press:1},
  'tag-level':{cls:'light', size:.85, text:'المستوى 1'}, 'tag-city':{cls:'dark', size:.85, text:'القاهرة'}, 'tag-low':{cls:'light', size:.85, text:'!وقت منخفض'},
  'tag-done':{cls:'light', size:.85, text:'!تم التوصيل'}, 'tag-daily':{cls:'dark', size:.85, text:'طلبية اليوم'},
  'card-shop':{cls:'dark', size:.8, text:'مخبز البلد\n36 رغيف', multi:1},
  'card-stats':{cls:'dark', size:.75, text:'السرعة\nالتحكم\nالوثب', rows:1},
  'round-jump':{cls:'light', size:.7, text:'قفز'}, 'round-boost':{cls:'light', size:.7, text:'تعزيز'},
  'btn-pause':{press:1}, 'btn-gear':{press:1},
};

export const names = Object.keys(META);
export function make(name, opts={}){
  const m = META[name]; if(!m) throw new Error('no UI piece '+name);
  const st = STYLE[name] || {}, el = document.createElement('div');
  el.className = 'k '+name+(st.press?' press':'');
  el.style.backgroundImage = `url(${BASE}${name}.png)`;
  const h = opts.height ?? m.h*0.6; el.style.height = h+'px'; el.style.width = (h*m.w/m.h)+'px';
  const labels = [];
  const text = opts.text ?? st.text;
  if(m.text.length && text!=null){
    const [x,y,w,hh] = m.text[0];
    const lines = (st.rows||st.multi) ? String(text).split('\n') : [String(text)];
    lines.forEach((line,i)=>{
      const t = document.createElement('span'); t.className = 't '+(st.cls||'dark');
      const rowH = (st.rows||st.multi) ? hh/lines.length : hh;
      Object.assign(t.style,{ left:x+'%', top:(y+rowH*i)+'%', width:w+'%', height:rowH+'%', fontSize:(h*hh/100/((st.rows||st.multi)?lines.length:1)*(st.size??.6))+'px' });
      if(st.rows) t.style.justifyContent='flex-start';
      t.textContent = line; if(opts.editable!==false) t.contentEditable = 'true'; el.appendChild(t); labels.push(t);
    });
  }
  if(m.track){
    const [x,y,w,hh] = m.track, tr = document.createElement('div'), f = document.createElement('div');
    tr.className='track'; f.className='fill'; tr.appendChild(f); el.appendChild(tr);
    Object.assign(tr.style,{left:x+'%',top:y+'%',width:w+'%',height:hh+'%'});
    el.setValue = v => f.style.setProperty('--v', Math.max(0,Math.min(1,v))*100+'%'); el.setValue(opts.value ?? .6);
    el.insertBefore(tr, el.firstChild);
  }
  const fit = () => labels.forEach(t=>{ const base=parseFloat(t.dataset.base||(t.dataset.base=parseFloat(t.style.fontSize))); t.style.fontSize=base+'px';
    for(let k=0;k<20 && (t.scrollWidth>t.clientWidth+1); k++) t.style.fontSize=(parseFloat(t.style.fontSize)*0.93)+'px'; });
  labels.forEach(t=>t.addEventListener('input',fit));
  requestAnimationFrame(()=>requestAnimationFrame(fit)); document.fonts?.ready.then(fit);
  el.setText = (...v) => { v.forEach((s,i)=>{ if(labels[i]) labels[i].textContent = s; }); fit(); };
  if(opts.onClick) el.addEventListener('click', opts.onClick);
  return el;
}

// progress bar drawn in code; only the icon comes from the art.  bar('i-bread',{value:.6, width:420, height:44, color:'orange'|'red'|'green'|'blue'})
export function bar(iconName, opts={}){
  const el=document.createElement('div'); el.className='kbar '+(opts.color||'');
  el.style.setProperty('--h',(opts.height??44)+'px'); el.style.width=(opts.width??420)+'px';
  const ic=document.createElement('img'); ic.className='ic'; ic.src=BASE+(iconName.startsWith('i-')?iconName:'icons/'+iconName)+'.png'; ic.alt='';
  const tr=document.createElement('div'); tr.className='tr'; const fl=document.createElement('div'); fl.className='fl'; tr.appendChild(fl);
  el.append(tr, ic);
  el.setValue=v=>{ v=Math.max(0,Math.min(1,v)); el.classList.toggle('empty',v<=0); fl.style.setProperty('--v',(v*100)+'%'); };
  el.setValue(opts.value??.6);
  return el;
}

// HUD counter drawn in code; icon from ui/art/icons.  counter('bread',{text:'50 / 37', height:52})
export function counter(iconName, opts={}){
  const el=document.createElement('div'); el.className='kc'; el.style.setProperty('--h',(opts.height??52)+'px');
  const ic=document.createElement('img'); ic.src=BASE+'icons/'+iconName+'.png'; ic.alt='';
  const t=document.createElement('span'); t.textContent=opts.text??''; if(opts.editable) t.contentEditable='true';
  el.append(ic,t);
  // centre the digits themselves (not the font's padded line box) in the visible cream area
  const ctx=document.createElement('canvas').getContext('2d');
  const centre=()=>{ if(!el.isConnected) return; t.style.top='0px';
    const cs=getComputedStyle(t), es=getComputedStyle(el); ctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m=ctx.measureText('0123456789'), r=document.createRange(); r.selectNodeContents(t); const box=r.getBoundingClientRect(), pr=el.getBoundingClientRect();
    if(!box.height) return;
    const baseline=box.top+m.fontBoundingBoxAscent, glyphMid=baseline-m.actualBoundingBoxAscent/2;
    const bw=parseFloat(es.borderTopWidth), h=pr.height, inset=h*.08;                 // bottom inner shade band
    const target=pr.top+bw+(h-2*bw-inset)/2;
    t.style.top=(target-glyphMid)+'px'; };
  requestAnimationFrame(()=>requestAnimationFrame(centre)); document.fonts?.ready.then(centre); addEventListener('resize',centre);
  el.setText=v=>{ t.textContent=v; }; return el;
}
