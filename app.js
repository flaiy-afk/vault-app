const KEY='vault_finance_v1';
const defaults={ratios:{ops:60,emergency:20,cold:20},balances:{ops:0,emergency:0,cold:0},transactions:[],dailyBudget:null};
let state=load();
function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
const rupiah=n=>'Rp'+Math.round(Number(n)||0).toLocaleString('id-ID');
const el=id=>document.getElementById(id);
function toast(s){const t=el('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function go(page){document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.page===page));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));
document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>go(b.dataset.goto));
el('today').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
function render(){
 const b=state.balances,r=state.ratios,total=b.ops+b.emergency+b.cold;
 el('totalBalance').textContent=rupiah(total);el('coldBalance').textContent=rupiah(b.cold);el('emergencyBalance').textContent=rupiah(b.emergency);
 if(el('scannerColdBalance'))el('scannerColdBalance').textContent=rupiah(b.cold);if(el('portfolioColdBalance'))el('portfolioColdBalance').textContent=rupiah(b.cold);renderPortfolio();
 el('ratioOps').textContent=r.ops+'%';el('ratioEmergency').textContent=r.emergency+'%';el('ratioCold').textContent=r.cold+'%';
 el('barOps').style.width=r.ops+'%';el('barEmergency').style.width=r.emergency+'%';el('barCold').style.width=r.cold+'%';
 renderDailyBudget();
 el('recent').innerHTML=state.transactions.slice(0,4).map(txRow).join('')||'Belum ada transaksi.';
 el('historyRows').innerHTML=state.transactions.map(txRow).join('')||'Belum ada transaksi.';
 previewIncome();previewExpense();
}
function localDateKey(value=new Date()){const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function dateOnlyUtc(key){const [y,m,d]=key.split('-').map(Number);return Date.UTC(y,m-1,d);}
function renderDailyBudget(){
 const plan=state.dailyBudget,daysInput=el('dailyDays');
 if(!plan){el('dailyAllowance').textContent='—';el('dailySpent').textContent=rupiah(0);el('dailyRemaining').textContent='—';el('dailyStatus').textContent='Masukkan jumlah hari untuk mulai mengatur budget harian.';return;}
 if(daysInput&&!daysInput.value)daysInput.value=plan.totalDays;
 const today=localDateKey(),elapsed=Math.max(0,Math.floor((dateOnlyUtc(today)-dateOnlyUtc(plan.startDate))/86400000));
 const daysLeft=Math.max(0,Number(plan.totalDays)-elapsed);
 const spentToday=state.transactions.filter(t=>t.type==='expense'&&localDateKey(t.date)===today).reduce((sum,t)=>sum+(Number(t.amount)||0)+(Number(t.round)||0),0);
 // Jatah hari ini memasukkan kembali pengeluaran hari ini agar tidak terhitung dua kali.
 const allowance=daysLeft>0?Math.max(0,(Number(state.balances.ops)||0)+spentToday)/daysLeft:0;
 const remaining=allowance-spentToday;
 el('dailyAllowance').textContent=rupiah(allowance);el('dailySpent').textContent=rupiah(spentToday);el('dailyRemaining').textContent=rupiah(remaining);
 if(daysLeft<=0)el('dailyStatus').textContent='Periode budget selesai. Atur ulang jumlah hari untuk memulai periode baru.';
 else if(remaining<0)el('dailyStatus').textContent=`Pengeluaran hari ini melewati jatah sebesar ${rupiah(Math.abs(remaining))}. Jaga pengeluaran berikutnya agar saldo cukup sampai akhir periode.`;
 else el('dailyStatus').textContent=`Sisa periode ${daysLeft} hari. Jatah harian dihitung dari saldo operasional dan pengeluaran hari ini.`;
}
el('saveDailyBudget').onclick=()=>{const days=Number(el('dailyDays').value);if(!Number.isInteger(days)||days<1||days>365)return toast('Masukkan jumlah hari 1–365.');state.dailyBudget={startDate:localDateKey(),totalDays:days};save();toast(`Budget harian diatur untuk ${days} hari.`);};
function txRow(t){
 const idx=state.transactions.indexOf(t),isBuy=t.type==='buy',kind=t.type==='income'?'Pemasukan':isBuy?'Pembelian crypto · Entry':`Pengeluaran · ${esc(t.method==='scan'?'Scan struk':'Manual')}`;
 const items=Array.isArray(t.items)&&t.items.length?`<div class="saved-items"><b>Rincian barang</b>${t.items.map(i=>`<div><span>${esc(i.name)} (${Number(i.qty)||1} × ${rupiah(i.price)})</span><b>${rupiah((Number(i.qty)||1)*(Number(i.price)||0))}</b></div>`).join('')}</div>`:'';
 const more=isBuy?`<small>Harga entry: ${rupiah(t.entryPrice)} · Jumlah: ${Number(t.quantity||0).toLocaleString('id-ID',{maximumFractionDigits:8})} ${esc(t.symbol||'')}</small>`:t.type==='expense'?`<details class="tx-detail"><summary>Lihat detail</summary><div class="tx-meta"><span>Jenis: ${kind}</span><span>Kategori: ${esc(t.category||t.title)}</span>${t.store?`<span>Toko: ${esc(t.store)}</span>`:''}<span>Round-up: ${rupiah(t.round||0)}</span>${t.note?`<span>Catatan: ${esc(t.note)}</span>`:''}${items}</div><div class="tx-actions"><button class="ghost" data-edit-tx="${idx}">Edit</button><button class="text-danger" data-delete-tx="${idx}">Hapus transaksi</button></div></details>`:`<small>${esc(t.detail||'')}</small>`;
 return `<div class="entry"><div><b>${esc(t.title)}</b><small>${new Date(t.date).toLocaleString('id-ID')} · ${kind}</small>${more}</div><div class="${t.type==='income'?'positive':'negative'}">${t.type==='income'?'+':'−'}${rupiah(t.amount)}</div></div>`;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function previewIncome(){let n=Math.max(0,+el('incomeAmount').value||0),r=state.ratios;el('previewOps').textContent=rupiah(n*r.ops/100);el('previewEmergency').textContent=rupiah(n*r.emergency/100);el('previewCold').textContent=rupiah(n*r.cold/100)}
function previewExpense(){let n=Math.max(0,+el('expenseAmount').value||0),enabled=el('roundEnabled').checked,unit=+el('roundUnit').value,round=enabled&&n?Math.ceil(n/unit)*unit-n:0;el('expenseDebit').textContent=rupiah(n);el('roundValue').textContent=rupiah(round)}
el('incomeAmount').oninput=previewIncome;
document.querySelectorAll('[data-amount]').forEach(b=>b.onclick=()=>{el('incomeAmount').value=b.dataset.amount;previewIncome()});
el('saveIncome').onclick=()=>{let n=+el('incomeAmount').value;if(!Number.isFinite(n)||n<=0)return toast('Masukkan nominal yang valid.');let r=state.ratios;let split={ops:Math.round(n*r.ops/100),emergency:Math.round(n*r.emergency/100)};split.cold=n-split.ops-split.emergency;Object.keys(split).forEach(k=>state.balances[k]+=split[k]);state.transactions.unshift({type:'income',title:'Pemasukan',amount:n,detail:el('incomeNote').value||'Pembagian otomatis',date:new Date().toISOString(),split});el('incomeAmount').value='';el('incomeNote').value='';save();toast('Pemasukan berhasil dicatat.')};
el('expenseAmount').oninput=previewExpense;el('roundEnabled').onchange=previewExpense;el('roundUnit').onchange=previewExpense;
el('saveExpense').onclick=()=>{
 let n=+el('expenseAmount').value;if(!Number.isFinite(n)||n<=0)return toast('Masukkan nominal yang valid.');
 let unit=+el('roundUnit').value,round=el('roundEnabled').checked?Math.ceil(n/unit)*unit-n:0,debit=n+round;
 if(state.balances.ops<debit)return toast('Saldo operasional tidak cukup untuk pengeluaran + pembulatan.');
 state.balances.ops-=debit;state.balances.cold+=round;
 state.transactions.unshift({type:'expense',method:'manual',title:el('expenseCategory').value,category:el('expenseCategory').value,amount:n,note:el('expenseNote').value,detail:`Dibulatkan ${rupiah(debit)} · sweep ${rupiah(round)}`,date:new Date().toISOString(),round,roundUnit:unit});
 el('expenseAmount').value='';el('expenseNote').value='';save();toast('Pengeluaran dan round-up tersimpan.');
};

// --- Scan struk: OCR berjalan di browser. Foto tidak pernah dimasukkan ke ledger. ---
function setExpenseMode(mode){
 const scan=mode==='scan';el('manualExpensePanel').hidden=scan;el('scanExpensePanel').hidden=!scan;
 el('manualMode').classList.toggle('active',!scan);el('scanMode').classList.toggle('active',scan);
}
el('manualMode').onclick=()=>setExpenseMode('manual');el('scanMode').onclick=()=>setExpenseMode('scan');
function parseReceiptMoney(s){const digits=String(s||'').replace(/[^0-9]/g,'');return digits?Number(digits):0}
function addReceiptItem(name='',qty=1,price=0){
 const row=document.createElement('div');row.className='receipt-item';
 row.innerHTML=`<div class="item-name"><label>Nama barang</label><input class="ri-name" maxlength="80" placeholder="Nama barang"></div><div><label>Qty</label><input class="ri-qty" type="number" min="1" value="1" inputmode="numeric"></div><div><label>Harga satuan</label><input class="ri-price" type="number" min="0" value="0" inputmode="numeric"></div><button type="button" class="remove-item" aria-label="Hapus barang">×</button>`;
 row.querySelector('.ri-name').value=name;row.querySelector('.ri-qty').value=qty;row.querySelector('.ri-price').value=price;
 row.querySelector('.remove-item').onclick=()=>{row.remove();};el('receiptItems').appendChild(row);
}
el('addReceiptItem').onclick=()=>addReceiptItem();
function parseReceiptText(text){
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const totalLines=lines.filter(x=>/(grand\s*total|total\s*belanja|total|jumlah\s*bayar|tagihan|amount\s*due)/i.test(x));
 let total=0;for(const line of totalLines){const nums=line.match(/(?:rp\s*)?\d[\d., ]*\d|\d+/gi)||[];if(nums.length){total=parseReceiptMoney(nums[nums.length-1]);if(total)break;}}
 const dateMatch=text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
 let date=new Date().toISOString().slice(0,10);if(dateMatch){let [,d,m,y]=dateMatch;if(y.length===2)y='20'+y;const candidate=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;if(!Number.isNaN(new Date(candidate+'T12:00:00').getTime()))date=candidate;}
 const items=[];
 for(const line of lines){
  if(/(grand\s*total|subtotal|total\s*belanja|total|jumlah\s*bayar|tagihan|cash|tunai|kembali|change|tanggal|date|telp|kasir|invoice)/i.test(line))continue;
  const m=line.match(/(?:rp\s*)?(\d{1,3}(?:[., ]\d{3})+|\d{4,})\s*$/i);if(!m)continue;
  const price=parseReceiptMoney(m[1]),name=line.slice(0,m.index).replace(/[|*]+/g,' ').trim();
  if(price>0&&name.length>1&&name.length<80)items.push({name,qty:1,price});
 }
 let store=lines.slice(0,4).find(x=>/[a-zA-Z]{3,}/.test(x)&&!/(indonesia|alamat|telp|struk|receipt)/i.test(x))||'';
 return {total,date,items,store};
}
el('receiptRoundEnabled').onchange=previewReceiptExpense;el('receiptRoundUnit').onchange=previewReceiptExpense;el('receiptTotal').oninput=previewReceiptExpense;
function previewReceiptExpense(){const n=Math.max(0,+el('receiptTotal').value||0),unit=+el('receiptRoundUnit').value,round=el('receiptRoundEnabled').checked&&n?Math.ceil(n/unit)*unit-n:0;el('receiptDebit').textContent=rupiah(n);el('receiptRound').textContent=rupiah(round)}
el('scanReceipt').onclick=async()=>{
 const file=el('receiptImage').files?.[0];if(!file)return toast('Pilih foto struk terlebih dahulu.');
 if(!window.Tesseract)return toast('Mesin OCR belum termuat. Periksa koneksi internet lalu muat ulang.');
 const btn=el('scanReceipt');btn.disabled=true;btn.textContent='Membaca struk...';el('ocrStatus').textContent='Menyiapkan OCR. Foto diproses di browser perangkat ini.';
 let worker;
 try{
  worker=await Tesseract.createWorker('ind+eng');
  const result=await worker.recognize(file);const parsed=parseReceiptText(result.data.text||'');
  el('receiptStore').value=parsed.store;el('receiptDate').value=parsed.date;el('receiptItems').innerHTML='';
  (parsed.items.length?parsed.items:[{name:'',qty:1,price:0}]).forEach(i=>addReceiptItem(i.name,i.qty,i.price));
  el('receiptTotal').value=parsed.total||parsed.items.reduce((a,i)=>a+i.qty*i.price,0)||'';
  el('receiptNote').value='';el('receiptReview').hidden=false;previewReceiptExpense();
  el('ocrStatus').textContent=`Pembacaan selesai. ${parsed.items.length} baris barang terdeteksi. Periksa dan koreksi semua data sebelum menyimpan.`;
  if(!parsed.total&&!parsed.items.length)toast('Teks belum terbaca jelas. Isi data secara manual pada bagian pemeriksaan.');
 }catch(err){console.error(err);el('ocrStatus').textContent='Gagal membaca struk. Coba foto lebih terang, lurus, dan tidak buram.';toast('OCR gagal diproses.');}
 finally{if(worker){try{await worker.terminate()}catch(_){}}btn.disabled=false;btn.textContent='📷 Baca struk';el('receiptImage').value='';}
};
el('saveReceiptExpense').onclick=()=>{
 const n=+el('receiptTotal').value;if(!Number.isFinite(n)||n<=0)return toast('Periksa total transaksi terlebih dahulu.');
 const unit=+el('receiptRoundUnit').value,round=el('receiptRoundEnabled').checked?Math.ceil(n/unit)*unit-n:0,debit=n+round;
 if(state.balances.ops<debit)return toast('Saldo operasional tidak cukup untuk pengeluaran + pembulatan.');
 const items=[...el('receiptItems').querySelectorAll('.receipt-item')].map(row=>({name:row.querySelector('.ri-name').value.trim(),qty:Math.max(1,+row.querySelector('.ri-qty').value||1),price:Math.max(0,+row.querySelector('.ri-price').value||0)})).filter(i=>i.name);
 const store=el('receiptStore').value.trim(),category=el('receiptCategory').value;
 state.balances.ops-=debit;state.balances.cold+=round;
 state.transactions.unshift({type:'expense',method:'scan',title:store||category,store,category,amount:n,note:el('receiptNote').value,items,detail:`Scan struk · ${items.length} jenis barang · sweep ${rupiah(round)}`,date:new Date(`${el('receiptDate').value||new Date().toISOString().slice(0,10)}T12:00:00`).toISOString(),round,roundUnit:unit});
 el('receiptReview').hidden=true;el('receiptImage').value='';el('receiptItems').innerHTML='';el('receiptTotal').value='';el('receiptStore').value='';el('receiptNote').value='';save();toast('Data struk tersimpan ke riwayat. Foto tidak disimpan.');go('history');
};

// Edit transaksi pengeluaran dari riwayat.
let editingTxIndex=null;
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-edit-tx]');if(!btn)return;const idx=Number(btn.dataset.editTx),tx=state.transactions[idx];if(!tx||tx.type!=='expense')return;
 editingTxIndex=idx;el('editTxTitle').value=tx.title||tx.category||'';el('editTxAmount').value=tx.amount;el('editTxNote').value=tx.note||'';el('editTransactionDialog').showModal();
});
el('saveTxEdit').onclick=e=>{
 e.preventDefault();if(editingTxIndex===null)return;const old=state.transactions[editingTxIndex],amount=+el('editTxAmount').value;
 if(!Number.isFinite(amount)||amount<=0)return toast('Nominal harus lebih dari nol.');
 const next=state.transactions.map((t,i)=>i===editingTxIndex?{...t,title:el('editTxTitle').value.trim()||t.title,category:el('editTxTitle').value.trim()||t.category,amount,note:el('editTxNote').value.trim()}:t);
 const b={ops:0,emergency:0,cold:0};for(const t of [...next].reverse()){
  if(t.type==='income'){const sp=t.split||{ops:Math.round(t.amount*state.ratios.ops/100),emergency:Math.round(t.amount*state.ratios.emergency/100)};b.ops+=Number(sp.ops)||0;b.emergency+=Number(sp.emergency)||0;b.cold+=Number(sp.cold)||0;}
  else if(t.type==='buy'){b.cold-=Number(t.amount)||0;}else{let round=Number(t.round)||0;if(t===next[editingTxIndex]&&round>0){const unit=Number(t.roundUnit)||1000;round=Math.ceil(amount/unit)*unit-amount;}b.ops-=Number(t.amount)||0;b.ops-=round;b.cold+=round;}
 }
 if(Object.values(b).some(v=>v<0)){return toast('Perubahan ditolak karena saldo operasional menjadi negatif.');}
 // Simpan pembulatan baru pada transaksi yang diedit.
 const edited=next[editingTxIndex];if(Number(old.round)>0){const unit=Number(old.roundUnit)||1000;edited.round=Math.ceil(amount/unit)*unit-amount;edited.detail=`Diedit · sweep ${rupiah(edited.round)}`;}
 state.transactions=next;state.balances=b;editingTxIndex=null;el('editTransactionDialog').close();save();toast('Transaksi berhasil diperbarui.');
};

