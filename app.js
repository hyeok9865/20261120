const $ = s => document.querySelector(s);
const avg = xs => xs.reduce((a,b)=>a+b,0) / xs.length;
const money = n => `$${n.toFixed(2)}`;

function setupDataset() {
  $('#nMice').textContent = MICE.length;
  $('#avgPrice').textContent = money(avg(MICE.map(d => d.price)));
  const wireless = MICE.filter(d => d.wireless);
  $('#wirelessRate').textContent = `${Math.round(wireless.length / MICE.length * 100)}%`;
  $('#dataRows').innerHTML = MICE.map(d => `<tr><td>${d.name}</td><td>${d.brand}</td><td>${money(d.price)}</td><td>${d.weight}g</td><td>${d.wireless ? '무선':'유선'}</td><td>${d.battery ? d.battery+'h':'-'}</td><td>${d.polling.toLocaleString()} Hz</td></tr>`).join('');
  const wired = MICE.filter(d => !d.wireless);
  $('#insightWireless').textContent = `무선 평균 ${money(avg(wireless.map(d=>d.price)))}`;
  $('#insightWirelessText').textContent = `유선 표본 평균 ${money(avg(wired.map(d=>d.price)))}보다 ${money(avg(wireless.map(d=>d.price))-avg(wired.map(d=>d.price)))} 높다. 단, 유선 표본은 2개라 일반화에 주의한다.`;
  const ultra = MICE.filter(d => d.weight <= 65);
  const rest = MICE.filter(d => d.weight > 65);
  $('#insightWeight').textContent = `65g 이하 ${ultra.length}개`;
  $('#insightWeightText').textContent = `초경량 제품의 평균 MSRP는 ${money(avg(ultra.map(d=>d.price)))}로, 나머지 제품의 ${money(avg(rest.map(d=>d.price)))}와 비교된다.`;
}

function drawScatter() {
  const svg = $('#scatter'), W=700,H=300,p={l:48,r:18,t:15,b:36};
  const x = v => p.l + (v-45)/(145-45)*(W-p.l-p.r);
  const y = v => H-p.b - (v-20)/(170-20)*(H-p.t-p.b);
  let h = `<line class="axis" x1="${p.l}" y1="${H-p.b}" x2="${W-p.r}" y2="${H-p.b}"/><line class="axis" x1="${p.l}" y1="${p.t}" x2="${p.l}" y2="${H-p.b}"/>`;
  [50,75,100,125].forEach(v=>h+=`<text class="axis-text" x="${x(v)}" y="${H-12}" text-anchor="middle">${v}g</text>`);
  [50,100,150].forEach(v=>h+=`<text class="axis-text" x="${p.l-7}" y="${y(v)+3}" text-anchor="end">$${v}</text>`);
  h += `<text class="axis-text" x="${W/2}" y="${H-1}" text-anchor="middle">WEIGHT</text>`;
  MICE.forEach(d=>{const r=4+Math.log2(d.polling/1000+1)*2;h+=`<circle class="${d.wireless?'dot-wireless':'dot-wired'}" cx="${x(d.weight)}" cy="${y(d.price)}" r="${r}"><title>${d.name}: ${money(d.price)}, ${d.weight}g</title></circle>`});
  svg.innerHTML=h;
}

function inverse(a) {
  const n=a.length, m=a.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let i=0;i<n;i++) { let pivot=i; for(let j=i+1;j<n;j++) if(Math.abs(m[j][i])>Math.abs(m[pivot][i])) pivot=j; [m[i],m[pivot]]=[m[pivot],m[i]]; const d=m[i][i]; if(Math.abs(d)<1e-9) return null; for(let j=0;j<2*n;j++)m[i][j]/=d; for(let k=0;k<n;k++) if(k!==i){const f=m[k][i];for(let j=0;j<2*n;j++)m[k][j]-=f*m[i][j];} }
  return m.map(r=>r.slice(n));
}
function trainModel() {
  const feat = d => [1,d.weight,d.wireless,d.battery,Math.log2(d.polling)];
  const X=MICE.map(feat), y=MICE.map(d=>d.price), n=5;
  const xtx=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>X.reduce((s,r)=>s+r[i]*r[j],0)+(i===j&&i>0?.001:0)));
  const inv=inverse(xtx); const xty=Array.from({length:n},(_,i)=>X.reduce((s,r,k)=>s+r[i]*y[k],0));
  const beta=inv.map(r=>r.reduce((s,v,i)=>s+v*xty[i],0));
  const predict=d=>feat(d).reduce((s,v,i)=>s+v*beta[i],0);
  const yh=MICE.map(predict), mean=avg(y); const r2=1-y.reduce((s,v,i)=>s+(v-yh[i])**2,0)/y.reduce((s,v)=>s+(v-mean)**2,0);
  $('#r2').textContent=r2.toFixed(2);$('#mae').textContent=money(avg(y.map((v,i)=>Math.abs(v-yh[i]))));
  const update=()=>{const d={weight:+$('#weight').value,wireless:+$('#wireless').value,battery:+$('#battery').value,polling:+$('#polling').value};$('#weightOut').textContent=`${d.weight} g`;$('#batteryOut').textContent=`${d.battery} h`;$('#prediction').textContent=money(Math.max(0,predict(d)));};
  ['#weight','#wireless','#battery','#polling'].forEach(id=>$(id).addEventListener('input',update));update();
}