// Hapus transaksi dan hitung ulang saldo dari ledger agar saldo tetap konsisten.
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-delete-tx]');if(!btn)return;const idx=Number(btn.dataset.deleteTx),tx=state.transactions[idx];if(!tx)return;
 if(!confirm('Hapus transaksi ini dari riwayat? Saldo akan dihitung ulang.'))return;
 const next=state.transactions.filter((_,i)=>i!==idx),b={ops:0,emergency:0,cold:0};
 for(const t of [...next].reverse()){
  if(t.type==='income'){const sp=t.split||{ops:Math.round(t.amount*state.ratios.ops/100),emergency:Math.round(t.amount*state.ratios.emergency/100)};b.ops+=Number(sp.ops)||0;b.emergency+=Number(sp.emergency)||0;b.cold+=(Number(sp.cold)||0);}
  else if(t.type==='buy'){b.cold-=Number(t.amount)||0;}else{const a=Number(t.amount)||0,r=Number(t.round)||0;b.ops-=a+r;b.cold+=r;}
 }
 if(Object.values(b).some(v=>v<0)){toast('Transaksi tidak bisa dihapus karena akan membuat saldo tercatat negatif.');return;}
 state.transactions=next;state.balances=b;save();toast('Transaksi dihapus dan saldo dihitung ulang.');
});

el('editRatio').onclick=()=>{el('ratioOpsInput').value=state.ratios.ops;el('ratioEmergencyInput').value=state.ratios.emergency;el('ratioColdInput').value=state.ratios.cold;el('ratioDialog').showModal()};
el('saveRatios').onclick=e=>{e.preventDefault();let ops=+el('ratioOpsInput').value,emergency=+el('ratioEmergencyInput').value,cold=+el('ratioColdInput').value;if([ops,emergency,cold].some(x=>!Number.isFinite(x)||x<0)||ops+emergency+cold!==100)return toast('Rasio harus berjumlah tepat 100%.');state.ratios={ops,emergency,cold};el('ratioDialog').close();save();toast('Rasio berhasil diperbarui.')};
el('exportData').onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='vault-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)};
el('resetData').onclick=()=>{if(confirm('Yakin hapus seluruh saldo dan riwayat? Tindakan ini tidak bisa dibatalkan.')){state=structuredClone(defaults);save();toast('Data lokal dihapus.')}};
function rsi(values,period=14){if(values.length<period+1)return null;let gain=0,loss=0;for(let i=values.length-period;i<values.length;i++){let d=values[i]-values[i-1];if(d>0)gain+=d;else loss-=d}let ag=gain/period,al=loss/period;if(al===0)return 100;return 100-(100/(1+ag/al))}
const TF_MAP={'15m':'15','1h':'60','4h':'240','1d':'1D'};
async function fetchKlines(symbol,interval){
 const now=Math.floor(Date.now()/1000),tf=TF_MAP[interval],seconds=interval==='15m'?900:interval==='1h'?3600:interval==='4h'?14400:86400,from=now-(seconds*100);
 const url=`https://indodax.com/tradingview/history_v2?from=${from}&symbol=${encodeURIComponent(symbol)}&tf=${tf}&to=${now}`;
 const res=await fetch(url,{headers:{'Accept':'application/json'}});if(!res.ok)throw new Error(`${symbol}: HTTP ${res.status}`);
 const json=await res.json();if(!Array.isArray(json)||!json.length)throw new Error(`${symbol}: candle kosong`);
 return json.map(c=>({time:+c.Time,open:+c.Open,high:+c.High,low:+c.Low,close:+c.Close,volume:+c.Volume})).filter(c=>[c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite)).sort((a,b)=>a.time-b.time);
}
function ema(values,period){if(values.length<period)return null;const k=2/(period+1);let value=values.slice(0,period).reduce((a,b)=>a+b,0)/period;for(let i=period;i<values.length;i++)value=values[i]*k+value*(1-k);return value}
function supportOf(rows){return Math.min(...rows.slice(-30).map(x=>x.low).filter(Number.isFinite))}
function analyze(rows,limit){
 const closes=rows.map(x=>x.close),last=closes.at(-1),r=rsi(closes),support=supportOf(rows),distance=support>0?(last-support)/support*100:Infinity;
 const volumes=rows.slice(-25).map(x=>x.volume),recentAvg=volumes.slice(-5).reduce((a,b)=>a+b,0)/Math.max(1,volumes.slice(-5).length),prior=volumes.slice(0,-5),priorAvg=prior.reduce((a,b)=>a+b,0)/Math.max(1,prior.length),volumeRatio=priorAvg>0?recentAvg/priorAvg:0;
 const ema20=ema(closes,20),trendUp=ema20!==null&&last>ema20;let score=0;
 // Balanced scoring dipertahankan persis: RSI 30, support 30, volume 20, EMA20 10, candle 10.
 if(r!==null&&r<=limit)score+=30;else if(r!==null&&r<=45)score+=15;
 if(distance<=2)score+=30;else if(distance<=5)score+=18;
 if(volumeRatio>=1.2)score+=20;else if(volumeRatio>=0.8)score+=10;
 if(trendUp)score+=10;if(closes.length>=2&&last>closes.at(-2))score+=10;
 return {last,rsi:r,support,distance,volumeRatio,trendUp,score,ema20};
}
function renderAnalysisResult(x,interval){
 const status=x.score>=70?'Setup menarik':x.score>=45?'Pantau':'Belum ideal';
 const cls=x.score>=70?'':x.score>=45?'warn':'bad';
 return `<article class="result"><div class="result-top"><div><div class="coin">${esc(x.symbol)}</div><div class="price">${rupiah(x.last)}</div></div><span class="tag ${cls}">${status} · ${x.score}/100</span></div><div class="stats"><div><small>RSI (14)</small><b>${x.rsi===null?'N/A':x.rsi.toFixed(1)}</b></div><div><small>Support 30 candle</small><b>${rupiah(x.support)}</b></div><div><small>Jarak support</small><b>${x.distance.toFixed(2)}%</b></div></div><div class="stats"><div><small>Volume vs rata-rata</small><b>${x.volumeRatio.toFixed(2)}x</b></div><div><small>Konfirmasi EMA20</small><b>${x.trendUp?'Di atas':'Di bawah'}</b></div><div><small>Harga analisis</small><b>${rupiah(x.last)}</b></div></div><div class="tiny muted">Timeframe ${interval} · Skor Balanced adalah indikator bantu, bukan kepastian harga akan naik.</div><button class="primary full entry-open" data-entry-symbol="${esc(x.symbol)}" data-entry-price="${x.last}">＋ Mau Entry ${esc(x.symbol)}</button></article>`;
}
el('runScreener').onclick=async()=>{
 const btn=el('runScreener'),symbol=el('pairSymbol').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,''),interval=el('timeframe').value,limit=+el('rsiLimit').value;
 if(!symbol)return toast('Masukkan pair terlebih dahulu, contoh BTCIDR.');
 if(!symbol.endsWith('IDR')||symbol.length<=3)return toast('Gunakan pair IDR, contoh BTCIDR atau ETHIDR.');
 btn.disabled=true;btn.textContent='Menganalisis pair...';el('apiStatus').textContent=`Mengambil data candle ${symbol} dari Indodax...`;el('screenResults').innerHTML='';
 try{
  const rows=await fetchKlines(symbol,interval);
  const result={symbol,...analyze(rows,limit)};
  el('screenResults').innerHTML=renderAnalysisResult(result,interval);
  el('apiStatus').textContent=`Analisis ${symbol} selesai · ${new Date().toLocaleTimeString('id-ID')}.`;
 }catch(e){el('apiStatus').textContent=e.message;el('screenResults').innerHTML=`<div class="panel empty">${esc(e.message)}. Periksa pair dan coba lagi.</div>`;}
 finally{btn.disabled=false;btn.textContent='⚡ Analisis pair';}
};
function renderPortfolio(){const host=el('portfolioRows');if(!host)return;const buys=state.transactions.filter(t=>t.type==='buy'&&t.status!=='closed');host.classList.toggle('empty',!buys.length);host.innerHTML=buys.map(t=>`<div class="entry"><div><b>${esc(t.symbol)}</b><small>${new Date(t.date).toLocaleString('id-ID')} · Entry ${rupiah(t.entryPrice)} · ${Number(t.quantity||0).toLocaleString('id-ID',{maximumFractionDigits:8})} koin</small></div><div class="negative">−${rupiah(t.amount)}</div></div>`).join('')||'Belum ada posisi aktif.';}
let selectedEntry={symbol:'',price:0};
document.addEventListener('click',e=>{const btn=e.target.closest('[data-entry-symbol]');if(!btn)return;selectedEntry={symbol:btn.dataset.entrySymbol,price:Number(btn.dataset.entryPrice)||0};el('entryTitle').textContent=`Entry ${selectedEntry.symbol}`;el('entryPairLabel').textContent=`Harga analisis terakhir: ${rupiah(selectedEntry.price)}. Masukkan harga beli aktualmu.`;el('entryAmount').value='';el('entryPrice').value=selectedEntry.price||'';el('entryAvailable').textContent=rupiah(state.balances.cold);el('entryRemaining').textContent=rupiah(state.balances.cold);el('entryDialog').showModal();});
function previewEntry(){const amount=Math.max(0,+el('entryAmount').value||0);el('entryAvailable').textContent=rupiah(state.balances.cold);el('entryRemaining').textContent=rupiah(state.balances.cold-amount)}
el('entryAmount').oninput=previewEntry;
el('confirmEntry').onclick=e=>{
 e.preventDefault();const amount=+el('entryAmount').value,price=+el('entryPrice').value;
 if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(price)||price<=0)return toast('Isi nominal pembelian dan harga entry yang valid.');
 // Pemeriksaan ulang tepat saat konfirmasi untuk mencegah saldo Uang Dingin minus.
 if(amount>state.balances.cold)return toast(`Entry ditolak. Uang dingin hanya ${rupiah(state.balances.cold)}.`);
 const quantity=amount/price;state.balances.cold-=amount;
 state.transactions.unshift({type:'buy',title:`Entry ${selectedEntry.symbol}`,symbol:selectedEntry.symbol,amount,entryPrice:price,quantity,status:'active',date:new Date().toISOString(),detail:'Pembelian dicatat manual; tidak ada order otomatis.'});
 el('entryDialog').close();save();toast(`Entry ${selectedEntry.symbol} tersimpan. Uang dingin berkurang ${rupiah(amount)}.`);go('portfolio');
};
render();
if('serviceWorker'in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