function setupExperiment() {
  const previewCondition = new URLSearchParams(location.search).get('condition');
  const isPreview = previewCondition === 'A' || previewCondition === 'B';
  let condition = isPreview ? previewCondition : sessionStorage.getItem('mouseLabCondition');
  if(!condition){condition=Math.random()<.5?'A':'B';sessionStorage.setItem('mouseLabCondition',condition)}
  $('#conditionTag').textContent=isPreview ? `PREVIEW ${condition}` : `CONDITION ${condition}`;
  $('#conditionNote').textContent=isPreview ? `${condition === 'A' ? '사양 중심':'사용 경험 중심'} 설계 미리보기: 응답은 저장되지 않습니다.` : (condition==='A'?'사양 중심 제품 설명':'사용 경험 중심 제품 설명');
  $('#liveExperiment').addEventListener('click', e => { e.preventDefault(); history.replaceState({}, '', location.pathname + '#experiment'); location.reload(); });
  $('#message').textContent=condition==='A'?'54g 초경량 · 35,000 DPI 센서 · 최대 8,000Hz 폴링레이트 · 최대 90시간 배터리.':'장시간 FPS 플레이에서도 손목 부담을 줄이고, 빠른 조준 전환을 돕도록 설계했습니다.';
  $('#intentButtons').innerHTML=[1,2,3,4,5,6,7].map(n=>`<button type="button" data-value="${n}">${n}</button>`).join('');
  let intent=null;
  $('#intentButtons').addEventListener('click',e=>{if(!e.target.matches('button'))return;intent=+e.target.dataset.value;document.querySelectorAll('#intentButtons button').forEach(b=>b.classList.toggle('selected',+b.dataset.value===intent));});
  $('#survey').addEventListener('submit',async e=>{e.preventDefault();if(!intent){alert('구매 의도를 선택해 주세요.');return}if(isPreview){alert('미리보기에서는 응답을 저장하지 않습니다. 실제 무작위 배정으로 돌아가 참여해 주세요.');return}const form=new FormData(e.target);const button=e.target.querySelector('button[type=submit]');button.disabled=true;button.textContent='제출 중...';try{const r=await fetch('/api/responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({condition,intent,fairPrice:form.get('fairPrice'),game:form.get('game')})});if(!r.ok)throw Error();sessionStorage.setItem('mouseLabResponded','1');e.target.innerHTML='<p class="thanks">응답이 저장되었습니다. 참여해 주셔서 감사합니다.</p>';loadResults()}catch{button.disabled=false;button.textContent='응답 제출';alert('저장에 실패했습니다. 서버가 실행 중인지 확인해 주세요.')}});
  loadResults();
}
async function loadResults(){try{const r=await fetch('/api/results');const d=await r.json();const txt=x=>x.n?`n=${x.n} · 평균 ${x.mean}/7`:'n=0 · 수집 중';const ready=d.A.n>=20&&d.B.n>=20;const status=ready?'조건별 20명 이상 확보: 평균 차이 검정 단계로 진행할 수 있습니다.':'조건별 유효 응답 20명 이상이 필요합니다. 현재 수치로는 효과를 결론 내리지 않습니다.';$('#results').innerHTML=`<div class="result-grid"><div><b>${d.total}</b><span>총 유효 응답</span></div><div><b>${txt(d.A)}</b><span>조건 A: 사양 중심</span></div><div><b>${txt(d.B)}</b><span>조건 B: 경험 중심</span></div></div><p class="result-status">${status}</p>`}catch{$('#results').textContent='서버 연결 후 실시간 응답 현황이 표시됩니다.'}}
setupDataset();drawScatter();trainModel();setupExperiment();
